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

export interface DraftEmailResponse {
  drafts: Array<{
    heading: string;
    body: string;
  }>;
}

export async function fetchDraftEmails(sessionId: number): Promise<DraftEmailResponse> {
  return request<DraftEmailResponse>(`/sessions/${sessionId}/draft-emails`);
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

export interface ChecklistRequest {
  location?: string;
  relationship?: string;
  additional_context?: string;
}

export interface ChecklistResponse {
  checklist: any;
  message: string;
}

export async function generateChecklist(
  sessionId: number,
  data: ChecklistRequest = {},
): Promise<ChecklistResponse> {
  return request<ChecklistResponse>(`/sessions/${sessionId}/generate-checklist`, {
    method: "POST",
    body: JSON.stringify({
      location: data.location || "UK",
      relationship: data.relationship || "Family member",
      additional_context: data.additional_context || "",
    }),
  });
}

export interface ComputationRequest {
  user_data: any;
  task_data: any;
}

export interface ComputationResponse {
  results: Array<{ id: string; body: string }>;
  message: string;
}

export async function runComputations(
  sessionId: number,
  data: ComputationRequest,
): Promise<ComputationResponse> {
  return request<ComputationResponse>(`/sessions/${sessionId}/compute`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface FinancialAssessmentResponse {
  needs_probate_check: boolean;
  needs_iht_calculation: boolean;
  needs_estate_valuation: boolean;
  message: string;
  next_steps: string[];
}

export async function getFinancialAssessment(
  sessionId: number,
): Promise<FinancialAssessmentResponse> {
  return request<FinancialAssessmentResponse>(`/sessions/${sessionId}/financial-assessment`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export interface TaskStatus {
  status: "completed" | "in_progress" | "pending";
  updated_at: string;
  results: any;
}

export interface TaskStatusesResponse {
  session_id: number;
  task_statuses: Record<string, TaskStatus>;
}

export async function getTaskStatuses(
  sessionId: number,
): Promise<TaskStatusesResponse> {
  return request<TaskStatusesResponse>(`/sessions/${sessionId}/task-statuses`);
}

export interface FuneralSearchRequest {
  location: string;
}

export interface FuneralSearchResponse {
  cremation: {
    price_range: string | null;
    summary: Array<{
      name: string;
      price: string | null;
      rating: number | null;
      location: string;
      link: string;
    }>;
  };
  burial: {
    price_range: string | null;
    summary: Array<{
      name: string;
      price: string | null;
      rating: number | null;
      location: string;
      link: string;
    }>;
  };
  woodland: {
    price_range: string | null;
    summary: Array<{
      name: string;
      price: string | null;
      rating: number | null;
      location: string;
      link: string;
    }>;
  };
  metadata: {
    query_location: string;
    search_timestamp: string;
    currency: string | null;
    notes: string | null;
  };
}

export async function searchFuneralHomes(
  sessionId: number,
  data: FuneralSearchRequest,
): Promise<FuneralSearchResponse> {
  return request<FuneralSearchResponse>(`/sessions/${sessionId}/search-funeral`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
