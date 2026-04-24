import { eq } from 'drizzle-orm';
import { openaiClient } from '@/src/clients/openai';
import { db } from '@/src/lib/db';
import { projects } from '@/src/lib/db/schema';

interface OnelinerResult {
  shortOneliner: string;
  reasoning: string;
}

const onelinerSchema = {
  type: 'object' as const,
  properties: {
    shortOneliner: {
      type: 'string',
      description:
        'A very short and concise oneliner in Spanish (max 60 characters) that captures the essence of the project',
    },
    reasoning: {
      type: 'string',
      description:
        'Brief explanation of why this oneliner was chosen (in English)',
    },
  },
  required: ['shortOneliner', 'reasoning'],
};

async function generateShortOneliner(
  projectName: string,
  oneliner: string | null,
  description: string | null,
): Promise<OnelinerResult> {
  const client = openaiClient.getClient();

  const contextParts: string[] = [];
  if (oneliner) contextParts.push(`Oneliner: ${oneliner}`);
  if (description) contextParts.push(`Description: ${description}`);

  const context =
    contextParts.length > 0
      ? contextParts.join('\n')
      : 'No description available';

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a copywriter expert in creating concise, impactful project descriptions in Spanish for a hackathon.
Your goal is to create a VERY SHORT oneliner (maximum 60 characters) in Spanish that will be used in:
- OpenGraph images for social media sharing
- Voting pages where users browse multiple projects

The oneliner should be:
- EXTREMELY concise (max 60 characters)
- In Spanish
- Catchy and memorable
- Focused on the core value proposition
- Suitable for social media previews

DO NOT use quotes or special formatting. Just the plain text.`,
      },
      {
        role: 'user',
        content: `Create a short Spanish oneliner for this project:

Project Name: ${projectName}
${context}

Remember: Maximum 60 characters, no quotes, plain Spanish text only.`,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'generate_short_oneliner',
          description:
            'Generate a short and concise Spanish oneliner for a hackathon project',
          parameters: onelinerSchema,
        },
      },
    ],
    tool_choice: {
      type: 'function',
      function: { name: 'generate_short_oneliner' },
    },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];

  if (!toolCall || toolCall.type !== 'function') {
    throw new Error('Failed to generate short oneliner');
  }

  const result = JSON.parse(toolCall.function.arguments) as OnelinerResult;

  if (result.shortOneliner.length > 60) {
    throw new Error(
      `Generated oneliner is too long: ${result.shortOneliner.length} characters (max 60)`,
    );
  }

  return result;
}

async function main() {
  console.log('\n🚀 Starting short oneliner generation for all projects...\n');

  try {
    const allProjects = await db.select().from(projects);
    console.log(`📋 Found ${allProjects.length} projects in database\n`);

    const projectsToProcess = allProjects.filter(
      (p) => p.oneliner || p.description,
    );
    console.log(
      `🎯 Processing ${projectsToProcess.length} projects with content\n`,
    );

    const results: Array<{
      slug: string;
      name: string;
      shortOneliner: string;
      success: boolean;
    }> = [];
    const failed: Array<{ slug: string; name: string; reason: string }> = [];

    for (let i = 0; i < projectsToProcess.length; i++) {
      const project = projectsToProcess[i];
      console.log(
        `\n[${i + 1}/${projectsToProcess.length}] 🔍 Processing: ${project.name}`,
      );
      console.log(`   Slug: ${project.slug}`);

      if (project.oneliner) {
        console.log(`   Current oneliner: "${project.oneliner}"`);
      }
      if (project.description) {
        console.log(
          `   Description: "${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}"`,
        );
      }

      try {
        const result = await generateShortOneliner(
          project.name,
          project.oneliner,
          project.description,
        );

        console.log(`   ✨ Generated: "${result.shortOneliner}"`);
        console.log(`   📝 Reasoning: ${result.reasoning}`);
        console.log(
          `   📊 Length: ${result.shortOneliner.length}/60 characters`,
        );

        await db
          .update(projects)
          .set({ onelinerShort: result.shortOneliner })
          .where(eq(projects.id, project.id));

        results.push({
          slug: project.slug,
          name: project.name,
          shortOneliner: result.shortOneliner,
          success: true,
        });

        console.log('   ✅ Updated in database');

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        console.log(`   ❌ Failed: ${reason}`);
        failed.push({
          slug: project.slug,
          name: project.name,
          reason,
        });
      }
    }

    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successfully generated: ${results.length} projects`);
    console.log(`❌ Failed: ${failed.length} projects`);
    console.log(
      `⏭️  Skipped: ${allProjects.length - projectsToProcess.length} projects (no content)`,
    );

    if (results.length > 0) {
      console.log('\n✅ Successfully generated oneliners:');
      console.log('─'.repeat(80));
      for (const { name, shortOneliner } of results) {
        console.log(`\n${name}`);
        console.log(`   → "${shortOneliner}"`);
      }
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed generations:');
      console.log('─'.repeat(80));
      for (const { name, reason } of failed) {
        console.log(`\n${name}`);
        console.log(`   → ${reason}`);
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Short oneliner generation completed!\n');
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

main();
