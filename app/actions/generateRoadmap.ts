'use server'

import { OpenAI } from 'openai'
import * as cheerio from 'cheerio'
import { robustFetch } from '../utils/robustFetch'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateRoadmap(jobPostUrl: string, existingKnowledge: string): Promise<string> {
  try {
    if (!isValidLinkedInJobUrl(jobPostUrl)) {
      throw new Error('Invalid LinkedIn job post URL')
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a career advisor creating detailed study roadmaps. Format your response in clean, well-structured markdown with proper headings, lists, and emphasis. Use code blocks for technical content.`
        },
        {
          role: "user",
          content: `Create a detailed study roadmap based on this job description: "${jobDescription}". Please cover ALL requirements. The user already knows: "${existingKnowledge}". 
${fetchError ? `Note: There was an error fetching the job post (${fetchError.message}). Please provide a general roadmap based on common requirements for this type of position.` : ''}

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
- **Estimated time**: [Duration]
- **Project outline**:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]

## Overall tips to land this job
[Provide any other type of info to help to land this job]

## Next Steps
1. [Actionable step]
2. [Actionable step]
3. [Actionable step]

Use proper markdown formatting with headers (##), bold (**), lists (-)`
        }
      ],
    })

    return completion.choices[0].message.content || 'Failed to generate roadmap'
  } catch (error) {
    console.error('Error in generateRoadmap:', error);
    throw error;
  }
}

function isValidLinkedInJobUrl(url: string): boolean {
  const linkedInJobRegex = /^https:\/\/(www\.)?linkedin\.com\/jobs\/view\/.+$/
  return linkedInJobRegex.test(url)
}

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

