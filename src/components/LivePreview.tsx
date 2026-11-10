import { useEffect, useRef, useState } from 'react';
import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';

interface LivePreviewProps {
  code: string;
}

export function LivePreview({ code }: LivePreviewProps) {
  const renderRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = renderRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <h3>미리보기</h3>
        {size && (
          <span className="dim-readout">
            캔버스 {size.w} × {size.h}px
          </span>
        )}
      </div>
      <div className="preview-content">
        <LiveProvider code={code} noInline>
          <div className="preview-render" ref={renderRef}>
            <ReactLivePreview />
          </div>
          <LiveError className="preview-error" />
        </LiveProvider>
      </div>
    </div>
  );
}
