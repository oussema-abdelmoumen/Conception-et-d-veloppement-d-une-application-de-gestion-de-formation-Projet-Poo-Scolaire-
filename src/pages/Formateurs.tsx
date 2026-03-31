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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Loader2, UserCheck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type TypeFormateur = Database['public']['Enums']['type_formateur'];

const Formateurs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', tel: '', type: 'interne' as TypeFormateur, id_employeur: '' });

  const { data: formateurs, isLoading } = useQuery({
    queryKey: ['formateurs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('formateurs').select('*, employeurs(nom_employeur)').order('nom');
      if (error) throw error;
      return data;
    },
  });

  const { data: employeurs } = useQuery({ queryKey: ['employeurs'], queryFn: async () => (await supabase.from('employeurs').select('*').order('nom_employeur')).data || [] });

  const saveMutation = useMutation({
    mutationFn: async (v: any) => {
      const payload = { nom: v.nom, prenom: v.prenom, email: v.email || null, tel: v.tel || null, type: v.type, id_employeur: v.type === 'externe' ? (v.id_employeur || null) : null };
      if (editing) {
        const { error } = await supabase.from('formateurs').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('formateurs').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['formateurs'] }); toast({ title: 'Succès', description: 'Enregistré avec succès' }); setOpen(false); setEditing(null); },
    onError: () => toast({ title: 'Erreur', description: "Échec de l'enregistrement", variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('formateurs').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['formateurs'] }); toast({ title: 'Supprimé avec succès' }); setDeleteId(null); },
  });

  const openNew = () => { setEditing(null); setForm({ nom: '', prenom: '', email: '', tel: '', type: 'interne', id_employeur: '' }); setOpen(true); };
  const openEdit = (f: any) => { setEditing(f); setForm({ nom: f.nom, prenom: f.prenom, email: f.email || '', tel: f.tel || '', type: f.type, id_employeur: f.id_employeur || '' }); setOpen(true); };

  const filtered = formateurs?.filter((f: any) => {
    const q = search.toLowerCase();
    const matchSearch = f.nom.toLowerCase().includes(q) || f.prenom.toLowerCase().includes(q);
    const matchType = !filterType || filterType === 'all' || f.type === filterType;
    return matchSearch && matchType;
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Formateurs</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="interne">Interne</SelectItem>
                <SelectItem value="externe">Externe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="mx-auto h-12 w-12 mb-2 opacity-30" />
              <p>Aucun formateur trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tél</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Employeur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nom}</TableCell>
                    <TableCell>{f.prenom}</TableCell>
                    <TableCell>{f.email || '—'}</TableCell>
                    <TableCell>{f.tel || '—'}</TableCell>
                    <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${f.type === 'interne' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'}`}>{f.type === 'interne' ? 'Interne' : 'Externe'}</span></TableCell>
                    <TableCell>{f.employeurs?.nom_employeur || '—'}</TableCell>
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
          <DialogHeader><DialogTitle>{editing ? 'Modifier le formateur' : 'Nouveau formateur'}</DialogTitle></DialogHeader>
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
              <Label>Type *</Label>
              <RadioGroup value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TypeFormateur })} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="interne" id="interne" /><Label htmlFor="interne">Interne</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="externe" id="externe" /><Label htmlFor="externe">Externe</Label></div>
              </RadioGroup>
            </div>
            {form.type === 'externe' && (
              <div className="space-y-2">
                <Label>Employeur</Label>
                <Select value={form.id_employeur} onValueChange={(v) => setForm({ ...form, id_employeur: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{employeurs?.map(e => <SelectItem key={e.id} value={e.id}>{e.nom_employeur}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
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

export default Formateurs;
