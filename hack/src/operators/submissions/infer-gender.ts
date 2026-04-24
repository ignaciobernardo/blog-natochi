import { openaiClient } from '@/src/clients/openai';
import type { Gender } from '@/src/lib/db/schema';

const genderSchema = {
  type: 'object' as const,
  properties: {
    gender: {
      type: 'string',
      enum: ['male', 'female'],
      description: 'The inferred gender based on the name',
    },
    confidence: {
      type: 'number',
      description: 'Confidence level between 0 and 1',
    },
  },
  required: ['gender', 'confidence'],
};

export class GenderInferrer {
  async inferFromName(
    name: string,
  ): Promise<{ gender: Gender; confidence: number }> {
    const client = openaiClient.getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Analyze the given name and determine if it appears to be a male or female name. Consider cultural context and common naming patterns.

Name: ${name}

Respond with the inferred gender and your confidence level (0-1) in your determination.`,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'determine_gender',
            description: 'Determine the gender of a person based on their name',
            parameters: genderSchema,
          },
        },
      ],
      tool_choice: {
        type: 'function',
        function: { name: 'determine_gender' },
      },
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.type !== 'function') {
      throw new Error('Failed to infer gender from name');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return {
      gender: result.gender as Gender,
      confidence: result.confidence as number,
    };
  }
}

export const genderInferrer = new GenderInferrer();
