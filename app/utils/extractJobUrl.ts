export function extractLinkedInJobUrl(fullUrl: string): string {
  const jobUrlRegex = /https:\/\/www\.linkedin\.com\/jobs\/view\/(\d+)/
  
  const match = fullUrl.match(jobUrlRegex)
  
  return match ? match[0] : fullUrl
}