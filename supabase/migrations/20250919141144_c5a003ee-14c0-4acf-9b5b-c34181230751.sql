-- Create user access control tables
CREATE TABLE public.user_candidate_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, candidate_id)
);

CREATE TABLE public.user_party_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, party_id)
);

-- Create regional neighborhood mapping table
CREATE TABLE public.regional_neighborhood_map (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city_id UUID REFERENCES cidades(id) ON DELETE CASCADE,
    regional_id UUID NOT NULL REFERENCES regionais(id) ON DELETE CASCADE,
    neighborhood_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(city_id, neighborhood_name)
);

-- Enable RLS on new tables
ALTER TABLE public.user_candidate_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_party_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_neighborhood_map ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_candidate_access
CREATE POLICY "Admins can manage user_candidate_access" ON public.user_candidate_access
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own candidate access" ON public.user_candidate_access
FOR SELECT USING (user_id = auth.uid());

-- RLS policies for user_party_access
CREATE POLICY "Admins can manage user_party_access" ON public.user_party_access
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own party access" ON public.user_party_access
FOR SELECT USING (user_id = auth.uid());

-- RLS policies for regional_neighborhood_map
CREATE POLICY "Everyone can view regional mappings" ON public.regional_neighborhood_map
FOR SELECT USING (true);

CREATE POLICY "Admins can manage regional mappings" ON public.regional_neighborhood_map
FOR ALL USING (is_admin(auth.uid()));

-- Update existing candidate access policies to use new access control
DROP POLICY IF EXISTS "Candidates can view their own bairros" ON public.candidate_bairros;
CREATE POLICY "Candidates can view their own bairros" ON public.candidate_bairros
FOR SELECT USING (
    candidato_id IN (
        SELECT candidate_id FROM user_candidate_access WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Candidates can view their own secoes" ON public.candidate_secoes;
CREATE POLICY "Candidates can view their own secoes" ON public.candidate_secoes
FOR SELECT USING (
    candidato_id IN (
        SELECT candidate_id FROM user_candidate_access WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Candidates can view their own anos" ON public.candidate_anos;
CREATE POLICY "Candidates can view their own anos" ON public.candidate_anos
FOR SELECT USING (
    candidato_id IN (
        SELECT candidate_id FROM user_candidate_access WHERE user_id = auth.uid()
    )
);

-- Add party-based access for presidents
CREATE POLICY "Presidents can view party candidate bairros" ON public.candidate_bairros
FOR SELECT USING (
    candidato_id IN (
        SELECT c.id FROM candidatos c
        JOIN user_party_access upa ON upa.party_id = c.partido_id
        WHERE upa.user_id = auth.uid()
    )
);

CREATE POLICY "Presidents can view party candidate secoes" ON public.candidate_secoes
FOR SELECT USING (
    candidato_id IN (
        SELECT c.id FROM candidatos c
        JOIN user_party_access upa ON upa.party_id = c.partido_id
        WHERE upa.user_id = auth.uid()
    )
);

CREATE POLICY "Presidents can view party candidate anos" ON public.candidate_anos
FOR SELECT USING (
    candidato_id IN (
        SELECT c.id FROM candidatos c
        JOIN user_party_access upa ON upa.party_id = c.partido_id
        WHERE upa.user_id = auth.uid()
    )
);

-- Create helper function to get user accessible candidates
CREATE OR REPLACE FUNCTION public.get_user_accessible_candidates(user_id UUID)
RETURNS TABLE(candidate_id UUID, candidate_name TEXT, party_name TEXT)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    -- Direct candidate access
    SELECT c.id, c.nome, p.nome as party_name
    FROM candidatos c
    JOIN partidos p ON p.id = c.partido_id
    WHERE c.id IN (
        SELECT uca.candidate_id 
        FROM user_candidate_access uca 
        WHERE uca.user_id = get_user_accessible_candidates.user_id
    )
    
    UNION
    
    -- Party-based access (for presidents)
    SELECT c.id, c.nome, p.nome as party_name
    FROM candidatos c
    JOIN partidos p ON p.id = c.partido_id
    WHERE c.partido_id IN (
        SELECT upa.party_id 
        FROM user_party_access upa 
        WHERE upa.user_id = get_user_accessible_candidates.user_id
    );
$$;