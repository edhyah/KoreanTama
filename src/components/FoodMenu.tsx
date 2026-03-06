import type { Word } from '../types';

interface FoodMenuProps {
  options: Word[];
  visible: boolean;
  isReverseQuiz: boolean;
  onSelect: (word: Word, buttonElement: HTMLButtonElement) => void;
}

export function FoodMenu({ options, visible, isReverseQuiz, onSelect }: FoodMenuProps) {
  const handleClick = (word: Word, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSelect(word, e.currentTarget);
  };

  return (
    <div className={`food-menu ${visible ? 'visible' : ''}`}>
      {options.map((word) => (
        <button
          key={word.emoji}
          className={`food-option ${isReverseQuiz ? 'text-option' : ''}`}
          data-emoji={word.emoji}
          onClick={(e) => handleClick(word, e)}
          dangerouslySetInnerHTML={isReverseQuiz ? undefined : { __html: word.emoji }}
        >
          {isReverseQuiz ? word.korean : null}
        </button>
      ))}
      {visible && <div className="food-menu-hint">tap to choose</div>}
    </div>
  );
}

// Export helper for parent to mark buttons as wrong
export function markButtonWrong(button: HTMLButtonElement) {
  button.classList.add('wrong');
}
