// Couche de compatibilité : reproduit la surface de `supabase.from(table).select/insert/update/delete`
// pour appeler le backend Spring Boot SANS réécrire toutes les pages.
//
// Limitations connues :
//  - Les "jointures" type `.select('*, domaines(libelle)')` sont simulées en
//    chargeant la table liée et en fusionnant côté client.
//  - `.eq('id', x).single()` etc. sont supportés pour les cas utilisés dans le projet.
//  - Les Edge Functions sont mappées vers /api/users.

import { http } from './http';

// ---- Mapping table -> endpoint ----
const ENDPOINTS: Record<string, string> = {
  domaines: '/domaines',
  profils: '/profils',
  structures: '/structures',
  employeurs: '/employeurs',
  formateurs: '/formateurs',
  participants: '/participants',
  formations: '/formations',
  formation_participants: '/__special_fp__',
  formation_formateurs: '/__special_ff__',
  user_roles: '/users',
};

// Champs à transformer entre snake_case (DB) et camelCase (Java)
const SNAKE_TO_CAMEL: Record<string, string> = {
  id_employeur: 'idEmployeur',
  id_structure: 'idStructure',
  id_profil: 'idProfil',
  id_domaine: 'idDomaine',
  id_formation: 'idFormation',
  id_formateur: 'idFormateur',
  id_participant: 'idParticipant',
  nom_employeur: 'nomEmployeur',
};
const CAMEL_TO_SNAKE: Record<string, string> = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL).map(([k, v]) => [v, k])
);

function toBackend(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[SNAKE_TO_CAMEL[k] ?? k] = v;
  }
  return out;
}
function toFrontend(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toFrontend);
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[CAMEL_TO_SNAKE[k] ?? k] = v;
  }
  return out;
}

// ---- Parser le `select(...)` pour détecter les jointures ----
interface JoinSpec {
  table: string;     // ex: 'domaines'
  fields: string[];  // ex: ['libelle']
}
function parseSelect(sel: string): JoinSpec[] {
  const joins: JoinSpec[] = [];
  // matche "tableName(field1,field2)"
  const re = /(\w+)\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(sel)) !== null) {
    joins.push({ table: m[1], fields: m[2].split(',').map((s) => s.trim()) });
  }
  return joins;
}

// Cache simple par table pour les jointures (évite N+1)
const joinCache = new Map<string, Promise<any[]>>();
function loadAll(table: string): Promise<any[]> {
  if (!joinCache.has(table)) {
    const ep = ENDPOINTS[table];
    joinCache.set(table, http.get<any[]>(ep).then(toFrontend));
  }
  return joinCache.get(table)!;
}
function clearJoinCache(table?: string) {
  if (table) joinCache.delete(table);
  else joinCache.clear();
}

// ---- QueryBuilder ----
class Query {
  private filters: Array<{ field: string; op: 'eq'; value: any }> = [];
  private orderField?: string;
  private orderAsc = true;
  private selectStr = '*';

  constructor(private table: string) {}

  select(s: string = '*') {
    this.selectStr = s;
    return this;
  }
  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }
  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  // .single() => première ligne
  async single() {
    const r = await this.exec();
    if (r.error) return r;
    const row = r.data && r.data[0];
    return { data: row ?? null, error: row ? null : new Error('No row') };
  }

  then<T1 = any, T2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null
  ): Promise<T1 | T2> {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }

  private async exec(): Promise<{ data: any[] | null; error: any }> {
    try {
      // Cas spéciaux : tables de liaison
      if (this.table === 'formation_participants' || this.table === 'formation_formateurs') {
        return await this.execLink();
      }
      if (this.table === 'user_roles') {
        // GET /api/users -> [{id,email,role,createdAt}]
        const data = await http.get<any[]>('/users');
        let rows = data.map((u) => ({
          id: u.id,
          user_id: u.id,
          role: (u.role as string)?.toLowerCase(),
          email: u.email,
        }));
        rows = this.applyClientOps(rows);
        return { data: rows, error: null };
      }

      const ep = ENDPOINTS[this.table];
      if (!ep) throw new Error(`Table inconnue: ${this.table}`);
      const raw = await http.get<any[]>(ep);
      let rows: any[] = toFrontend(raw);

      // Jointures
      const joins = parseSelect(this.selectStr);
      if (joins.length) {
        for (const j of joins) {
          const fk = `id_${j.table.replace(/s$/, '')}`; // ex: id_domaine
          const related = await loadAll(j.table);
          const byId = new Map(related.map((r: any) => [r.id, r]));
          rows = rows.map((row) => ({
            ...row,
            [j.table]: row[fk] ? pick(byId.get(row[fk]), j.fields) : null,
          }));
        }
      }

      rows = this.applyClientOps(rows);
      return { data: rows, error: null };
    } catch (e: any) {
      return { data: null, error: e };
    }
  }

  private async execLink(): Promise<{ data: any[] | null; error: any }> {
    // formation_participants / formation_formateurs : nécessite filtre par id_formation
    const f = this.filters.find((x) => x.field === 'id_formation');
    const isFP = this.table === 'formation_participants';
    if (f) {
      const ids = await http.get<string[]>(
        `/formations/${f.value}/${isFP ? 'participants' : 'formateurs'}`
      );
      const fkOut = isFP ? 'id_participant' : 'id_formateur';
      return {
        data: ids.map((id) => ({ id_formation: f.value, [fkOut]: id })),
        error: null,
      };
    }
    // Pas de filtre : on charge toutes les formations puis tout assemble
    const formations = await http.get<any[]>('/formations');
    const all: any[] = [];
    for (const fo of formations) {
      const ids = await http.get<string[]>(
        `/formations/${fo.id}/${isFP ? 'participants' : 'formateurs'}`
      );
      const fkOut = isFP ? 'id_participant' : 'id_formateur';
      ids.forEach((id) => all.push({ id_formation: fo.id, [fkOut]: id }));
    }
    return { data: all, error: null };
  }

  private applyClientOps(rows: any[]) {
    for (const f of this.filters) {
      if (f.op === 'eq') rows = rows.filter((r) => r[f.field] === f.value);
    }
    if (this.orderField) {
      const k = this.orderField;
      rows = [...rows].sort((a, b) => {
        const va = a[k], vb = b[k];
        if (va === vb) return 0;
        const cmp = va > vb ? 1 : -1;
        return this.orderAsc ? cmp : -cmp;
      });
    }
    return rows;
  }
}

function pick(obj: any, fields: string[]) {
  if (!obj) return null;
  if (fields.length === 1 && fields[0] === '*') return obj;
  const out: any = {};
  for (const f of fields) out[f] = obj[f];
  return out;
}

// ---- Mutation builder ----
class Mutation {
  private filters: Array<{ field: string; value: any }> = [];

  constructor(private table: string, private op: 'insert' | 'update' | 'delete', private payload?: any) {}

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  then<T1 = any, T2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null
  ): Promise<T1 | T2> {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }

  private async exec(): Promise<{ data: any; error: any }> {
    try {
      clearJoinCache();

      // Cas spéciaux liaisons
      if (this.table === 'formation_participants' || this.table === 'formation_formateurs') {
        return await this.execLink();
      }
      if (this.table === 'user_roles') {
        // pas utilisé directement en écriture (on passe par les edge functions)
        throw new Error('user_roles non modifiable directement');
      }

      const ep = ENDPOINTS[this.table];
      if (this.op === 'insert') {
        const res = await http.post(ep, toBackend(this.payload));
        return { data: toFrontend(res), error: null };
      }
      if (this.op === 'update') {
        const idF = this.filters.find((f) => f.field === 'id');
        if (!idF) throw new Error('UPDATE sans id non supporté');
        const res = await http.put(`${ep}/${idF.value}`, toBackend(this.payload));
        return { data: toFrontend(res), error: null };
      }
      if (this.op === 'delete') {
        const idF = this.filters.find((f) => f.field === 'id');
        if (idF) {
          await http.delete(`${ep}/${idF.value}`);
          return { data: null, error: null };
        }
        throw new Error('DELETE sans id non supporté');
      }
      return { data: null, error: new Error('Opération inconnue') };
    } catch (e: any) {
      return { data: null, error: e };
    }
  }

  private async execLink(): Promise<{ data: any; error: any }> {
    const isFP = this.table === 'formation_participants';
    const subPath = isFP ? 'participants' : 'formateurs';
    const fkOut = isFP ? 'id_participant' : 'id_formateur';

    if (this.op === 'insert') {
      const p = this.payload;
      const current = await http.get<string[]>(`/formations/${p.id_formation}/${subPath}`);
      if (!current.includes(p[fkOut])) {
        await http.put(`/formations/${p.id_formation}/${subPath}`, {
          ids: [...current, p[fkOut]],
        });
      }
      return { data: null, error: null };
    }
    if (this.op === 'delete') {
      const fF = this.filters.find((f) => f.field === 'id_formation');
      const fX = this.filters.find((f) => f.field === fkOut);
      if (!fF) throw new Error('id_formation requis');
      const current = await http.get<string[]>(`/formations/${fF.value}/${subPath}`);
      const next = fX ? current.filter((x) => x !== fX.value) : [];
      await http.put(`/formations/${fF.value}/${subPath}`, { ids: next });
      return { data: null, error: null };
    }
    throw new Error('Opération non supportée sur table de liaison');
  }
}

// ---- Edge functions compat ----
async function invokeFunction(name: string, opts: { body: any }) {
  try {
    if (name === 'create-user') {
      const { email, password, role } = opts.body;
      const data = await http.post('/users', {
        email,
        password,
        role: (role as string).toUpperCase(),
      });
      return { data, error: null };
    }
    if (name === 'delete-user') {
      const { userId } = opts.body;
      await http.delete(`/users/${userId}`);
      return { data: { success: true }, error: null };
    }
    return { data: null, error: new Error(`Fonction inconnue: ${name}`) };
  } catch (e: any) {
    return { data: null, error: e };
  }
}

// ---- API publique compatible Supabase ----
export const supabaseCompat = {
  from(table: string) {
    return {
      select: (s?: string) => new Query(table).select(s ?? '*'),
      insert: (payload: any) => new Mutation(table, 'insert', payload),
      update: (payload: any) => new Mutation(table, 'update', payload),
      delete: () => new Mutation(table, 'delete'),
    };
  },
  functions: {
    invoke: invokeFunction,
  },
};
