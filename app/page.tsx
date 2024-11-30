import Link from 'next/link'
import StudyRoadmapGenerator from '../components/StudyRoadmapGenerator'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container m-auto px-4 py-12 md:py-16">
        <div className="flex justify-center mb-8">
          <Button
            variant="link"
            size="sm"
            asChild
          >
            <Link href="https://www.arthurwerle.com.br" target="_blank" rel="noopener noreferrer">
              built by arthur
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-block p-3 rounded-lg bg-primary/10 mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter mb-4">
            Job Post Study Roadmap Generator
          </h1>
          <p className="text-muted-foreground max-w-[600px] mb-8">
            Wanna land a job?
            Enter a LinkedIn job post URL and your existing knowledge to generate a personalized study roadmap to that specific job post.
          </p>
        </div>
        <StudyRoadmapGenerator />
      </div>
    </main>
  )
}

