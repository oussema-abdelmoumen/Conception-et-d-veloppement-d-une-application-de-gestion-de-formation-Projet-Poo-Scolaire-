import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseCompat as supabase } from '@/lib/api/supabaseCompat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Loader2, BarChart3 } from 'lucide-react';

const COLORS = ['hsl(215, 60%, 24%)', 'hsl(199, 89%, 48%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(270, 60%, 50%)', 'hsl(180, 60%, 40%)', 'hsl(30, 80%, 50%)', 'hsl(315, 60%, 50%)', 'hsl(60, 70%, 45%)'];

const Statistiques = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));

  const { data, isLoading } = useQuery({
    queryKey: ['statistics', year],
    queryFn: async () => {
      const [formations, formateurs, participants, domaines, structures, formationParticipants] = await Promise.all([
        supabase.from('formations').select('*, domaines(libelle)'),
        supabase.from('formateurs').select('*'),
        supabase.from('participants').select('*, structures(libelle)'),
        supabase.from('domaines').select('*'),
        supabase.from('structures').select('*'),
        supabase.from('formation_participants').select('*, formations(annee), participants(nom, prenom)'),
      ]);

      const allFormations = formations.data || [];
      const yearFormations = allFormations.filter(f => f.annee === Number(year));
      const allFormateurs = formateurs.data || [];
      const allParticipants = participants.data || [];
      const allFP = formationParticipants.data || [];

      // Chart 1: Formations par domaine
      const domaineMap = new Map<string, number>();
      yearFormations.forEach(f => {
        const label = (f as any).domaines?.libelle || 'Non défini';
        domaineMap.set(label, (domaineMap.get(label) || 0) + 1);
      });
      const formationsParDomaine = Array.from(domaineMap.entries()).map(([name, value]) => ({ name, value }));

      // Chart 2: Participants par structure
      const structureMap = new Map<string, number>();
      allParticipants.forEach(p => {
        const label = (p as any).structures?.libelle || 'Non défini';
        structureMap.set(label, (structureMap.get(label) || 0) + 1);
      });
      const participantsParStructure = Array.from(structureMap.entries()).map(([name, value]) => ({ name, value }));

      // Chart 3: Formateurs internes vs externes
      const internes = allFormateurs.filter(f => f.type === 'interne').length;
      const externes = allFormateurs.filter(f => f.type === 'externe').length;
      const formateursPie = [{ name: 'Internes', value: internes }, { name: 'Externes', value: externes }];

      // Chart 4: Budget par année (5 dernières)
      const budgetParAnnee: { annee: number; budget: number }[] = [];
      for (let y = Number(year) - 4; y <= Number(year); y++) {
        const yearBudget = allFormations.filter(f => f.annee === y).reduce((sum, f) => sum + Number(f.budget), 0);
        budgetParAnnee.push({ annee: y, budget: yearBudget });
      }

      // Chart 5: Top 10 participants
      const participantCount = new Map<string, { name: string; count: number }>();
      allFP.forEach((fp: any) => {
        if (fp.formations?.annee === Number(year) && fp.participants) {
          const key = fp.id_participant;
          const existing = participantCount.get(key);
          if (existing) {
            existing.count++;
          } else {
            participantCount.set(key, { name: `${fp.participants.nom} ${fp.participants.prenom}`, count: 1 });
          }
        }
      });
      const top10 = Array.from(participantCount.values()).sort((a, b) => b.count - a.count).slice(0, 10);

      // Summary
      const totalBudget = yearFormations.reduce((sum, f) => sum + Number(f.budget), 0);
      const avgDuration = yearFormations.length > 0 ? yearFormations.reduce((sum, f) => sum + f.duree, 0) / yearFormations.length : 0;

      return {
        formationsParDomaine,
        participantsParStructure,
        formateursPie,
        budgetParAnnee,
        top10,
        summary: {
          totalFormations: yearFormations.length,
          totalParticipants: allParticipants.length,
          totalBudget,
          avgDuration: Math.round(avgDuration * 10) / 10,
        },
      };
    },
  });

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Statistiques</h1>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Total formations ({year})</TableHead>
                <TableHead>Total participants</TableHead>
                <TableHead>Budget total (DA)</TableHead>
                <TableHead>Durée moyenne (jours)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold text-lg">{data?.summary.totalFormations}</TableCell>
                <TableCell className="font-bold text-lg">{data?.summary.totalParticipants}</TableCell>
                <TableCell className="font-bold text-lg">{data?.summary.totalBudget.toLocaleString('fr-FR')}</TableCell>
                <TableCell className="font-bold text-lg">{data?.summary.avgDuration}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1 */}
        <Card>
          <CardHeader><CardTitle className="text-base">Formations par domaine ({year})</CardTitle></CardHeader>
          <CardContent>
            {data?.formationsParDomaine.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.formationsParDomaine}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(215, 60%, 24%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Aucune donnée</p>}
          </CardContent>
        </Card>

        {/* Chart 2 */}
        <Card>
          <CardHeader><CardTitle className="text-base">Participants par structure</CardTitle></CardHeader>
          <CardContent>
            {data?.participantsParStructure.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.participantsParStructure}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Aucune donnée</p>}
          </CardContent>
        </Card>

        {/* Chart 3 */}
        <Card>
          <CardHeader><CardTitle className="text-base">Formateurs internes vs externes</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data?.formateursPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data?.formateursPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4 */}
        <Card>
          <CardHeader><CardTitle className="text-base">Évolution du budget (5 dernières années)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.budgetParAnnee}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="annee" />
                <YAxis />
                <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} DA`} />
                <Line type="monotone" dataKey="budget" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Chart 5 */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top 10 participants — plus de formations suivies ({year})</CardTitle></CardHeader>
        <CardContent>
          {data?.top10.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.top10} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">Aucune donnée pour cette année</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistiques;
