import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Pet,
  PetRef,
  HUD,
  StatusBar,
  ThoughtBubble,
  FoodMenu,
  SleepOverlay,
  PopText,
  Confetti,
  useConfetti,
  DebugModal,
  DebugPage,
  markButtonWrong,
} from './components';
import { usePersistence, useGameState, useQuiz } from './hooks';
import { speak, unlockAudio } from './utils';
import { randomPhrase, getTimeGreeting, CATEGORIES } from './constants';
import type { Word } from './types';

type PageName = 'main' | 'debug';

export default function App() {
  const persistence = usePersistence();
  const {
    session,
    returnType,
    isLoaded,
    getStats,
    updateWordStats,
    updateSession,
    getUnlockedCategories,
    getUnlockedWords,
    getLearnedWordCount,
    resetAll,
    setProgressLevel,
    setReturnType,
  } = persistence;

  const gameStateHook = useGameState({
    initialAwake: session.awake,
    initialDailyGoalMet: session.dailyCorrectCount >= session.dailyGoal,
  });
  const { state: gameState, ...gameActions } = gameStateHook;

  const quiz = useQuiz({ getStats, getUnlockedWords });
  const { pieces: confettiPieces, showConfetti } = useConfetti();

  const petRef = useRef<PetRef>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const creatureZoneRef = useRef<HTMLDivElement>(null);

  const [thoughtText, setThoughtText] = useState('');
  const [thoughtVisible, setThoughtVisible] = useState(false);
  const [thoughtFontSize, setThoughtFontSize] = useState<string | undefined>();
  const [isThoughtEmoji, setIsThoughtEmoji] = useState(false);
  const [quizOptions, setQuizOptions] = useState<Word[]>([]);
  const [debugModalVisible, setDebugModalVisible] = useState(false);
  const [popTexts, setPopTexts] = useState<{ id: number; text: string }[]>([]);
  const [goalPulse, setGoalPulse] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [wanderPosition, setWanderPosition] = useState({ x: 0, y: 0 });

  // Debug page state
  const [currentPage, setCurrentPage] = useState<PageName>(() => {
    // Check URL for ?debug=true
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'true' ? 'debug' : 'main';
  });

  // Keyboard shortcut for debug page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        setCurrentPage(prev => prev === 'debug' ? 'main' : 'debug');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Animation time for sleep overlay
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTime(t => t + 1);
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, []);

  // Update session awake state when game wakes up
  useEffect(() => {
    if (gameState.awake && !session.awake) {
      updateSession({ awake: true });
    }
  }, [gameState.awake, session.awake, updateSession]);

  const showPop = useCallback((text: string, sayIt: boolean = false) => {
    const id = Date.now();
    setPopTexts(prev => [...prev, { id, text }]);
    if (sayIt) speak(text);
  }, []);

  const handleWakeUp = useCallback(() => {
    if (gameState.awake) return;

    unlockAudio();
    gameActions.wakeUp();
    petRef.current?.setEmotionalState('greeting');

    const greeting = '안녕! 나는 보리야!';
    setThoughtText(greeting);
    setThoughtVisible(true);
    setIsThoughtEmoji(false);
    setThoughtFontSize(undefined);

    setTimeout(() => {
      speak(greeting);
    }, 300);

    setTimeout(() => {
      setThoughtVisible(false);
      handleReturnState();
    }, 2500);
  }, [gameState.awake, gameActions]);

  const handleReturnState = useCallback(() => {
    if (returnType === 'lapsed') {
      petRef.current?.setEmotionalState('sad');
      setThoughtText('...보고 싶었어');
      setThoughtVisible(true);
      speak('보고 싶었어');
      setTimeout(() => {
        setThoughtVisible(false);
        gameActions.decideDefaultState();
      }, 2000);
    } else if (returnType === 'new-day') {
      petRef.current?.setEmotionalState('excited');
      showPop(getTimeGreeting(), true);
      setTimeout(() => {
        gameActions.decideDefaultState();
      }, 1500);
    } else if (returnType === 'same-day') {
      petRef.current?.setEmotionalState('happy');
      const greeting = randomPhrase('greeting');
      setThoughtText(greeting);
      setThoughtVisible(true);
      speak(greeting);
      setTimeout(() => {
        setThoughtVisible(false);
        gameActions.decideDefaultState();
      }, 1500);
    } else {
      gameActions.decideDefaultState();
    }
  }, [returnType, gameActions, showPop]);

  const startQuiz = useCallback((playerInitiated: boolean = false) => {
    const { word, isReverse, isPhrase, adjective } = quiz.startQuiz(playerInitiated);
    petRef.current?.setEmotionalState('playing');

    if (isPhrase && adjective) {
      const phrase = `${adjective.korean} ${word.korean} 주세요!`;
      setThoughtText(phrase);
      setThoughtFontSize(undefined);
      setIsThoughtEmoji(false);
      speak(phrase);
    } else if (isReverse) {
      setThoughtText(word.emoji);
      setThoughtFontSize('36px');
      setIsThoughtEmoji(true);
      speak(word.korean);
    } else {
      const requestText = playerInitiated
        ? `${word.korean} 줄까?`
        : gameState.happiness < 40
        ? `놀자! ${word.korean}?`
        : `${word.korean} 주세요!`;
      setThoughtText(requestText);
      setThoughtFontSize(undefined);
      setIsThoughtEmoji(false);
      speak(requestText);
    }

    setThoughtVisible(true);
    setQuizOptions(quiz.getQuizOptions());
    gameActions.setFoodMenuOpen(true);
  }, [quiz, gameState.happiness, gameActions]);

  const handleAnswer = useCallback((chosen: Word, btn: HTMLButtonElement) => {
    const isCorrect = quiz.checkAnswer(chosen);
    const currentWord = quiz.quizState.currentWord;

    if (isCorrect && currentWord) {
      const prevCats = getUnlockedCategories().map(c => c.id);

      const stats = getStats(currentWord.korean);
      updateWordStats(currentWord.korean, {
        correctCount: stats.correctCount + 1,
        correctStreak: stats.correctStreak + 1,
        lastSeen: Date.now(),
        interval: Math.min(Math.max((stats.interval || 0) * 2 || 30000, 30000), 86400000),
      });

      quiz.incrementStreak();

      const newDailyCount = session.dailyCorrectCount + 1;
      const justMetGoal = !gameState.dailyGoalMet && newDailyCount >= session.dailyGoal;
      if (justMetGoal) {
        gameActions.setDailyGoalMet(true);
      }

      const isFirstFeed = !session.firstFeedComplete;
      if (isFirstFeed) {
        updateSession({ firstFeedComplete: true, dailyCorrectCount: newDailyCount });
      } else {
        updateSession({ dailyCorrectCount: newDailyCount });
      }

      const newCats = getUnlockedCategories().map(c => c.id);
      const newlyUnlocked = CATEGORIES.find(c => newCats.includes(c.id) && !prevCats.includes(c.id));

      gameActions.setFoodMenuOpen(false);
      setThoughtVisible(false);
      setQuizOptions([]);
      gameActions.feed(100);
      gameActions.boostHappiness(30);
      gameActions.setGameState('eating');
      petRef.current?.setEmotionalState('eating');

      const wasLapsed = returnType === 'lapsed';
      if (wasLapsed) {
        setReturnType('restored');
      }

      setTimeout(() => {
        if (wasLapsed) {
          petRef.current?.setEmotionalState('excited');
          showPop('다시 만나서 반가워!', true);
          setTimeout(() => gameActions.decideDefaultState(), 2200);
        } else if (isFirstFeed) {
          showConfetti();
          petRef.current?.setEmotionalState('excited');
          setThoughtText('와! 보리 첫 밥이야! 고마워!');
          setThoughtVisible(true);
          speak('와! 보리 첫 밥이야! 고마워!');
          setTimeout(() => {
            setThoughtVisible(false);
            gameActions.decideDefaultState();
          }, 2500);
        } else if (newlyUnlocked) {
          petRef.current?.setEmotionalState('proud');
          const preview = newlyUnlocked.words.slice(0, 3).map(w => w.emoji).join('');
          showPop(`${newlyUnlocked.name}! ${preview}`);
          speak(newlyUnlocked.name);
          setTimeout(() => gameActions.decideDefaultState(), 2200);
        } else if (justMetGoal) {
          petRef.current?.setEmotionalState('proud');
          showPop('잘했어!', true);
          setGoalPulse(true);
          setTimeout(() => setGoalPulse(false), 2000);
          setTimeout(() => gameActions.decideDefaultState(), 2200);
        } else {
          let responseText: string;
          let doExtraCelebration = false;
          if (Math.random() < 0.05) {
            responseText = '와!! 이거 제일 좋아해!!';
            doExtraCelebration = true;
            petRef.current?.setEmotionalState('excited');
          } else {
            responseText = randomPhrase('delicious');
            petRef.current?.setEmotionalState('thanking');
          }

          setThoughtText(responseText);
          setThoughtVisible(true);
          speak(responseText);

          if (quiz.quizState.streak >= 3 || doExtraCelebration) {
            petRef.current?.setEmotionalState('excited');
            quiz.resetStreak();
          }

          setTimeout(() => {
            setThoughtVisible(false);
            gameActions.decideDefaultState();
          }, 2000);
        }
      }, 1200);

      quiz.endQuiz();
    } else if (currentWord) {
      // Wrong answer
      markButtonWrong(btn);
      petRef.current?.setEmotionalState('sad');

      updateWordStats(currentWord.korean, {
        correctStreak: 0,
        lastSeen: Date.now(),
        interval: 30000,
      });
      quiz.resetStreak();

      const wrongMsg = randomPhrase('wrongAnswer');
      if (quiz.quizState.isPhraseQuiz && quiz.quizState.phraseAdjective) {
        const phrase = `${wrongMsg} ${quiz.quizState.phraseAdjective.korean} ${currentWord.korean}!`;
        setThoughtText(phrase);
        speak(phrase);
      } else {
        setThoughtText(`${wrongMsg} ${currentWord.korean}!`);
        speak(currentWord.korean);
      }
      setThoughtVisible(true);

      setTimeout(() => {
        petRef.current?.setEmotionalState('playing');
      }, 1800);
    }
  }, [
    quiz, session, gameState.dailyGoalMet, gameActions, returnType,
    getStats, updateWordStats, updateSession, getUnlockedCategories,
    showPop, showConfetti, setReturnType
  ]);

  const handlePetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gameState.awake) return;
    if (['flying', 'walking', 'discovering', 'eating'].includes(gameState.gameState)) return;

    // Poke reaction
    petRef.current?.handlePoke(e.clientX, e.clientY);
    gameActions.boostHappiness(2);
  }, [gameState.awake, gameState.gameState, gameActions]);

  const handleThoughtBubbleClick = useCallback(() => {
    if (quiz.quizState.currentWord) {
      // Toggle food menu when clicking on the speech bubble
      if (gameState.foodMenuOpen) {
        gameActions.setFoodMenuOpen(false);
      } else {
        setQuizOptions(quiz.getQuizOptions());
        gameActions.setFoodMenuOpen(true);
      }
    }
  }, [quiz.quizState.currentWord, quiz, gameState.foodMenuOpen, gameActions]);

  const handleVolumeClick = useCallback(() => {
    if (quiz.quizState.currentWord) {
      speak(thoughtText);
    }
  }, [quiz.quizState.currentWord, thoughtText]);

  // Check for hunger-triggered quiz
  useEffect(() => {
    if (!gameState.awake) return;
    if (quiz.quizState.currentWord) return;
    if (['discovering', 'eating', 'sleeping', 'waking'].includes(gameState.gameState)) return;

    if (gameState.hunger < 40 && gameState.gameState !== 'hungry') {
      gameActions.setGameState('hungry');
    }

    if (gameState.gameState === 'hungry' && !quiz.quizState.currentWord) {
      startQuiz(false);
    }
  }, [gameState.awake, gameState.hunger, gameState.gameState, quiz.quizState.currentWord, gameActions, startQuiz]);

  // Check for boredom state
  useEffect(() => {
    if (!gameState.awake) return;
    if (quiz.quizState.currentWord) return;
    if (['discovering', 'eating', 'sleeping', 'waking', 'hungry'].includes(gameState.gameState)) return;

    if (gameState.happiness < 40 && gameState.gameState === 'idle') {
      gameActions.setGameState('bored');
      const msg = randomPhrase('bored');
      setThoughtText(msg);
      setThoughtVisible(true);
      speak(msg.replace('...', ''));
    }
  }, [gameState.awake, gameState.happiness, gameState.gameState, quiz.quizState.currentWord, gameActions]);

  // Random quiz trigger
  useEffect(() => {
    if (!gameState.awake || quiz.quizState.currentWord) return;

    const checkInterval = setInterval(() => {
      if (gameActions.shouldTriggerRandomQuiz()) {
        petRef.current?.setEmotionalState('playing');
        const phrases = ['놀자!', '뭐 먹을까?', '같이 공부하자!', '심심해~'];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        setThoughtText(phrase);
        setThoughtVisible(true);
        speak(phrase);

        setTimeout(() => {
          setThoughtVisible(false);
          startQuiz(false);
        }, 1200);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [gameState.awake, quiz.quizState.currentWord, gameActions, startQuiz]);

  // Wandering update
  useEffect(() => {
    if (!gameState.awake || quiz.quizState.currentWord) return;
    if (gameState.gameState !== 'idle') return;

    const interval = setInterval(() => {
      const target = gameActions.updateWandering();
      if (target) {
        setWanderPosition(target);
        petRef.current?.setWanderTarget(target.x, target.y);
        if (target.x !== 0 || target.y !== 0) {
          // Eyes look in direction of movement, scaled to actual distance
          // Horizontal: scale by distance, max ~6 for wide looks
          const lookX = Math.sign(target.x) * Math.min(Math.abs(target.x) * 0.15, 6);
          // Vertical: slight upward look when moving, varies with horizontal
          const lookY = -1.5 + Math.sin(target.x * 0.1) * 1.5;
          petRef.current?.setLookTarget(lookX, lookY);
        } else {
          petRef.current?.resetLookTarget();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.awake, gameState.gameState, quiz.quizState.currentWord, gameActions]);

  // Debug handlers
  const handleTriggerDiscovery = useCallback(() => {
    if (!gameState.awake) return;
    gameActions.setFoodMenuOpen(false);
    quiz.endQuiz();
    setThoughtVisible(false);

    const word = quiz.pickDiscoveryWord();
    const stats = getStats(word.korean);
    updateWordStats(word.korean, { exposureCount: (stats.exposureCount || 0) + 1 });

    gameActions.setGameState('discovering');
    petRef.current?.setEmotionalState('playing');

    setThoughtText(`${word.emoji} ${word.korean}!`);
    setIsThoughtEmoji(true);
    setThoughtVisible(true);
    speak(word.korean);

    setTimeout(() => {
      setThoughtVisible(false);
      setIsThoughtEmoji(false);
      gameActions.decideDefaultState();
    }, 2500);
  }, [gameState.awake, gameActions, quiz, getStats, updateWordStats]);

  const handleTriggerHungerQuiz = useCallback(() => {
    if (!gameState.awake) return;
    gameActions.setHunger(30);
    gameActions.setHappiness(100);
    gameActions.setGameState('hungry');
    startQuiz(false);
  }, [gameState.awake, gameActions, startQuiz]);

  const handleTriggerBoredQuiz = useCallback(() => {
    if (!gameState.awake) return;
    gameActions.setHunger(100);
    gameActions.setHappiness(30);
    gameActions.setGameState('bored');
    startQuiz(false);
  }, [gameState.awake, gameActions, startQuiz]);

  const handleTriggerRandomQuiz = useCallback(() => {
    if (!gameState.awake) return;
    gameActions.setFoodMenuOpen(false);
    quiz.endQuiz();
    setThoughtVisible(false);

    petRef.current?.setEmotionalState('playing');
    const phrases = ['놀자!', '뭐 먹을까?', '같이 공부하자!', '심심해~'];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    setThoughtText(phrase);
    setThoughtVisible(true);
    speak(phrase);

    setTimeout(() => {
      setThoughtVisible(false);
      startQuiz(false);
    }, 1200);
  }, [gameState.awake, gameActions, quiz, startQuiz]);

  if (!isLoaded) {
    return null;
  }

  // Render debug page
  if (currentPage === 'debug') {
    return <DebugPage onClose={() => setCurrentPage('main')} />;
  }

  const creatureZoneStyle = wanderPosition.x !== 0 || wanderPosition.y !== 0
    ? { transform: `translate(calc(-50% + ${wanderPosition.x}px), calc(-50% + ${wanderPosition.y}px))` }
    : undefined;

  return (
    <div className="world">
      <HUD
        ref={hudRef}
        currentStreak={session.currentStreak}
        learnedWordCount={getLearnedWordCount()}
        dailyCorrectCount={session.dailyCorrectCount}
        dailyGoal={session.dailyGoal}
        onDebugClick={() => setDebugModalVisible(true)}
        goalPulse={goalPulse}
      />

      <StatusBar
        hunger={gameState.hunger}
        happiness={gameState.happiness}
        visible={gameState.awake}
      />

      <div ref={creatureZoneRef} className="creature-zone" style={creatureZoneStyle}>
        <ThoughtBubble
          text={thoughtText}
          visible={thoughtVisible}
          fontSize={thoughtFontSize}
          onBubbleClick={handleThoughtBubbleClick}
          onVolumeClick={handleVolumeClick}
          isEmoji={isThoughtEmoji}
          isClickable={!!quiz.quizState.currentWord}
        />

        <FoodMenu
          options={quizOptions}
          visible={gameState.foodMenuOpen}
          isReverseQuiz={quiz.quizState.isReverseQuiz}
          onSelect={handleAnswer}
        />

        <Pet
          ref={petRef}
          gameState={gameState.gameState}
          isQuizActive={!!quiz.quizState.currentWord}
          hunger={gameState.hunger}
          happiness={gameState.happiness}
          onClick={handlePetClick}
        />

        {popTexts.map(({ id, text }) => (
          <PopText
            key={id}
            text={text}
            onComplete={() => setPopTexts(prev => prev.filter(p => p.id !== id))}
          />
        ))}
      </div>

      <SleepOverlay
        visible={!gameState.awake}
        onWake={handleWakeUp}
        animationTime={animationTime}
      />

      <Confetti pieces={confettiPieces} />

      <DebugModal
        visible={debugModalVisible}
        onClose={() => setDebugModalVisible(false)}
        hunger={gameState.hunger}
        happiness={gameState.happiness}
        quizFrequency={gameState.quizFrequency}
        onSetHunger={(v) => {
          gameActions.setHunger(v);
          if (gameState.awake && !quiz.quizState.currentWord) {
            gameActions.decideDefaultState();
          }
        }}
        onSetHappiness={(v) => {
          gameActions.setHappiness(v);
          if (gameState.awake && !quiz.quizState.currentWord) {
            gameActions.decideDefaultState();
          }
        }}
        onSetProgressLevel={setProgressLevel}
        onSetEmotionalState={(state) => petRef.current?.setEmotionalState(state)}
        onSetQuizFrequency={gameActions.setQuizFrequency}
        onTriggerDiscovery={handleTriggerDiscovery}
        onTriggerHungerQuiz={handleTriggerHungerQuiz}
        onTriggerBoredQuiz={handleTriggerBoredQuiz}
        onTriggerRandomQuiz={handleTriggerRandomQuiz}
        onTestSquish={() => petRef.current?.applySquish()}
        onForceWander={() => gameActions.startWandering()}
        onReset={resetAll}
        onOpenDebugPage={() => setCurrentPage('debug')}
      />
    </div>
  );
}
