import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { isJobAlertSender } from '@/lib/classification';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on server' }, { status: 500 });
  }

  try {
    const { senders, customInstructions } = await req.json();

    if (!Array.isArray(senders) || senders.length === 0) {
      return NextResponse.json({ sendersAnalysis: [] });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare clean summary for Gemini prompt
    const compactList = senders.map((s: any) => ({
      senderKey: s.senderKey,
      fromName: s.fromName,
      fromEmail: s.fromEmail,
      totalEmailsScanned: s.totalEmails,
      unreadCount: s.unreadCount,
      latestSubject: s.sampleSubject,
      snippet: s.sampleSnippet,
    }));

    const userCustomSection = customInstructions && typeof customInstructions === 'string' && customInstructions.trim().length > 0
      ? `\n\n=== USER CUSTOM FILTERING INSTRUCTIONS & OVERRIDES (STRICTLY ENFORCE) ===\n${customInstructions.trim()}\n===================================================================\n`
      : '';

    const prompt = `Analyze these recurring subscription senders found in a user's Gmail inbox. The user wants to unsubscribe from newsletters, marketing promos, and low-engagement emails they haven't opened in a long time.
${userCustomSection}
CRITICAL FEATURE - JOB ALERTS FILTERING:
If a sender is sending job alerts, recruitment notifications, hiring recommendations, interview invites, career updates, or job board matches (e.g. LinkedIn Jobs, Indeed, Glassdoor, ZipRecruiter, Greenhouse, Lever, Workday, Google Careers, Handshake, Hired, Wellfound/AngelList, Dice, company hiring alerts, or job opportunity digests):
- Set "isJobRelated": true
- Set "category": "Job Alerts & Careers"
- Set "unsubscribePriority": "low" (do NOT recommend unsubscribing from job alerts!)
- Set "recommendationScore": a low score between 1 and 25
- Set "safetyWarning": "Job Alert / Career Notification - Keep to stay updated on job opportunities."
- Set "isSensitive": true

Evaluate each sender and provide:
1. "unsubscribePriority": "high" (definitely safe & recommended to unsubscribe, e.g. unread promotional spam/newsletters), "medium" (moderate priority), or "low" (keep or exercise caution, e.g. receipt, security alert, active subscription, job alert).
2. "recommendationScore": integer from 1 to 100 (higher score = stronger recommendation to unsubscribe).
3. "category": a concise 2-3 word tag (e.g. "Job Alerts & Careers", "E-Commerce Deals", "Tech Digest", "Social Digest", "SaaS Marketing", "Financial Alert", "Travel Offers").
4. "summary": a clear, 1-sentence description of what this sender sends.
5. "safetyWarning": null if safe to unsubscribe. If the sender is a job alert or contains critical receipts, invoices, bank alerts, or account security codes, provide a short 1-sentence warning explaining why caution is advised.
6. "isSensitive": boolean (true if safetyWarning is present or sender is job related).
7. "isJobRelated": boolean (true if sender sends job alerts or recruitment notifications).

Senders list:
${JSON.stringify(compactList, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sendersAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  senderKey: { type: Type.STRING },
                  unsubscribePriority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                  recommendationScore: { type: Type.INTEGER },
                  category: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  safetyWarning: { type: Type.STRING, nullable: true },
                  isSensitive: { type: Type.BOOLEAN },
                  isJobRelated: { type: Type.BOOLEAN },
                },
                required: ['senderKey', 'unsubscribePriority', 'recommendationScore', 'category', 'summary', 'isSensitive', 'isJobRelated'],
              },
            },
          },
          required: ['sendersAnalysis'],
        },
      },
    });

    const parsedText = response.text || '{}';
    const jsonResult = JSON.parse(parsedText);

    // Strict Post-Processing Safety Guarantee: Never allow job alerts to be marked as High or Medium priority
    const originalSenderMap = new Map(compactList.map((s: any) => [s.senderKey, s]));

    const sanitizedAnalysis = (jsonResult.sendersAnalysis || []).map((item: any) => {
      const orig = originalSenderMap.get(item.senderKey) || {};
      const isJob =
        item.isJobRelated ||
        item.category?.toLowerCase().includes('job') ||
        item.category?.toLowerCase().includes('career') ||
        item.summary?.toLowerCase().includes('job') ||
        item.summary?.toLowerCase().includes('recruiter') ||
        item.summary?.toLowerCase().includes('hiring') ||
        (orig.fromEmail && isJobAlertSender(orig)) ||
        (orig.senderKey && isJobAlertSender({ senderKey: orig.senderKey, fromName: orig.fromName, sampleSubject: orig.latestSubject, sampleSnippet: orig.snippet }));

      if (isJob) {
        return {
          ...item,
          isJobRelated: true,
          isSensitive: true,
          category: 'Job Alerts & Careers',
          unsubscribePriority: 'low', // GUARANTEED LOW PRIORITY
          recommendationScore: Math.min(item.recommendationScore || 15, 20),
          safetyWarning: item.safetyWarning || 'Job Alert / Career Notification - AI protected to preserve job opportunities.',
        };
      }

      return item;
    });

    return NextResponse.json({ sendersAnalysis: sanitizedAnalysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI Analysis failed' }, { status: 500 });
  }
}
