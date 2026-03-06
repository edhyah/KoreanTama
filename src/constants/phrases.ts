export const PET_NAME = '보리';

export const PHRASES = {
  delicious: ['맛있어!', '최고야!', '더 줘~', '냠냠!', '보리 행복해!'],
  hungry: ['배고파...', '밥...', '보리 배고파...', '먹고 싶어...'],
  bored: ['심심해...', '놀아줘...', '뭐해?', '...'],
  happy: ['기분 좋아!', '오늘 좋은 날!', '놀자!', '헤헤~'],
  greeting: ['안녕!', '왔어!', '보고 싶었어!', '반가워!'],
  firstMeal: ['와! 보리 첫 밥이야!', '고마워! 잊지 않을게!'],
  wrongAnswer: ['이거 아니야...', '다시...', '음...?'],
  wakeGreeting: ['안녕! 나는 보리야!'],
} as const;

export type PhraseType = keyof typeof PHRASES;

export function randomPhrase(type: PhraseType): string {
  const pool = PHRASES[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return '좋은 아침!';
  if (hour >= 12 && hour < 18) return '안녕!';
  if (hour >= 18 && hour < 22) return '좋은 저녁!';
  return '졸려...';
}
