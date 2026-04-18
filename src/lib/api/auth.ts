import { http, tokenStore } from './http';

export type AppRole = 'administrateur' | 'responsable' | 'simple_utilisateur';

// Le backend renvoie le rôle en MAJUSCULES (enum Java) — on normalise.
const normalizeRole = (r: string): AppRole =>
  r.toLowerCase() as AppRole;

export interface MeResponse {
  userId: string;
  email: string;
  role: AppRole;
}

export const authApi = {
  async login(email: string, password: string) {
    const res = await http.post<{ token: string; userId: string; email: string; role: string }>(
      '/auth/login',
      { email, password }
    );
    tokenStore.set(res.token);
    return { ...res, role: normalizeRole(res.role) };
  },

  async me(): Promise<MeResponse | null> {
    if (!tokenStore.get()) return null;
    try {
      const r = await http.get<{ userId: string; email: string; role: string }>('/auth/me');
      return { ...r, role: normalizeRole(r.role) };
    } catch {
      tokenStore.clear();
      return null;
    }
  },

  logout() {
    tokenStore.clear();
  },
};
