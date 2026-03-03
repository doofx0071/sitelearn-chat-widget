// ─────────────────────────────────────────────
//  SiteLearn Chat Widget — Auto-mount Entry
//  Reads config from <script> data-* attributes
//  and mounts the React widget into a Shadow DOM
//  for full CSS isolation from the host page.
// ─────────────────────────────────────────────

import React from 'react';
import { createRoot } from 'react-dom/client';
import Widget from './widget';
import type { WidgetConfig, WidgetPosition } from './types';

// Import styles as a raw string so we can inject them into the shadow DOM.
// The ?inline query is handled by Vite — no separate .css file is emitted.
import rawStyles from './styles.css?inline';

// ─── Config extraction ────────────────────────

function getDataAttr(el: HTMLElement, key: string, fallback = ''): string {
  return el.dataset[key] ?? fallback;
}

/**
 * Infers the default API endpoint from the script's origin.
 * Falls back to window.location.origin if the script origin cannot be determined.
 */
function inferApiEndpoint(script: HTMLElement): string {
  // If explicitly provided via data attribute, honor it
  const explicitEndpoint = getDataAttr(script, 'apiEndpoint') || getDataAttr(script, 'api-endpoint');
  if (explicitEndpoint) return explicitEndpoint;

  // Try to infer from script src origin
  if (script instanceof HTMLScriptElement && script.src) {
    try {
      const scriptUrl = new URL(script.src, window.location.href);
      return scriptUrl.origin;
    } catch {
      // Invalid URL, fall through
    }
  }

  // Fallback to current page origin
  return window.location.origin;
}

/**
 * Reads WidgetConfig from a script element's data-* attributes.
 * Supports both camelCase (data-botId) and kebab-case (data-bot-id) forms.
 */
function readConfig(script: HTMLElement): WidgetConfig {
  const positionRaw = getDataAttr(script, 'position', 'right');
  const position: WidgetPosition = positionRaw === 'left'
    ? { side: 'left' }
    : { side: 'right' };

  const bottomRaw = getDataAttr(script, 'bottom', '');
  if (bottomRaw) {
    position.bottom = parseInt(bottomRaw, 10);
  }

  return {
    botId:          getDataAttr(script, 'botId',          getDataAttr(script, 'bot-id',          'default')),
    primaryColor:   getDataAttr(script, 'primaryColor',   getDataAttr(script, 'primary-color',   '#5B6AF0')),
    apiEndpoint:    inferApiEndpoint(script),
    apiKey:         getDataAttr(script, 'apiKey',         getDataAttr(script, 'api-key',         '')) || undefined,
    welcomeMessage: getDataAttr(script, 'welcomeMessage', getDataAttr(script, 'welcome-message', 'Hi there! How can I help you today?')),
    botName:        getDataAttr(script, 'botName',        getDataAttr(script, 'bot-name',        'SiteLearn AI')),
    botAvatar:      getDataAttr(script, 'botAvatar',      getDataAttr(script, 'bot-avatar',      '')),
    headerFont:     getDataAttr(script, 'headerFont',     getDataAttr(script, 'header-font',     'modern')) as WidgetConfig['headerFont'],
    avatarStyle:    getDataAttr(script, 'avatarStyle',    getDataAttr(script, 'avatar-style',    'bot')) as WidgetConfig['avatarStyle'],
    autoOpen:       getDataAttr(script, 'autoOpen',       getDataAttr(script, 'auto-open',       'false')) === 'true',
    zIndex:         parseInt(getDataAttr(script, 'zIndex', getDataAttr(script, 'z-index', '9999')), 10),
    position,
  };
}

interface RemoteBotConfig {
  name?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  position?: 'bottom-left' | 'bottom-right';
  headerFont?: 'editorial' | 'modern' | 'classic' | 'minimal';
  avatarStyle?: 'sparkle' | 'bot' | 'chat' | 'initial';
}

async function hydrateConfigFromServer(config: WidgetConfig): Promise<WidgetConfig> {
  if (!config.botId || !config.apiEndpoint) {
    return config;
  }

  try {
    const response = await fetch(
      `${config.apiEndpoint}/widget-config?botId=${encodeURIComponent(config.botId)}`,
      {
        method: 'GET',
        headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      },
    );

    if (!response.ok) {
      return config;
    }

    const payload = (await response.json()) as { botConfig?: RemoteBotConfig };
    const botConfig = payload.botConfig;
    if (!botConfig) {
      return config;
    }

    return {
      ...config,
      botName: botConfig.name || config.botName,
      welcomeMessage: botConfig.welcomeMessage || config.welcomeMessage,
      primaryColor: botConfig.primaryColor || config.primaryColor,
      headerFont: botConfig.headerFont || config.headerFont,
      avatarStyle: botConfig.avatarStyle || config.avatarStyle,
      position:
        botConfig.position === 'bottom-left'
          ? { ...config.position, side: 'left' }
          : botConfig.position === 'bottom-right'
            ? { ...config.position, side: 'right' }
            : config.position,
    };
  } catch {
    return config;
  }
}

// ─── Mount logic ──────────────────────────────

/**
 * Sets up dynamic viewport height CSS variable for mobile browsers.
 * Solves the 100vh problem where mobile browser chrome takes up space.
 */
function setupDynamicViewportHeight(shadow: ShadowRoot): void {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    // Update the CSS custom property on the shadow host
    const host = shadow.host as HTMLElement;
    if (host) {
      host.style.setProperty('--sl-vh', `${vh}px`);
    }
  };

  // Set initially
  setVH();

  // Update on resize (with debouncing)
  let resizeTimeout: ReturnType<typeof setTimeout>;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(setVH, 100);
  };

  window.addEventListener('resize', handleResize, { passive: true });

  // Also listen to visualViewport for better iOS support
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
  }
}

function mountWidget(config: WidgetConfig): void {
  // Prevent duplicate mounts
  if (document.querySelector('#sl-widget-host')) return;

  // ── 1. Create host element ──
  // position:fixed + z-index comes from the child .sl-trigger / .sl-window
  // classes (which use fixed positioning themselves). The host wrapper is just
  // a zero-size anchor so it doesn't interfere with the host page layout.
  const host = document.createElement('div');
  host.id = 'sl-widget-host';
  // Keep the host out of the flow and out of the painting layer.
  // The trigger/window are positioned fixed so they escape this container.
  host.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:0',
    'height:0',
    'overflow:visible',   // allow fixed children to paint outside
    // NOTE: do NOT use contain:layout/strict/paint here — those would create a
    // new containing block for position:fixed children inside the shadow root,
    // breaking the fixed-position trigger bubble and chat window.
  ].join(';');
  document.body.appendChild(host);

  // ── 2. Attach Shadow DOM ──
  // delegatesFocus: true — when the shadow host gains focus it forwards to
  // the first focusable element inside the shadow root (good for a11y).
  const shadow = host.attachShadow({ mode: 'open', delegatesFocus: true });

  // ── 3. Inject compiled CSS into shadow root ──
  // We use a <style> element for universal browser support.
  // On browsers that support adoptedStyleSheets we could use a CSSStyleSheet,
  // but the <style> approach is spec-compliant and works everywhere.
  const styleEl = document.createElement('style');
  styleEl.textContent = rawStyles;
  shadow.appendChild(styleEl);

  // ── 3b. Setup dynamic viewport height for mobile ──
  setupDynamicViewportHeight(shadow);

  // ── 4. Create React mount point ──
  const mountPoint = document.createElement('div');
  mountPoint.id = 'sl-widget-root';
  // The mount point is a zero-size element; the trigger and window are
  // position:fixed and will paint relative to the viewport. We don't set
  // pointer-events:none here because the widget's trigger needs clicks.
  shadow.appendChild(mountPoint);

  // ── 5. Render the React widget tree ──
  const root = createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <Widget {...config} />
    </React.StrictMode>,
  );
}

// ─── Auto-detect and mount ────────────────────

async function autoMount(): Promise<void> {
  // Prefer document.currentScript (synchronous embed) then fall back to a
  // query selector (async / deferred embed).
  const script =
    (document.currentScript as HTMLElement | null) ??
    document.querySelector<HTMLElement>('script[data-bot-id],script[data-botId]');

  if (!script) {
    console.warn('[SiteLearn] Could not find a widget script tag with data-bot-id or data-botId attributes.');
    return;
  }

  const config = readConfig(script);
  
  // Check if server config hydration should be skipped (for preview mode)
  const disableServerConfig = getDataAttr(script, 'disableServerConfig', 
    getDataAttr(script, 'disable-server-config', 'false'));
  const shouldSkipHydration = disableServerConfig === 'true' || disableServerConfig === '1';
  
  if (shouldSkipHydration) {
    // Use local config directly without server override (preview mode)
    mountWidget(config);
  } else {
    // Normal behavior: hydrate from server config
    const hydratedConfig = await hydrateConfigFromServer(config);
    mountWidget(hydratedConfig);
  }
}

// Run immediately if DOM is ready, else defer until DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void autoMount();
  }, { once: true });
} else {
  void autoMount();
}

// ─── Programmatic API ─────────────────────────
// Exposed both as ES module exports and as window.SiteLearnWidget
// so vanilla-JS embeds can call: SiteLearnWidget.mount({ botId: '...' })

export { mountWidget, readConfig };
export type { WidgetConfig };

declare global {
  interface Window {
    SiteLearnWidget: {
      mount: typeof mountWidget;
    };
  }
}

if (typeof window !== 'undefined') {
  window.SiteLearnWidget = { mount: mountWidget };
}
