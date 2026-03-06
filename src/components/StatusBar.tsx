interface StatusBarProps {
  hunger: number;
  happiness: number;
  visible: boolean;
}

export function StatusBar({ hunger, happiness, visible }: StatusBarProps) {
  if (!visible) return null;

  const hearts = Math.ceil(hunger / 20);
  const smileys = Math.ceil(happiness / 20);
  const heartsStr = '♥'.repeat(hearts) + '♡'.repeat(5 - hearts);
  const smileysStr = '☻'.repeat(smileys) + '☺'.repeat(5 - smileys);

  return (
    <div className="status">
      <span style={{ fontSize: '24px', color: '#ff6b6b' }}>{heartsStr}</span>
      {'  '}
      <span style={{ fontSize: '32px', color: '#ffd166' }}>{smileysStr}</span>
    </div>
  );
}
