const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function recommendEquipment({ crop_type, soil_type, area_ha, location_city, location_state, period }) {
  const prompt = `Você é um especialista em máquinas agrícolas brasileiras.
Com base nos dados abaixo, recomende os tipos de equipamentos mais adequados para locação:

- Cultura: ${crop_type}
- Tipo de solo: ${soil_type}
- Área: ${area_ha} hectares
- Localização: ${location_city}, ${location_state}
- Período de uso: ${period}

Responda SOMENTE em JSON com este formato exato:
{
  "recommendations": [
    {
      "category": "nome da categoria",
      "reason": "justificativa curta",
      "priority": 1
    }
  ],
  "tips": "dica geral sobre o uso dos equipamentos"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content);
}

async function suggestPrice({ equipment_category, brand, model, year, location_state }) {
  const prompt = `Você é um especialista em precificação de aluguel de máquinas agrícolas no Brasil.
Estime o valor justo de diária (em R$) para o equipamento abaixo:

- Categoria: ${equipment_category}
- Marca: ${brand || 'não informado'}
- Modelo: ${model || 'não informado'}
- Ano: ${year || 'não informado'}
- Estado: ${location_state}

Responda SOMENTE em JSON com este formato exato:
{
  "daily_rate_min": 000,
  "daily_rate_max": 000,
  "daily_rate_suggested": 000,
  "justification": "breve explicação do valor"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 300,
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { recommendEquipment, suggestPrice };
