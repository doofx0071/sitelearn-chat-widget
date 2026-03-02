const JAILBREAK_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "ignore_previous_instructions", pattern: /ignore\s+(all\s+)?previous\s+instructions?/i },
  { id: "disregard_instructions", pattern: /disregard\s+(all\s+)?instructions?/i },
  { id: "role_reassignment", pattern: /you\s+are\s+now\s+\w+/i },
  { id: "developer_mode", pattern: /developer\s+mode/i },
  { id: "dan_mode", pattern: /dan\s+mode/i },
  { id: "reveal_system_prompt", pattern: /reveal\s+(your|the)\s+(system|hidden)\s+prompt/i },
  { id: "repeat_system_prompt", pattern: /repeat\s+(your|the)\s+system\s+prompt/i },
  { id: "policy_bypass", pattern: /bypass\s+(safety|policy|guardrails?)/i },
  { id: "system_tag_xml", pattern: /<\s*system\s*>/i },
  { id: "system_tag_bracket", pattern: /\[\s*system\s*\]/i },
  { id: "fenced_system_block", pattern: /```\s*(system|developer|assistant)/i },
];

const PROMPT_LEAK_PATTERNS: RegExp[] = [
  /answer\s+only\s+using\s+the\s+provided\s+context/i,
  /if\s+the\s+answer\s+is\s+not\s+in\s+the\s+context/i,
  /critical\s+constraints?/i,
  /system\s+prompt/i,
  /internal\s+instructions?/i,
];

export function sanitizeUserInput(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLikelyJailbreak(input: string): boolean {
  const normalized = sanitizeUserInput(input);
  return JAILBREAK_PATTERNS.some(({ pattern }) => pattern.test(normalized));
}

export function detectJailbreakPatterns(input: string): string[] {
  const normalized = sanitizeUserInput(input);
  return JAILBREAK_PATTERNS.filter(({ pattern }) => pattern.test(normalized)).map(({ id }) => id);
}

export function sanitizeContextText(input: string): string {
  const normalized = sanitizeUserInput(input);
  return normalized
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<\s*\/?.*?>/g, " ")
    .replace(/\[\s*(system|developer|assistant)\s*\]/gi, " ")
    .trim();
}

export function shouldBlockModelOutput(output: string): boolean {
  const normalized = sanitizeUserInput(output);
  return PROMPT_LEAK_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function safeRefusal(): string {
  return "I can help with questions about the learned content, but I can't follow that instruction.";
}
