import { Type, FunctionDeclaration } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithFallback } from '@/lib/gemini';

// Define enhanced function declarations for Gemini Agent tools
const crudTools: FunctionDeclaration[] = [
  {
    name: 'search_senders',
    description: 'Search and filter subscription senders in the scanned inbox by keyword, domain, category, or priority level.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Search term to match sender name, email, snippet, or subject.' },
        priority: { type: Type.STRING, enum: ['all', 'high', 'medium', 'low', 'job_alerts'], description: 'Filter by priority level.' },
        category: { type: Type.STRING, description: 'Filter by specific category e.g. E-Commerce, Tech Digest, Job Alerts.' },
        domain: { type: Type.STRING, description: 'Filter by email domain e.g. substack.com.' },
      },
    },
  },
  {
    name: 'get_inbox_health',
    description: 'Get current inbox scan summary metrics including total senders, high priority unsubscribes, unread emails, and job alerts.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'inspect_sender_samples',
    description: 'Inspect sample email subjects, snippets, unread ratios, unsubscribe headers, and volume trends for one or more senders.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        senderKey: { type: Type.STRING, description: 'The sender email address or key to inspect in detail.' },
      },
      required: ['senderKey'],
    },
  },
  {
    name: 'simulate_cleanup_impact',
    description: 'Simulate and calculate the projected impact (messages freed, storage MB estimate, job alert risk check) before running an unsubscribe or trash action.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        senderKeys: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of sender emails to simulate cleanup for.',
        },
        action: {
          type: Type.STRING,
          enum: ['unsubscribe', 'trash', 'unsubscribe_and_trash'],
          description: 'The type of action to simulate.',
        },
      },
      required: ['senderKeys', 'action'],
    },
  },
  {
    name: 'unsubscribe_sender',
    description: 'Unsubscribe from one or multiple subscription senders in Gmail.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        senderKeys: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of sender emails or keys to unsubscribe from.',
        },
        autoTrash: {
          type: Type.BOOLEAN,
          description: 'If true, also move existing emails from these senders to trash.',
        },
        reason: {
          type: Type.STRING,
          description: 'Clear reason for unsubscribing to display in the human-in-the-loop confirmation card.',
        },
      },
      required: ['senderKeys', 'reason'],
    },
  },
  {
    name: 'trash_sender_emails',
    description: 'Bulk move emails from specific senders directly to Gmail Trash.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        senderKeys: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of sender emails to move to trash.',
        },
        reason: {
          type: Type.STRING,
          description: 'Explanation for trashing these emails.',
        },
      },
      required: ['senderKeys', 'reason'],
    },
  },
  {
    name: 'update_sender_priority',
    description: 'Update a sender priority level or safety designation in the app.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        senderKey: { type: Type.STRING, description: 'The sender email address/key.' },
        newPriority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'New priority level.' },
        isJobRelated: { type: Type.BOOLEAN, description: 'Whether to mark as protected job alert.' },
        reason: { type: Type.STRING, description: 'Reason for updating priority.' },
      },
      required: ['senderKey', 'newPriority', 'reason'],
    },
  },
  {
    name: 'add_custom_filter_rule',
    description: 'Create a new AI filter rule or instruction in the app settings to guide future inbox scans.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Short descriptive title for the rule.' },
        description: { type: Type.STRING, description: 'Brief description of what this rule does.' },
        instruction: { type: Type.STRING, description: 'Detailed prompt instruction for the AI analyzer.' },
        category: { type: Type.STRING, enum: ['protection', 'priority', 'custom'], description: 'Rule category.' },
      },
      required: ['title', 'instruction', 'category'],
    },
  },
  {
    name: 'add_to_protected_list',
    description: 'Add a domain or email address to the user protected whitelist so it is never recommended for unsubscription.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        domainOrEmail: { type: Type.STRING, description: 'Email address or domain (e.g. substack.com or info@mybank.com).' },
        reason: { type: Type.STRING, description: 'Reason why this domain should be protected.' },
      },
      required: ['domainOrEmail', 'reason'],
    },
  },
  {
    name: 'update_scan_configuration',
    description: 'Update default scan configuration parameters such as timeframe or scan mode.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timeframe: { type: Type.STRING, enum: ['7d', '14d', '30d', '60d', '90d', '180d'] },
        mode: { type: Type.STRING, enum: ['unopened', 'all_subscriptions', 'untouched_promos', 'job_alerts'] },
        maxResults: { type: Type.INTEGER },
      },
    },
  },
  {
    name: 'trigger_inbox_scan',
    description: 'Trigger a new scan of the user Gmail inbox with current filter settings.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: { type: Type.STRING, description: 'Reason for running a new scan.' },
      },
    },
  },
  {
    name: 'get_audit_logs',
    description: 'Fetch the recent session audit log history of unsubscribes and cleanup actions.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY environment variable is missing on server.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      messages,
      systemRole = 'inbox_agent',
      context = {},
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    const ai = getGeminiClient();

    // Build role-based system instruction
    let roleDescription = 'You are the Gmail Smart Unsubscriber Copilot, an agentic AI chatbot equipped with real-time inspection, simulation, and CRUD tools to help users scan, analyze, filter, unsubscribe from newsletters, and organize their Gmail inbox with safety guarantees.';

    if (systemRole === 'privacy_expert') {
      roleDescription = 'You are the Gmail Privacy & Safety Audit Expert. You focus heavily on protecting sensitive emails, receipts, financial alerts, two-factor notices, and job opportunity alerts from accidental unsubscriptions. Always highlight safety warnings and check protected whitelists.';
    } else if (systemRole === 'strict_cleaner') {
      roleDescription = 'You are the Aggressive Clutter Cleaner AI Agent. Your goal is to aggressively surface high-volume unopened newsletters, marketing spam, and abandoned promo subscriptions to free up inbox space quickly and recommend batch cleanup.';
    }

    const currentContextSummary = `
=== CURRENT APP CONTEXT ===
- Total Senders Scanned: ${context.totalSenders || 0}
- High Priority Unsubscribes: ${context.highPriorityCount || 0}
- Job Alerts Preserved: ${context.jobAlertsCount || 0}
- Total Unread Messages in Scan: ${context.totalUnread || 0}
- Active Scan Timeframe: ${context.scanConfig?.timeframe || '30d'} (${context.scanConfig?.mode || 'unopened'} mode)
- Connected User: ${context.userEmail || 'Demo Mode User'}
- Unsubscribed So Far: ${context.unsubscribedCount || 0} senders
- Emails Cleaned/Trashed: ${context.cleanedMessagesCount || 0}
===========================
`;

    const systemInstruction = `${roleDescription}

${currentContextSummary}

CORE RULES & AGENTIC BEHAVIOR:
1. You have CRUD tools to inspect and act on the user's inbox subscriptions and rules.
2. READ & SIMULATION operations (search_senders, get_inbox_health, inspect_sender_samples, simulate_cleanup_impact, get_audit_logs) execute automatically to answer queries with precise facts and dry-run simulations.
3. WRITE / ACTION operations (unsubscribe_sender, trash_sender_emails, update_sender_priority, add_custom_filter_rule, add_to_protected_list, update_scan_configuration, trigger_inbox_scan) will trigger an interactive Human-In-The-Loop (HITL) confirmation card in the user's chat window before execution.
4. When proposing write/delete tools, always provide a clear, user-friendly "reason" parameter and explain the impact.
5. If the user asks about the consequences or impact of cleaning senders, invoke 'simulate_cleanup_impact' or 'inspect_sender_samples' first before proposing the action.
6. Never hallucinate fake email addresses or actions. Base actions on the provided app context.
7. Always preserve Job Alerts and Career notifications unless the user explicitly orders you to unsubscribe from them.
8. Be polite, concise, professional, and helpful. Format responses with clean Markdown bullet points and bold key numbers.`;

    // Convert client chat message history into Gemini content structure
    const formattedContents = messages.map((m: any) => {
      if (m.role === 'user') {
        return {
          role: 'user',
          parts: [{ text: m.content }],
        };
      } else if (m.role === 'model' || m.role === 'assistant') {
        const parts: any[] = [];
        if (m.functionCalls && Array.isArray(m.functionCalls)) {
          for (const call of m.functionCalls) {
            parts.push({ functionCall: call });
          }
        } else if (m.content) {
          parts.push({ text: m.content });
        }
        return {
          role: 'model',
          parts: parts.length > 0 ? parts : [{ text: 'Processing your request.' }],
        };
      } else if (m.role === 'function' || m.role === 'tool') {
        return {
          role: 'tool',
          parts: [
            {
              functionResponse: {
                name: m.name,
                response:
                  typeof m.response === 'object' && m.response !== null
                    ? m.response
                    : { result: m.response || 'ok' },
              },
            },
          ],
        };
      }
      return {
        role: 'user',
        parts: [{ text: String(m.content) }],
      };
    });

    // Call Gemini with tools with automatic model fallback (gemini-3.7-flash -> gemini-3.6-flash -> gemini-3.5-flash-lite)
    const { response, modelUsed } = await generateContentWithFallback(ai, {
      contents: formattedContents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: crudTools }],
      },
    });

    console.info(`[Gemini Chat] Successfully generated response using model: ${modelUsed}`);

    const candidate = response.candidates?.[0];
    const textOutput = response.text || '';
    const functionCalls = candidate?.content?.parts
      ?.filter((p: any) => p.functionCall)
      ?.map((p: any) => p.functionCall);

    return NextResponse.json({
      text: textOutput,
      functionCalls: functionCalls && functionCalls.length > 0 ? functionCalls : null,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error in Gemini Chatbot route:', error);
    return NextResponse.json({ error: error.message || 'Chat request failed.' }, { status: 500 });
  }
}
