import * as cheerio from 'cheerio'

export function extractJobDescription(html: string): string | null {
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