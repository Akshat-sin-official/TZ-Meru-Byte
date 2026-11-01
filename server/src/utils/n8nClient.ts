import axios, { AxiosInstance, AxiosError } from 'axios';

export interface UserContext {
  id: string;
  email?: string;
  name?: string;
  role: string;
  department?: string | null;
  facultyId?: string | null;
  clubName?: string | null;
}

export interface WF01BookingIntakePayload {
  message: string;
  timezone?: string;
  current_date?: string;
  conversation_id?: string;
  user_context?: UserContext;
  previous_booking_draft?: Record<string, any> | null;
}

export interface WF02ScheduleChangePayload {
  message: string;
  timezone?: string;
  current_date?: string;
  conversation_id?: string;
  user_context?: UserContext;
}

export interface WF03DecisionExplainerPayload {
  backend_result: {
    status: string;
    reason_codes?: string[];
    reason_code?: string;
    request_id?: string;
    title?: string;
    venue?: string | null;
    requested_slot?: string | null;
    attendance?: number | null;
    conflict_details?: string | null;
    alternatives?: any;
    [key: string]: any;
  };
  language?: 'English' | 'Hindi' | 'Hinglish' | string;
}

export interface N8nClientResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  status?: number;
  fallbackAvailable?: boolean;
  duration_ms?: number;
}

class N8nClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private secret: string;

  constructor() {
    this.baseUrl = (process.env.N8N_BASE_URL || 'https://techzephyr.app.n8n.cloud').replace(/\/+$/, '');
    this.secret = process.env.N8N_WEBHOOK_SECRET || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 25000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.secret ? { 'x-cit-webhook-secret': this.secret } : {}),
      },
    });

    // Request interceptor: sanitize any sensitive tokens before dispatching
    this.client.interceptors.request.use((config) => {
      // Ensure header secret is present if dynamically updated
      const activeSecret = process.env.N8N_WEBHOOK_SECRET || this.secret;
      if (activeSecret && config.headers) {
        config.headers['x-cit-webhook-secret'] = activeSecret;
      }

      // Safe debug log: log path and outgoing keys without logging sensitive secrets or full payload
      const maskedUrl = (config.url || '').replace(/secret=([^&]+)/gi, 'secret=***');
      console.log(`[n8nClient] Outgoing POST -> ${config.baseURL}/${maskedUrl}`);
      return config;
    });

    // Response interceptor: handle logging without leaking secrets
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Redact any auth secret that might appear in URL or config
        if (error.config?.headers) {
          if (error.config.headers['x-cit-webhook-secret']) {
            error.config.headers['x-cit-webhook-secret'] = '***REDACTED***';
          }
          if (error.config.headers['Authorization']) {
            error.config.headers['Authorization'] = '***REDACTED***';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private normalizePath(path: string): string {
    const cleanPath = path.replace(/^\/+/, '');
    // If path already starts with webhook/ or webhook-test/, preserve it; otherwise prepend webhook/
    if (cleanPath.startsWith('webhook/') || cleanPath.startsWith('webhook-test/')) {
      return `/${cleanPath}`;
    }
    return `/webhook/${cleanPath}`;
  }

  private handleError(error: any, workflowName: string): N8nClientResponse {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data: any = error.response?.data;
      const responseError = data?.error || data?.message || error.message;

      console.error(`[n8nClient] ${workflowName} failed with HTTP ${status || 'NETWORK_ERROR'}: ${responseError}`);

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          success: false,
          errorCode: 'AI_TIMEOUT',
          error: 'AI workflow timed out after 25s. Deterministic local fallback is active.',
          status: 504,
          fallbackAvailable: true,
        };
      }

      if (status === 401 || status === 403) {
        return {
          success: false,
          errorCode: 'N8N_AUTH_FAILED',
          error: 'n8n webhook authentication rejected. Please check N8N_WEBHOOK_SECRET.',
          status,
          fallbackAvailable: true,
        };
      }

      if (status === 404) {
        return {
          success: false,
          errorCode: 'N8N_WORKFLOW_INACTIVE',
          error: 'n8n webhook not found or workflow is inactive. Please ensure workflow is toggled to Active (ON) in n8n Cloud.',
          status: 404,
          fallbackAvailable: true,
        };
      }

      if (status === 400) {
        return {
          success: false,
          errorCode: 'INVALID_AI_INPUT',
          error: responseError || 'Invalid input to AI workflow.',
          status: 400,
          data,
          fallbackAvailable: true,
        };
      }

      return {
        success: false,
        errorCode: 'N8N_SERVER_ERROR',
        error: responseError || 'n8n upstream error occurred.',
        status: status || 502,
        data,
        fallbackAvailable: true,
      };
    }

    console.error(`[n8nClient] ${workflowName} unexpected error:`, error?.message || error);
    return {
      success: false,
      errorCode: 'UNKNOWN_ERROR',
      error: error?.message || 'Unexpected failure while communicating with AI workflow.',
      status: 500,
      fallbackAvailable: true,
    };
  }

  /**
   * WF01: Booking Intake
   * Production Path: /webhook/cit/ai/booking-intake
   */
  async callBookingIntake(payload: WF01BookingIntakePayload): Promise<N8nClientResponse> {
    const rawPath = process.env.N8N_WF01_PATH || 'cit/ai/booking-intake';
    const path = this.normalizePath(rawPath);
    const startTime = Date.now();

    try {
      const response = await this.client.post(path, payload);
      return {
        success: true,
        status: response.status,
        data: response.data,
        duration_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      const res = this.handleError(err, 'WF01_BookingIntake');
      res.duration_ms = Date.now() - startTime;
      return res;
    }
  }

  /**
   * WF02: Schedule Change
   * Production Path: /webhook/cit/ai/schedule-change
   */
  async callScheduleChange(payload: WF02ScheduleChangePayload): Promise<N8nClientResponse> {
    const rawPath = process.env.N8N_WF02_PATH || 'cit/ai/schedule-change';
    const path = this.normalizePath(rawPath);
    const startTime = Date.now();

    try {
      const response = await this.client.post(path, payload);
      return {
        success: true,
        status: response.status,
        data: response.data,
        duration_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      const res = this.handleError(err, 'WF02_ScheduleChange');
      res.duration_ms = Date.now() - startTime;
      return res;
    }
  }

  /**
   * WF03: Decision Explainer
   * Production Path: /webhook/cit/ai/explain-decision (fallback to cit/ai/decision-explainer if needed)
   */
  async callDecisionExplainer(payload: WF03DecisionExplainerPayload): Promise<N8nClientResponse> {
    const rawPath = process.env.N8N_WF03_PATH || 'cit/ai/explain-decision';
    const path = this.normalizePath(rawPath);
    const startTime = Date.now();

    try {
      const response = await this.client.post(path, payload);
      return {
        success: true,
        status: response.status,
        data: response.data,
        duration_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      // If 404 and configured as explain-decision, attempt fallback to decision-explainer
      if (axios.isAxiosError(err) && err.response?.status === 404 && rawPath.includes('explain-decision')) {
        try {
          console.warn('[n8nClient] Retrying WF03 with alternate path: cit/ai/decision-explainer');
          const altPath = this.normalizePath('cit/ai/decision-explainer');
          const altResponse = await this.client.post(altPath, payload);
          return {
            success: true,
            status: altResponse.status,
            data: altResponse.data,
            duration_ms: Date.now() - startTime,
          };
        } catch (retryErr: any) {
          const res = this.handleError(retryErr, 'WF03_DecisionExplainer');
          res.duration_ms = Date.now() - startTime;
          return res;
        }
      }
      const res = this.handleError(err, 'WF03_DecisionExplainer');
      res.duration_ms = Date.now() - startTime;
      return res;
    }
  }
}

export const n8nClient = new N8nClient();

