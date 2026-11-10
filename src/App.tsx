import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function Win({
  title,
  label,
  className = '',
  children,
}: {
  title: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`win ${className}`} aria-label={label}>
      <div className="win-title">
        <span>{title}</span>
      </div>
      <div className="win-body">{children}</div>
    </section>
  );
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<Provider>('google');
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <div className="menubar" aria-label="현재 작업 상태">
        <strong className="menubar-name">컴포넌트 생성기</strong>
        <span className="menubar-spacer" />
        <span>{activeProvider}</span>
        <span>시안 {components.length}장</span>
      </div>

      <div className="desktop">
        <div className="workspace">
          <Win title="새 컴포넌트" label="컴포넌트 생성" className="win--main">
            <h1>만들 컴포넌트를 설명하세요</h1>
            <p className="lead">
              요청을 적으면 React 컴포넌트가 시안 창으로 열리고, 바로 미리보기와 코드를 확인할 수 있습니다.
            </p>
            <PromptInput onGenerate={handleGenerate} isLoading={isLoading} />
          </Win>

          <Win title="실행 설정" label="실행 설정" className="win--settings">
            <div className="field">
              <label htmlFor="provider">AI 모델 제공사</label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
              >
                {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="api-key">API 키</label>
              <div className="api-key-field">
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    hasEnvKey
                      ? '서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)'
                      : PROVIDER_CONFIG[provider].placeholder
                  }
                />
                <button
                  className="btn btn-toggle-key"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                >
                  {showKey ? '숨기기' : '보기'}
                </button>
              </div>
              <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
                {hasEnvKey ? '.env 키가 연결되어 있습니다.' : '직접 입력하거나 서버 환경변수를 설정하세요.'}
              </p>
            </div>
          </Win>
        </div>

        {error && (
          <Win title="오류" label="오류" className="win--alert">
            <p role="alert" className="alert-text">
              {error}
            </p>
          </Win>
        )}

        {isLoading && (
          <Win title="생성 중" label="생성 중" className="win--progress">
            <div role="status">
              <p>컴포넌트를 생성하고 있습니다...</p>
              <div className="progress" aria-hidden="true">
                <div className="progress-bar" />
              </div>
            </div>
          </Win>
        )}

        {components.length === 0 && !isLoading && (
          <Win title="시안 없음" label="빈 목록" className="win--empty">
            <div className="empty">
              <svg
                className="empty-icon"
                viewBox="0 0 16 20"
                width="48"
                height="60"
                shapeRendering="crispEdges"
                aria-hidden="true"
              >
                <path d="M1 1h10l4 4v14H1z" fill="#fff" stroke="#000" strokeWidth="1" />
                <path d="M11 1v4h4" fill="none" stroke="#000" strokeWidth="1" />
                <path d="M4 9h8M4 12h8M4 15h5" stroke="#000" strokeWidth="1" />
              </svg>
              <div>
                <h2>아직 만든 시안이 없습니다.</h2>
                <p>위 입력창에 만들 컴포넌트를 설명하고 컴포넌트 생성을 누르세요.</p>
              </div>
            </div>
          </Win>
        )}

        {components.length > 0 && (
          <div className="results-header">
            <h2>생성된 컴포넌트 {components.length}개</h2>
            <button className="btn btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
          </div>
        )}

        <div className="results-grid">
          {components.map((component, index) => (
            <ComponentCard
              key={component.id}
              number={components.length - index}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
