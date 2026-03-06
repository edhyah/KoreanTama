import { useState } from 'react';

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8bd0'];

interface ConfettiPiece {
  id: number;
  left: string;
  color: string;
  delay: string;
}

export function useConfetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const showConfetti = () => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 30; i++) {
      newPieces.push({
        id: Date.now() + i,
        left: `${Math.random() * 100}vw`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: `${Math.random() * 0.5}s`,
      });
    }
    setPieces(newPieces);

    // Clean up after animation
    setTimeout(() => {
      setPieces([]);
    }, 2500);
  };

  return { pieces, showConfetti };
}

interface ConfettiProps {
  pieces: ConfettiPiece[];
}

export function Confetti({ pieces }: ConfettiProps) {
  return (
    <>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: piece.left,
            '--color': piece.color,
            animationDelay: piece.delay,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
