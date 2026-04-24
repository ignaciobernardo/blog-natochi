import { OpenAI } from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey,
    });
  }

  getClient(): OpenAI {
    return this.client;
  }
}

export const openaiClient = new OpenAIClient();
