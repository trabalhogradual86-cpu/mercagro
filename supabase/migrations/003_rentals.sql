CREATE TABLE rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment(id) ON DELETE RESTRICT,
  renter_id uuid REFERENCES profiles(id),
  owner_id uuid REFERENCES profiles(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  daily_rate numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  contract_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partes envolvidas veem locação" ON rentals FOR SELECT
  USING (auth.uid() = renter_id OR auth.uid() = owner_id);
CREATE POLICY "Locatário cria locação" ON rentals FOR INSERT
  WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "Partes atualizam locação" ON rentals FOR UPDATE
  USING (auth.uid() = renter_id OR auth.uid() = owner_id);
