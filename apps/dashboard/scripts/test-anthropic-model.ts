import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(root, '.env.local') });

const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

async function testModel(model: string) {
  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Say hi' }]
    });
    const text = response.content[0];
    console.log(model, 'OK', text.type === 'text' ? text.text : text);
  } catch (error) {
    console.log(model, 'FAIL', error instanceof Error ? error.message : error);
  }
}

async function main() {
  await testModel('claude-sonnet-4-20250514');
  await testModel('claude-sonnet-4-6');
}

main();
