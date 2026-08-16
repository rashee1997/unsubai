import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, generateContentWithFallback } from '@/lib/gemini';

// Banned AI phrases and cliches
const BANNED_AI_WORDS = [
  'delve', 'tapestry', 'testament', 'beacon', 'moreover', 'furthermore',
  'in conclusion', 'in summary', 'paradigm', 'leverage', 'utilize', 'synergy',
  'seamlessly', 'holistic', 'game-changing', 'crucial', 'pivotal', 'plethora',
  'navigate the complexities', 'I hope this email finds you well',
  'hope this finds you well', "hope you're doing well",
  'please do not hesitate to reach out', "please don't hesitate to reach out",
  'feel free to reach out', 'in today\'s fast-paced world', 'just touching base',
  'it is important to note', 'it is worth noting'
];

interface ComposeRequest {
  type: 'new' | 'reply' | 'humanize';
  prompt?: string;
  originalEmail?: {
    from?: string;
    subject?: string;
    body?: string;
    date?: string;
  };
  draftToHumanize?: string;
  tone?: 'direct' | 'warm' | 'casual' | 'polite_decline' | 'detailed';
  length?: 'short' | 'medium' | 'detailed';
  senderName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ComposeRequest = await req.json();
    const { type, prompt, originalEmail, draftToHumanize, tone = 'direct', length = 'short', senderName = 'Me' } = body;

    let systemInstruction = `You are an elite, natural human email writer. Your job is to draft or refine emails that sound genuinely human, authentic, and direct.

CRITICAL ANTI-AI WRITING RULES (YOU MUST ADHERE TO ALL OF THESE):
1. BURSTINESS (Vary sentence structure & length):
   - Mix short, punchy statements (3-7 words) with occasional medium/longer sentences (12-20 words).
   - Never write 3 consecutive sentences of identical length.
   - Do NOT use monotonous rhythmic cadence.

2. HIGH PERPLEXITY & NATURAL VOCABULARY:
   - Use concrete, simple, everyday English.
   - Use natural contractions freely (I'm, don't, won't, we've, let's, it's).
   - Write like a thoughtful human typing to a colleague or friend over coffee.

3. STRICTLY BANNED PHRASES & CLICHES (DO NOT USE ANY OF THESE UNDER ANY CIRCUMSTANCES):
   - NO opening throat-clearing like "I hope this email finds you well", "Hope you are having a great week", "I am writing to...", "I wanted to reach out regarding...".
   - NO closing clichés like "Please don't hesitate to reach out", "Feel free to let me know", "Best regards for your future endeavors".
   - NO robotic buzzwords: delve, tapestry, testament, beacon, moreover, furthermore, in conclusion, leverage, utilize, synergy, seamlessly, holistic, game-changing, pivotal, crucial, plethora, navigate the complexities.
   - NO fake contrast formulas ("It's not just about X, it's about Y").
   - NO unprompted bulleted lists for simple messages. Keep it conversational paragraphs unless specifically requested as a list.

4. TONE & LENGTH ADAPTATION:
   - "direct": 2-4 sentences max. Gets straight to the point without fluff. Clean, confident.
   - "warm": Friendly, professional, collaborative, personable.
   - "casual": Relaxed peer-to-peer tone, natural conversational flow.
   - "polite_decline": Sets clear, firm boundaries politely without over-apologizing or making up excuses.
   - "detailed": Thorough and structured, but still written in authentic human prose.
`;

    let userPrompt = '';

    if (type === 'humanize') {
      userPrompt = `Please humanize and rewrite the following email draft. Strip out all robotic AI cadence, corporate fluff, buzzwords, and throat-clearing. Keep the core intent and facts, but make it read like a real human wrote it.

Draft to Humanize:
"""
${draftToHumanize || prompt || ''}
"""

Tone: ${tone}
Requested Length: ${length}
Sender Sign-off Name: ${senderName || 'Me'}`;
    } else if (type === 'reply') {
      userPrompt = `You are replying to the following email thread:

From: ${originalEmail?.from || 'Sender'}
Subject: ${originalEmail?.subject || 'Re:'}
Date: ${originalEmail?.date || ''}
Original Message:
"""
${originalEmail?.body || ''}
"""

User Instructions / Reply Intent:
"""
${prompt || 'Acknowledge, answer clearly, and propose next steps.'}
"""

Tone: ${tone}
Requested Length: ${length}
Sender Sign-off Name: ${senderName || 'Me'}

Draft a natural, direct reply. Start right with the response (e.g., "Thanks for sending this over," or answer the question directly).`;
    } else {
      userPrompt = `Write a fresh email based on the following notes / prompt:

Prompt:
"""
${prompt || 'Quick update on project status.'}
"""

Tone: ${tone}
Requested Length: ${length}
Sender Sign-off Name: ${senderName || 'Me'}

Provide a clean Subject line and the Email Body.`;
    }

    try {
      const ai = getGeminiClient();
      const result = await generateContentWithFallback(ai, {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
          }
        ],
        config: {
          temperature: 0.75, // Higher temperature for more creative human perplexity
          topP: 0.95,
        }
      });

      const responseText = result.response?.text || '';
      
      // Parse subject and body if generated as new email
      let subject = '';
      let bodyText = responseText;

      const subjectMatch = responseText.match(/^Subject:\s*(.+)$/im);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        bodyText = responseText.replace(/^Subject:\s*.+$/im, '').trim();
      }

      let finalSubject = subject;
      if (!finalSubject) {
        if (originalEmail && originalEmail.subject) {
          finalSubject = originalEmail.subject.startsWith('Re:')
            ? originalEmail.subject
            : `Re: ${originalEmail.subject}`;
        } else {
          finalSubject = 'Update';
        }
      }

      return NextResponse.json({
        success: true,
        subject: finalSubject,
        body: bodyText,
        modelUsed: result.modelUsed,
      });
    } catch (genError: any) {
      console.warn('Gemini generation error, falling back to rule-based humanizer:', genError?.message);

      // Fallback humanizer if API key is not yet set or in offline demo
      let fallbackText = '';
      if (type === 'reply') {
        fallbackText = `Hi ${originalEmail?.from?.split('<')[0]?.trim() || 'there'},\n\nThanks for reaching out. ${prompt || "Got your note and I'm looking into this."}\n\nI'll follow up shortly once I have an update.\n\nBest,\n${senderName}`;
      } else if (type === 'humanize') {
        let cleaned = (draftToHumanize || prompt || '')
          .replace(/I hope this email finds you well[,.]?/gi, '')
          .replace(/Please do not hesitate to reach out[,.]?/gi, 'Let me know if you need anything else.')
          .replace(/feel free to contact me/gi, 'let me know')
          .replace(/furthermore|moreover|in essence/gi, 'also')
          .replace(/utilize|leverage/gi, 'use')
          .trim();
        fallbackText = cleaned;
      } else {
        fallbackText = `Hi there,\n\n${prompt || 'Quick update regarding our latest discussion.'}\n\nLet me know what works for you.\n\nBest,\n${senderName}`;
      }

      return NextResponse.json({
        success: true,
        subject: originalEmail?.subject ? `Re: ${originalEmail.subject}` : 'Quick update',
        body: fallbackText,
        modelUsed: 'rule-based-fallback',
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate email' },
      { status: 500 }
    );
  }
}
