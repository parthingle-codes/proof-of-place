export const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Furniture",
  "Classroom equipment",
  "Cleaning and waste",
  "Drainage",
  "Building infrastructure",
  "Other or uncertain",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Analysis {
  category: Category;
  issue_title: string;
  problem_summary: string;
  observed_facts: string[];
  user_reported_details: string[];
  suggested_follow_up_questions: string[];
  missing_information: string[];
  hypotheses: string[];
  suggested_next_action: string;
  urgency_indicators: string[];
  uncertainties: string[];
}

export interface ComplaintInput {
  description: string;
  location: string;
  category: string;
  context: string;
}

export interface AnalyzeResponse {
  sample: boolean;
  model?: string;
  latency_ms?: number;
  source?: string;
  input: ComplaintInput;
  analysis: Analysis;
}

export interface Answer {
  question: string;
  answer: string;
}

export interface Ticket {
  issue_title: string;
  category: string;
  original_description: string;
  problem_summary: string;
  location: string;
  context: string;
  observed_from_photo: string[];
  reported_by_user: string[];
  follow_up_answers: { question: string; answer: string; answered: boolean }[];
  open_questions: string[];
  missing_information: string[];
  hypotheses: string[];
  suggested_next_action: string;
  urgency_indicators: string[];
  uncertainties: string[];
  provenance: {
    prepared_in: string;
    model: string;
    sample?: boolean;
    generated_note: string;
    submitted: boolean;
    received_by_college_staff: boolean;
    handoff_status: string;
  };
  generated_at: string;
}

export interface Health {
  ok: boolean;
  mode: "live" | "demo";
  model: string;
  message: string;
  kind?: string;
  categories: string[];
  privacy: string;
}

/** Campus Maintenance Desk - DEMONSTRATION queue (never a real college system). */
export interface QueueEntry {
  queue_id: number;
  added_at: string;
  demo: boolean;
  real_system: boolean;
  received_by_college_staff: boolean;
  status: string;
  issue_title: string;
  category: string;
  location: string;
  ticket: Ticket;
}

export interface QueueResponse {
  entry: QueueEntry;
  queue_size: number;
  demo: boolean;
  real_system: boolean;
  notice: string;
}

export interface QueueListResponse {
  demo: boolean;
  real_system: boolean;
  notice: string;
  queue_size: number;
  entries: QueueEntry[];
}
