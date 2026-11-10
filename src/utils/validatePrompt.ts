export const MAX_PROMPT_LENGTH = 500;

// 이모지 등 서로게이트 쌍을 한 글자로 세기 위해 코드 포인트 기준으로 센다.
export function countPromptChars(text: string): number {
  return Array.from(text).length;
}

export function isPromptTooLong(text: string): boolean {
  return countPromptChars(text) > MAX_PROMPT_LENGTH;
}
