-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'presidente', 'candidato');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'candidato',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create partidos table
CREATE TABLE public.partidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL,
  numero INTEGER,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sigla)
);

-- Create candidatos table
CREATE TABLE public.candidatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  numero INTEGER,
  partido_id UUID NOT NULL REFERENCES public.partidos(id) ON DELETE CASCADE,
  foto_url TEXT,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create regionais table
CREATE TABLE public.regionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  sigla TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bairros table
CREATE TABLE public.bairros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  regional_id UUID REFERENCES public.regionais(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create zonas_eleitorais table
CREATE TABLE public.zonas_eleitorais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  nome TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(numero)
);

-- Create secoes table
CREATE TABLE public.secoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  zona_id UUID NOT NULL REFERENCES public.zonas_eleitorais(id) ON DELETE CASCADE,
  bairro_id UUID REFERENCES public.bairros(id) ON DELETE SET NULL,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votacao table
CREATE TABLE public.votacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  secao_id UUID NOT NULL REFERENCES public.secoes(id) ON DELETE CASCADE,
  zona_id UUID NOT NULL REFERENCES public.zonas_eleitorais(id) ON DELETE CASCADE,
  bairro_id UUID REFERENCES public.bairros(id) ON DELETE SET NULL,
  regional_id UUID REFERENCES public.regionais(id) ON DELETE SET NULL,
  votos INTEGER NOT NULL DEFAULT 0,
  eleitores_aptos INTEGER DEFAULT 0,
  ano_eleicao INTEGER NOT NULL,
  turno INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bairros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_eleitorais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votacao ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- RLS Policies for partidos (Admin full access, others read-only)
CREATE POLICY "Everyone can view active partidos" ON public.partidos FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage partidos" ON public.partidos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- RLS Policies for candidatos
CREATE POLICY "Everyone can view active candidatos" ON public.candidatos FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage candidatos" ON public.candidatos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- RLS Policies for regionais, bairros, zonas, secoes (Admin manages, others read)
CREATE POLICY "Everyone can view regionais" ON public.regionais FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage regionais" ON public.regionais FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Everyone can view bairros" ON public.bairros FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage bairros" ON public.bairros FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Everyone can view zonas" ON public.zonas_eleitorais FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage zonas" ON public.zonas_eleitorais FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Everyone can view secoes" ON public.secoes FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage secoes" ON public.secoes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- RLS Policies for votacao (restricted access based on role)
CREATE POLICY "Admins can view all votacao" ON public.votacao FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Presidentes can view their party votacao" ON public.votacao FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles prof 
    JOIN public.candidatos c ON c.partido_id IN (
      SELECT DISTINCT c2.partido_id FROM public.candidatos c2 
      WHERE c2.user_id = auth.uid()
    )
    WHERE prof.user_id = auth.uid() AND prof.role = 'presidente'
    AND votacao.candidato_id = c.id
  )
);

CREATE POLICY "Candidatos can view their own votacao" ON public.votacao FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.candidatos c 
    WHERE c.user_id = auth.uid() AND votacao.candidato_id = c.id
  )
);

CREATE POLICY "Admins can manage votacao" ON public.votacao FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome', new.email),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'candidato')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partidos_updated_at BEFORE UPDATE ON public.partidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_candidatos_updated_at BEFORE UPDATE ON public.candidatos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_votacao_updated_at BEFORE UPDATE ON public.votacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();