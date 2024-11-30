export const maxDuration = 120

import { OpenAIStream, OpenAIStreamPayload } from "../../utils/gptStream"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI")
}

export const runtime = "edge"

export async function POST(req: Request): Promise<Response> {
  const { jobDescription, existingKnowledge } = (await req.json()) as {
    jobDescription?: string;
    existingKnowledge?: string
  };

  if (!jobDescription) {
    return new Response("Missing job description", { status: 400 });
  }

  let fetchError: Error | null = null;

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

