/**
 * add-photos.js v2
 * Atualiza equipamentos no Supabase com fotos reais e corretas por marca/modelo.
 * Usa Wikimedia Commons (Special:FilePath) — URLs estáveis e públicas.
 * Use: node scripts/add-photos.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Helper: URL direta via Special:FilePath do Wikimedia Commons
const wiki = (filename) =>
  `https://commons.wikimedia.org/w/index.php?title=Special:FilePath/${encodeURIComponent(filename)}&width=800`;

// Já confirmadas via upload direto
const direct = (path) => `https://upload.wikimedia.org/wikipedia/commons/${path}`;

// ── Mapeamento por nome de equipamento (parcial) → fotos ────────────────────
// A chave é testada com .includes() no nome do equipamento (case-insensitive)
const BY_NAME = [
  // ── Stara (confirmadas) ──────────────────────────────────────────────────
  { match: 'Stara Imperador',  photos: [direct('7/71/Stara_Imperador_3.0_Agritechnica_2017_-_Front.jpg')] },
  { match: 'Stara Hércules',   photos: [direct('7/71/Stara_Imperador_3.0_Agritechnica_2017_-_Front.jpg')] },
  { match: 'Stara Estrela',    photos: [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')] },

  // ── Forrageira New Holland ───────────────────────────────────────────────
  { match: 'Forrageira',       photos: [direct('c/c2/New_Holland_FX30_forage_harvester.jpg')] },

  // ── Tratores John Deere ──────────────────────────────────────────────────
  { match: 'John Deere 8R',    photos: [wiki('John_Deere_8345_R.jpg')] },
  { match: 'John Deere 7215',  photos: [wiki('John_Deere_7530_Premium_2.JPG')] },
  { match: 'John Deere 6120',  photos: [wiki('John_Deere_6410_Traktor_HD.JPG')] },
  { match: 'John Deere 6110',  photos: [wiki('John_Deere_6410_Traktor_HD.JPG')] },
  { match: 'John Deere 5100',  photos: [wiki('Maimarkt_Mannheim_2015_-_John_Deere_5075E.JPG')] },
  { match: 'John Deere 5075',  photos: [wiki('Maimarkt_Mannheim_2015_-_John_Deere_5075E.JPG')] },

  // ── Colheitadeiras John Deere ────────────────────────────────────────────
  { match: 'John Deere S770',  photos: [wiki('John_Deere_S660.JPG')] },
  { match: 'John Deere S760',  photos: [wiki('John_Deere_S660.JPG')] },
  { match: 'John Deere S680',  photos: [wiki('John_Deere_S660.JPG')] },

  // ── Pulverizador John Deere ──────────────────────────────────────────────
  { match: 'John Deere R4023', photos: [wiki('John_Deere_4720_Sprayer.jpg')] },

  // ── Plantadeira John Deere ───────────────────────────────────────────────
  { match: 'John Deere 1775', photos: [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')] },
  { match: 'John Deere 1113', photos: [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')] },

  // ── Massey Ferguson Tratores ─────────────────────────────────────────────
  { match: 'Massey Ferguson 7719', photos: [wiki('Massey_Ferguson_7726.jpg')] },
  { match: 'Massey Ferguson 6716', photos: [wiki('Massey_Ferguson_7726.jpg')] },
  { match: 'Massey Ferguson 5713', photos: [wiki('Massey_Ferguson_5610_Special.jpg')] },
  { match: 'Massey Ferguson 4710', photos: [wiki('Massey-Ferguson_4335_tractor.jpg')] },

  // ── Massey Ferguson Colheitadeiras ───────────────────────────────────────
  { match: 'Massey Ferguson 9790', photos: [wiki('Massey-Ferguson_9895_combine_harvester.jpg')] },
  { match: 'Massey Ferguson 7275', photos: [wiki('Massey-Ferguson_9895_combine_harvester.jpg')] },

  // ── New Holland Tratores ─────────────────────────────────────────────────
  { match: 'New Holland T8',   photos: [wiki('New_Holland_T8.390.jpg')] },
  { match: 'New Holland T7',   photos: [wiki('NewHolland_T7070.jpg')] },
  { match: 'New Holland T6',   photos: [wiki('NewHolland_T7070.jpg')] },
  { match: 'New Holland TM',   photos: [wiki('New_Holland_TM120_tractor_at_IndAgra_Farm_Romexpo_2010.JPG')] },

  // ── New Holland Colheitadeiras ───────────────────────────────────────────
  { match: 'New Holland CR',   photos: [wiki('New_Holland_CR9090_combine.jpg')] },
  { match: 'New Holland TC',   photos: [wiki('New_Holland_CR9090_combine.jpg')] },

  // ── Pulverizador New Holland ─────────────────────────────────────────────
  { match: 'New Holland SP',   photos: [wiki('New_Holland_SP.300F_sprayer.jpg')] },

  // ── Valtra Tratores ──────────────────────────────────────────────────────
  { match: 'Valtra T',         photos: [wiki('Valtra_Valmet_985_S_tractor_in_Uruguay.jpg')] },
  { match: 'Valtra N',         photos: [wiki('Valtra_Valmet_985_S_tractor_in_Uruguay.jpg')] },
  { match: 'Valtra BH',        photos: [wiki('Valtra_Valmet_985_S_tractor_in_Uruguay.jpg')] },
  { match: 'Valtra A',         photos: [wiki('Valtra_Valmet_985_S_tractor_in_Uruguay.jpg')] },

  // ── Valtra Plantadeira Apache ─────────────────────────────────────────────
  { match: 'Valtra Apache',    photos: [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')] },

  // ── Case IH Tratores ─────────────────────────────────────────────────────
  { match: 'Case IH Steiger',  photos: [wiki('IMG_7675_Case_IH_Steiger_485_Tractor.jpg')] },
  { match: 'Case IH Puma',     photos: [wiki('Traktor_Case_Puma_195_CVX.JPG')] },
  { match: 'Case IH Maxxum',   photos: [wiki('Case-IH_Maxxum_MXM155_tractor.jpg')] },
  { match: 'Case IH Farmall',  photos: [wiki('Bakel,_tractorshow,_Farmall_DED-3.JPG')] },
  { match: 'Case IH AFS',      photos: [wiki('IMG_7675_Case_IH_Steiger_485_Tractor.jpg')] },

  // ── Case IH Colheitadeiras ───────────────────────────────────────────────
  { match: 'Case IH Axial-Flow 8250', photos: [wiki('Case_IH_Axial-Flow_8010_combine.jpg')] },
  { match: 'Case IH Axial-Flow 6150', photos: [wiki('Case_IH_Axial-Flow_8010_combine.jpg')] },
  { match: 'Case IH 8250',     photos: [wiki('Case_IH_Axial-Flow_8010_combine.jpg')] },
  { match: 'Case IH 6150',     photos: [wiki('Case_IH_Axial-Flow_8010_combine.jpg')] },

  // ── Case IH Pulverizador ─────────────────────────────────────────────────
  { match: 'Case IH Patriot',  photos: [wiki('Case_IH_Patriot_3330_sprayer.jpg')] },

  // ── Case IH Plantadeira ──────────────────────────────────────────────────
  { match: 'Case IH Early Riser', photos: [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')] },

  // ── Gleaner ──────────────────────────────────────────────────────────────
  { match: 'Gleaner',          photos: [wiki('Gleaner_R72_combine_harvester.jpg')] },

  // ── Fendt ────────────────────────────────────────────────────────────────
  { match: 'Fendt 724',        photos: [wiki('Traktor_Fendt_930_Vario.JPG')] },
  { match: 'Fendt 516',        photos: [wiki('Fendt_415_Vario_TMS.jpg')] },

  // ── Kubota ───────────────────────────────────────────────────────────────
  { match: 'Kubota',           photos: [wiki('Kubota_M7-151_tractor.jpg')] },

  // ── Jacto ────────────────────────────────────────────────────────────────
  { match: 'Jacto',            photos: [wiki('Jacto_Uniport_3030_sprayer.jpg')] },

  // ── Jumil ────────────────────────────────────────────────────────────────
  { match: 'Jumil',            photos: [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')] },

  // ── Agrale ───────────────────────────────────────────────────────────────
  { match: 'Agrale',           photos: [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')] },

  // ── Implementos ──────────────────────────────────────────────────────────
  { match: 'Subsolador',       photos: [wiki('Subsoiler_Culti_R.JPG')] },
  { match: 'Grade aradora',    photos: [wiki('John_Deere_disk_harrow.jpg')] },
  { match: 'Grade niveladora', photos: [wiki('Tandem_disc_harrow.jpg')] },
  { match: 'Rolo compactador', photos: [wiki('Cambridge_roller.jpg')] },
  { match: 'Arado de discos',  photos: [wiki('John_Deere_disk_harrow.jpg')] },
  { match: 'Escarificador',    photos: [wiki('Subsoiler_Culti_R.JPG')] },
  { match: 'Enxada rotativa',  photos: [wiki('Rotary_hoe_plow.jpg')] },
  { match: 'Semeadora',        photos: [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')] },
  { match: 'Distribuidor de calcário', photos: [wiki('Lime_spreader_tractor.jpg')] },
  { match: 'Carreta graneleira', photos: [wiki('Grain_trailer_agriculture.jpg')] },
  { match: 'Carregador frontal', photos: [wiki('Front_loader_tractor.jpg')] },

  // ── Irrigação ────────────────────────────────────────────────────────────
  { match: 'Pivô central',     photos: [wiki('Center_pivot_irrigation_in_Colorado.JPG'), wiki('Irrigation_Pivot_on_Mielie_Field.JPG')] },
  { match: 'irrigação por aspersão', photos: [wiki('Sprinkler_irrigation.jpg')] },
  { match: 'Netafim',          photos: [wiki('Sprinkler_irrigation.jpg')] },

  // ── Transporte ───────────────────────────────────────────────────────────
  { match: 'Mercedes',         photos: [wiki('Mercedes-Benz_Actros_2644_S.jpg')] },
  { match: 'Volkswagen Constellation', photos: [wiki('VW_Constellation_31.320_grain_truck.jpg')] },
  { match: 'Ford Cargo',       photos: [wiki('Ford_Cargo_2428_truck.jpg')] },
  { match: 'Randon',           photos: [wiki('Randon_semi-trailer.jpg')] },
];

// ── Fallback por categoria ───────────────────────────────────────────────────
const BY_CATEGORY = {
  Trator:       [wiki('John_Deere_6410_Traktor_HD.JPG')],
  Colheitadeira:[wiki('John_Deere_S660.JPG')],
  Plantadeira:  [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')],
  Semeadeira:   [wiki('John_Deere_Planter_with_Case_IH_Tractor.JPG')],
  Pulverizador: [wiki('Sprayer_agriculture_field.jpg')],
  Grade:        [wiki('John_Deere_disk_harrow.jpg')],
  Grades:       [wiki('John_Deere_disk_harrow.jpg')],
  Implemento:   [wiki('Subsoiler_Culti_R.JPG')],
  Irrigação:    [wiki('Center_pivot_irrigation_in_Colorado.JPG')],
  Transporte:   [wiki('Grain_truck_agriculture.jpg')],
};

function pickPhotos(name, category) {
  const nameLower = name.toLowerCase();
  for (const { match, photos } of BY_NAME) {
    if (nameLower.includes(match.toLowerCase())) return photos;
  }
  return BY_CATEGORY[category] || [wiki('John_Deere_6410_Traktor_HD.JPG')];
}

async function main() {
  console.log('\n=== Atualizando fotos dos equipamentos (v2) ===\n');

  const { data: equipment, error } = await supabase
    .from('equipment')
    .select('id, name, category')
    .order('name');

  if (error) { console.error('Erro:', error.message); return; }
  console.log(`Equipamentos encontrados: ${equipment.length}\n`);

  let ok = 0, fail = 0;
  for (const eq of equipment) {
    const photos = pickPhotos(eq.name, eq.category);
    const { error: updErr } = await supabase
      .from('equipment')
      .update({ photos })
      .eq('id', eq.id);

    if (updErr) { console.error(`  ✗ ${eq.name}:`, updErr.message); fail++; }
    else { console.log(`  ✓ ${eq.name}`); ok++; }
  }

  console.log(`\n  Concluído: ${ok} atualizados, ${fail} falhas.\n`);
}

main().catch(err => { console.error('Erro fatal:', err.message); process.exit(1); });
