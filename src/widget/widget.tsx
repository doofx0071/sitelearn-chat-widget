import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from 'react';
import type { Message, WidgetConfig, Citation, FeedbackRating } from './types';
import {
  streamMessage,
  submitFeedback,
  requestHandoff,
  ApiError,
} from './api';

// ─── SVG icon atoms ───────────────────────────

const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="20" height="20">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconThumbUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);

const IconThumbDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
  </svg>
);

const IconDocument = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const IconHandoff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconMinimise = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="16" height="16">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ─── Utility ──────────────────────────────────

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────

interface CitationsProps {
  items: Citation[];
}

const Citations: React.FC<CitationsProps> = ({ items }) => {
  if (!items.length) return null;
  return (
    <div className="sl-citations">
      {items.map((c) => (
        <a
          key={c.id}
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="sl-citation"
        >
          <span className="sl-citation__icon">
            <IconDocument />
          </span>
          <span className="sl-citation__body">
            <span className="sl-citation__title">{c.title}</span>
            {c.excerpt && (
              <span className="sl-citation__excerpt">{c.excerpt}</span>
            )}
          </span>
        </a>
      ))}
    </div>
  );
};

interface FeedbackBarProps {
  messageId: string;
  currentFeedback?: FeedbackRating;
  onFeedback: (messageId: string, rating: FeedbackRating) => void;
}

const FeedbackBar: React.FC<FeedbackBarProps> = ({
  messageId,
  currentFeedback,
  onFeedback,
}) => (
  <div className="sl-feedback">
    <span className="sl-feedback__label">Helpful?</span>
    <button
      className={`sl-feedback__btn ${
        currentFeedback === 'up' ? 'sl-feedback__btn--active-up' : ''
      }`}
      title="Helpful"
      aria-label="Mark as helpful"
      onClick={() => onFeedback(messageId, 'up')}
    >
      <IconThumbUp />
    </button>
    <button
      className={`sl-feedback__btn ${
        currentFeedback === 'down' ? 'sl-feedback__btn--active-down' : ''
      }`}
      title="Not helpful"
      aria-label="Mark as not helpful"
      onClick={() => onFeedback(messageId, 'down')}
    >
      <IconThumbDown />
    </button>
  </div>
);

interface TypingIndicatorProps {}

const TypingIndicator: React.FC<TypingIndicatorProps> = () => (
  <div className="sl-msg sl-msg--assistant" aria-label="Bot is typing">
    <div className="sl-typing">
      <div className="sl-dot" />
      <div className="sl-dot" />
      <div className="sl-dot" />
    </div>
  </div>
);

// ─── Message bubble ───────────────────────────

interface MessageBubbleProps {
  message: Message;
  onFeedback: (messageId: string, rating: FeedbackRating) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFeedback }) => (
  <div
    className={`sl-msg sl-msg--${message.role}`}
    data-message-id={message.id}
  >
    <div className={`sl-bubble${message.error ? ' sl-bubble--error' : ''}`}>
      {message.content}
      {message.isStreaming && <span className="sl-cursor" aria-hidden="true" />}
    </div>
    {message.citations && message.citations.length > 0 && (
      <Citations items={message.citations} />
    )}
    {message.role === 'assistant' && !message.isStreaming && (
      <FeedbackBar
        messageId={message.id}
        currentFeedback={message.feedback?.rating}
        onFeedback={onFeedback}
      />
    )}
    <time className="sl-msg__time" dateTime={message.timestamp}>
      {formatTime(message.timestamp)}
    </time>
  </div>
);

// ─── Main Widget ──────────────────────────────

export interface WidgetProps extends WidgetConfig {}

const Widget: React.FC<WidgetProps> = ({
  botId,
  primaryColor,
  position,
  welcomeMessage,
  apiEndpoint,
  botName = 'SiteLearn AI',
  botAvatar,
  autoOpen = false,
  zIndex = 9999,
}) => {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uid());
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const labelId = useId();

  // Inject welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0 && welcomeMessage) {
      setMessages([
        {
          id: uid(),
          role: 'system',
          content: welcomeMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-grow textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    setInputValue(el.value);
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  // Apply dynamic primary color via inline CSS custom properties
  const cssVars: React.CSSProperties = primaryColor
    ? ({
        '--sl-primary': primaryColor,
        '--sl-primary-dark': primaryColor,
        '--sl-primary-light': primaryColor,
        zIndex,
      } as React.CSSProperties)
    : { zIndex };

  // ── Send logic ────────────────────────────

  const sendCurrentMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setErrorBanner(null);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const streamingId = uid();
    const streamingMsg: Message = {
      id: streamingId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, streamingMsg]);
    setIsLoading(true);

    abortRef.current = new AbortController();

    await streamMessage(
      apiEndpoint,
      botId,
      sessionId,
      text,
      typeof window !== 'undefined' ? window.location.href : '',
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? {
                  ...m,
                  content: m.content + chunk.delta,
                  citations: chunk.citations ?? m.citations,
                }
              : m,
          ),
        );
      },
      (err) => {
        const msg =
          err instanceof ApiError && err.retryable
            ? 'Something went wrong — please try again.'
            : err.message || 'Unable to get a response right now.';
        setErrorBanner(msg);
        // Mark streaming message as error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? {
                  ...m,
                  isStreaming: false,
                  error: true,
                  content: m.content || msg,
                }
              : m,
          ),
        );
      },
      abortRef.current.signal,
    );

    // Finalise streaming state
    setMessages((prev) =>
      prev.map((m) =>
        m.id === streamingId ? { ...m, isStreaming: false } : m,
      ),
    );
    setIsLoading(false);

    if (!isOpen) setUnreadCount((n) => n + 1);
  }, [inputValue, isLoading, apiEndpoint, botId, sessionId, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCurrentMessage();
    }
  };

  // ── Feedback ──────────────────────────────

  const handleFeedback = useCallback(
    async (messageId: string, rating: FeedbackRating) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                feedback: {
                  rating,
                  submittedAt: new Date().toISOString(),
                },
              }
            : m,
        ),
      );
      try {
        await submitFeedback(apiEndpoint, botId, messageId, rating);
      } catch {
        // fail silently — feedback is best-effort
      }
    },
    [apiEndpoint, botId],
  );

  // ── Handoff ───────────────────────────────

  const handleHandoff = useCallback(async () => {
    setIsLoading(true);
    try {
      const { message } = await requestHandoff(
        apiEndpoint,
        botId,
        sessionId,
        messages,
      );
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'system',
          content: message || "You've been connected to a human agent.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setErrorBanner('Unable to connect to a human agent right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, botId, sessionId, messages]);

  // ── Toggle ────────────────────────────────

  const toggle = () => setIsOpen((v) => !v);

  // ── Render ────────────────────────────────

  const isLeft = position?.side === 'left';

  return (
    <div style={cssVars}>
      {/* ── Trigger bubble ── */}
      <button
        className={`sl-trigger ${isLeft ? 'sl-trigger--left' : ''} ${
          isOpen ? 'sl-trigger--open' : ''
        }`}
        onClick={toggle}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
        aria-controls="sl-chat-window"
        style={{ bottom: position?.bottom ?? 24 }}
      >
        <span className="sl-trigger__icon sl-trigger__icon--chat">
          <IconChat />
        </span>
        <span className="sl-trigger__icon sl-trigger__icon--close">
          <IconClose />
        </span>
        {unreadCount > 0 && !isOpen && (
          <span className="sl-trigger__badge" aria-label={`${unreadCount} new messages`}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* ── Chat window ── */}
      <div
        id="sl-chat-window"
        role="dialog"
        aria-labelledby={labelId}
        aria-modal="false"
        className={`sl-window ${isLeft ? 'sl-window--left' : ''} ${
          isOpen ? 'sl-window--open' : ''
        }`}
        style={{ bottom: (position?.bottom ?? 24) + 72 }}
      >
        {/* Header */}
        <header className="sl-header">
          <div className="sl-header__avatar" aria-hidden="true">
            {botAvatar ? (
              <img src={botAvatar} alt="" width={40} height={40} />
            ) : (
              '✦'
            )}
          </div>
          <div className="sl-header__info">
            <p id={labelId} className="sl-header__name">{botName}</p>
            <p className="sl-header__status">Online</p>
          </div>
          <div className="sl-header__actions">
            <button
              className="sl-header__btn"
              onClick={() => setIsOpen(false)}
              aria-label="Minimise chat"
              title="Minimise"
            >
              <IconMinimise />
            </button>
          </div>
        </header>

        {/* Error banner */}
        {errorBanner && (
          <div className="sl-error-banner" role="alert">
            <IconWarning />
            {errorBanner}
          </div>
        )}

        {/* Messages */}
        <main
          className="sl-messages"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onFeedback={handleFeedback}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <TypingIndicator />
          )}
          <div ref={messagesEndRef} aria-hidden="true" />
        </main>

        {/* Input */}
        <div className="sl-inputbar">
          <label htmlFor="sl-input" className="sl-sr-only">
            Message {botName}
          </label>
          <textarea
            id="sl-input"
            ref={textareaRef}
            className="sl-textarea"
            rows={1}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            disabled={isLoading}
            aria-disabled={isLoading}
          />
          <button
            className="sl-send"
            onClick={sendCurrentMessage}
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
            title="Send (Enter)"
          >
            <IconSend />
          </button>
        </div>

        {/* Footer */}
        <footer className="sl-footer">
          <button
            className="sl-handoff-btn"
            onClick={handleHandoff}
            disabled={isLoading}
            title="Talk to a human agent"
          >
            <IconHandoff />
            Talk to a person
          </button>
          <a
            href="https://sitelearn.io"
            target="_blank"
            rel="noopener noreferrer"
            className="sl-powered"
            tabIndex={-1}
          >
            by <span>SiteLearn</span>
          </a>
        </footer>
      </div>

      {/* Visually hidden utility class */}
      <style>{`.sl-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}`}</style>
    </div>
  );
};

export default Widget;
