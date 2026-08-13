import { GroupedSenderData } from '@/components/SenderCard';

/**
 * Calculates if a query string fuzzy matches a target text string.
 * Supports direct substring, multi-token match, and sequential character fuzzy matching.
 */
export function fuzzyMatchString(target: string, query: string): boolean {
  if (!query) return true;
  if (!target) return false;

  const targetLower = target.toLowerCase();
  const queryLower = query.toLowerCase().trim();

  // 1. Direct substring match
  if (targetLower.includes(queryLower)) return true;

  // 2. Token / word-level matching (all query tokens exist as substrings in target)
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);
  const allTokensMatched = queryTokens.every((token) => targetLower.includes(token));
  if (allTokensMatched) return true;

  // 3. Sequential character fuzzy match for acronyms/abbreviations or typos (e.g. "lkdn" -> "linkedin")
  let targetIdx = 0;
  let queryIdx = 0;
  while (targetIdx < targetLower.length && queryIdx < queryLower.length) {
    if (targetLower[targetIdx] === queryLower[queryIdx]) {
      queryIdx++;
    }
    targetIdx++;
  }
  if (queryIdx === queryLower.length) return true;

  return false;
}

export interface FilterOptions {
  query: string; // Fuzzy text query
  domainFilter: string; // Specific domain or pattern (e.g., substack.com or @substack.com)
  domainFilterMode: 'include' | 'exclude'; // Include matching domain or exclude matching domain
  contextType: string; // "all", "job_alerts", "newsletters", "ecommerce", "finance", "high_unread"
  priorityFilter: 'all' | 'high' | 'medium' | 'low' | 'job_alerts';
}

/**
 * Filters senders using fuzzy matching across name, email, domain, subjects, snippets, and AI categories,
 * as well as custom domain filters (include/exclude) and context/use-type selectors.
 */
export function filterSendersFuzzy(
  senders: GroupedSenderData[],
  options: FilterOptions
): GroupedSenderData[] {
  const { query, domainFilter, domainFilterMode, contextType, priorityFilter } = options;

  const cleanDomainQuery = domainFilter.toLowerCase().replace(/^@/, '').trim();
  const cleanSearchQuery = query.trim();

  return senders.filter((s) => {
    // 1. Custom Domain Filter Check
    if (cleanDomainQuery) {
      const senderDomain = (s.domain || '').toLowerCase();
      const senderEmail = (s.fromEmail || '').toLowerCase();

      const domainMatches =
        senderDomain.includes(cleanDomainQuery) || senderEmail.includes(cleanDomainQuery);

      if (domainFilterMode === 'include' && !domainMatches) return false;
      if (domainFilterMode === 'exclude' && domainMatches) return false;
    }

    // 2. Priority Filter Check
    if (priorityFilter === 'high' && s.analysis?.unsubscribePriority !== 'high') return false;
    if (priorityFilter === 'medium' && s.analysis?.unsubscribePriority !== 'medium') return false;
    if (priorityFilter === 'low' && s.analysis?.unsubscribePriority !== 'low') return false;
    if (
      priorityFilter === 'job_alerts' &&
      !s.analysis?.isJobRelated &&
      !s.analysis?.category?.toLowerCase().includes('job')
    ) {
      return false;
    }

    // 3. Context / Use-Type Filter Check
    if (contextType && contextType !== 'all') {
      const categoryLower = (s.analysis?.category || '').toLowerCase();
      const summaryLower = (s.analysis?.summary || '').toLowerCase();
      const emailLower = s.fromEmail.toLowerCase();
      const subjectLower = (s.sampleSubject || '').toLowerCase();

      if (contextType === 'job_alerts') {
        const isJob =
          s.analysis?.isJobRelated ||
          categoryLower.includes('job') ||
          categoryLower.includes('career') ||
          summaryLower.includes('recruiter') ||
          emailLower.includes('linkedin') ||
          emailLower.includes('indeed');
        if (!isJob) return false;
      } else if (contextType === 'newsletters') {
        const isNewsletter =
          categoryLower.includes('newsletter') ||
          categoryLower.includes('digest') ||
          categoryLower.includes('subscription') ||
          emailLower.includes('substack') ||
          emailLower.includes('medium');
        if (!isNewsletter) return false;
      } else if (contextType === 'ecommerce') {
        const isEcom =
          categoryLower.includes('promo') ||
          categoryLower.includes('shop') ||
          categoryLower.includes('sale') ||
          subjectLower.includes('off') ||
          subjectLower.includes('discount') ||
          subjectLower.includes('deal');
        if (!isEcom) return false;
      } else if (contextType === 'finance') {
        const isFinance =
          categoryLower.includes('receipt') ||
          categoryLower.includes('financial') ||
          categoryLower.includes('invoice') ||
          subjectLower.includes('order') ||
          subjectLower.includes('bank') ||
          subjectLower.includes('payment');
        if (!isFinance) return false;
      } else if (contextType === 'high_unread') {
        if (s.unreadCount < 5) return false;
      }
    }

    // 4. Fuzzy Match Query Check across name, email, domain, sampleSubject, snippet, category, summary
    if (cleanSearchQuery) {
      const fieldsToMatch = [
        s.fromName,
        s.fromEmail,
        s.domain,
        s.sampleSubject,
        s.sampleSnippet,
        s.analysis?.category || '',
        s.analysis?.summary || '',
        s.analysis?.safetyWarning || '',
      ];

      const matchesAnyField = fieldsToMatch.some((field) =>
        fuzzyMatchString(field, cleanSearchQuery)
      );

      if (!matchesAnyField) return false;
    }

    return true;
  });
}
