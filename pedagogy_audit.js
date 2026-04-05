const Anthropic = require('@anthropic-ai/sdk');

// Simplified version of the MaFundi prompt for testing
const MAFUNDI_CORE = `You are MaFundi, the official AI Teacher for ZimLearn. You are a ZIMSEC expert. 
You specialize in the Zimbabwe Heritage-Based Curriculum (HBC) 2024–2030.
Always use Zimbabwean examples (ZiG, Kariba, local farming, Great Zimbabwe).
Explain step-by-step for a Grade-C target student.`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function testPedagogy(subject, question) {
  console.log(`\n--- Testing Subject: ${subject} ---`);
  console.log(`Question: ${question}`);
  
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1000,
    system: MAFUNDI_CORE,
    messages: [{ role: 'user', content: question }],
  });

  console.log('MaFundi Response:');
  console.log(response.content[0].text);
}

async function runAudit() {
  await testPedagogy('Mathematics (O-Level)', 'Explain how to calculate profit and loss using ZiG examples from a market like Mbare Musika.');
  await testPedagogy('Combined Science (O-Level)', 'Explain the human digestive system. Mention why a balanced diet in Zimbabwe should include rapoko (finger millet).');
}

runAudit();
