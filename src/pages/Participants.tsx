import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Loader2, Users } from 'lucide-react';

const Participants = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', tel: '', id_structure: '', id_profil: '' });

  const { data: participants, isLoading } = useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('participants').select('*, structures(libelle), profils(libelle)').order('nom');
      if (error) throw error;
      return data;
    },
  });

  const { data: structures } = useQuery({ queryKey: ['structures'], queryFn: async () => (await supabase.from('structures').select('*').order('libelle')).data || [] });
  const { data: profils } = useQuery({ queryKey: ['profils'], queryFn: async () => (await supabase.from('profils').select('*').order('libelle')).data || [] });

  const saveMutation = useMutation({
    mutationFn: async (v: any) => {
      const payload = { nom: v.nom, prenom: v.prenom, email: v.email || null, tel: v.tel || null, id_structure: v.id_structure || null, id_profil: v.id_profil || null };
      if (editing) {
        const { error } = await supabase.from('participants').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('participants').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['participants'] }); toast({ title: 'Succès', description: 'Enregistré avec succès' }); setOpen(false); setEditing(null); },
    onError: () => toast({ title: 'Erreur', description: "Échec de l'enregistrement", variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('participants').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['participants'] }); toast({ title: 'Supprimé avec succès' }); setDeleteId(null); },
  });

  const openNew = () => { setEditing(null); setForm({ nom: '', prenom: '', email: '', tel: '', id_structure: '', id_profil: '' }); setOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ nom: p.nom, prenom: p.prenom, email: p.email || '', tel: p.tel || '', id_structure: p.id_structure || '', id_profil: p.id_profil || '' }); setOpen(true); };

  const filtered = participants?.filter((p: any) => {
    const q = search.toLowerCase();
    return p.nom.toLowerCase().includes(q) || p.prenom.toLowerCase().includes(q);
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Participants</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par nom ou prénom..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-2 opacity-30" />
              <p>Aucun participant trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tél</TableHead>
                  <TableHead>Structure</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nom}</TableCell>
                    <TableCell>{p.prenom}</TableCell>
                    <TableCell>{p.email || '—'}</TableCell>
                    <TableCell>{p.tel || '—'}</TableCell>
                    <TableCell>{p.structures?.libelle || '—'}</TableCell>
                    <TableCell>{p.profils?.libelle || '—'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Modifier le participant' : 'Nouveau participant'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Prénom *</Label><Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Téléphone</Label><Input value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Structure</Label>
              <Select value={form.id_structure} onValueChange={(v) => setForm({ ...form, id_structure: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{structures?.map(s => <SelectItem key={s.id} value={s.id}>{s.libelle}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profil</Label>
              <Select value={form.id_profil} onValueChange={(v) => setForm({ ...form, id_profil: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{profils?.map(p => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmer la suppression</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cet élément ?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Participants;
