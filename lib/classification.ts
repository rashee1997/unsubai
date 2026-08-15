import { AIAnalysisData, GroupedSenderData } from '@/components/SenderCard';

// Known job board, career platform, and applicant tracking system (ATS) domains
const JOB_DOMAINS = [
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'ziprecruiter.com',
  'greenhouse.io',
  'lever.co',
  'handshake.com',
  'joinhandshake.com',
  'workday.com',
  'myworkdayjobs.com',
  'wellfound.com',
  'angel.co',
  'dice.com',
  'otta.com',
  'hired.com',
  'monster.com',
  'careerbuilder.com',
  'simplyhired.com',
  'smartrecruiters.com',
  'jobvite.com',
  'breezy.hr',
  'recruitee.com',
  'workable.com',
  'ashbyhq.com',
  'rippling.com',
  'talent.com',
  'upwork.com',
  'freelancer.com',
  'toptal.com',
  'levels.fyi',
  'flexjobs.com',
  'themuse.com',
  'builtin.com',
  'snagajob.com',
  'lensa.com',
  'jobrapido.com',
  'adzuna.com',
  'jooble.org',
  'careerjet.com',
  'theladders.com',
  'remoteco.com',
  'weworkremotely.com',
  'remoteok.com',
  'jobilize.com',
  'jobs.net',
  'jobsearch.net',
  'careers.google.com',
  'amazon.jobs',
  'meta.com/careers',
  'careers.microsoft.com',
  'apple.com/careers',
];

// Keywords indicating job alerts, recruiting, and career opportunities
const JOB_KEYWORDS = [
  'job alert',
  'job alerts',
  'jobs alert',
  'job opening',
  'job openings',
  'job match',
  'job matches',
  'job recommendation',
  'job recommendations',
  'recommended jobs',
  'jobs matching',
  'career update',
  'career opportunities',
  'career alert',
  'recruiter',
  'recruitment',
  'recruiting',
  'hiring',
  'we are hiring',
  'interview invite',
  'interview invitation',
  'application status',
  'applied to',
  'candidate status',
  'talent match',
  'new positions',
  'open positions',
  'new openings',
  'engineering positions',
  'developer openings',
  'internship opportunity',
  'internship openings',
  'view job',
  'apply now',
  'linkedin jobs',
  'indeed jobs',
  'ziprecruiter',
  'greenhouse',
  'workday',
];

// Financial, invoice, and receipt keywords
const FINANCE_KEYWORDS = [
  'receipt',
  'invoice',
  'order confirmation',
  'billing statement',
  'payment received',
  'bank statement',
  'account alert',
  'tax document',
  'flight confirmation',
  'e-ticket',
  'booking reference',
];

/**
 * Checks if a sender represents a job alert, career recommendation, or recruiter email.
 */
export function isJobAlertSender(sender: {
  fromName?: string;
  fromEmail?: string;
  domain?: string;
  sampleSubject?: string;
  sampleSnippet?: string;
  senderKey?: string;
}): boolean {
  const domainLower = (sender.domain || '').toLowerCase();
  const emailLower = (sender.fromEmail || sender.senderKey || '').toLowerCase();
  const nameLower = (sender.fromName || '').toLowerCase();
  const subjectLower = (sender.sampleSubject || '').toLowerCase();
  const snippetLower = (sender.sampleSnippet || '').toLowerCase();

  // 1. Check known job platform domains
  if (JOB_DOMAINS.some((d) => domainLower.includes(d) || emailLower.includes(`@${d}`) || emailLower.includes(`.${d}`))) {
    return true;
  }

  // 2. Check email prefix / localpart (e.g. jobalerts@, careers@, talent@, jobs-noreply@)
  const localPart = emailLower.split('@')[0] || '';
  if (
    localPart.includes('job') ||
    localPart.includes('career') ||
    localPart.includes('hiring') ||
    localPart.includes('recruiter') ||
    localPart.includes('talent') ||
    localPart.includes('workday') ||
    localPart.includes('greenhouse')
  ) {
    return true;
  }

  // 3. Check sender display name (e.g. "LinkedIn Job Alerts", "Indeed Jobs", "Handshake Careers")
  if (
    nameLower.includes('job') ||
    nameLower.includes('career') ||
    nameLower.includes('recruiter') ||
    nameLower.includes('recruiting') ||
    nameLower.includes('hiring') ||
    nameLower.includes('handshake') ||
    nameLower.includes('glassdoor') ||
    nameLower.includes('indeed') ||
    nameLower.includes('ziprecruiter')
  ) {
    return true;
  }

  // 4. Check subject line & snippet for job alerts
  const combinedText = `${subjectLower} ${snippetLower}`;
  if (JOB_KEYWORDS.some((kw) => combinedText.includes(kw))) {
    return true;
  }

  return false;
}

/**
 * Checks if a sender represents a receipt, invoice, or financial alert.
 */
export function isFinanceOrReceiptSender(sender: {
  fromName?: string;
  fromEmail?: string;
  sampleSubject?: string;
  sampleSnippet?: string;
}): boolean {
  const combinedText = `${(sender.fromName || '').toLowerCase()} ${(sender.fromEmail || '').toLowerCase()} ${(sender.sampleSubject || '').toLowerCase()} ${(sender.sampleSnippet || '').toLowerCase()}`;
  return FINANCE_KEYWORDS.some((kw) => combinedText.includes(kw));
}

/**
 * Classifies a sender and generates AIAnalysisData.
 * CRITICAL RULE: Job Alerts are ALWAYS assigned 'low' priority and protected from bulk unsubscribe.
 */
export function classifySender(sender: {
  senderKey: string;
  fromName: string;
  fromEmail: string;
  domain?: string;
  totalEmails: number;
  unreadCount: number;
  sampleSubject?: string;
  sampleSnippet?: string;
  existingAnalysis?: AIAnalysisData;
}): AIAnalysisData {
  const isJob = isJobAlertSender(sender);

  if (isJob) {
    return {
      senderKey: sender.senderKey,
      unsubscribePriority: 'low', // ALWAYS Low Priority for Job Alerts
      recommendationScore: Math.min(18, 5 + Math.min(sender.unreadCount, 10)),
      category: 'Job Alerts & Careers',
      summary: sender.sampleSubject
        ? `Job alert & career notification: "${sender.sampleSubject.slice(0, 75)}"`
        : 'Job alerts and career recruitment notifications.',
      safetyWarning: 'Job Alert / Career Notification - AI protected to preserve job opportunities.',
      isSensitive: true,
      isJobRelated: true,
    };
  }

  if (isFinanceOrReceiptSender(sender)) {
    return {
      senderKey: sender.senderKey,
      unsubscribePriority: 'low',
      recommendationScore: 22,
      category: 'Receipts & Billing',
      summary: sender.sampleSubject
        ? `Receipt / Transaction: "${sender.sampleSubject.slice(0, 75)}"`
        : 'Contains financial statements, order receipts, or billing updates.',
      safetyWarning: 'Contains receipts, account alerts, or invoices. Caution advised.',
      isSensitive: true,
      isJobRelated: false,
    };
  }

  // If existing analysis is present and valid
  if (sender.existingAnalysis) {
    // If existing analysis was somehow marked jobRelated, enforce low priority
    if (sender.existingAnalysis.isJobRelated || sender.existingAnalysis.category?.toLowerCase().includes('job')) {
      return {
        ...sender.existingAnalysis,
        unsubscribePriority: 'low',
        recommendationScore: Math.min(sender.existingAnalysis.recommendationScore || 15, 20),
        isJobRelated: true,
        isSensitive: true,
        safetyWarning: 'Job Alert / Career Notification - AI protected to preserve job opportunities.',
      };
    }
    return sender.existingAnalysis;
  }

  // Standard promotional / newsletter classification
  const isHighVolumeUnread = sender.unreadCount >= 3;
  const isModerateUnread = sender.unreadCount >= 1;

  const subjectLower = (sender.sampleSubject || '').toLowerCase();
  let category = 'Newsletter & Promo';
  if (subjectLower.includes('sale') || subjectLower.includes('off') || subjectLower.includes('deal')) {
    category = 'E-Commerce Deals';
  } else if (subjectLower.includes('digest') || subjectLower.includes('newsletter') || subjectLower.includes('weekly')) {
    category = 'Newsletter Digest';
  } else if (subjectLower.includes('security') || subjectLower.includes('update') || subjectLower.includes('alert')) {
    category = 'Updates & Alerts';
  }

  return {
    senderKey: sender.senderKey,
    unsubscribePriority: isHighVolumeUnread ? 'high' : isModerateUnread ? 'medium' : 'low',
    recommendationScore: Math.min(96, Math.max(30, 50 + sender.unreadCount * 8)),
    category,
    summary: `Sender has ${sender.unreadCount} unread email(s) out of ${sender.totalEmails} scanned.`,
    safetyWarning: null,
    isSensitive: false,
    isJobRelated: false,
  };
}
