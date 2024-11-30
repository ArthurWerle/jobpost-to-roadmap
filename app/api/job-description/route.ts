import { NextRequest, NextResponse } from 'next/server'
import { extractJobDescription } from '@/app/utils/extractJobDescription'
import { extractLinkedInJobUrl } from '@/app/utils/extractJobUrl'
import { robustFetch } from '@/app/utils/robustFetch'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const jobUrl = request.nextUrl.searchParams.get('jobUrl')

  if (!jobUrl) {
    return new Response('Missing job URL', { status: 400 })
  }

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  const statusMessages = [
    'Trying to fetch job description...',
    'Extracting job details...',
    'Processing job description...',
    'Job description successfully retrieved'
  ]

  async function streamJobDescription() {
    try {
      // Stream status messages
      for (const message of statusMessages) {
        await writer.write(encoder.encode(`STATUS: ${message}\n`))
      }

      const extractedUrl = extractLinkedInJobUrl(jobUrl as string)
      
      if (!extractedUrl) {
        await writer.write(encoder.encode('ERROR: Invalid job URL\n'))
        await writer.close()
        return
      }

      const response = await robustFetch(extractedUrl)
      const html = await response.text()

      // Extract job description
      const jobDescription = extractJobDescription(html)

      // Stream job description
      await writer.write(encoder.encode(`DESCRIPTION: ${jobDescription}\n`))
      
      await writer.close()
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred'
      
      await writer.write(encoder.encode(`ERROR: ${errorMessage}\n`))
      await writer.close()
    }
  }

  streamJobDescription()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}