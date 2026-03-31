-- ============================================================
-- 006_admin.sql
-- Suporte a painel administrativo, aprovação de equipamentos,
-- bloqueio de usuários e taxa da plataforma (1% por locação)
-- ============================================================

-- Flag de administrador no perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Flag de bloqueio de usuário
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Status de aprovação de equipamentos (moderação pelo admin)
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Equipamentos já existentes são aprovados automaticamente
UPDATE equipment SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = 'pending';

-- Taxa da plataforma por locação (1% do total)
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2) DEFAULT 0;

-- Atualizar locações já existentes com a taxa calculada
UPDATE rentals SET platform_fee = ROUND(total_amount * 0.01, 2) WHERE platform_fee = 0;

-- ============================================================
-- Atualizar política de listagem pública de equipamentos
-- Agora exige approval_status = 'approved' além de não-inactive
-- ============================================================
DROP POLICY IF EXISTS "Equipamentos públicos" ON equipment;
CREATE POLICY "Equipamentos públicos" ON equipment FOR SELECT
  USING (status != 'inactive' AND approval_status = 'approved');

-- O dono ainda pode ver seus próprios equipamentos (mesmo pending/rejected)
DROP POLICY IF EXISTS "Dono gerencia equipamento" ON equipment;
CREATE POLICY "Dono gerencia equipamento" ON equipment FOR ALL
  USING (auth.uid() = owner_id);
