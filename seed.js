require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── USUÁRIOS ────────────────────────────────────────────────────────────────
const USERS = [
  {
    email: 'admin@mercagro.com',
    password: 'Admin@123456',
    profile: {
      full_name: 'Admin Mercagro',
      cpf_cnpj: '000.000.000-00',
      user_type: 'both',
      location_city: 'São Paulo',
      location_state: 'SP',
      location_lat: -23.5505,
      location_lng: -46.6333,
    },
  },
  {
    email: 'usuario@mercagro.com',
    password: 'User@123456',
    profile: {
      full_name: 'João Produtor',
      cpf_cnpj: '111.111.111-11',
      user_type: 'producer',
      location_city: 'Ribeirão Preto',
      location_state: 'SP',
      location_lat: -21.1775,
      location_lng: -47.8103,
    },
  },
];

// ─── EQUIPAMENTOS ─────────────────────────────────────────────────────────────
const EQUIPMENT_DATA = [
  // Tratores
  { name: 'Trator John Deere 6110J', brand: 'John Deere', model: '6110J', year: 2021, category: 'Trator', daily_rate: 850, location_city: 'Sorriso', location_state: 'MT', location_lat: -12.5462, location_lng: -55.7219 },
  { name: 'Trator New Holland TM7040', brand: 'New Holland', model: 'TM7040', year: 2020, category: 'Trator', daily_rate: 780, location_city: 'Rondonópolis', location_state: 'MT', location_lat: -16.4726, location_lng: -54.6366 },
  { name: 'Trator Massey Ferguson 7719', brand: 'Massey Ferguson', model: '7719', year: 2022, category: 'Trator', daily_rate: 920, location_city: 'Uberlândia', location_state: 'MG', location_lat: -18.9186, location_lng: -48.2772 },
  { name: 'Trator Valtra BH180', brand: 'Valtra', model: 'BH180', year: 2019, category: 'Trator', daily_rate: 700, location_city: 'Cascavel', location_state: 'PR', location_lat: -24.9578, location_lng: -53.4595 },
  { name: 'Trator Case IH Puma 185', brand: 'Case IH', model: 'Puma 185', year: 2021, category: 'Trator', daily_rate: 870, location_city: 'Londrina', location_state: 'PR', location_lat: -23.3045, location_lng: -51.1696 },
  { name: 'Trator Fendt 724', brand: 'Fendt', model: '724 Vario', year: 2023, category: 'Trator', daily_rate: 1200, location_city: 'Passo Fundo', location_state: 'RS', location_lat: -28.2620, location_lng: -52.4070 },
  { name: 'Trator John Deere 5075E', brand: 'John Deere', model: '5075E', year: 2020, category: 'Trator', daily_rate: 550, location_city: 'Barreiras', location_state: 'BA', location_lat: -12.1522, location_lng: -44.9994 },
  { name: 'Trator Massey Ferguson 4710', brand: 'Massey Ferguson', model: '4710', year: 2019, category: 'Trator', daily_rate: 490, location_city: 'Luís Eduardo Magalhães', location_state: 'BA', location_lat: -12.0965, location_lng: -45.7940 },
  { name: 'Trator New Holland T7.245', brand: 'New Holland', model: 'T7.245', year: 2022, category: 'Trator', daily_rate: 980, location_city: 'Campo Grande', location_state: 'MS', location_lat: -20.4697, location_lng: -54.6201 },
  { name: 'Trator Valtra A134', brand: 'Valtra', model: 'A134', year: 2018, category: 'Trator', daily_rate: 420, location_city: 'Dourados', location_state: 'MS', location_lat: -22.2219, location_lng: -54.8056 },

  // Colheitadeiras
  { name: 'Colheitadeira John Deere S680', brand: 'John Deere', model: 'S680', year: 2021, category: 'Colheitadeira', daily_rate: 3500, location_city: 'Sorriso', location_state: 'MT', location_lat: -12.5462, location_lng: -55.7219 },
  { name: 'Colheitadeira Case IH 8250', brand: 'Case IH', model: 'Axial-Flow 8250', year: 2022, category: 'Colheitadeira', daily_rate: 3800, location_city: 'Lucas do Rio Verde', location_state: 'MT', location_lat: -13.0581, location_lng: -55.9108 },
  { name: 'Colheitadeira New Holland CR9.90', brand: 'New Holland', model: 'CR9.90', year: 2020, category: 'Colheitadeira', daily_rate: 3200, location_city: 'Cascavel', location_state: 'PR', location_lat: -24.9578, location_lng: -53.4595 },
  { name: 'Colheitadeira Massey Ferguson 9790', brand: 'Massey Ferguson', model: '9790', year: 2019, category: 'Colheitadeira', daily_rate: 2800, location_city: 'Maringá', location_state: 'PR', location_lat: -23.4273, location_lng: -51.9375 },
  { name: 'Colheitadeira John Deere S760', brand: 'John Deere', model: 'S760', year: 2023, category: 'Colheitadeira', daily_rate: 4200, location_city: 'Primavera do Leste', location_state: 'MT', location_lat: -15.5567, location_lng: -54.2993 },
  { name: 'Colheitadeira Gleaner S98', brand: 'Gleaner', model: 'S98', year: 2021, category: 'Colheitadeira', daily_rate: 3600, location_city: 'Passo Fundo', location_state: 'RS', location_lat: -28.2620, location_lng: -52.4070 },
  { name: 'Colheitadeira Case IH 6150', brand: 'Case IH', model: 'Axial-Flow 6150', year: 2020, category: 'Colheitadeira', daily_rate: 2900, location_city: 'Rio Verde', location_state: 'GO', location_lat: -17.7987, location_lng: -50.9242 },

  // Plantadeiras
  { name: 'Plantadeira Jumil JM 3060 PD', brand: 'Jumil', model: 'JM 3060 PD', year: 2021, category: 'Plantadeira', daily_rate: 650, location_city: 'Uberlândia', location_state: 'MG', location_lat: -18.9186, location_lng: -48.2772 },
  { name: 'Plantadeira Valtra Apache 2500', brand: 'Valtra', model: 'Apache 2500', year: 2020, category: 'Plantadeira', daily_rate: 580, location_city: 'Dourados', location_state: 'MS', location_lat: -22.2219, location_lng: -54.8056 },
  { name: 'Plantadeira John Deere 1113', brand: 'John Deere', model: '1113', year: 2022, category: 'Plantadeira', daily_rate: 720, location_city: 'Rondonópolis', location_state: 'MT', location_lat: -16.4726, location_lng: -54.6366 },
  { name: 'Plantadeira Agrale 4800 HS', brand: 'Agrale', model: '4800 HS', year: 2019, category: 'Plantadeira', daily_rate: 480, location_city: 'Ponta Grossa', location_state: 'PR', location_lat: -25.0945, location_lng: -50.1633 },
  { name: 'Plantadeira Case IH Early Riser 2150', brand: 'Case IH', model: 'Early Riser 2150', year: 2021, category: 'Plantadeira', daily_rate: 800, location_city: 'Campo Grande', location_state: 'MS', location_lat: -20.4697, location_lng: -54.6201 },

  // Pulverizadores
  { name: 'Pulverizador autopropelido Jacto Uniport 3030', brand: 'Jacto', model: 'Uniport 3030', year: 2022, category: 'Pulverizador', daily_rate: 1800, location_city: 'Barreiras', location_state: 'BA', location_lat: -12.1522, location_lng: -44.9994 },
  { name: 'Pulverizador Stara Imperador 3.0', brand: 'Stara', model: 'Imperador 3.0', year: 2021, category: 'Pulverizador', daily_rate: 1650, location_city: 'Passo Fundo', location_state: 'RS', location_lat: -28.2620, location_lng: -52.4070 },
  { name: 'Pulverizador John Deere R4023', brand: 'John Deere', model: 'R4023', year: 2023, category: 'Pulverizador', daily_rate: 2200, location_city: 'Sorriso', location_state: 'MT', location_lat: -12.5462, location_lng: -55.7219 },
  { name: 'Pulverizador Case IH Patriot 3330', brand: 'Case IH', model: 'Patriot 3330', year: 2020, category: 'Pulverizador', daily_rate: 1900, location_city: 'Rio Verde', location_state: 'GO', location_lat: -17.7987, location_lng: -50.9242 },
  { name: 'Pulverizador Jacto Uniport 2530', brand: 'Jacto', model: 'Uniport 2530', year: 2019, category: 'Pulverizador', daily_rate: 1400, location_city: 'Luís Eduardo Magalhães', location_state: 'BA', location_lat: -12.0965, location_lng: -45.7940 },
  { name: 'Pulverizador New Holland SP.300F', brand: 'New Holland', model: 'SP.300F', year: 2022, category: 'Pulverizador', daily_rate: 1750, location_city: 'Cascavel', location_state: 'PR', location_lat: -24.9578, location_lng: -53.4595 },

  // Grades
  { name: 'Grade aradora Baldan GAAR 36x26', brand: 'Baldan', model: 'GAAR 36x26', year: 2020, category: 'Grades', daily_rate: 280, location_city: 'Londrina', location_state: 'PR', location_lat: -23.3045, location_lng: -51.1696 },
  { name: 'Grade niveladora Tatu GNN 36x20', brand: 'Tatu', model: 'GNN 36x20', year: 2021, category: 'Grades', daily_rate: 220, location_city: 'Maringá', location_state: 'PR', location_lat: -23.4273, location_lng: -51.9375 },
  { name: 'Grade aradora Baldan GAAM 32x26', brand: 'Baldan', model: 'GAAM 32x26', year: 2019, category: 'Grades', daily_rate: 250, location_city: 'Uberlândia', location_state: 'MG', location_lat: -18.9186, location_lng: -48.2772 },
  { name: 'Grade niveladora Tatu Agrícola GN 32', brand: 'Tatu', model: 'GN 32', year: 2020, category: 'Grades', daily_rate: 200, location_city: 'Unaí', location_state: 'MG', location_lat: -16.3592, location_lng: -46.9043 },

  // Implementos
  { name: 'Subsolador Baldan SBT 7 Hastes', brand: 'Baldan', model: 'SBT 7 Hastes', year: 2021, category: 'Implemento', daily_rate: 350, location_city: 'Dourados', location_state: 'MS', location_lat: -22.2219, location_lng: -54.8056 },
  { name: 'Enxada rotativa Tatu FR 1,80m', brand: 'Tatu', model: 'FR 1,80m', year: 2020, category: 'Implemento', daily_rate: 180, location_city: 'Araçatuba', location_state: 'SP', location_lat: -21.2089, location_lng: -50.4328 },
  { name: 'Arado de discos Baldan AD-4 x26', brand: 'Baldan', model: 'AD-4 x26', year: 2019, category: 'Implemento', daily_rate: 260, location_city: 'Ponta Grossa', location_state: 'PR', location_lat: -25.0945, location_lng: -50.1633 },
  { name: 'Rolo compactador Tatu RC 5,0m', brand: 'Tatu', model: 'RC 5,0m', year: 2021, category: 'Implemento', daily_rate: 190, location_city: 'Campo Grande', location_state: 'MS', location_lat: -20.4697, location_lng: -54.6201 },
  { name: 'Escarificador Baldan ESC 9 Hastes', brand: 'Baldan', model: 'ESC 9 Hastes', year: 2022, category: 'Implemento', daily_rate: 320, location_city: 'Rondonópolis', location_state: 'MT', location_lat: -16.4726, location_lng: -54.6366 },
  { name: 'Carreta graneleira Vacchi 20.000L', brand: 'Vacchi', model: 'Graneleira 20.000L', year: 2021, category: 'Implemento', daily_rate: 450, location_city: 'Sorriso', location_state: 'MT', location_lat: -12.5462, location_lng: -55.7219 },
  { name: 'Distribuidor de calcário Metasa DCA 3000', brand: 'Metasa', model: 'DCA 3000', year: 2020, category: 'Implemento', daily_rate: 230, location_city: 'Primavera do Leste', location_state: 'MT', location_lat: -15.5567, location_lng: -54.2993 },

  // Mais tratores para completar 50+
  { name: 'Trator John Deere 7215R', brand: 'John Deere', model: '7215R', year: 2022, category: 'Trator', daily_rate: 1050, location_city: 'Rio Verde', location_state: 'GO', location_lat: -17.7987, location_lng: -50.9242 },
  { name: 'Trator Case IH Farmall 110A', brand: 'Case IH', model: 'Farmall 110A', year: 2020, category: 'Trator', daily_rate: 620, location_city: 'Goiânia', location_state: 'GO', location_lat: -16.6869, location_lng: -49.2648 },
  { name: 'Trator Massey Ferguson 5713S', brand: 'Massey Ferguson', model: '5713S', year: 2021, category: 'Trator', daily_rate: 680, location_city: 'Anápolis', location_state: 'GO', location_lat: -16.3281, location_lng: -48.9532 },
  { name: 'Trator New Holland T6.175', brand: 'New Holland', model: 'T6.175', year: 2022, category: 'Trator', daily_rate: 760, location_city: 'Petrolina', location_state: 'PE', location_lat: -9.3986, location_lng: -40.4995 },
  { name: 'Trator Valtra T195', brand: 'Valtra', model: 'T195', year: 2021, category: 'Trator', daily_rate: 830, location_city: 'Imperatriz', location_state: 'MA', location_lat: -5.5253, location_lng: -47.4914 },
  { name: 'Trator John Deere 6120J', brand: 'John Deere', model: '6120J', year: 2020, category: 'Trator', daily_rate: 890, location_city: 'Palmas', location_state: 'TO', location_lat: -10.1840, location_lng: -48.3336 },
  { name: 'Trator Fendt 516', brand: 'Fendt', model: '516 Vario', year: 2021, category: 'Trator', daily_rate: 960, location_city: 'Cuiabá', location_state: 'MT', location_lat: -15.6014, location_lng: -56.0979 },
  { name: 'Trator Case IH Maxxum 150', brand: 'Case IH', model: 'Maxxum 150', year: 2022, category: 'Trator', daily_rate: 820, location_city: 'Sinop', location_state: 'MT', location_lat: -11.8641, location_lng: -55.5094 },
  { name: 'Trator New Holland T8.390', brand: 'New Holland', model: 'T8.390', year: 2023, category: 'Trator', daily_rate: 1100, location_city: 'Balsas', location_state: 'MA', location_lat: -7.5322, location_lng: -46.0353 },
  { name: 'Trator Massey Ferguson 6716S', brand: 'Massey Ferguson', model: '6716S', year: 2022, category: 'Trator', daily_rate: 890, location_city: 'Formosa do Rio Preto', location_state: 'BA', location_lat: -11.0516, location_lng: -45.1930 },
  { name: 'Trator John Deere 5100R', brand: 'John Deere', model: '5100R', year: 2020, category: 'Trator', daily_rate: 730, location_city: 'Santa Rosa', location_state: 'RS', location_lat: -27.8716, location_lng: -54.4808 },
  { name: 'Trator Valtra N175', brand: 'Valtra', model: 'N175', year: 2021, category: 'Trator', daily_rate: 710, location_city: 'Cruz Alta', location_state: 'RS', location_lat: -28.6382, location_lng: -53.6064 },
];

// ─── DESCRIÇÕES ───────────────────────────────────────────────────────────────
const DESCRIPTIONS = [
  'Equipamento em excelente estado de conservação. Manutenção em dia e documentação completa. Disponível para locação imediata.',
  'Máquina revisada recentemente com laudo técnico. Ideal para safra de soja e milho. Operador disponível mediante consulta.',
  'Equipamento de alta produtividade, conservado em galpão coberto. Revisão completa realizada em 2024.',
  'Excelente custo-benefício. Motor revisado, pneus novos. Perfeito para pequenas e médias propriedades.',
  'Máquina de alta tecnologia com GPS de precisão embutido. Histórico de manutenção disponível para consulta.',
];

async function createUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (error.message.includes('already registered')) {
      console.log(`  ⚠ Usuário ${email} já existe, buscando...`);
      const { data: list } = await supabase.auth.admin.listUsers();
      return list.users.find(u => u.email === email);
    }
    throw error;
  }
  return data.user;
}

async function seed() {
  console.log('🌱 Iniciando seed do banco Mercagro...\n');

  // ── 1. Criar usuários ──
  console.log('👤 Criando usuários...');
  const createdUsers = [];
  for (const u of USERS) {
    const user = await createUser(u.email, u.password);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...u.profile });
    if (error) console.error(`  ✗ Perfil ${u.email}:`, error.message);
    else console.log(`  ✓ ${u.email} (${u.profile.user_type})`);
    createdUsers.push({ ...user, profile: u.profile });
  }

  const adminUser = createdUsers[0];
  const normalUser = createdUsers[1];

  // ── 2. Criar equipamentos ──
  console.log('\n🚜 Criando equipamentos...');
  const equipmentIds = [];
  for (let i = 0; i < EQUIPMENT_DATA.length; i++) {
    const eq = EQUIPMENT_DATA[i];
    const owner = i % 4 === 0 ? normalUser : adminUser; // distribui entre os 2 usuários
    const desc = DESCRIPTIONS[i % DESCRIPTIONS.length];
    const { data, error } = await supabase.from('equipment').insert({
      owner_id: owner.id,
      ...eq,
      description: desc,
      photos: [],
      status: 'available',
    }).select('id').single();

    if (error) console.error(`  ✗ ${eq.name}:`, error.message);
    else {
      equipmentIds.push(data.id);
      process.stdout.write(`  ✓ ${eq.name}\n`);
    }
  }

  // ── 3. Criar algumas locações de exemplo ──
  console.log('\n📋 Criando locações de exemplo...');
  const rentalEquipment = equipmentIds.slice(0, 5);
  for (const eqId of rentalEquipment) {
    const { data: eq } = await supabase.from('equipment').select('daily_rate, owner_id').eq('id', eqId).single();
    const days = Math.floor(Math.random() * 7) + 2;
    const start = new Date();
    start.setDate(start.getDate() + Math.floor(Math.random() * 10) + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const renterId = eq.owner_id === adminUser.id ? normalUser.id : adminUser.id;

    const { error } = await supabase.from('rentals').insert({
      equipment_id: eqId,
      renter_id: renterId,
      owner_id: eq.owner_id,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      daily_rate: eq.daily_rate,
      total_amount: eq.daily_rate * days,
      status: 'pending',
    });
    if (error) console.error('  ✗ Locação:', error.message);
    else console.log(`  ✓ Locação criada (${days} dias)`);
  }

  // ── 4. Criar alguns leilões de exemplo ──
  console.log('\n⚡ Criando leilões de exemplo...');
  const auctionEquipment = equipmentIds.slice(10, 14);
  for (const eqId of auctionEquipment) {
    const { data: eq } = await supabase.from('equipment').select('daily_rate, owner_id').eq('id', eqId).single();
    const startsAt = new Date();
    startsAt.setHours(startsAt.getHours() - 1); // já ativo
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 2);

    const startPrice = eq.daily_rate * 3;

    const { data: auction, error } = await supabase.from('auctions').insert({
      equipment_id: eqId,
      owner_id: eq.owner_id,
      start_price: startPrice,
      current_price: startPrice,
      min_increment: 100,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'active',
    }).select('id').single();

    if (error) { console.error('  ✗ Leilão:', error.message); continue; }

    await supabase.from('equipment').update({ status: 'auction' }).eq('id', eqId);

    // Adicionar alguns lances
    const bidderId = eq.owner_id === adminUser.id ? normalUser.id : adminUser.id;
    let currentBid = startPrice;
    for (let b = 0; b < 3; b++) {
      currentBid += 100 * (b + 1);
      await supabase.from('bids').insert({ auction_id: auction.id, bidder_id: bidderId, amount: currentBid });
    }
    await supabase.from('auctions').update({ current_price: currentBid }).eq('id', auction.id);

    console.log(`  ✓ Leilão ativo criado (lance atual: R$ ${currentBid})`);
  }

  console.log('\n✅ Seed concluído!');
  console.log('\n── CREDENCIAIS DE ACESSO ─────────────────────');
  console.log('  ADMIN  → admin@mercagro.com    | Admin@123456');
  console.log('  USER   → usuario@mercagro.com  | User@123456');
  console.log('──────────────────────────────────────────────');
  console.log(`\n  Total equipamentos: ${equipmentIds.length}`);
}

seed().catch(err => {
  console.error('Erro no seed:', err.message);
  process.exit(1);
});
