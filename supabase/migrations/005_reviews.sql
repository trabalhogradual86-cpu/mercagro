CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid REFERENCES rentals(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id),
  reviewed_id uuid REFERENCES profiles(id),
  rating int CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Avaliações públicas" ON reviews FOR SELECT USING (true);
CREATE POLICY "Usuário avalia" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
