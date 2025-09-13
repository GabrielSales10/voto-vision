-- Add login field to profiles table
ALTER TABLE public.profiles ADD COLUMN login text UNIQUE;

-- Add support for multiple years in candidate data
CREATE TABLE public.candidate_anos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidato_id uuid NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  votos_por_secao_file text,
  votos_por_bairro_file text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(candidato_id, ano)
);

-- Enable RLS on candidate_anos
ALTER TABLE public.candidate_anos ENABLE ROW LEVEL SECURITY;

-- Create policies for candidate_anos
CREATE POLICY "Admins can manage candidate_anos" 
ON public.candidate_anos 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.user_id = auth.uid() AND p.role = 'admin'::user_role
));

CREATE POLICY "Candidates can view their own anos" 
ON public.candidate_anos 
FOR SELECT 
USING (candidato_id IN (
  SELECT c.id FROM public.candidatos c
  WHERE c.user_id = auth.uid()
));

-- Add year column to existing candidate data tables
ALTER TABLE public.candidate_secoes ADD COLUMN ano integer DEFAULT 2024;
ALTER TABLE public.candidate_bairros ADD COLUMN ano integer DEFAULT 2024;

-- Create table for cities (extracted from CSV data)
CREATE TABLE public.cidades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on cidades
ALTER TABLE public.cidades ENABLE ROW LEVEL SECURITY;

-- Create policies for cidades
CREATE POLICY "Everyone can view cidades" 
ON public.cidades 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage cidades" 
ON public.cidades 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.user_id = auth.uid() AND p.role = 'admin'::user_role
));

-- Update bairros table to reference cidade
ALTER TABLE public.bairros ADD COLUMN cidade_id uuid REFERENCES public.cidades(id);

-- Update trigger to handle profiles with login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, role, login)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome', new.email),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'candidato'),
    COALESCE(new.raw_user_meta_data->>'login', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;