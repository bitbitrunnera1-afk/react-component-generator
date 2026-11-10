import type { GeneratedComponent, Provider } from '../types';

// API 키는 저장하지 않는다 (AGENTS.md Immutable 규칙). 키는 App의 state에만 둔다.
const KEYS = {
  provider: 'rcg:provider',
  components: 'rcg:components',
  promptHistory: 'rcg:prompt-history',
} as const;

export const MAX_PROMPT_HISTORY = 20;

const DEFAULT_PROVIDER: Provider = 'google';

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과나 저장소 차단 시 영속화만 포기한다.
  }
}

export function loadProvider(): Provider {
  const value = read(KEYS.provider);
  return value === 'anthropic' || value === 'google' ? value : DEFAULT_PROVIDER;
}

export function saveProvider(provider: Provider): void {
  write(KEYS.provider, provider);
}

export function loadComponents(): GeneratedComponent[] {
  const value = read(KEYS.components);
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): GeneratedComponent[] => {
    if (
      item &&
      typeof item.id === 'string' &&
      typeof item.prompt === 'string' &&
      typeof item.code === 'string'
    ) {
      const createdAt = new Date(item.createdAt);
      if (!Number.isNaN(createdAt.getTime())) {
        return [{ id: item.id, prompt: item.prompt, code: item.code, createdAt }];
      }
    }
    return [];
  });
}

export function saveComponents(components: GeneratedComponent[]): void {
  write(KEYS.components, components);
}

export function loadPromptHistory(): string[] {
  const value = read(KEYS.promptHistory);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

export function savePromptHistory(history: string[]): void {
  write(KEYS.promptHistory, history);
}

export function addPromptToHistory(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((p) => p !== prompt)].slice(0, MAX_PROMPT_HISTORY);
}
