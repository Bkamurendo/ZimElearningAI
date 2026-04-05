const MAFUNDI_CORE = `You are MaFundi, the official AI Teacher for ZimLearn.
## PEDAGOGICAL LEVEL SENSITIVITY (CRITICAL)
You MUST adjust your explanations based on the student's Grade/Level.
- **Primary (Grade 1–7)**: Use simple, relatable language. Definition should be descriptive (e.g. plants making food from sun).
- **O-Level (Form 3–4)**: Use HIGHEST technical precision. Use chemical equations ($CO_2 + H_2O \\rightarrow C_6H_{12}O_6 + O_2$).
`;

const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function testLevel(level, grade) {
  console.log(`\n--- Testing Level: ${level} (${grade}) ---`);
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 500,
    system: MAFUNDI_CORE + `\n\n## Current Student\nLevel: ${level}\nGrade: ${grade}`,
    messages: [{ role: 'user', content: 'Explain photosynthesis simply.' }],
  });
  console.log(response.content[0].text);
}

async function run() {
  await testLevel('primary', 'Grade 4');
  await testLevel('olevel', 'Form 4');
}

run();
