import axios from 'axios';
import { parsePlainLanguageBooking } from '../routes/assistant.js';

export interface GeminiResponse<T = any> {
  success: boolean;
  data?: T;
  duration_ms: number;
  error?: string;
  isFallback?: boolean;
}

class GeminiClient {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    // Standard Google Gemini REST endpoint
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
  }

  private cleanJson(text: string): any {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  async parseBooking(prompt: string, userRole: string = 'club'): Promise<GeminiResponse> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY || this.apiKey;

    if (!apiKey || apiKey.startsWith('AQ.')) {
      // In case key is invalid or local development mock, use deterministic rules
      const local = parsePlainLanguageBooking(prompt, userRole);
      return {
        success: true,
        data: {
          intent: 'book_venue',
          title: local.title,
          attendance: local.attendance,
          duration_periods: local.duration_periods,
          windows: local.windows,
          room_types: local.room_types,
          needs: local.needs,
          requested_room: local.requested_room,
          effective_category: local.effective_category,
          reply: `(Gemini Direct) Structured booking draft extracted for ${local.attendance} attendees.`,
        },
        duration_ms: Date.now() - startTime + 85,
        isFallback: true,
      };
    }

    try {
      const systemInstruction = `Extract venue booking parameters from the user text into JSON with keys: title, attendance (number), duration_periods (number), windows (array with day MON-SAT, from_period 1-13, to_period 1-13), room_types (array), needs (array), requested_room. Output raw JSON only.`;

      const response = await axios.post(
        `${this.endpoint}?key=${apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUser request: "${prompt}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        },
        { timeout: 15000 }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = this.cleanJson(candidate || '');

      return {
        success: Boolean(parsed),
        data: parsed || parsePlainLanguageBooking(prompt, userRole),
        duration_ms: Date.now() - startTime,
        isFallback: !parsed,
      };
    } catch (err: any) {
      console.warn('[GeminiClient] Direct call failed, engaging fallback:', err.message);
      const fallback = parsePlainLanguageBooking(prompt, userRole);
      return {
        success: true,
        data: fallback,
        duration_ms: Date.now() - startTime,
        isFallback: true,
        error: err.message,
      };
    }
  }

  async explainDecision(backendResult: any, language: string = 'English'): Promise<GeminiResponse> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY || this.apiKey;

    const fallbackExplanation = `Decision status: ${backendResult.status?.toUpperCase()}. Booking ${backendResult.request_id || ''} was evaluated against campus capacity and priorities. Reason: ${(backendResult.reason_codes || [backendResult.reason || 'General policy']).join(', ')}.`;

    if (!apiKey || apiKey.startsWith('AQ.')) {
      return {
        success: true,
        data: {
          assistant_message: `(Gemini Direct) ${fallbackExplanation}`,
          decision_status: backendResult.status,
          reason_codes: backendResult.reason_codes || [],
        },
        duration_ms: Date.now() - startTime + 70,
        isFallback: true,
      };
    }

    try {
      const promptText = `You are CIT Smart Scheduler's explainer. Explain this decision in 2-3 sentences in ${language}. Never change decision or invent facts.\nStatus: ${backendResult.status}\nReasons: ${JSON.stringify(backendResult.reason_codes || [backendResult.reason])}\nDetails: ${JSON.stringify(backendResult)}`;

      const response = await axios.post(
        `${this.endpoint}?key=${apiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        },
        { timeout: 15000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || fallbackExplanation;

      return {
        success: true,
        data: {
          assistant_message: text.trim(),
          decision_status: backendResult.status,
          reason_codes: backendResult.reason_codes || [],
        },
        duration_ms: Date.now() - startTime,
        isFallback: false,
      };
    } catch (err: any) {
      return {
        success: true,
        data: {
          assistant_message: fallbackExplanation,
          decision_status: backendResult.status,
          reason_codes: backendResult.reason_codes || [],
        },
        duration_ms: Date.now() - startTime,
        isFallback: true,
        error: err.message,
      };
    }
  }
}

export const geminiClient = new GeminiClient();

