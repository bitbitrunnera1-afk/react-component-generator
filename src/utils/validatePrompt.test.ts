import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, countPromptChars, isPromptTooLong } from './validatePrompt';

describe('MAX_PROMPT_LENGTH', () => {
  it('프롬프트 최대 길이는 500자다', () => {
    expect(MAX_PROMPT_LENGTH).toBe(500);
  });
});

describe('countPromptChars', () => {
  it('영문자를 한 글자씩 센다', () => {
    expect(countPromptChars('abc')).toBe(3);
  });

  it('한글을 한 글자씩 센다', () => {
    expect(countPromptChars('검색 필터')).toBe(5);
  });

  it('이모지 하나를 한 글자로 센다', () => {
    expect(countPromptChars('😀a')).toBe(2);
  });

  it('빈 문자열은 0자다', () => {
    expect(countPromptChars('')).toBe(0);
  });
});

describe('isPromptTooLong', () => {
  it('500자 이하이면 초과가 아니다', () => {
    expect(isPromptTooLong('a'.repeat(499))).toBe(false);
  });

  it('정확히 500자이면 초과가 아니다', () => {
    expect(isPromptTooLong('a'.repeat(500))).toBe(false);
  });

  it('501자이면 초과다', () => {
    expect(isPromptTooLong('a'.repeat(501))).toBe(true);
  });

  it('한글 500자는 초과가 아니고 501자는 초과다', () => {
    expect(isPromptTooLong('가'.repeat(500))).toBe(false);
    expect(isPromptTooLong('가'.repeat(501))).toBe(true);
  });

  it('이모지 500개는 초과가 아니고 501개는 초과다', () => {
    expect(isPromptTooLong('😀'.repeat(500))).toBe(false);
    expect(isPromptTooLong('😀'.repeat(501))).toBe(true);
  });

  it('빈 문자열은 초과가 아니다', () => {
    expect(isPromptTooLong('')).toBe(false);
  });
});
