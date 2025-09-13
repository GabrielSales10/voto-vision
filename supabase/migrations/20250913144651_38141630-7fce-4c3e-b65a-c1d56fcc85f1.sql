-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-photos', 'candidate-photos', true);

-- Create storage policies for candidate photos
CREATE POLICY "Admin can upload candidate photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'candidate-photos' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Admin can update candidate photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'candidate-photos' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Admin can delete candidate photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'candidate-photos' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Candidate photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'candidate-photos');

-- Add columns to candidatos table
ALTER TABLE candidatos 
ADD COLUMN IF NOT EXISTS votos_por_secao_file TEXT,
ADD COLUMN IF NOT EXISTS votos_por_bairro_file TEXT,
ADD COLUMN IF NOT EXISTS usa_regionais BOOLEAN DEFAULT true;

-- Create table to store candidate-bairro associations
CREATE TABLE IF NOT EXISTS candidate_bairros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID REFERENCES candidatos(id) ON DELETE CASCADE,
  bairro_nome TEXT NOT NULL,
  votos INTEGER DEFAULT 0,
  percentual_votos DECIMAL DEFAULT 0,
  regional_id UUID REFERENCES regionais(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for candidate_bairros
ALTER TABLE candidate_bairros ENABLE ROW LEVEL SECURITY;

-- Create policies for candidate_bairros
CREATE POLICY "Admins can manage candidate_bairros" 
ON candidate_bairros 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Candidates can view their own bairros" 
ON candidate_bairros 
FOR SELECT 
USING (candidato_id IN (
  SELECT id FROM candidatos WHERE user_id = auth.uid()
));

-- Create table to store candidate voting sections
CREATE TABLE IF NOT EXISTS candidate_secoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID REFERENCES candidatos(id) ON DELETE CASCADE,
  zona INTEGER NOT NULL,
  secao INTEGER NOT NULL,
  secoes_agregadas TEXT,
  votos INTEGER DEFAULT 0,
  local_votacao TEXT,
  endereco_local TEXT,
  bairro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for candidate_secoes
ALTER TABLE candidate_secoes ENABLE ROW LEVEL SECURITY;

-- Create policies for candidate_secoes
CREATE POLICY "Admins can manage candidate_secoes" 
ON candidate_secoes 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Candidates can view their own secoes" 
ON candidate_secoes 
FOR SELECT 
USING (candidato_id IN (
  SELECT id FROM candidatos WHERE user_id = auth.uid()
));