export const SPAM_WORDS = [
  'winner', 'free', 'win', 'prize', 'urgent', 'cash', 'gift', 'bonus', 'money', 'credit',
  'earn', 'income', 'profit', 'investment', 'guaranteed', 'risk-free', 'unlimited',
  'billion', 'million', 'lottery', 'inheritance', 'claim', 'verify', 'account', 'security',
  'alert', 'restricted', 'suspended', 'limited-time', 'act-now', 'exclusive', 'offer',
  'click-here', 'link', 'download', 'attached', 'billing', 'invoice', 'payment',
  'pharmacy', 'viagra', 'cialis', 'casino', 'betting', 'weight-loss', 'diet', 'detox',
  'cheap', 'discount', 'bargain', 'buy-now', 'order-now', 'subscribe', 'unsubscribe',
  'congratulations', 'congrats', 'dear-customer', 'valuable-customer'
];

export interface SpamDetectionResult {
  score: number; // 0 to 100, where 100 is very spicy/spammy
  foundWords: string[];
}

export function detectSpam(text: string): SpamDetectionResult {
  if (!text) return { score: 0, foundWords: [] };
  
  const words = text.toLowerCase().split(/\W+/);
  const found = SPAM_WORDS.filter(spamWord => words.includes(spamWord.toLowerCase()));
  
  // Calculate a basic score based on concentration
  const uniqueFound = new Set(found);
  const density = (uniqueFound.size / SPAM_WORDS.length) * 100;
  const wordCountWeight = (found.length / Math.max(1, words.length)) * 500;
  
  const score = Math.min(100, Math.round(density + wordCountWeight));
  
  return {
    score,
    foundWords: found
  };
}
