// ─────────────────────────────────────────────
//  SiteLearn Chat Widget — Auto-mount Entry
//  Reads config from <script> data-* attributes
//  and mounts the React widget into a shadow DOM
//  for full CSS isolation from the host page.
// ─────────────────────────────────────────────

import React from 'react';
import { createRoot } from 'react-dom/client';
import Widget from './widget';
import type { WidgetConfig, WidgetPosition } from './types';

// Import styles as a raw string so we can inject them into shadow DOM
import rawStyles from './styles.css?inline';

// ─── Config extraction ────────────────────────

function getDataAttr(el: HTMLElement, key: string, fallback = ''): string {
  return el.dataset[key] ?? fallback;
}

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
    botId:          getDataAttr(script, 'botId', getDataAttr(script, 'bot-id', 'default')),
    primaryColor:   getDataAttr(script, 'primaryColor', getDataAttr(script, 'primary-color', '#5B6AF0')),
    apiEndpoint:    getDataAttr(script, 'apiEndpoint', getDataAttr(script, 'api-endpoint', 'https://api.sitelearn.io')),
    welcomeMessage: getDataAttr(script, 'welcomeMessage', getDataAttr(script, 'welcome-message', 'Hi there! How can I help you today?')),
    botName:        getDataAttr(script, 'botName', getDataAttr(script, 'bot-name', 'SiteLearn AI')),
    botAvatar:      getDataAttr(script, 'botAvatar', getDataAttr(script, 'bot-avatar', '')),
    autoOpen:       getDataAttr(script, 'autoOpen', getDataAttr(script, 'auto-open', 'false')) === 'true',
    zIndex:         parseInt(getDataAttr(script, 'zIndex', getDataAttr(script, 'z-index', '9999')), 10),
    position,
  };
}

// ─── Mount logic ──────────────────────────────

function mountWidget(config: WidgetConfig): void {
  // Prevent duplicate mounts
  if (document.querySelector('#sl-widget-host')) return;

  // Create host element appended to body
  const host = document.createElement('div');
  host.id = 'sl-widget-host';
  host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:0;pointer-events:none;';
  document.body.appendChild(host);

  // Attach shadow DOM for CSS isolation
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject scoped styles into shadow root
  const styleEl = document.createElement('style');
  styleEl.textContent = rawStyles;
  shadow.appendChild(styleEl);

  // Mount point inside shadow DOM
  const mountPoint = document.createElement('div');
  mountPoint.id = 'sl-widget-root';
  shadow.appendChild(mountPoint);

  // Render React tree
  const root = createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <Widget {...config} />
    </React.StrictMode>,
  );
}

// ─── Auto-detect and mount ────────────────────

function autoMount(): void {
  // Find the SiteLearn script tag
  const script =
    (document.currentScript as HTMLElement | null) ??
    document.querySelector<HTMLElement>('script[data-bot-id],script[data-botId]');

  if (!script) {
    console.warn('[SiteLearn] Could not find widget script tag with data attributes.');
    return;
  }

  const config = readConfig(script);
  mountWidget(config);
}

// Run immediately if DOM is ready, else wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoMount, { once: true });
} else {
  autoMount();
}

// ─── Programmatic API (export for bundled usage) ──

export { mountWidget, readConfig };
export type { WidgetConfig };

// Expose on window for vanilla-JS embed usage
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
