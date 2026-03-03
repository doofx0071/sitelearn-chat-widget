// ─────────────────────────────────────────────
//  SiteLearn Chat Widget — Types
// ─────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';
export type FeedbackRating = 'up' | 'down';

export interface Citation {
  id: string;
  title: string;
  url: string;
  excerpt?: string;
  pageNumber?: number;
}

export interface Feedback {
  rating: FeedbackRating;
  note?: string;
  submittedAt: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  feedback?: Feedback;
  isStreaming?: boolean;
  timestamp: string;
  error?: boolean;
}

export interface WidgetPosition {
  side: 'left' | 'right';
  bottom?: number;
}

export interface WidgetConfig {
  /** Bot identifier — used to scope the API call */
  botId: string;
  /** Hex color or CSS variable for primary accent */
  primaryColor: string;
  /** Widget anchor position */
  position: WidgetPosition;
  /** First message shown to the user */
  welcomeMessage: string;
  /** Base URL for the SiteLearn chat API */
  apiEndpoint: string;
  /** Optional public bot key used to bypass strict origin checks */
  apiKey?: string;
  /** Optional label shown in the chat header */
  botName?: string;
  /** Optional avatar URL for the bot */
  botAvatar?: string;
  /** Header font style */
  headerFont?: 'editorial' | 'modern' | 'classic' | 'minimal';
  /** Avatar style when no botAvatar URL is provided */
  avatarStyle?: 'sparkle' | 'bot' | 'chat' | 'initial';
  /** When true the widget opens on page load */
  autoOpen?: boolean;
  /** Z-index for the widget container */
  zIndex?: number;
}

// ─── API shapes ───────────────────────────────

export interface SendMessagePayload {
  sessionId: string;
  message: string;
  pageUrl: string;
  botId: string;
}

export interface StreamChunk {
  delta: string;
  citations?: Citation[];
  done: boolean;
}

export interface FeedbackPayload {
  messageId: string;
  rating: FeedbackRating;
  note?: string;
}

export interface HandoffPayload {
  sessionId: string;
  botId: string;
  transcript: Message[];
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}
