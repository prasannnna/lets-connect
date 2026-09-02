import { GoogleGenAI } from '@google/genai';

// Banned patterns for rule-based filter
const ABUSIVE_PATTERNS = [
  /\b(kill\s+yourself|kys|die\s+in\s+a\s+fire|i\s+will\s+kill|slit\s+your)\b/i,
  /\b(threaten|murder|bomb|terrorist|doxx|swat)\b/i,
  /\b(slut|whore|bitch|bastard|faggot|retard|cunt|nigger|nigga|chink)\b/i,
  /\b(idiot\s+prof|corrupt\s+dean|scam\s+faculty)\b/i,
  // Phone number leak attempt detection (e.g. +91 9876543210 or 10-digit Indian numbers)
  /\b(?:\+?91[\-\s]?)?[6-9]\d{9}\b/,
  // Aadhaar/sensitive ID pattern
  /\b\d{4}\s\d{4}\s\d{4}\b/,
];

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY && !geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
}

export async function checkContentSafety(
  title: string | null,
  body: string
): Promise<ModerationResult> {
  const fullText = `${title ? title + ' ' : ''}${body}`;

  // 1. Regex & Pattern Checks
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(fullText)) {
      return {
        isSafe: false,
        reason: 'Content contains prohibited abusive language, threats, or sensitive personal information.',
      };
    }
  }

  // 2. Optional Gemini AI Moderation Layer if API Key is configured
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a strict safety and anti-harassment moderator for an anonymous student mentorship platform called "Let's Connect" at Aditya University.
Analyze the following user-submitted post/reply content for community violations.
Violations include: hate speech, threats of violence, personal attacks/defamation against specific professors or students, doxxing/sharing phone numbers or private records, extreme toxicity, or harassment.
Respond ONLY with a JSON object in this exact format:
{"isSafe": true} or {"isSafe": false, "reason": "brief reason"}

Content to analyze:
"""${fullText.slice(0, 2000)}"""`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed.isSafe === false) {
          return {
            isSafe: false,
            reason: parsed.reason || 'Content violates university community safety guidelines.',
          };
        }
      }
    } catch (err) {
      console.warn('AI moderation check failed, falling back to rule-based engine:', err);
    }
  }

  return { isSafe: true };
}
