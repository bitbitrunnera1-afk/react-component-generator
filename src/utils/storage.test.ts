import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadProvider,
  saveProvider,
  loadComponents,
  saveComponents,
  loadPromptHistory,
  addPromptToHistory,
  savePromptHistory,
  MAX_PROMPT_HISTORY,
} from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('provider 저장', () => {
  it('저장된 값이 없으면 기본값 google을 반환한다', () => {
    expect(loadProvider()).toBe('google');
  });

  it('저장한 provider를 다시 불러온다', () => {
    saveProvider('anthropic');
    expect(loadProvider()).toBe('anthropic');
  });

  it('유효하지 않은 값이 저장돼 있으면 기본값을 반환한다', () => {
    localStorage.setItem('rcg:provider', 'openai');
    expect(loadProvider()).toBe('google');
  });
});

describe('컴포넌트 목록 저장', () => {
  it('저장된 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadComponents()).toEqual([]);
  });

  it('저장한 목록을 불러오면 createdAt이 Date로 복원된다', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    saveComponents([{ id: 'a', prompt: 'p', code: 'c', createdAt }]);

    const loaded = loadComponents();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].createdAt).toBeInstanceOf(Date);
    expect(loaded[0].createdAt.getTime()).toBe(createdAt.getTime());
  });

  it('깨진 JSON이면 빈 배열을 반환한다', () => {
    localStorage.setItem('rcg:components', '{broken');
    expect(loadComponents()).toEqual([]);
  });

  it('형식이 맞지 않는 항목은 걸러낸다', () => {
    localStorage.setItem(
      'rcg:components',
      JSON.stringify([{ id: 'a', prompt: 'p', code: 'c', createdAt: '2026-01-01T00:00:00Z' }, { id: 1 }]),
    );
    expect(loadComponents().map((c) => c.id)).toEqual(['a']);
  });

  it('저장소 쓰기가 실패해도 예외를 던지지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveComponents([])).not.toThrow();
    vi.restoreAllMocks();
  });
});

describe('프롬프트 히스토리', () => {
  it('저장된 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadPromptHistory()).toEqual([]);
  });

  it('저장한 히스토리를 다시 불러온다', () => {
    savePromptHistory(['a', 'b']);
    expect(loadPromptHistory()).toEqual(['a', 'b']);
  });

  it('새 프롬프트는 맨 앞에 추가된다', () => {
    expect(addPromptToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('중복 프롬프트는 맨 앞으로 옮기고 하나만 남긴다', () => {
    expect(addPromptToHistory(['a', 'b'], 'b')).toEqual(['b', 'a']);
  });

  it('최대 개수를 넘으면 오래된 항목을 버린다', () => {
    const history = Array.from({ length: MAX_PROMPT_HISTORY }, (_, i) => `p${i}`);
    const next = addPromptToHistory(history, 'new');
    expect(next).toHaveLength(MAX_PROMPT_HISTORY);
    expect(next[0]).toBe('new');
  });
});

describe('API 키', () => {
  it('어떤 저장 함수도 API 키를 localStorage에 쓰지 않는다', () => {
    saveProvider('anthropic');
    saveComponents([]);
    savePromptHistory(['x']);
    const dump = JSON.stringify({ ...localStorage });
    expect(dump).not.toMatch(/api.?key/i);
  });
});
