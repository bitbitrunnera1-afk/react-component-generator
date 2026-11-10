# src/components/AGENTS.md

## Module Context

- 화면 조각 컴포넌트 모음이다. `ComponentCard`가 `LivePreview`와 `CodeView`를 조합하고, `PromptInput`은 입력과 예시를 담당한다.
- 이 폴더에서만 AI가 생성한 코드를 실행한다. `LivePreview`가 `react-live`로 생성 코드를 평가한다 (`LivePreview.tsx:34`). 실행 경계이므로 변경할 때 특히 주의한다.
- 상태와 서버 호출은 여기서 하지 않는다. 훅(`src/hooks/useComponentGenerator.ts`)과 `App.tsx`에서 내려받은 props만 쓴다.

## Tech Stack & Constraints

- 미리보기는 `react-live` 4 (`LiveProvider`, `LivePreview`, `LiveError`)만 쓴다 (`LivePreview.tsx:2`). 다른 렌더 라이브러리를 섞지 않는다.
- `LiveProvider`는 `noInline` 옵션으로 쓴다 (`LivePreview.tsx:34`). 생성 코드는 `render()` 호출로 끝나야 그려진다 (`server/generator.ts:12-13`).
- 스타일은 `App.css`의 클래스(`preview-panel`, `panel-header`, `component-card`, `btn` 계열)를 쓴다. 인라인 스타일은 생성 코드 안에서만 쓴다.

## Implementation Patterns

- 컴포넌트는 named export로 내보낸다 (`export function LivePreview`, `export function CodeView`). `App.tsx`만 default export를 쓴다.
- Props 타입은 `컴포넌트명Props` 인터페이스로 파일 상단에 정의한다 (`LivePreviewProps`, `CodeViewProps`, `PromptInputProps`).
- 패널 헤더는 `div.panel-header` 안에 `h3`로 제목을 쓴다 (`LivePreview.tsx:25-26`, `CodeView.tsx:18-19`). 같은 구조를 유지한다.
- 한국어 UI 문구는 컴포넌트 안에 직접 쓴다. 상수 배열이 필요하면 `PromptInput.tsx:8-15`의 `EXAMPLES`처럼 파일 상단에 둔다.

## Testing Strategy

- 테스트 실행: `bun run test -- src/components`
- 현재 테스트는 `PromptInput.test.tsx`뿐이다. 테스트 패턴은 그 파일을 따른다: `render`, `screen.getByRole`, `userEvent.setup()`.
- 콜백은 `vi.fn()`으로 넘기고 호출 인자를 검증한다 (`PromptInput.test.tsx:13-22`).

## Local Golden Rules

- Do: `LivePreview`에 넘기는 `code`는 `ComponentCard`가 가진 `component.code` 그대로 쓴다. 다른 곳에서 문자열을 가공해 넘기면 `render()` 주입 규칙(`server/generator.ts:16`)이 깨질 수 있다.
- Don't: `LiveProvider`에 `scope`를 넘기지 않는다. 생성 코드가 `window`, 키, 민감 객체에 접근할 수 있다 (`LivePreview.tsx:34`).
- Don't: `CodeView`의 `<code>{code}</code>`를 `dangerouslySetInnerHTML`로 바꾸지 않는다. 생성 코드는 텍스트로만 출력한다 (`CodeView.tsx:25`).
- Do: `ComponentCard`의 재생성 버튼은 `isLoading`일 때 비활성화한다 (`ComponentCard.tsx:46`). 중복 요청 방지 가드를 빼지 않는다.
- Do: `ComponentCard`의 미리보기 새로고침은 `previewKey` 증가로 `LivePreview`를 리마운트한다 (`ComponentCard.tsx:18`, `:37`, `:75`). 다른 방식으로 바꾸면 애니메이션 컴포넌트가 다시 그려지지 않는다.
- Test Boundary: `LivePreview.tsx`, `ComponentCard.tsx`, `CodeView.tsx`는 테스트가 없다. 실행 경계를 바꾸면 `bun run dev`로 실제 미리보기가 동작하는지 확인하고 테스트 추가를 제안한다.
- Don't: 생성 코드 정규화(`stripCodeFences`, `ensureRenderCall`)를 이 폴더에서 다시 하지 않는다. 정규화는 서버에서 한 번 한다 (`server/index.ts:188`). 두 번 적용하면 정상 코드가 바뀔 수 있다.
