import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Loader2, BookOpen } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Formations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterDomaine, setFilterDomaine] = useState<string>('');
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ titre: '', annee: new Date().getFullYear(), duree: 1, id_domaine: '', budget: 0 });

  const { data: formations, isLoading } = useQuery({
    queryKey: ['formations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('formations').select('*, domaines(libelle)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: domaines } = useQuery({
    queryKey: ['domaines'],
    queryFn: async () => {
      const { data } = await supabase.from('domaines').select('*').order('libelle');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = { titre: values.titre, annee: values.annee, duree: values.duree, id_domaine: values.id_domaine || null, budget: values.budget };
      if (editing) {
        const { error } = await supabase.from('formations').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('formations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast({ title: 'Succès', description: 'Enregistré avec succès' });
      setOpen(false);
      setEditing(null);
    },
    onError: () => toast({ title: 'Erreur', description: "Échec de l'enregistrement", variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('formations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast({ title: 'Succès', description: 'Supprimé avec succès' });
      setDeleteId(null);
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ titre: '', annee: new Date().getFullYear(), duree: 1, id_domaine: '', budget: 0 });
    setOpen(true);
  };

  const openEdit = (f: any) => {
    setEditing(f);
    setForm({ titre: f.titre, annee: f.annee, duree: f.duree, id_domaine: f.id_domaine || '', budget: Number(f.budget) });
    setOpen(true);
  };

  const filtered = formations?.filter((f: any) => {
    const matchSearch = f.titre.toLowerCase().includes(search.toLowerCase());
    const matchYear = !filterYear || f.annee === Number(filterYear);
    const matchDomaine = !filterDomaine || filterDomaine === 'all' || f.id_domaine === filterDomaine;
    return matchSearch && matchYear && matchDomaine;
  }) || [];

  const years = [...new Set(formations?.map((f: any) => f.annee) || [])].sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Formations</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par titre..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Année" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterDomaine} onValueChange={setFilterDomaine}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Domaine" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {domaines?.map(d => <SelectItem key={d.id} value={d.id}>{d.libelle}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-2 opacity-30" />
              <p>Aucune formation trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Durée (j)</TableHead>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Budget (DA)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.titre}</TableCell>
                    <TableCell>{f.annee}</TableCell>
                    <TableCell>{f.duree}</TableCell>
                    <TableCell>{f.domaines?.libelle || '—'}</TableCell>
                    <TableCell>{Number(f.budget).toLocaleString('fr-FR')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la formation' : 'Nouvelle formation'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Année *</Label>
                <Input type="number" value={form.annee} onChange={(e) => setForm({ ...form, annee: Number(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <Label>Durée (jours) *</Label>
                <Input type="number" min={1} value={form.duree} onChange={(e) => setForm({ ...form, duree: Number(e.target.value) })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Domaine</Label>
              <Select value={form.id_domaine} onValueChange={(v) => setForm({ ...form, id_domaine: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un domaine" /></SelectTrigger>
                <SelectContent>
                  {domaines?.map(d => <SelectItem key={d.id} value={d.id}>{d.libelle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget (DA) *</Label>
              <Input type="number" min={0} step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cet élément ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Formations;
