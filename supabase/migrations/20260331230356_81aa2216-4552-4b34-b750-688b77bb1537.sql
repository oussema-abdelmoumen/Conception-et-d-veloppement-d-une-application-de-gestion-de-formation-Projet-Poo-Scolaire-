
-- Create enums
CREATE TYPE public.app_role AS ENUM ('administrateur', 'responsable', 'simple_utilisateur');
CREATE TYPE public.type_formateur AS ENUM ('interne', 'externe');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- user_roles RLS
CREATE POLICY "Admins can manage user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));

CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Domaines
CREATE TABLE public.domaines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.domaines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read domaines" ON public.domaines
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage domaines" ON public.domaines
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));

-- Profils
CREATE TABLE public.profils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read profils" ON public.profils
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage profils" ON public.profils
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));

-- Structures
CREATE TABLE public.structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read structures" ON public.structures
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage structures" ON public.structures
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));

-- Employeurs
CREATE TABLE public.employeurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_employeur TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employeurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read employeurs" ON public.employeurs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage employeurs" ON public.employeurs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));

-- Formateurs
CREATE TABLE public.formateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  tel TEXT,
  type type_formateur NOT NULL DEFAULT 'interne',
  id_employeur UUID REFERENCES public.employeurs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.formateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read formateurs" ON public.formateurs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage formateurs" ON public.formateurs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));
CREATE POLICY "Simple users can manage formateurs" ON public.formateurs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'simple_utilisateur'))
  WITH CHECK (public.has_role(auth.uid(), 'simple_utilisateur'));

-- Participants
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  tel TEXT,
  id_structure UUID REFERENCES public.structures(id) ON DELETE SET NULL,
  id_profil UUID REFERENCES public.profils(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read participants" ON public.participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage participants" ON public.participants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));
CREATE POLICY "Simple users can manage participants" ON public.participants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'simple_utilisateur'))
  WITH CHECK (public.has_role(auth.uid(), 'simple_utilisateur'));

-- Formations
CREATE TABLE public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  annee INTEGER NOT NULL,
  duree INTEGER NOT NULL,
  id_domaine UUID REFERENCES public.domaines(id) ON DELETE SET NULL,
  budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read formations" ON public.formations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage formations" ON public.formations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));
CREATE POLICY "Simple users can manage formations" ON public.formations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'simple_utilisateur'))
  WITH CHECK (public.has_role(auth.uid(), 'simple_utilisateur'));

-- Formation-Formateurs (many-to-many)
CREATE TABLE public.formation_formateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_formation UUID REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  id_formateur UUID REFERENCES public.formateurs(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (id_formation, id_formateur)
);
ALTER TABLE public.formation_formateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read formation_formateurs" ON public.formation_formateurs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage formation_formateurs" ON public.formation_formateurs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));
CREATE POLICY "Simple users can manage formation_formateurs" ON public.formation_formateurs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'simple_utilisateur'))
  WITH CHECK (public.has_role(auth.uid(), 'simple_utilisateur'));

-- Formation-Participants (many-to-many)
CREATE TABLE public.formation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_formation UUID REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  id_participant UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (id_formation, id_participant)
);
ALTER TABLE public.formation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read formation_participants" ON public.formation_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage formation_participants" ON public.formation_participants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrateur'))
  WITH CHECK (public.has_role(auth.uid(), 'administrateur'));
CREATE POLICY "Simple users can manage formation_participants" ON public.formation_participants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'simple_utilisateur'))
  WITH CHECK (public.has_role(auth.uid(), 'simple_utilisateur'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_formateurs_updated_at BEFORE UPDATE ON public.formateurs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_formations_updated_at BEFORE UPDATE ON public.formations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
