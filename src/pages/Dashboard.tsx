import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Users, UserCheck, DollarSign, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, role } = useAuth();
  const currentYear = new Date().getFullYear();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [formations, participants, formateurs] = await Promise.all([
        supabase.from('formations').select('*'),
        supabase.from('participants').select('id'),
        supabase.from('formateurs').select('id'),
      ]);

      const allFormations = formations.data || [];
      const thisYear = allFormations.filter(f => f.annee === currentYear);
      const totalBudget = thisYear.reduce((sum, f) => sum + Number(f.budget), 0);

      return {
        formationsCount: thisYear.length,
        participantsCount: participants.data?.length || 0,
        formateursCount: formateurs.data?.length || 0,
        totalBudget,
        recentFormations: allFormations.slice(-5).reverse(),
      };
    },
  });

  const roleLabels: Record<string, string> = {
    administrateur: 'Administrateur',
    responsable: 'Responsable du centre',
    simple_utilisateur: 'Utilisateur',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { title: 'Formations ' + currentYear, value: stats?.formationsCount || 0, icon: BookOpen, color: 'text-primary' },
    { title: 'Participants', value: stats?.participantsCount || 0, icon: Users, color: 'text-[hsl(var(--info))]' },
    { title: 'Formateurs', value: stats?.formateursCount || 0, icon: UserCheck, color: 'text-[hsl(var(--success))]' },
    { title: 'Budget consommé', value: `${(stats?.totalBudget || 0).toLocaleString('fr-FR')} DA`, icon: DollarSign, color: 'text-[hsl(var(--warning))]' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
        <h2 className="text-2xl font-bold">Bienvenue, {user?.email?.split('@')[0]}</h2>
        <p className="text-primary-foreground/80">{role ? roleLabels[role] : ''} — Excellent Training</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formations récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentFormations && stats.recentFormations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Durée (jours)</TableHead>
                  <TableHead>Budget (DA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentFormations.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.titre}</TableCell>
                    <TableCell>{f.annee}</TableCell>
                    <TableCell>{f.duree}</TableCell>
                    <TableCell>{Number(f.budget).toLocaleString('fr-FR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-2 opacity-30" />
              <p>Aucune formation enregistrée</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
