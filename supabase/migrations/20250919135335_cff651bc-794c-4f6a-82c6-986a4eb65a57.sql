-- Remove dangerous overly permissive RLS policies that bypass security
-- These policies completely override the admin-only restrictions

-- Remove permissive policies from candidate_anos
DROP POLICY IF EXISTS "candidate_anos all" ON public.candidate_anos;

-- Remove permissive policies from candidate_bairros  
DROP POLICY IF EXISTS "candidate_bairros all" ON public.candidate_bairros;

-- Remove permissive policies from candidate_secoes
DROP POLICY IF EXISTS "candidate_secoes all" ON public.candidate_secoes;

-- Remove permissive policies from candidatos table
DROP POLICY IF EXISTS "candidatos select" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos insert" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos update" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos delete" ON public.candidatos;

-- Remove permissive policy from regionais
DROP POLICY IF EXISTS "regionais all" ON public.regionais;

-- Remove permissive policy from regionais_bairros
DROP POLICY IF EXISTS "regionais_bairros all" ON public.regionais_bairros;

-- Create proper RLS policy for regionais_bairros table to replace the overly permissive one
CREATE POLICY "Admins can manage regionais_bairros" 
ON public.regionais_bairros 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'::user_role
));

-- Create view policy for regionais_bairros for authenticated users
CREATE POLICY "Authenticated users can view regionais_bairros" 
ON public.regionais_bairros 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Ensure candidatos table only allows viewing active candidates publicly, but restrict management to admins
-- The existing "Everyone can view active candidatos" policy is fine, keep it
-- The "Admins can manage candidatos" policy is also fine, keep it

-- Add security definer function to safely check user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;