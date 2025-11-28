// src/database/seeds/seed-prompts.ts
import { AppDataSource } from '../data-source';
import { Prompt, PromptVersion } from '../entities/prompts.entities';


async function seed() {
  await AppDataSource.initialize();


  const promptRepo = AppDataSource.getRepository(Prompt);
  const versionRepo = AppDataSource.getRepository(PromptVersion);


  // helper: create + version
  async function createPromptWithVersion({
    key,
    name,
    description,
    model,
    system_template,
    user_template,
    temperature = 0.3,
    top_p = 0.9,
    max_tokens = 600,
  }: {
    key: string;
    name: string;
    description: string;
    model: string;
    system_template: string;
    user_template: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  }) {
    // 1. create prompt
    let prompt = await promptRepo.findOne({ where: { key } });
    if (!prompt) {
      prompt = promptRepo.create({
        key,
        name,
        description,
        is_archived: false,
      });
      await promptRepo.save(prompt);
    }

    // 2. check if version 1 already exists
    let version = await versionRepo.findOne({
      where: { prompt: { id: prompt.id }, version: 1 }
    });

    if (!version) {
      // create version 1 (active)
      version = versionRepo.create({
        prompt,
        version: 1,
        is_active: true,
        model,
        system_template,
        user_template,
        temperature,
        top_p,
        max_tokens,
      });
      await versionRepo.save(version);
    }

    return { prompt, version };
  }


  // Prompt 1: general summary
  await createPromptWithVersion({
    key: 'doc.summarize.general',
    name: 'General Document Summarization',
    description: 'Summarize long documents clearly and accurately.',
    model: 'gpt-4o-mini',
    system_template: `You are an AI assistant that specializes in summarizing long documents clearly and accurately.
Your job is to produce a well-structured summary that captures the core ideas, main arguments, and essential facts.
Do not invent information that does not appear in the source.
Write in neutral, professional, easy-to-read language.
If the text contains multiple themes, summarize each theme.
If the text is technical, keep important terminology.`,
    user_template: `Summarize the following document in a clear, concise way.
Focus on the main points, key facts, and overall conclusion.


Document:
---
{{text}}
---`,
    temperature: 0.3,
    top_p: 0.9,
    max_tokens: 700,
  });


  // Prompt 2: executive summary
  await createPromptWithVersion({
    key: 'doc.summarize.executive',
    name: 'Executive Summary',
    description: 'High-level business summary for decision makers.',
    model: 'gpt-4o-mini',
    system_template: `You are an AI assistant that writes executive summaries for reports, research briefs, and business documents.
Your goal is to deliver a concise, high-level overview that a decision-maker can read in under one minute.
You should:
- State the purpose/context of the document
- Summarize the most important findings or claims
- Highlight any implications, risks, or recommendations at the end
Tone: concise, factual, professional.
Do not include marketing language.
Do not exaggerate certainty if the source is uncertain.
Limit the final output to 4-6 sentences.`,
    user_template: `Write an executive summary of the following content:


---
{{text}}
---


The summary must be professional and suitable for senior stakeholders.
Focus on business-relevant information.`,
    temperature: 0.25,
    top_p: 0.8,
    max_tokens: 400,
  });


  // Prompt 3: bullet-point summary
  await createPromptWithVersion({
    key: 'doc.summarize.bullets',
    name: 'Bullet Point Summary',
    description: 'Return key ideas as bullet points.',
    model: 'gpt-4o-mini',
    system_template: `You are an assistant that outputs structured bullet point summaries.
Your job is to extract key ideas, main arguments, and important facts.
Each bullet must be self-contained and easy to scan.
Do not include filler language like "In summary" or "Overall".
Do not repeat the same point multiple times.
If the document mentions numbers, timelines, or metrics, include them.`,
    user_template: `Convert the following text into a bullet-point summary.
Use short, direct bullets. Each bullet should represent one important idea.


Text:
---
{{text}}
---`,
    temperature: 0.4,
    top_p: 0.9,
    max_tokens: 600,
  });

  // Prompt 4: document attribute extraction
  await createPromptWithVersion({
    key: 'document-attribute-extraction',
    name: 'Document Attribute Extraction',
    description: 'Extract key attributes and metadata from documents.',
    model: 'gpt-4o-mini',
    system_template: `You are an AI assistant that extracts key attributes and metadata from documents.
Your task is to analyze the document content and extract relevant metadata that would be useful for search and categorization.
Focus on extracting:
- Document type (contract, report, letter, etc.)
- Key entities (people, organizations, dates)
- Main topics or subjects
- Important dates mentioned
- Geographic locations
- Any other relevant metadata

Always return a JSON object with the following structure, using null or empty values if no information is available:
{
    "topic": string | null,
    "field": string | null,
    "keywords": string[],
    "methodology": string | null
}
Be accurate and only extract information that is explicitly mentioned in the document. Do not wrap the JSON in any additional keys or code blocks.`,
    user_template: `Extract key attributes and metadata from the following document content:

Document Content:
---
{{text}}
---

Return the extracted metadata as a JSON object with the exact structure specified.`,
    temperature: 0.2,
    top_p: 0.8,
    max_tokens: 500,
  });

  // Prompt 5: summary to diagram
  await createPromptWithVersion({
    key: 'summary.to.diagram',
    name: 'Summary to Diagram',
    description: 'Generate Mermaid diagram code from a document summary.',
    model: 'gpt-4o-mini',
    system_template: `You are an AI assistant specialized in generating Mermaid mindmap diagrams from document summaries.
Your task is to analyze the provided summary and create a mindmap that represents the key concepts, relationships, and structure of the content.

Use the latest Mermaid syntax:
- Begin with mindmap.
- Use clear, descriptive labels for each node.
- Use hierarchical indentation to show structure.
- Keep the diagram concise but comprehensive, focusing on main ideas.
- Ensure the code is valid Mermaid syntax that can be rendered directly.
- Output only the Mermaid code, with no explanations, no surrounding code blocks, and no additional text.`,
    user_template: `Generate Mermaid diagram code from the following summary:

Summary:
---
{{text}}
---

Output the complete Mermaid code for the diagram.`,
    temperature: 0.3,
    top_p: 0.9,
    max_tokens: 1000,
  });

  await AppDataSource.destroy();
}


seed().catch((err) => {
  console.error('❌ Seed error', err);
  AppDataSource.destroy();
});


