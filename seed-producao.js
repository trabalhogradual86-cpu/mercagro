require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(4));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── DADOS BASE ───────────────────────────────────────────────────────────────
const ESTADOS = [
  { state: 'MT', cities: [['Sorriso', -12.5462, -55.7219], ['Rondonópolis', -16.4726, -54.6366], ['Lucas do Rio Verde', -13.0581, -55.9108], ['Primavera do Leste', -15.5567, -54.2993], ['Sinop', -11.8641, -55.5094], ['Cuiabá', -15.6014, -56.0979]] },
  { state: 'PR', cities: [['Cascavel', -24.9578, -53.4595], ['Londrina', -23.3045, -51.1696], ['Maringá', -23.4273, -51.9375], ['Ponta Grossa', -25.0945, -50.1633], ['Guarapuava', -25.3937, -51.4594]] },
  { state: 'RS', cities: [['Passo Fundo', -28.2620, -52.4070], ['Santa Rosa', -27.8716, -54.4808], ['Cruz Alta', -28.6382, -53.6064], ['Ijuí', -28.3878, -53.9144], ['Pelotas', -31.7654, -52.3376]] },
  { state: 'GO', cities: [['Rio Verde', -17.7987, -50.9242], ['Goiânia', -16.6869, -49.2648], ['Anápolis', -16.3281, -48.9532], ['Jataí', -17.8794, -51.7155], ['Catalão', -18.1670, -47.9447]] },
  { state: 'MS', cities: [['Campo Grande', -20.4697, -54.6201], ['Dourados', -22.2219, -54.8056], ['Três Lagoas', -20.7849, -51.7003], ['Naviraí', -23.0648, -54.1946]] },
  { state: 'MG', cities: [['Uberlândia', -18.9186, -48.2772], ['Unaí', -16.3592, -46.9043], ['Patos de Minas', -18.5789, -46.5180], ['Uberaba', -19.7482, -47.9317]] },
  { state: 'BA', cities: [['Barreiras', -12.1522, -44.9994], ['Luís Eduardo Magalhães', -12.0965, -45.7940], ['Formosa do Rio Preto', -11.0516, -45.1930], ['Correntina', -13.3402, -44.6396]] },
  { state: 'MA', cities: [['Imperatriz', -5.5253, -47.4914], ['Balsas', -7.5322, -46.0353], ['Timon', -5.0919, -42.8355]] },
  { state: 'TO', cities: [['Palmas', -10.1840, -48.3336], ['Paraíso do Tocantins', -10.1692, -48.8858], ['Gurupi', -11.7319, -49.0614]] },
  { state: 'SP', cities: [['Ribeirão Preto', -21.1775, -47.8103], ['Araçatuba', -21.2089, -50.4328], ['Presidente Prudente', -22.1208, -51.3882], ['São José do Rio Preto', -20.8197, -49.3795]] },
];

const randomLocation = () => {
  const estado = pick(ESTADOS);
  const city = pick(estado.cities);
  return { location_city: city[0], location_state: estado.state, location_lat: city[1] + randFloat(-0.05, 0.05), location_lng: city[2] + randFloat(-0.05, 0.05) };
};

// ─── USUÁRIOS ─────────────────────────────────────────────────────────────────
const NOMES_PROPIETARIOS = [
  'Carlos Agropecuária', 'Fazenda Boa Esperança', 'Maquinários Silva Ltda', 'Grupo Cerrado Máquinas',
  'Agro Equipamentos Norte', 'Pedro Locações Rurais', 'João Implementos Agrícolas', 'Irrigo Máquinas e Serviços',
  'Família Rodrigues Agro', 'Trator Center Sul', 'Agro Rental Mato Grosso', 'Colheita Fácil Locações',
  'Roberto Máquinas Pesadas', 'Safra Equipamentos GO', 'Sertão Máquinas BA',
];

const NOMES_PRODUTORES = [
  'Ana Paula Ferreira', 'Marcos Gonçalves', 'Fernanda Souza', 'Ricardo Almeida',
  'Claudia Martins', 'Eduardo Barros', 'Luciana Pereira', 'Thiago Nascimento',
  'Patricia Costa', 'Bruno Lima', 'Vanessa Oliveira', 'Diego Santana',
  'Mariana Rocha', 'Felipe Nunes', 'Camila Araújo', 'Gustavo Mendes',
  'Renata Cavalcante', 'André Cardoso', 'Juliana Teixeira', 'Rafael Moura',
];

const CPF_BASE = [
  '123.456.789-10', '234.567.890-11', '345.678.901-22', '456.789.012-33',
  '567.890.123-44', '678.901.234-55', '789.012.345-66', '890.123.456-77',
  '901.234.567-88', '012.345.678-99', '111.222.333-44', '222.333.444-55',
  '333.444.555-66', '444.555.666-77', '555.666.777-88', '666.777.888-99',
  '777.888.999-00', '888.999.000-11', '999.000.111-22', '100.200.300-40',
  '200.300.400-50', '300.400.500-60', '400.500.600-70', '500.600.700-80',
  '600.700.800-90', '700.800.900-01', '800.900.001-12', '900.001.002-23',
  '001.002.003.34', '002.003.004-45',
];

const CNPJ_BASE = [
  '12.345.678/0001-90', '23.456.789/0001-01', '34.567.890/0001-12', '45.678.901/0001-23',
  '56.789.012/0001-34', '67.890.123/0001-45', '78.901.234/0001-56', '89.012.345/0001-67',
  '90.123.456/0001-78', '01.234.567/0001-89', '11.222.333/0001-44', '22.333.444/0001-55',
  '33.444.555/0001-66', '44.555.666/0001-77', '55.666.777/0001-88',
];

// ─── EQUIPAMENTOS ─────────────────────────────────────────────────────────────
const EQUIPMENT_POOL = [
  // Tratores
  { name: 'Trator John Deere 6110J', brand: 'John Deere', model: '6110J', year: 2021, category: 'Trator', daily_rate: 850 },
  { name: 'Trator New Holland TM7040', brand: 'New Holland', model: 'TM7040', year: 2020, category: 'Trator', daily_rate: 780 },
  { name: 'Trator Massey Ferguson 7719', brand: 'Massey Ferguson', model: '7719', year: 2022, category: 'Trator', daily_rate: 920 },
  { name: 'Trator Valtra BH180', brand: 'Valtra', model: 'BH180', year: 2019, category: 'Trator', daily_rate: 700 },
  { name: 'Trator Case IH Puma 185', brand: 'Case IH', model: 'Puma 185', year: 2021, category: 'Trator', daily_rate: 870 },
  { name: 'Trator Fendt 724 Vario', brand: 'Fendt', model: '724 Vario', year: 2023, category: 'Trator', daily_rate: 1200 },
  { name: 'Trator John Deere 5075E', brand: 'John Deere', model: '5075E', year: 2020, category: 'Trator', daily_rate: 550 },
  { name: 'Trator Massey Ferguson 4710', brand: 'Massey Ferguson', model: '4710', year: 2019, category: 'Trator', daily_rate: 490 },
  { name: 'Trator New Holland T7.245', brand: 'New Holland', model: 'T7.245', year: 2022, category: 'Trator', daily_rate: 980 },
  { name: 'Trator Valtra A134', brand: 'Valtra', model: 'A134', year: 2018, category: 'Trator', daily_rate: 420 },
  { name: 'Trator John Deere 7215R', brand: 'John Deere', model: '7215R', year: 2022, category: 'Trator', daily_rate: 1050 },
  { name: 'Trator Case IH Farmall 110A', brand: 'Case IH', model: 'Farmall 110A', year: 2020, category: 'Trator', daily_rate: 620 },
  { name: 'Trator Massey Ferguson 5713S', brand: 'Massey Ferguson', model: '5713S', year: 2021, category: 'Trator', daily_rate: 680 },
  { name: 'Trator New Holland T6.175', brand: 'New Holland', model: 'T6.175', year: 2022, category: 'Trator', daily_rate: 760 },
  { name: 'Trator Valtra T195', brand: 'Valtra', model: 'T195', year: 2021, category: 'Trator', daily_rate: 830 },
  { name: 'Trator John Deere 6120J', brand: 'John Deere', model: '6120J', year: 2020, category: 'Trator', daily_rate: 890 },
  { name: 'Trator Fendt 516 Vario', brand: 'Fendt', model: '516 Vario', year: 2021, category: 'Trator', daily_rate: 960 },
  { name: 'Trator Case IH Maxxum 150', brand: 'Case IH', model: 'Maxxum 150', year: 2022, category: 'Trator', daily_rate: 820 },
  { name: 'Trator New Holland T8.390', brand: 'New Holland', model: 'T8.390', year: 2023, category: 'Trator', daily_rate: 1100 },
  { name: 'Trator Massey Ferguson 6716S', brand: 'Massey Ferguson', model: '6716S', year: 2022, category: 'Trator', daily_rate: 890 },
  { name: 'Trator John Deere 5100R', brand: 'John Deere', model: '5100R', year: 2020, category: 'Trator', daily_rate: 730 },
  { name: 'Trator Valtra N175', brand: 'Valtra', model: 'N175', year: 2021, category: 'Trator', daily_rate: 710 },
  { name: 'Trator Kubota M7-153', brand: 'Kubota', model: 'M7-153', year: 2022, category: 'Trator', daily_rate: 780 },
  { name: 'Trator John Deere 8R 340', brand: 'John Deere', model: '8R 340', year: 2023, category: 'Trator', daily_rate: 1450 },
  { name: 'Trator Case IH AFS Connect Steiger 540', brand: 'Case IH', model: 'Steiger 540', year: 2022, category: 'Trator', daily_rate: 1600 },

  // Colheitadeiras
  { name: 'Colheitadeira John Deere S680', brand: 'John Deere', model: 'S680', year: 2021, category: 'Colheitadeira', daily_rate: 3500 },
  { name: 'Colheitadeira Case IH Axial-Flow 8250', brand: 'Case IH', model: 'Axial-Flow 8250', year: 2022, category: 'Colheitadeira', daily_rate: 3800 },
  { name: 'Colheitadeira New Holland CR9.90', brand: 'New Holland', model: 'CR9.90', year: 2020, category: 'Colheitadeira', daily_rate: 3200 },
  { name: 'Colheitadeira Massey Ferguson 9790', brand: 'Massey Ferguson', model: '9790', year: 2019, category: 'Colheitadeira', daily_rate: 2800 },
  { name: 'Colheitadeira John Deere S760', brand: 'John Deere', model: 'S760', year: 2023, category: 'Colheitadeira', daily_rate: 4200 },
  { name: 'Colheitadeira Gleaner S98', brand: 'Gleaner', model: 'S98', year: 2021, category: 'Colheitadeira', daily_rate: 3600 },
  { name: 'Colheitadeira Case IH Axial-Flow 6150', brand: 'Case IH', model: 'Axial-Flow 6150', year: 2020, category: 'Colheitadeira', daily_rate: 2900 },
  { name: 'Colheitadeira New Holland TC5.90', brand: 'New Holland', model: 'TC5.90', year: 2021, category: 'Colheitadeira', daily_rate: 3100 },
  { name: 'Colheitadeira Massey Ferguson 7275 Centora', brand: 'Massey Ferguson', model: '7275 Centora', year: 2022, category: 'Colheitadeira', daily_rate: 4000 },
  { name: 'Colheitadeira John Deere S770', brand: 'John Deere', model: 'S770', year: 2022, category: 'Colheitadeira', daily_rate: 3900 },

  // Plantadeiras
  { name: 'Plantadeira Jumil JM 3060 PD', brand: 'Jumil', model: 'JM 3060 PD', year: 2021, category: 'Plantadeira', daily_rate: 650 },
  { name: 'Plantadeira Valtra Apache 2500', brand: 'Valtra', model: 'Apache 2500', year: 2020, category: 'Plantadeira', daily_rate: 580 },
  { name: 'Plantadeira John Deere 1113', brand: 'John Deere', model: '1113', year: 2022, category: 'Plantadeira', daily_rate: 720 },
  { name: 'Plantadeira Agrale 4800 HS', brand: 'Agrale', model: '4800 HS', year: 2019, category: 'Plantadeira', daily_rate: 480 },
  { name: 'Plantadeira Case IH Early Riser 2150', brand: 'Case IH', model: 'Early Riser 2150', year: 2021, category: 'Plantadeira', daily_rate: 800 },
  { name: 'Plantadeira Stara Estrela 32000', brand: 'Stara', model: 'Estrela 32000', year: 2022, category: 'Plantadeira', daily_rate: 870 },
  { name: 'Plantadeira John Deere ExactEmerge 1775NT', brand: 'John Deere', model: '1775NT ExactEmerge', year: 2023, category: 'Plantadeira', daily_rate: 1100 },

  // Pulverizadores
  { name: 'Pulverizador Jacto Uniport 3030', brand: 'Jacto', model: 'Uniport 3030', year: 2022, category: 'Pulverizador', daily_rate: 1800 },
  { name: 'Pulverizador Stara Imperador 3.0', brand: 'Stara', model: 'Imperador 3.0', year: 2021, category: 'Pulverizador', daily_rate: 1650 },
  { name: 'Pulverizador John Deere R4023', brand: 'John Deere', model: 'R4023', year: 2023, category: 'Pulverizador', daily_rate: 2200 },
  { name: 'Pulverizador Case IH Patriot 3330', brand: 'Case IH', model: 'Patriot 3330', year: 2020, category: 'Pulverizador', daily_rate: 1900 },
  { name: 'Pulverizador Jacto Uniport 2530', brand: 'Jacto', model: 'Uniport 2530', year: 2019, category: 'Pulverizador', daily_rate: 1400 },
  { name: 'Pulverizador New Holland SP.300F', brand: 'New Holland', model: 'SP.300F', year: 2022, category: 'Pulverizador', daily_rate: 1750 },
  { name: 'Pulverizador Jacto Uniport 4030', brand: 'Jacto', model: 'Uniport 4030', year: 2023, category: 'Pulverizador', daily_rate: 2400 },
  { name: 'Pulverizador Stara Hércules 10000', brand: 'Stara', model: 'Hércules 10000', year: 2022, category: 'Pulverizador', daily_rate: 2000 },

  // Grades
  { name: 'Grade aradora Baldan GAAR 36x26', brand: 'Baldan', model: 'GAAR 36x26', year: 2020, category: 'Grade', daily_rate: 280 },
  { name: 'Grade niveladora Tatu GNN 36x20', brand: 'Tatu', model: 'GNN 36x20', year: 2021, category: 'Grade', daily_rate: 220 },
  { name: 'Grade aradora Baldan GAAM 32x26', brand: 'Baldan', model: 'GAAM 32x26', year: 2019, category: 'Grade', daily_rate: 250 },
  { name: 'Grade niveladora Tatu GN 32', brand: 'Tatu', model: 'GN 32', year: 2020, category: 'Grade', daily_rate: 200 },
  { name: 'Grade aradora pesada Marchesan GAPD 60x28', brand: 'Marchesan', model: 'GAPD 60x28', year: 2022, category: 'Grade', daily_rate: 380 },

  // Implementos
  { name: 'Subsolador Baldan SBT 7 Hastes', brand: 'Baldan', model: 'SBT 7 Hastes', year: 2021, category: 'Implemento', daily_rate: 350 },
  { name: 'Enxada rotativa Tatu FR 1,80m', brand: 'Tatu', model: 'FR 1,80m', year: 2020, category: 'Implemento', daily_rate: 180 },
  { name: 'Arado de discos Baldan AD-4 x26', brand: 'Baldan', model: 'AD-4 x26', year: 2019, category: 'Implemento', daily_rate: 260 },
  { name: 'Rolo compactador Tatu RC 5,0m', brand: 'Tatu', model: 'RC 5,0m', year: 2021, category: 'Implemento', daily_rate: 190 },
  { name: 'Escarificador Baldan ESC 9 Hastes', brand: 'Baldan', model: 'ESC 9 Hastes', year: 2022, category: 'Implemento', daily_rate: 320 },
  { name: 'Carreta graneleira Vacchi 20.000L', brand: 'Vacchi', model: 'Graneleira 20.000L', year: 2021, category: 'Implemento', daily_rate: 450 },
  { name: 'Distribuidor de calcário Metasa DCA 3000', brand: 'Metasa', model: 'DCA 3000', year: 2020, category: 'Implemento', daily_rate: 230 },
  { name: 'Forrageira New Holland FP240', brand: 'New Holland', model: 'FP240', year: 2021, category: 'Implemento', daily_rate: 290 },
  { name: 'Semeadora Jumil JM 2980 TDS', brand: 'Jumil', model: 'JM 2980 TDS', year: 2022, category: 'Implemento', daily_rate: 410 },
  { name: 'Carregador frontal Stara Krone', brand: 'Stara', model: 'Krone', year: 2021, category: 'Implemento', daily_rate: 340 },

  // Irrigação
  { name: 'Pivô central Valmont 500m', brand: 'Valmont', model: 'Valley 8000', year: 2021, category: 'Irrigação', daily_rate: 2800 },
  { name: 'Pivô central Lindsay Zimmatic 400m', brand: 'Lindsay', model: 'Zimmatic 400m', year: 2020, category: 'Irrigação', daily_rate: 2400 },
  { name: 'Sistema de irrigação por aspersão Netafim', brand: 'Netafim', model: 'Sprinkler Pro 300m', year: 2022, category: 'Irrigação', daily_rate: 1500 },
  { name: 'Conjunto moto-bomba Schneider 75cv', brand: 'Schneider', model: 'ME-AP 3" 75cv', year: 2021, category: 'Irrigação', daily_rate: 380 },

  // Transporte
  { name: 'Caminhão agrícola Mercedes 2644', brand: 'Mercedes-Benz', model: 'Actros 2644', year: 2021, category: 'Transporte', daily_rate: 1200 },
  { name: 'Caminhão graneleiro Volkswagen Constellation 31.320', brand: 'Volkswagen', model: 'Constellation 31.320', year: 2020, category: 'Transporte', daily_rate: 1050 },
  { name: 'Carreta Randon graneleira 60m³', brand: 'Randon', model: 'Graneleira 60m³', year: 2021, category: 'Transporte', daily_rate: 600 },
  { name: 'Truck Ford Cargo 2428 graneleiro', brand: 'Ford', model: 'Cargo 2428', year: 2020, category: 'Transporte', daily_rate: 780 },
];

const DESCRIPTIONS = [
  'Equipamento em excelente estado de conservação. Manutenção em dia e documentação completa. Disponível para locação imediata.',
  'Máquina revisada recentemente com laudo técnico. Ideal para safra de soja e milho. Operador disponível mediante consulta.',
  'Equipamento de alta produtividade, conservado em galpão coberto. Revisão completa realizada em 2024.',
  'Excelente custo-benefício. Motor revisado, pneus novos. Perfeito para pequenas e médias propriedades.',
  'Máquina de alta tecnologia com GPS de precisão embutido. Histórico de manutenção disponível para consulta.',
  'Equipamento bem conservado com baixo número de horas trabalhadas. Documentação em dia. Aceita locação de curto prazo.',
  'Máquina com todas as revisões feitas na concessionária autorizada. Ótimo para grandes lavouras de grãos.',
  'Equipamento disponível para locação mensal ou por safra. Preço negociável para contratos longos.',
  'Máquina com tecnologia de precisão, monitores de plantio e ISO-BUS. Entrega no local mediante consulta.',
  'Excelente estado geral, último modelo lançado no mercado. Consumo de combustível otimizado.',
  'Ideal para produtores que precisam de equipamento de ponta sem o custo de compra. Suporte técnico incluso.',
  'Máquina conservada, revisão feita, pneus calibrados. Entrega e retirada negociáveis conforme a região.',
];

const COMENTARIOS_POSITIVOS = [
  'Ótimo equipamento, chegou no prazo combinado e estava em perfeito estado. Recomendo!',
  'Proprietário muito atencioso, máquina em excelente condição. Com certeza locaria novamente.',
  'Experiência ótima, equipamento superou as expectativas. Entrega e retirada sem problemas.',
  'Máquina funcionou perfeitamente durante toda a safra. Proprietário honesto e prestativo.',
  'Equipamento top de linha, valeu cada centavo investido. Produtividade excelente.',
  'Tudo ocorreu conforme combinado. Equipamento bem conservado e documentado.',
  'Muito satisfeito com a locação. Maquinário em perfeito estado, proprietário confiável.',
];

const COMENTARIOS_NEUTROS = [
  'Bom equipamento mas a entrega atrasou um dia. No geral valeu.',
  'Máquina ok, fez o trabalho. Poderia ter manutenção mais recente.',
  'Locação tranquila, equipamento cumpriu o prometido. Nada de extraordinário.',
  'Funcionou bem, mas o proprietário demorou para responder mensagens.',
];

// ─── FUNÇÕES ──────────────────────────────────────────────────────────────────
async function createUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      return list.users.find((u) => u.email === email);
    }
    throw error;
  }
  return data.user;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function toDate(d) {
  return d.toISOString().split('T')[0];
}

// ─── SEED PRINCIPAL ───────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Iniciando seed de produção do Mercagro...\n');
  console.log('   Isso pode levar alguns minutos...\n');

  // ════════════════════════════════════════════════════════════════════════════
  // 1. USUÁRIOS
  // ════════════════════════════════════════════════════════════════════════════
  console.log('👤 Criando usuários...');

  // Admin
  const adminAuthUser = await createUser('admin@mercagro.com', 'Admin@123456');
  await supabase.from('profiles').upsert({
    id: adminAuthUser.id,
    full_name: 'Admin Mercagro',
    cpf_cnpj: '000.000.000-00',
    user_type: 'both',
    is_admin: true,
    ...randomLocation(),
  });
  console.log('  ✓ admin@mercagro.com (admin)');

  // Proprietários de equipamentos (owners)
  const ownerUsers = [];
  for (let i = 0; i < NOMES_PROPIETARIOS.length; i++) {
    const email = `proprietario${i + 1}@mercagro.com`;
    const user = await createUser(email, 'Teste@123456');
    const loc = randomLocation();
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: NOMES_PROPIETARIOS[i],
      cpf_cnpj: CNPJ_BASE[i % CNPJ_BASE.length],
      user_type: 'owner',
      ...loc,
    });
    ownerUsers.push({ ...user, location: loc, name: NOMES_PROPIETARIOS[i] });
    process.stdout.write(`  ✓ ${email}\n`);
    await sleep(100);
  }

  // Produtores (renters)
  const producerUsers = [];
  for (let i = 0; i < NOMES_PRODUTORES.length; i++) {
    const email = `produtor${i + 1}@mercagro.com`;
    const user = await createUser(email, 'Teste@123456');
    const loc = randomLocation();
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: NOMES_PRODUTORES[i],
      cpf_cnpj: CPF_BASE[i % CPF_BASE.length],
      user_type: 'producer',
      ...loc,
    });
    producerUsers.push({ ...user, location: loc, name: NOMES_PRODUTORES[i] });
    process.stdout.write(`  ✓ ${email}\n`);
    await sleep(100);
  }

  // Usuários "both" (proprietário e produtor)
  const bothUsers = [];
  const bothNomes = ['Cooperativa Agro Norte', 'Grupo Rural Integrado', 'Fazenda Modelo Premium', 'AgroTech Solutions', 'Empresa Rural do Cerrado'];
  for (let i = 0; i < bothNomes.length; i++) {
    const email = `agro${i + 1}@mercagro.com`;
    const user = await createUser(email, 'Teste@123456');
    const loc = randomLocation();
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: bothNomes[i],
      cpf_cnpj: CNPJ_BASE[(i + 10) % CNPJ_BASE.length],
      user_type: 'both',
      ...loc,
    });
    bothUsers.push({ ...user, location: loc, name: bothNomes[i] });
    process.stdout.write(`  ✓ ${email}\n`);
    await sleep(100);
  }

  const allOwners = [...ownerUsers, ...bothUsers];
  const allRenters = [...producerUsers, ...bothUsers];
  const totalUsers = 1 + ownerUsers.length + producerUsers.length + bothUsers.length;
  console.log(`\n  Total: ${totalUsers} usuários criados\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // 2. EQUIPAMENTOS
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🚜 Criando equipamentos...');
  const allEquipmentIds = [];
  const availableEquipmentIds = [];
  let equipCount = 0;

  // Cada owner recebe entre 3 e 8 equipamentos
  for (const owner of allOwners) {
    const qtd = rand(3, 8);
    const pool = [...EQUIPMENT_POOL];
    // Embaralha
    pool.sort(() => Math.random() - 0.5);

    for (let i = 0; i < qtd && i < pool.length; i++) {
      const eq = pool[i];
      const loc = randomLocation();
      const desc = pick(DESCRIPTIONS);
      const yearVariation = rand(-1, 1);
      const rateVariation = rand(-50, 100);

      const { data, error } = await supabase.from('equipment').insert({
        owner_id: owner.id,
        name: eq.name,
        brand: eq.brand,
        model: eq.model,
        year: Math.min(2024, Math.max(2015, eq.year + yearVariation)),
        category: eq.category,
        description: desc,
        daily_rate: Math.max(100, eq.daily_rate + rateVariation),
        location_city: loc.location_city,
        location_state: loc.location_state,
        location_lat: loc.location_lat,
        location_lng: loc.location_lng,
        photos: [],
        status: 'available',
        approval_status: 'approved',
      }).select('id, daily_rate, owner_id').single();

      if (error) {
        console.error(`  ✗ ${eq.name}:`, error.message);
      } else {
        allEquipmentIds.push(data);
        availableEquipmentIds.push(data);
        equipCount++;
        process.stdout.write(`  ✓ ${eq.name} (${owner.name})\n`);
      }
      await sleep(30);
    }
  }

  console.log(`\n  Total: ${equipCount} equipamentos criados\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // 3. LOCAÇÕES
  // ════════════════════════════════════════════════════════════════════════════
  console.log('📋 Criando locações...');
  let rentalCount = 0;
  const completedRentals = []; // Para gerar reviews depois

  // Define quantas locações criar e em quais estados
  const rentalScenarios = [
    // Locações concluídas (passado) — base para reviews
    { count: 20, status: 'completed', daysStartOffset: -60, daysEndOffset: -45 },
    { count: 15, status: 'completed', daysStartOffset: -40, daysEndOffset: -20 },
    // Locações ativas (agora)
    { count: 12, status: 'active', daysStartOffset: -5, daysEndOffset: 10 },
    // Locações confirmadas (futuro próximo)
    { count: 10, status: 'confirmed', daysStartOffset: 3, daysEndOffset: 15 },
    // Locações pendentes
    { count: 10, status: 'pending', daysStartOffset: 5, daysEndOffset: 18 },
    // Locações canceladas
    { count: 5, status: 'cancelled', daysStartOffset: -30, daysEndOffset: -25 },
  ];

  // Filtra equipamentos disponíveis (não marca como rented ainda, apenas simula)
  let equipIdx = 0;
  for (const scenario of rentalScenarios) {
    for (let i = 0; i < scenario.count; i++) {
      if (equipIdx >= availableEquipmentIds.length) equipIdx = 0;
      const eq = availableEquipmentIds[equipIdx % availableEquipmentIds.length];
      equipIdx++;

      const renter = pick(allRenters.filter((r) => r.id !== eq.owner_id));
      if (!renter) continue;

      const days = rand(3, 21);
      const startDate = daysAgo(-scenario.daysStartOffset); // offset positivo = futuro
      startDate.setDate(startDate.getDate() + rand(-3, 3)); // pequena variação
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);

      const platformFee = parseFloat((eq.daily_rate * days * 0.01).toFixed(2));

      const { data: rental, error } = await supabase.from('rentals').insert({
        equipment_id: eq.id,
        renter_id: renter.id,
        owner_id: eq.owner_id,
        start_date: toDate(startDate),
        end_date: toDate(endDate),
        daily_rate: eq.daily_rate,
        total_amount: eq.daily_rate * days,
        platform_fee: platformFee,
        status: scenario.status,
      }).select('id').single();

      if (error) {
        process.stderr.write(`  ✗ Locação: ${error.message}\n`);
      } else {
        rentalCount++;
        process.stdout.write(`  ✓ Locação ${scenario.status} (${days} dias, R$ ${eq.daily_rate * days})\n`);
        if (scenario.status === 'completed') {
          completedRentals.push({ rentalId: rental.id, renterId: renter.id, ownerId: eq.owner_id });
        }
      }
      await sleep(30);
    }
  }

  console.log(`\n  Total: ${rentalCount} locações criadas\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // 4. LEILÕES
  // ════════════════════════════════════════════════════════════════════════════
  console.log('⚡ Criando leilões...');
  let auctionCount = 0;

  // Separa alguns equipamentos para leilão (não reutiliza os mesmos IDs)
  const auctionCandidates = allEquipmentIds.slice(0, Math.floor(allEquipmentIds.length * 0.3));

  const auctionScenarios = [
    // Leilões ativos (já começaram, ainda não terminaram)
    { count: 8, status: 'active', startHoursAgo: 12, endDaysFromNow: 2 },
    { count: 5, status: 'active', startHoursAgo: 2, endDaysFromNow: 5 },
    // Leilões agendados (ainda não começaram)
    { count: 6, status: 'scheduled', startDaysFromNow: 2, endDaysFromNow: 5 },
    { count: 4, status: 'scheduled', startDaysFromNow: 7, endDaysFromNow: 10 },
    // Leilões finalizados (passado)
    { count: 8, status: 'finished', startDaysAgo: 20, endDaysAgo: 10 },
    { count: 5, status: 'finished', startDaysAgo: 45, endDaysAgo: 38 },
    // Leilões cancelados
    { count: 2, status: 'cancelled', startDaysFromNow: 5, endDaysFromNow: 8 },
  ];

  let auctionEqIdx = 0;
  for (const scenario of auctionScenarios) {
    for (let i = 0; i < scenario.count; i++) {
      const eq = auctionCandidates[auctionEqIdx % auctionCandidates.length];
      auctionEqIdx++;
      if (!eq) continue;

      let startsAt, endsAt;

      if (scenario.status === 'active') {
        startsAt = new Date();
        startsAt.setHours(startsAt.getHours() - (scenario.startHoursAgo || 1));
        endsAt = daysFromNow(scenario.endDaysFromNow || 2);
      } else if (scenario.status === 'scheduled') {
        startsAt = daysFromNow(scenario.startDaysFromNow || 3);
        endsAt = daysFromNow(scenario.endDaysFromNow || 6);
      } else if (scenario.status === 'finished') {
        startsAt = daysAgo(scenario.startDaysAgo || 15);
        endsAt = daysAgo(scenario.endDaysAgo || 10);
      } else {
        // cancelled
        startsAt = daysFromNow(scenario.startDaysFromNow || 5);
        endsAt = daysFromNow(scenario.endDaysFromNow || 8);
      }

      const startPrice = Math.round(eq.daily_rate * rand(5, 15) / 50) * 50;
      const minIncrement = pick([50, 100, 150, 200]);

      const { data: auction, error: auctionError } = await supabase.from('auctions').insert({
        equipment_id: eq.id,
        owner_id: eq.owner_id,
        start_price: startPrice,
        current_price: startPrice,
        min_increment: minIncrement,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: scenario.status,
      }).select('id').single();

      if (auctionError) {
        process.stderr.write(`  ✗ Leilão: ${auctionError.message}\n`);
        continue;
      }

      // Atualiza status do equipamento se leilão ativo ou agendado
      if (scenario.status === 'active' || scenario.status === 'scheduled') {
        await supabase.from('equipment').update({ status: 'auction' }).eq('id', eq.id);
      }

      // Gera lances (bids)
      const numBids = scenario.status === 'cancelled' ? 0 : rand(2, 12);
      let currentBid = startPrice;
      let winnerId = null;

      // Sorteia licitantes (excluindo o dono)
      const bidders = allRenters.filter((r) => r.id !== eq.owner_id);
      bidders.sort(() => Math.random() - 0.5);
      const activeBidders = bidders.slice(0, Math.min(rand(2, 5), bidders.length));

      for (let b = 0; b < numBids; b++) {
        if (activeBidders.length === 0) break;
        const bidder = activeBidders[b % activeBidders.length];
        currentBid += minIncrement * rand(1, 4);

        const bidTime = new Date(startsAt.getTime() + (b + 1) * rand(600000, 7200000));
        await supabase.from('bids').insert({
          auction_id: auction.id,
          bidder_id: bidder.id,
          amount: currentBid,
          created_at: bidTime.toISOString(),
        });
        winnerId = bidder.id;
        await sleep(20);
      }

      // Atualiza preço atual e vencedor (se finalizado)
      const updateData = { current_price: currentBid };
      if (scenario.status === 'finished' && winnerId) {
        updateData.winner_id = winnerId;
      }
      await supabase.from('auctions').update(updateData).eq('id', auction.id);

      auctionCount++;
      process.stdout.write(`  ✓ Leilão ${scenario.status} | ${numBids} lances | lance atual: R$ ${currentBid}\n`);
      await sleep(40);
    }
  }

  console.log(`\n  Total: ${auctionCount} leilões criados\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // 5. AVALIAÇÕES (reviews para locações concluídas)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('⭐ Criando avaliações...');
  let reviewCount = 0;

  for (const rental of completedRentals) {
    // ~80% das locações concluídas têm avaliação do produtor
    if (Math.random() < 0.80) {
      const rating = rand(3, 5); // maioria positiva
      const comment = rating >= 4 ? pick(COMENTARIOS_POSITIVOS) : pick(COMENTARIOS_NEUTROS);

      const { error } = await supabase.from('reviews').insert({
        rental_id: rental.rentalId,
        reviewer_id: rental.renterId,
        reviewed_id: rental.ownerId,
        rating,
        comment,
      });
      if (!error) {
        reviewCount++;
        process.stdout.write(`  ✓ Avaliação ${rating}/5 estrelas\n`);
      }
      await sleep(20);
    }

    // ~50% têm avaliação do dono sobre o produtor também
    if (Math.random() < 0.50) {
      const rating = rand(3, 5);
      const comment = rating >= 4 ? pick(COMENTARIOS_POSITIVOS) : pick(COMENTARIOS_NEUTROS);

      await supabase.from('reviews').insert({
        rental_id: rental.rentalId,
        reviewer_id: rental.ownerId,
        reviewed_id: rental.renterId,
        rating,
        comment,
      });
      reviewCount++;
      await sleep(20);
    }
  }

  console.log(`\n  Total: ${reviewCount} avaliações criadas\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ════════════════════════════════════════════════════════════════════════════
  console.log('═'.repeat(55));
  console.log('✅  SEED DE PRODUÇÃO CONCLUÍDO!');
  console.log('═'.repeat(55));
  console.log(`\n  Usuários criados:      ${totalUsers}`);
  console.log(`    - Admin:             1`);
  console.log(`    - Proprietários:     ${ownerUsers.length}`);
  console.log(`    - Produtores:        ${producerUsers.length}`);
  console.log(`    - Ambos (both):      ${bothUsers.length}`);
  console.log(`\n  Equipamentos:          ${equipCount}`);
  console.log(`  Locações:              ${rentalCount}`);
  console.log(`  Leilões:               ${auctionCount}`);
  console.log(`  Avaliações:            ${reviewCount}`);

  console.log('\n── CREDENCIAIS ──────────────────────────────────────');
  console.log('  ADMIN        → admin@mercagro.com       | Admin@123456');
  console.log('  PROPRIETÁRIO → proprietario1@mercagro.com | Teste@123456');
  console.log('  PRODUTOR     → produtor1@mercagro.com   | Teste@123456');
  console.log('  AMBOS        → agro1@mercagro.com       | Teste@123456');
  console.log('─────────────────────────────────────────────────────\n');
}

seed().catch((err) => {
  console.error('\n❌ Erro no seed:', err.message);
  process.exit(1);
});
