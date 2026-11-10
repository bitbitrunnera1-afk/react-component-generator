# src/AGENTS.md

## Module Context

- Vite로 빌드되는 브라우저 React 앱이다. API 호출은 `/api` 경로로 보내고 Vite 프록시가 `localhost:3002`로 전달한다 (`vite.config.ts:9-14`).
- `server/`의 코드를 import하지 않는다. 공유 타입은 `src/types/index.ts`에 둔다.

## Tech Stack & Constraints

- React 19, react-live 4(미리보기), Vitest + jsdom + Testing Library.
- 앱 UI 스타일은 CSS 파일(`src/App.css`, `src/index.css`)을 쓴다 (`src/App.tsx:7`). 생성 코드용 인라인 스타일과 구분한다.
- 테스트 환경은 `vite.config.ts:16-21`과 `src/test/setup.ts`에서 설정한다. 테스트 파일은 `*.test.tsx`로 같은 폴더에 둔다.

## Implementation Patterns

- 서버 호출과 상태 관리는 `useComponentGenerator` 훅에 둔다 (`src/hooks/useComponentGenerator.ts`). 컴포넌트는 표시와 이벤트만 담당한다.
- 패널은 `App.tsx`의 `Win` 컴포넌트(`src/App.tsx:14-33`)로 감싸 기존 창 스타일을 맞춘다.
- 미리보기 새로고침은 `key` 증가로 리마운트한다 (`src/components/ComponentCard.tsx:18`, `:37`, `:75`). 같은 방식을 쓴다.
- 컴포넌트 파일명은 PascalCase `.tsx`를 쓴다.

## Testing Strategy

- 테스트 실행: `bun run test -- src`
- 역할 기반 쿼리(`getByRole`)와 `userEvent`를 쓴다 (`src/components/PromptInput.test.tsx:17`).
- 테스트 이름은 한국어로 쓴다.

## Local Golden Rules

- Do: 생성 코드는 `LiveProvider`의 `code`로만 전달한다. 문자열을 DOM에 직접 삽입하지 않는다 (`src/components/LivePreview.tsx:34`).
- Don't: API 키를 `localStorage`나 `sessionStorage`에 저장하지 않는다. 키는 state에만 둔다 (`src/App.tsx:36`).
- Do: 프로바이더를 바꾸면 API 키 입력값을 비우는 동작을 유지한다 (`src/App.tsx:63-66`). 다른 프로바이더의 키가 섞여 전송되는 것을 막는다.
- Do: 중복 요청 방지 가드(`PromptInput.tsx:22`, `ComponentCard.tsx:46`)를 둘 다 유지한다.
- Don't: `LivePreview`에 `scope` prop으로 `window`, 키, 민감 객체를 넘기지 않는다. 생성 코드가 이 값을 읽을 수 있다 (`src/components/LivePreview.tsx:34`).
- Test Boundary: `App.tsx`, `LivePreview.tsx`, `useComponentGenerator.ts`는 테스트가 없다. 이 파일들을 바꾸면 직접 검증하고 테스트 추가를 제안한다.
