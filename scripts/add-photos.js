/**
 * add-photos.js
 * Atualiza os equipamentos no Supabase com fotos reais de máquinas agrícolas.
 * Use: node scripts/add-photos.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const fmt = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

// Fotos por categoria — IDs do Unsplash de máquinas agrícolas reais
const PHOTOS = {
  Trator: [
    fmt('1500595168135-5a4d1d96b7bc'),
    fmt('1590682680695-43b964a3ae17'),
    fmt('1560493676-04071c5f467b'),
    fmt('1625246338378-c9b3c2cbed4a'),
    fmt('1592839988001-9f1a60d0c3f5'),
    fmt('1516367971920-52be69b93c1b'),
  ],
  Colheitadeira: [
    fmt('1574943320219-3a5a4eaefb5a'),
    fmt('1567459267889-83dc04c29b98'),
    fmt('1473186578172-c141e6798cf4'),
    fmt('1574943320219-3a5a4eaefb5a'),
    fmt('1601648461660-e3b8ab8e23fc'),
  ],
  Plantadeira: [
    fmt('1560493676-04071c5f467b'),
    fmt('1625246338378-c9b3c2cbed4a'),
    fmt('1500595168135-5a4d1d96b7bc'),
    fmt('1516367971920-52be69b93c1b'),
  ],
  Semeadeira: [
    fmt('1625246338378-c9b3c2cbed4a'),
    fmt('1560493676-04071c5f467b'),
    fmt('1574943320219-3a5a4eaefb5a'),
  ],
  Pulverizador: [
    fmt('1592839988001-9f1a60d0c3f5'),
    fmt('1532996122724-e3c354a0b15b'),
    fmt('1625246338378-c9b3c2cbed4a'),
    fmt('1590682680695-43b964a3ae17'),
  ],
  Irrigação: [
    fmt('1471193945509-9ad0617afabf'),
    fmt('1512207736890-6ffed8a84e8d'),
    fmt('1527525443983-6e60c75fff32'),
  ],
  Implemento: [
    fmt('1516367971920-52be69b93c1b'),
    fmt('1500595168135-5a4d1d96b7bc'),
    fmt('1590682680695-43b964a3ae17'),
  ],
  Outro: [
    fmt('1500595168135-5a4d1d96b7bc'),
    fmt('1574943320219-3a5a4eaefb5a'),
  ],
};

const DEFAULT = [
  fmt('1500595168135-5a4d1d96b7bc'),
  fmt('1574943320219-3a5a4eaefb5a'),
];

function pickPhotos(category) {
  const pool = PHOTOS[category] || DEFAULT;
  // Pega 2 fotos distintas da categoria
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

async function main() {
  console.log('\n=== Adicionando fotos aos equipamentos ===\n');

  const { data: equipment, error } = await supabase
    .from('equipment')
    .select('id, name, category')
    .order('created_at', { ascending: true });

  if (error) { console.error('Erro ao buscar equipamentos:', error.message); return; }
  if (!equipment?.length) { console.log('Nenhum equipamento encontrado.'); return; }

  console.log(`Equipamentos encontrados: ${equipment.length}\n`);

  let ok = 0, fail = 0;

  for (const eq of equipment) {
    const photos = pickPhotos(eq.category);
    const { error: updErr } = await supabase
      .from('equipment')
      .update({ photos })
      .eq('id', eq.id);

    if (updErr) {
      console.error(`  ✗ ${eq.name}: ${updErr.message}`);
      fail++;
    } else {
      console.log(`  ✓ ${eq.name} [${eq.category}]`);
      ok++;
    }
  }

  console.log(`\n  Concluído: ${ok} atualizados, ${fail} falhas.\n`);
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
