# server/AGENTS.md

## Module Context

- Bun 런타임에서 실행되는 API 프록시다. Anthropic과 Gemini를 호출하고 생성 코드를 정규화해 `/api/generate`로 반환한다.
- `src/`의 코드를 import하지 않는다. 브라우저 전용 API를 쓰지 않는다.

## Tech Stack & Constraints

- 외부 SDK 없이 `fetch`로 프로바이더를 직접 호출한다 (`server/index.ts:68-136`). 새 SDK 패키지를 추가하지 않는다.
- Google 모델은 `GOOGLE_MODELS` 배열의 순서대로 폴백한다 (`server/index.ts:5`). Anthropic 모델 ID는 `callAnthropic` 안에 하드코딩되어 있다 (`server/index.ts:77`). 모델을 바꿀 때 두 위치를 함께 확인한다.
- 응답 최대 토큰은 Anthropic 4096 (`server/index.ts:78`), Gemini 8192 (`server/index.ts:107`)로 다르다.
- CORS는 `*`로 열려 있다 (`server/index.ts:52`). 서버 `.env` 키가 모든 origin의 요청에 쓰인다. 키를 쓰는 라우트를 추가할 때 이 점을 고려하고, CORS 설정을 임의로 넓히지 않는다.

## Implementation Patterns

- 순수 함수(정규화, 폴백)는 `generator.ts`, `fallback.ts`에 둔다. 라우팅과 `fetch` 호출은 `index.ts`에 둔다.
- 프로바이더를 추가하려면 다음 다섯 곳을 함께 고친다: `Provider` 타입(`server/index.ts:57`), `ENV_KEYS`(`:59-62`), `/api/generate` 분기(`:183-186`), `/api/config`의 `envKeys`(`:150-153`), 키 누락 에러 문구(`:171`).
- 에러 응답은 `Response.json({ error }, { status, headers: CORS_HEADERS })` 형식을 따른다 (`server/index.ts:170-173`, `:208-211`).

## Testing Strategy

- 테스트 실행: `bun run test -- server`
- 테스트 파일은 `server/*.test.ts`로 둔다. 함수마다 `describe`로 묶고, 테스트 이름은 한국어로 쓴다 (`server/generator.test.ts`).
- 폴백 로직은 `vi.fn`으로 `attempt`를 주입해 검증한다 (`server/fallback.test.ts`).

## Local Golden Rules

- Don't: `server/index.ts`를 테스트에서 import하지 않는다. `Bun.serve`가 3002 포트를 점유한다 (`server/index.ts:138`).
- Don't: `ensureRenderCall`이나 `stripCodeFences`를 프롬프트 규칙만으로 대체하지 않는다. 두 방어선을 모두 유지한다 (`server/generator.ts:5`, `:16`).
- Do: 프로바이더 에러 메시지에 HTTP 상태 코드를 넣는다 (`Claude API error: ${status}`). 상태 매핑이 이 문자열에 의존한다 (`server/index.ts:194`, `:201`).
- Do: Gemini에 추가 기능을 넣을 때 `MAX_TOKENS` 처리 방식을 Anthropic 경로에도 맞출지 함께 검토한다 (`server/index.ts:123-125`).
- Don't: Gemini 요청 URL을 로그에 출력하지 않는다. 키가 포함되어 있다 (`server/index.ts:99`).
