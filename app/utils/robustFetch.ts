const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
];

// Custom delay function
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function robustFetch(url: string, maxRetries = 8): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://www.google.com/',
        },
      });

      console.log(`Attempt ${attempt + 1} status: ${response.status}`);

      if (response.ok) {
        return response;
      }

      if (response.status === 429) {
        console.log(`Rate limited on attempt ${attempt + 1}. Retrying after delay...`);
        await delay(Math.pow(2, attempt) * 1000 + Math.random() * 1000);
        continue;
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        await delay(Math.pow(2, attempt) * 1000 + Math.random() * 1000);
      }
    }
  }

  throw lastError || new Error('Failed to fetch after multiple attempts');
}
