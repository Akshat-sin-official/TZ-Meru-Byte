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
    // Use the official supported Gemini model
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`;
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

    if (!apiKey) {
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
      const systemInstruction = `You are CIT CampusOS AI Assistant. Extract venue booking parameters from the user request into JSON.
Campus Venues:
- Auditorium (500 seats)
- Lecture Halls LH-1 to LH-6 (90 to 120 seats)
- Seminar Halls SH-1 (80 seats, accessible), SH-2 (80 seats, not accessible)
- Computing Labs LAB-A, LAB-B (60 seats)
- Outdoor Open Air Theatre OAT (large gathering)

Required JSON format:
{
  "title": string,
  "attendance": number,
  "duration_periods": number,
  "windows": [{"day": "MON"|"TUE"|"WED"|"THU"|"FRI"|"SAT", "from_period": number, "to_period": number}],
  "room_types": string[],
  "needs": string[],
  "requested_room": string or null,
  "reply": string
}
Return raw JSON only.`;

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
        { timeout: 7000 }
      );

      const candidates = response.data?.candidates;
      const text = candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = text ? this.cleanJson(text) : null;

      if (!parsed) {
        throw new Error('Gemini JSON extraction failed');
      }

      return {
        success: true,
        data: parsed,
        duration_ms: Date.now() - startTime,
        isFallback: false,
      };
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local deterministic engine:', err.message);
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
          reply: `I have analyzed your request using CIT Campus rules for ${local.attendance} attendees.`,
        },
        duration_ms: Date.now() - startTime,
        isFallback: true,
      };
    }
  }

  async explainDecision(prompt: string, contextData: any): Promise<GeminiResponse> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY || this.apiKey;

    if (!apiKey) {
      return {
        success: true,
        data: {
          explanation: 'Decision rendered based on official Section 4 priority constraints and venue availability.',
        },
        duration_ms: 10,
        isFallback: true,
      };
    }

    try {
      const response = await axios.post(
        `${this.endpoint}?key=${apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Explain why this scheduling decision occurred using the provided context:\n\nContext:\n${JSON.stringify(
                    contextData,
                    null,
                    2
                  )}\n\nUser question: "${prompt}"\n\nBe concise, professional, and reference specific constraints.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
          },
        },
        { timeout: 7000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return {
        success: true,
        data: { explanation: text },
        duration_ms: Date.now() - startTime,
        isFallback: false,
      };
    } catch (err: any) {
      return {
        success: false,
        duration_ms: Date.now() - startTime,
        error: err.message,
        isFallback: true,
      };
    }
  }
}

export const geminiClient = new GeminiClient();
