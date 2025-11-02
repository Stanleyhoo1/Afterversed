import { API_BASE_URL } from "./config";

interface FetchOptions extends RequestInit {
  parseJson?: boolean;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { parseJson = true, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (!parseJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface SessionCreateResponse {
  session_id: number;
}

export interface SurveyPayload {
  answers: Record<string, string | string[]>;
  timestamp?: string;
  [key: string]: unknown;
}

export interface SessionDetailResponse {
  session_id: number;
  survey_data: SurveyPayload | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export async function createSurveySession(): Promise<SessionCreateResponse> {
  return request<SessionCreateResponse>("/sessions", { method: "POST" });
}

export async function fetchSurveySession(
  sessionId: number,
): Promise<SessionDetailResponse> {
  return request<SessionDetailResponse>(`/sessions/${sessionId}`);
}

export async function submitSurveyResults(
  sessionId: number,
  payload: SurveyPayload,
): Promise<SessionDetailResponse> {
  return request<SessionDetailResponse>(`/sessions/${sessionId}/survey`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
