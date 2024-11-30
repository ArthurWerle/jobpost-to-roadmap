'use client'
import { useState, useEffect } from 'react'

export function useJobDescriptionStream(jobUrl: string) {
  const [statusMessages, setStatusMessages] = useState<string[]>([])
  const [jobDescription, setJobDescription] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobUrl) return

    const controller = new AbortController()
    const signal = controller.signal

    async function fetchStream() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/job-description?jobUrl=${encodeURIComponent(jobUrl)}`, { signal })
        
        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        const messages: string[] = []
        let description = ''
        let run = true

        while (run) {
          const { done, value } = await reader.read()
          
          if (done) {
            run = false
            setIsLoading(false)
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.trim().split('\n')
          
          console.log({ lines })
          lines.forEach(line => {
            if (line.startsWith('STATUS: ')) {
              messages.push(line.replace('STATUS: ', ''))
              setStatusMessages([...messages])
            } else if (line.startsWith('DESCRIPTION: ')) {
              description = line.replace('DESCRIPTION: ', '')
              setJobDescription(description)
            } else if (line.startsWith('ERROR: ')) {
              setError(line.replace('ERROR: ', ''))
            }
          })
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
        }
        setIsLoading(false)
      }
    }

    fetchStream()

    return () => {
      controller.abort()
    }
  }, [jobUrl])

  return { statusMessages, jobDescription, isLoading, error }
}