CREATE TABLE auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment(id) ON DELETE RESTRICT,
  owner_id uuid REFERENCES profiles(id),
  start_price numeric NOT NULL,
  current_price numeric,
  min_increment numeric DEFAULT 50,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'finished', 'cancelled')),
  winner_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id uuid REFERENCES profiles(id),
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leilões públicos" ON auctions FOR SELECT USING (true);
CREATE POLICY "Dono cria leilão" ON auctions FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Dono atualiza leilão" ON auctions FOR UPDATE USING (auth.uid() = owner_id);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lances públicos" ON bids FOR SELECT USING (true);
CREATE POLICY "Usuário autenticado dá lance" ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Habilitar Realtime para a tabela bids
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
