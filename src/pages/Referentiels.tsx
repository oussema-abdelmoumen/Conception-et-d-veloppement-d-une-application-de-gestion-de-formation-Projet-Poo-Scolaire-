import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Check, X, Loader2, Settings } from 'lucide-react';

interface ReferentielItem {
  id: string;
  libelle?: string;
  nom_employeur?: string;
}

const ReferentielTab = ({ tableName, labelField, title }: { tableName: string; labelField: string; title: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName as any).select('*').order(labelField);
      if (error) throw error;
      return (data as unknown) as ReferentielItem[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase.from(tableName as any).insert({ [labelField]: value } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [tableName] }); setNewValue(''); toast({ title: 'Ajouté avec succès' }); },
    onError: () => toast({ title: 'Erreur', description: "Échec de l'ajout", variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { error } = await supabase.from(tableName as any).update({ [labelField]: value } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [tableName] }); setEditingId(null); toast({ title: 'Modifié avec succès' }); },
    onError: () => toast({ title: 'Erreur', description: 'Échec de la modification', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [tableName] }); setDeleteId(null); toast({ title: 'Supprimé avec succès' }); },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <form onSubmit={(e) => { e.preventDefault(); if (newValue.trim()) addMutation.mutate(newValue.trim()); }} className="flex gap-2 mt-2">
          <Input placeholder={`Nouveau ${title.toLowerCase().slice(0, -1)}...`} value={newValue} onChange={(e) => setNewValue(e.target.value)} className="flex-1" />
          <Button type="submit" size="sm" disabled={!newValue.trim()}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
        </form>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !data?.length ? (
          <p className="text-center text-muted-foreground py-4">Aucun élément</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Libellé</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8" autoFocus />
                    ) : (
                      <span>{(item as any)[labelField]}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {editingId === item.id ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => updateMutation.mutate({ id: item.id, value: editValue })}><Check className="h-4 w-4 text-[hsl(var(--success))]" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingId(item.id); setEditValue((item as any)[labelField]); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmer la suppression</AlertDialogTitle><AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cet élément ?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

const Referentiels = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-primary">Référentiels</h1>
      </div>
      <Tabs defaultValue="domaines">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="domaines">Domaines</TabsTrigger>
          <TabsTrigger value="structures">Structures</TabsTrigger>
          <TabsTrigger value="profils">Profils</TabsTrigger>
          <TabsTrigger value="employeurs">Employeurs</TabsTrigger>
        </TabsList>
        <TabsContent value="domaines"><ReferentielTab tableName="domaines" labelField="libelle" title="Domaines" /></TabsContent>
        <TabsContent value="structures"><ReferentielTab tableName="structures" labelField="libelle" title="Structures" /></TabsContent>
        <TabsContent value="profils"><ReferentielTab tableName="profils" labelField="libelle" title="Profils" /></TabsContent>
        <TabsContent value="employeurs"><ReferentielTab tableName="employeurs" labelField="nom_employeur" title="Employeurs" /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Referentiels;
