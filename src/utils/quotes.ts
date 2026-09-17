export interface QuoteData {
  quote: string;
  author: string;
  source?: string;
  dateKey?: string;
}

const QUOTE_CACHE_KEY = 'webclock_daily_quote_v1';

export const CURATED_WISDOM_QUOTES: Array<{ quote: string; author: string }> = [
  { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { quote: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { quote: 'Act as if what you do makes a difference. It does.', author: 'William James' },
  { quote: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson' },
  { quote: 'Happiness is not something ready-made. It comes from your own actions.', author: 'Dalai Lama' },
  { quote: 'Turn your wounds into wisdom.', author: 'Oprah Winfrey' },
  { quote: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { quote: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { quote: 'Believe you can and you’re halfway there.', author: 'Theodore Roosevelt' },
  { quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { quote: 'You must be the change you wish to see in the world.', author: 'Mahatma Gandhi' },
  { quote: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { quote: 'Everything you’ve ever wanted is sitting on the other side of fear.', author: 'George Addair' },
  { quote: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { quote: 'Time you enjoy wasting is not wasted time.', author: 'Marthe Troly-Curtin' },
  { quote: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
  { quote: 'Knowing is not enough; we must apply. Willing is not enough; we must do.', author: 'Johann Wolfgang von Goethe' },
  { quote: 'Keep your face always toward the sunshine, and shadows will fall behind you.', author: 'Walt Whitman' },
  { quote: 'Doubt kills more dreams than failure ever will.', author: 'Suzy Kassem' },
  { quote: 'Your time is limited, so don’t waste it living someone else’s life.', author: 'Steve Jobs' },
  { quote: 'The mind is everything. What you think you become.', author: 'Buddha' },
  { quote: 'Strive not to be a success, but rather to be of value.', author: 'Albert Einstein' },
  { quote: 'Life is 10% what happens to you and 90% how you react to it.', author: 'Charles R. Swindoll' },
];

/**
 * Returns today's ISO date string 'YYYY-MM-DD' in local time.
 */
export function getTodayDateKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Read cached quote from localStorage.
 */
export function getCachedQuote(): QuoteData | null {
  try {
    const raw = localStorage.getItem(QUOTE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.quote === 'string' && typeof parsed.author === 'string') {
      return parsed;
    }
  } catch {}
  return null;
}

/**
 * Save quote to localStorage with today's date key.
 */
export function saveCachedQuote(quote: QuoteData): void {
  try {
    localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(quote));
  } catch {}
}

/**
 * Fetch a daily quote:
 * - If not forced, reuses today's cached quote.
 * - Otherwise fetches from /api/quote, or public APIs, or fallback wisdom.
 */
export async function fetchDailyQuote(forceRefresh: boolean = false): Promise<QuoteData> {
  const todayKey = getTodayDateKey();
  const cached = getCachedQuote();

  if (!forceRefresh && cached && cached.dateKey === todayKey && cached.quote.trim()) {
    return cached;
  }

  // Helper to store and return
  const recordAndReturn = (quote: string, author: string, source: string): QuoteData => {
    const cleanQuote = quote.replace(/^["'„“\s]+|["'”\s]+$/g, '').trim();
    const cleanAuthor = author.replace(/^[—–\-\s]+/, '').trim() || 'Unknown';
    const result: QuoteData = {
      quote: cleanQuote,
      author: cleanAuthor,
      source,
      dateKey: todayKey,
    };
    saveCachedQuote(result);
    return result;
  };

  // 1. Try server endpoint /api/quote
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch('/api/quote', { signal: controller.signal });
    clearTimeout(timeout);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.quote && data.author) {
        return recordAndReturn(data.quote, data.author, data.source || 'api');
      }
    }
  } catch {}

  // 2. Direct client-side fetch from DummyJSON
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch('https://dummyjson.com/quotes/random', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.quote && data.author) {
        return recordAndReturn(data.quote, data.author, 'dummyjson');
      }
    }
  } catch {}

  // 3. Fallback to curated wisdom pool
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = forceRefresh
    ? Math.floor(Math.random() * CURATED_WISDOM_QUOTES.length)
    : Math.abs(dayOfYear) % CURATED_WISDOM_QUOTES.length;
  const picked = CURATED_WISDOM_QUOTES[index];
  return recordAndReturn(picked.quote, picked.author, 'curated');
}
