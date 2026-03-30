CREATE TABLE equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  model text,
  year int,
  category text,
  description text,
  daily_rate numeric NOT NULL,
  location_city text,
  location_state text,
  location_lat float,
  location_lng float,
  photos text[] DEFAULT '{}',
  status text DEFAULT 'available' CHECK (status IN ('available', 'rented', 'auction', 'inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipamentos públicos" ON equipment FOR SELECT USING (status != 'inactive');
CREATE POLICY "Dono gerencia equipamento" ON equipment FOR ALL USING (auth.uid() = owner_id);

-- Storage bucket para fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('equipment-photos', 'equipment-photos', true);
CREATE POLICY "Fotos públicas" ON storage.objects FOR SELECT USING (bucket_id = 'equipment-photos');
CREATE POLICY "Upload autenticado" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');
