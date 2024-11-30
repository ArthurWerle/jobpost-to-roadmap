import { NextRequest, NextResponse } from 'next/server'
import { extractJobDescription } from '@/app/utils/extractJobDescription'
import { extractLinkedInJobUrl } from '@/app/utils/extractJobUrl'
import { robustFetch } from '@/app/utils/robustFetch'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const jobUrl = request.nextUrl.searchParams.get('jobUrl')

  if (!jobUrl) {
    return new Response('Missing job URL', { status: 400 })
  }
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Helper function to safely write to the stream
      const writeToStream = (message: string) => {
        controller.enqueue(encoder.encode(message + '\n'))
      }

      try {
        // Stream status messages
        writeToStream(`STATUS: Trying to fetch job description...`)
        
        const extractedUrl = extractLinkedInJobUrl(jobUrl as string)
        
        if (!extractedUrl) {
          writeToStream('ERROR: Invalid job URL')
          controller.close()
          return
        }

        // Periodic heartbeat to prevent timeout
        const heartbeatInterval = setInterval(() => {
          writeToStream(`STATUS: Still processing...`)
        }, 2000)

        try {
          writeToStream(`STATUS: Extracting job details...`)
          
          const response = await robustFetch(extractedUrl)
          const html = await response.text()
          
          writeToStream(`STATUS: Processing job description...`)
          const jobDescription = extractJobDescription(html)
          
          writeToStream(`STATUS: Job description successfully retrieved...`)
          writeToStream(`DESCRIPTION: ${jobDescription}`)
        } finally {
          clearInterval(heartbeatInterval)
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'An unknown error occurred'
        
        writeToStream(`ERROR: ${errorMessage}`)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}