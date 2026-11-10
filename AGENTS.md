# AGENTS.md

## Project Context

- 목표: 프롬프트로 React 컴포넌트를 생성하고 react-live로 즉시 미리보기를 제공한다.
- Stack: React 19, TypeScript, Vite 8, Bun(API 프록시, 포트 3002), react-live, Vitest, Testing Library.
- 하위 영역: `server/` (Bun 런타임 API), `src/` (브라우저 React 앱).

## Operational Commands

- 패키지 매니저는 `bun`만 사용한다. npm, yarn, pnpm은 사용하지 않는다 (README.md 실행 방법, `bun.lock`).
- 설치: `bun install`
- 개발 서버(API + Vite 동시 실행): `bun run dev` (Vite 5173, API 3002. `vite.config.ts:9-14` 프록시)
- API 서버만 실행(watch): `bun run server`
- 전체 테스트: `bun run test`
- 특정 테스트: `bun run test -- server/generator.test.ts`
- 린트: `bun run lint`
- 타입 체크 + 빌드: `bun run build`
- `bun test`는 쓰지 않는다. Bun 내장 러너라 `vite.config.ts:16-21`의 jsdom 환경과 `src/test/setup.ts`가 적용되지 않는다.
- 코드를 수정한 뒤에는 `bun run test`와 `bun run build`를 실행해 결과를 확인하고 보고한다.

## Golden Rules

### Immutable (보안/아키텍처 제약)

- 서버의 `.env` 키는 클라이언트로 내보내지 않는다. `/api/config`는 키 존재 여부(boolean)만 반환한다 (`server/index.ts:147-157`).
- `.env` 파일 내용을 읽거나 출력하거나 커밋하지 않는다. `.env`는 `.gitignore:32`에서 제외된다.
- Gemini 요청 URL에는 API 키가 쿼리스트링으로 들어간다 (`server/index.ts:99`). 이 URL을 로그, 에러 메시지, 응답 본문에 남기지 않는다.
- API 키는 React state에만 둔다 (`src/App.tsx:36`). `localStorage`나 `sessionStorage`에 저장하지 않는다. 현재 코드베이스에는 저장소 API 사용이 없다.
- 생성 코드는 브라우저에서 실행된다 (`src/components/LivePreview.tsx:34`, `noInline`). `LiveProvider`에 `scope`로 키나 민감 객체를 넘기지 않는다. 현재는 `scope`를 쓰지 않는다.

### Do's & Don'ts

- Do: 모델 응답은 `stripCodeFences` → `ensureRenderCall` 순서로 정규화한 뒤 클라이언트에 보낸다 (`server/index.ts:188`).
- Don't: `SYSTEM_PROMPT`에서 "import 금지, 순수 JavaScript, render() 호출" 규칙을 제거하지 않는다 (`server/index.ts:9-20`). react-live 실행 환경이 이 규칙에 의존한다.
- Don't: 생성 코드 문자열을 `dangerouslySetInnerHTML`이나 `innerHTML`로 렌더하지 않는다. 코드 보기는 텍스트 노드로 출력한다 (`src/components/CodeView.tsx:25`).

### 팀 고유 규칙 (코드 근거)

- Asymmetry(비대칭): 잘림 감지는 Gemini에만 있다 (`server/index.ts:123-125`, `MAX_TOKENS`). `callAnthropic`은 `stop_reason`을 확인하지 않는다 (`server/index.ts:92-95`). 새 프로바이더를 추가하면 잘림 처리를 대칭으로 구현한다.
- Asymmetry(비대칭): 503/429 응답 매핑은 에러 메시지 문자열 포함 여부로 판단한다 (`server/index.ts:194`, `:201`). 에러 문자열 형식 `API error: ${status}`(`server/index.ts:85`, `:112`)를 바꾸면 매핑이 조용히 깨진다.
- Test Boundary(테스트 경계): 테스트가 있는 파일은 `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`뿐이다. `server/index.ts`, `src/App.tsx`, `src/components/LivePreview.tsx`, `src/hooks/useComponentGenerator.ts`는 테스트가 없다. 이 영역을 바꾸면 직접 검증하고 테스트 추가를 제안한다.
- Hard Constraint(하드 제약): `server/index.ts:138`의 `Bun.serve`는 모듈 최상위에서 실행된다. 테스트에서 `server/index.ts`를 import하면 3002 포트 서버가 뜬다. 테스트 대상 로직은 부수효과가 없는 모듈(`generator.ts`, `fallback.ts`)에 둔다 (`server/generator.ts:2-3`).
- Double Defense(이중 방어): 코드펜스 제거는 프롬프트 규칙(`server/index.ts:16`)과 `stripCodeFences`(`server/generator.ts:5`) 두 곳에서 막는다. `render()` 주입도 프롬프트(`server/index.ts:12`)와 `ensureRenderCall`(`server/generator.ts:16`) 두 곳에서 막는다. 한쪽을 제거하지 않는다.
- Double Defense(이중 방어): 중복 요청은 `PromptInput.tsx:22`와 `ComponentCard.tsx:46`의 `isLoading` 가드 두 곳에서 막는다.
- 타입 중복 주의: `Provider` 타입이 `server/index.ts:57`과 `src/types/index.ts:1`에 각각 정의되어 있다. 한쪽을 바꾸면 다른 쪽도 맞춘다.

## Standards & References

- 언어: 사용자 대상 문구와 주석은 한국어로 쓴다. 코드 식별자는 영어를 쓴다.
- 커밋: `<type>: <한국어 요약>` 형식이며 type은 `feat`, `fix`, `refactor`, `chore` 중 하나다. 요약 끝에 마침표를 붙이지 않는다.
- 기존 문서: 설치와 실행 안내는 `README.md`를 따른다. 이 파일은 에이전트 전용 지침만 담는다.

## Maintenance Policy

- 이 문서의 규칙과 코드가 어긋나면 수정을 제안한다. 근거(파일·라인)를 대지 못하는 규칙은 삭제를 제안한다.

## Context Map

- **[API 서버 수정 (Bun, server/)](./server/AGENTS.md)** — 라우트, 프로바이더 호출, 프롬프트, 폴백 로직을 바꿀 때.
- **[프론트엔드 수정 (React, src/)](./src/AGENTS.md)** — 컴포넌트, 훅, 미리보기, 스타일을 바꿀 때.
