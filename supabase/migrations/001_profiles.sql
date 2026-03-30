CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  full_name text,
  cpf_cnpj text,
  user_type text CHECK (user_type IN ('producer', 'owner', 'both')),
  location_city text,
  location_state text,
  location_lat float,
  location_lng float,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfis públicos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuário gerencia próprio perfil" ON profiles FOR ALL USING (auth.uid() = id);
