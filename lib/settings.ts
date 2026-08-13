export interface CustomFilterRule {
  id: string;
  title: string;
  description: string;
  instruction: string;
  enabled: boolean;
  category: 'protection' | 'priority' | 'custom';
}

export interface AppSettings {
  customInstructionsText: string;
  presetRules: CustomFilterRule[];
  scanDefaults: {
    timeframe: '7d' | '14d' | '30d' | '60d' | '90d' | '180d';
    mode: 'unopened' | 'all_subscriptions' | 'untouched_promos' | 'job_alerts';
    maxResults: number;
  };
  aiSafetyEnforcement: boolean;
  autoArchiveOnTrash: boolean;
}

export const DEFAULT_PRESET_RULES: CustomFilterRule[] = [
  {
    id: 'protect_job_alerts',
    title: '💼 Protect Job Alerts & Career Notifications',
    description: 'Keep LinkedIn Jobs, Indeed, Glassdoor, ZipRecruiter & recruitment emails as Low Priority.',
    instruction: 'If the sender is a job alert, recruiter email, career update, or hiring notice, set isJobRelated to true, set unsubscribePriority to "low", and add a safety warning.',
    enabled: true,
    category: 'protection',
  },
  {
    id: 'protect_finance_receipts',
    title: '🧾 Preserve Financial Statements & Receipts',
    description: 'Protect invoices, bank alerts, flight bookings, and order receipts from being recommended for bulk trash.',
    instruction: 'If sender contains receipts, order confirmations, flight itineraries, or bank updates, set safetyWarning and set isSensitive to true.',
    enabled: true,
    category: 'protection',
  },
  {
    id: 'elevate_high_unread_promos',
    title: '🔥 Elevate High Unread Promos (>10 Unopened)',
    description: 'Automatically flag marketing promos with more than 10 unopened emails as High Priority.',
    instruction: 'If a promotional or newsletter sender has more than 10 unopened emails, assign an unsubscribe recommendation score >= 85 and set unsubscribePriority to "high".',
    enabled: true,
    category: 'priority',
  },
  {
    id: 'protect_tech_newsletters',
    title: '📰 Protect Favorite Tech & AI Newsletters',
    description: 'Keep Substack, Medium, TLDR, and curated tech digests in Low/Medium priority unless requested.',
    instruction: 'If sender is a high-value tech digest (e.g. Substack, Medium, TLDR AI, Hacker News), do not mark as high priority unless unread count exceeds 20.',
    enabled: false,
    category: 'protection',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  customInstructionsText: '',
  presetRules: DEFAULT_PRESET_RULES,
  scanDefaults: {
    timeframe: '30d',
    mode: 'unopened',
    maxResults: 50,
  },
  aiSafetyEnforcement: true,
  autoArchiveOnTrash: false,
};

export const SETTINGS_STORAGE_KEY = 'unsub_ai_settings';

export function getStoredSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const item = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!item) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(item);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      scanDefaults: {
        ...DEFAULT_SETTINGS.scanDefaults,
        ...(parsed.scanDefaults || {}),
      },
      presetRules: parsed.presetRules && parsed.presetRules.length > 0 ? parsed.presetRules : DEFAULT_PRESET_RULES,
    };
  } catch (err) {
    console.error('Failed to parse stored settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
  * Compiles enabled preset instructions + custom text instructions into a single prompt block
  * for sending to the AI analyze API endpoint.
  */
export function compileCombinedCustomInstructions(settings: AppSettings): string {
  const enabledPresets = settings.presetRules
    .filter((r) => r.enabled)
    .map((r) => `- [${r.title}]: ${r.instruction}`)
    .join('\n');

  const customText = settings.customInstructionsText.trim();

  let combined = '';
  if (enabledPresets) {
    combined += `PRESET FILTER RULES:\n${enabledPresets}\n\n`;
  }
  if (customText) {
    combined += `USER DIRECT INSTRUCTIONS:\n${customText}`;
  }

  return combined.trim();
}
