import { useEffect } from 'react';

interface PopTextProps {
  text: string;
  onComplete: () => void;
}

export function PopText({ text, onComplete }: PopTextProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="pop-text" style={{ left: '50%', bottom: '100%' }}>
      {text}
    </div>
  );
}
