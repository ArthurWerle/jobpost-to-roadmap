'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LinkIcon, Copy, Check } from 'lucide-react'
import { generateRoadmap } from '../app/actions/generateRoadmap'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function StudyRoadmapGenerator() {
  const [jobPostUrl, setJobPostUrl] = useState('')
  const [existingKnowledge, setExistingKnowledge] = useState('')
  const [roadmap, setRoadmap] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    const isValid = /^https:\/\/(www\.)?linkedin\.com\/jobs\/view\/.+$/.test(jobPostUrl)
    setIsValidUrl(isValid)
    if (jobPostUrl && !isValid) {
      setError('Please enter a valid LinkedIn job post URL (e.g., https://www.linkedin.com/jobs/view/...)')
    } else {
      setError(null)
    }
  }, [jobPostUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidUrl) return

    setIsLoading(true)
    setError(null)
    setRoadmap('')

    try {
      const result = await generateRoadmap(jobPostUrl, existingKnowledge)
      setRoadmap(result)
    } catch (error) {
      console.error('Error generating roadmap:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    }

    setIsLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(roadmap)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="jobPostUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              LinkedIn Job Post URL
            </label>
            <div className="relative">
              <Input
                type="url"
                id="jobPostUrl"
                value={jobPostUrl}
                onChange={(e) => setJobPostUrl(e.target.value)}
                required
                placeholder="https://www.linkedin.com/jobs/view/..."
                className={cn(
                  "pl-10",
                  !isValidUrl && jobPostUrl && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              <LinkIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="existingKnowledge" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Existing Knowledge
            </label>
            <Textarea
              id="existingKnowledge"
              value={existingKnowledge}
              onChange={(e) => setExistingKnowledge(e.target.value)}
              placeholder="List the skills and technologies you already know..."
              className="min-h-[120px]"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !isValidUrl}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Roadmap...
              </>
            ) : (
              'Generate Study Roadmap'
            )}
          </Button>
        </form>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight">Your Study Roadmap</h2>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none rounded-lg bg-card p-6 shadow-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        {...props}
                        children={String(children).replace(/\n$/, '')}
                        style={tomorrow}
                        language={match[1]}
                        PreTag="div"
                      />
                    ) : (
                      <code {...props} className={className}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {roadmap}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

