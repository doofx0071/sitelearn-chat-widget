import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import type { Message, WidgetConfig, Citation, FeedbackRating } from './types';
import {
  streamMessage,
  submitFeedback,
  ApiError,
} from './api';

// ─── SVG icon atoms ───────────────────────────

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconLoader = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="18" height="18" className="sl-icon-spin">
    <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
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

const IconBotAvatar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect x="4" y="8" width="16" height="11" rx="3" />
    <circle cx="9" cy="13.5" r="1" />
    <circle cx="15" cy="13.5" r="1" />
    <path d="M12 8V5" />
    <circle cx="12" cy="4" r="1" />
  </svg>
);

const IconChatAvatar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5A8.4 8.4 0 0 1 8.8 19L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5Z" />
  </svg>
);

// ─── Utility ──────────────────────────────────

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Derive dark/light/ghost variants from a hex primary color so the widget
 * stays visually coherent when the host provides a custom `data-primary-color`.
 *
 * Returns a React.CSSProperties object with all four --sl-primary-* vars set.
 */
function derivePrimaryVars(hex: string): React.CSSProperties {
  // Parse #rgb or #rrggbb
  const raw = hex.replace('#', '');
  const full = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    // Fallback: let CSS variables from :host take over
    return {} as React.CSSProperties;
  }

  // Darken by blending toward black (20 %)
  const dark = (v: number) => Math.max(0, Math.round(v * 0.8));
  // Lighten by blending toward white (15 %)
  const light = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.15));

  const rD = dark(r); const gD = dark(g); const bD = dark(b);
  const rL = light(r); const gL = light(g); const bL = light(b);

  return {
    '--sl-primary':       `#${full}`,
    '--sl-primary-dark':  `rgb(${rD},${gD},${bD})`,
    '--sl-primary-light': `rgb(${rL},${gL},${bL})`,
    '--sl-primary-ghost': `rgba(${r},${g},${b},0.10)`,
    '--sl-user-bg':       `#${full}`,
    '--sl-border':        `rgba(${r},${g},${b},0.15)`,
    '--sl-surface-3':     `rgba(${r},${g},${b},0.06)`,
  } as React.CSSProperties;
}

function resolveHeaderFont(fontStyle?: WidgetConfig["headerFont"]): string {
  if (fontStyle === 'editorial') return "'Lora', Georgia, serif";
  if (fontStyle === 'classic') return "Georgia, 'Times New Roman', serif";
  if (fontStyle === 'minimal') return "system-ui, -apple-system, sans-serif";
  return "'DM Sans', system-ui, sans-serif";
}

// ─── Sub-components ───────────────────────────

interface CitationsProps {
  items: Citation[];
}

const Citations: React.FC<CitationsProps> = ({ items }) => {
  if (!items.length) return null;
  return (
    <div className="sl-citations" role="list" aria-label="Sources">
      {items.map((c, index) => (
        <a
          key={c.id}
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="sl-citation"
          role="listitem"
          title={c.title}
        >
          <span className="sl-citation__num" aria-hidden="true">[{index + 1}]</span>
          <span className="sl-citation__title">{c.title}</span>
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

const TypingIndicator: React.FC = () => (
  <div className="sl-msg sl-msg--assistant" role="status" aria-label="Assistant is thinking">
    <div className="sl-typing">
      <span className="sl-typing__label">Thinking</span>
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
      {message.role === 'assistant' || message.role === 'system' ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          skipHtml
          components={{
            p: ({ children }) => <p className="sl-md-p">{children}</p>,
            ul: ({ children }) => <ul className="sl-md-ul">{children}</ul>,
            ol: ({ children }) => <ol className="sl-md-ol">{children}</ol>,
            li: ({ children }) => <li className="sl-md-li">{children}</li>,
            strong: ({ children }) => <strong className="sl-md-strong">{children}</strong>,
            code: ({ children }) => <code className="sl-md-code">{children}</code>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="sl-md-link"
              >
                {children}
              </a>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      ) : (
        message.content
      )}
      {message.isStreaming && (
        <span className="sl-thinking-inline" role="status" aria-label="Assistant is thinking">
          <span className="sl-thinking-inline__text">Thinking</span>
          <span className="sl-thinking-inline__dots" aria-hidden="true">
            <span className="sl-dot sl-dot--sm" />
            <span className="sl-dot sl-dot--sm" />
            <span className="sl-dot sl-dot--sm" />
          </span>
        </span>
      )}
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
  headerFont = 'modern',
  avatarStyle = 'bot',
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

  // Handle iOS virtual keyboard - adjust scroll when input is focused
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;

    const handleVisualResize = () => {
      // Small delay to let the keyboard animate
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    // Modern browsers support visualViewport
    if (typeof window !== 'undefined' && 'visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleVisualResize);
      return () => window.visualViewport?.removeEventListener('resize', handleVisualResize);
    }
  }, []);

  // Auto-grow textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    setInputValue(el.value);
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  // Apply dynamic primary color via CSS custom properties derived from the hex
  const cssVars: React.CSSProperties & Record<string, string | number> = {
    ...(primaryColor ? derivePrimaryVars(primaryColor) : {}),
    '--sl-font-display': resolveHeaderFont(headerFont),
    zIndex,
  };

  const initialLetter = botName?.trim()?.charAt(0)?.toUpperCase() || 'B';

  const renderAvatarFallback = () => {
    if (avatarStyle === 'sparkle') return '✦';
    if (avatarStyle === 'chat') return <IconChatAvatar />;
    if (avatarStyle === 'initial') return initialLetter;
    return <IconBotAvatar />;
  };

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

  // ── Toggle ────────────────────────────────

  const toggle = () => setIsOpen((v) => !v);

  // ── Render ────────────────────────────────

  const isLeft = position?.side === 'left';

  return (
    <div style={cssVars}>
      {/* ── Trigger pill button ── */}
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
        <span className="sl-trigger__dot" aria-hidden="true" />
        <span className="sl-trigger__text">
          {isOpen ? 'Close chat' : 'Open chat'}
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
              renderAvatarFallback()
            )}
          </div>
          <div className="sl-header__info">
            <p id={labelId} className="sl-header__name">{botName}</p>
            <p className="sl-header__status">{isLoading ? "Thinking..." : "Online"}</p>
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
            placeholder={isLoading ? "Thinking..." : "Ask anything..."}
            disabled={isLoading}
            aria-disabled={isLoading}
          />
          <button
            className={`sl-send${isLoading ? ' sl-send--loading' : ''}`}
            onClick={sendCurrentMessage}
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
            title="Send (Enter)"
            aria-busy={isLoading}
          >
            {isLoading ? <IconLoader /> : <IconSend />}
          </button>
        </div>

        {/* Footer */}
        <footer className="sl-footer">
          <a
            href="https://sitelearn.doofs.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="sl-powered"
          >
            by <span>SiteLearn</span>
          </a>
        </footer>
      </div>
    </div>
  );
};

export default Widget;
