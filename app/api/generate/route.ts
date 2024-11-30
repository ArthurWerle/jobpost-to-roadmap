import { OpenAIStream, OpenAIStreamPayload } from "../../utils/gptStream"
import { robustFetch } from "../../utils/robustFetch"
import * as cheerio from 'cheerio'

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI")
}

export const runtime = "edge"

export async function POST(req: Request): Promise<Response> {
  const { jobPostUrl, existingKnowledge } = (await req.json()) as {
    jobPostUrl?: string;
    existingKnowledge?: string
  };

  if (!jobPostUrl) {
    return new Response("Missing jobUrl", { status: 400 });
  }

  let jobDescription: string | null = null;
  let fetchError: Error | null = null;

  try {
    const response = await robustFetch(jobPostUrl);
    const html = await response.text();
    jobDescription = extractJobDescription(html);
  } catch (error) {
    console.error('Error fetching job post:', error);
    fetchError = error instanceof Error ? error : new Error(String(error));
  }

  if (!jobDescription) {
    console.log('Failed to extract job description. Attempting to generate a roadmap without it.');
    jobDescription = 'Unable to fetch specific job description. Please provide a general roadmap for the job title.';
  }

  const payload: OpenAIStreamPayload = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a career advisor creating detailed study roadmaps. Format your response in clean, well-structured markdown with proper headings, lists, and emphasis. Use code blocks for technical content.`
      },
      {
        role: "user",
        content: `Create a detailed study roadmap based on this job description: "${jobDescription}". Please cover ALL requirements. The user already knows: "${existingKnowledge}".

Format the response as follows:

# Study Roadmap for [Job title here]

## Overview
[Brief overview of the learning path]

## Soft Skills
[Cover all soft skills mentioned in the job description]

## Technical Skills 
### 1. [Skill Name]
- **Why it's important**: [Explanation]
- **Priority**: [High/Medium/Low]
- **Learning resources**:
- [Resource 1]
- [Resource 2]

### 2. [Skill Name]
[Same structure as above]

## Recommended Projects to develop those skills
### 1. [Project Name]
- **Objective**: [What you'll learn]
- **Key technologies**: [List]
- **Project outline**:
1. [Step 1]
2. [Step 2]

## Overall tips to land this job
[Provide any other type of info to help to land this job]

## Next Steps
[Provide all actionable steps]

Use proper markdown formatting with headers (##), bold (**), lists (-)`
      }
    ],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    n: 1,
  };

  const stream = await OpenAIStream(payload);
  return new Response(
    stream, {
      headers: new Headers({
        'Cache-Control': 'no-cache',
      })
    }
  );
}

// export default handler

function extractJobDescription(html: string): string | null {
  const $ = cheerio.load(html)
  
  const selectors = [
    '.show-more-less-html__markup',
    '.job-description',
    '#job-details',
    '.description__text'
  ]

  for (const selector of selectors) {
    const description = $(selector).text().trim()
    if (description) {
      return description
    }
  }

  return null
}

