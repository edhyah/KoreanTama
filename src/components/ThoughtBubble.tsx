interface ThoughtBubbleProps {
  text: string;
  visible: boolean;
  fontSize?: string;
  onBubbleClick?: () => void;
  onVolumeClick?: () => void;
  isEmoji?: boolean;
  isClickable?: boolean;
}

export function ThoughtBubble({ text, visible, fontSize, onBubbleClick, onVolumeClick, isEmoji = false, isClickable = false }: ThoughtBubbleProps) {
  const style = fontSize ? { fontSize } : undefined;
  const className = `thought-bubble ${visible ? 'visible' : ''} ${isClickable ? 'clickable' : ''}`;

  const handleVolumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVolumeClick?.();
  };

  return (
    <div
      className={className}
      style={style}
      onClick={onBubbleClick}
      dangerouslySetInnerHTML={isEmoji ? { __html: text } : undefined}
    >
      {!isEmoji ? text : null}
      {isClickable && (
        <button className="volume-button" onClick={handleVolumeClick} aria-label="Replay audio">
          🔊
        </button>
      )}
    </div>
  );
}
