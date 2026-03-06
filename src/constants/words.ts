import type { Category, Word, Adjective } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'food', name: '음식', unlockAt: 0, words: [
    { korean: '사과', emoji: '&#x1F34E;' }, { korean: '바나나', emoji: '&#x1F34C;' },
    { korean: '빵', emoji: '&#x1F35E;' }, { korean: '물', emoji: '&#x1F4A7;' },
    { korean: '우유', emoji: '&#x1F95B;' }, { korean: '딸기', emoji: '&#x1F353;' },
    { korean: '포도', emoji: '&#x1F347;' }, { korean: '수박', emoji: '&#x1F349;' },
    { korean: '주스', emoji: '&#x1F9C3;' }, { korean: '쿠키', emoji: '&#x1F36A;' },
    { korean: '밥', emoji: '&#x1F35A;' }, { korean: '케이크', emoji: '&#x1F370;' },
    { korean: '사탕', emoji: '&#x1F36C;' }, { korean: '아이스크림', emoji: '&#x1F366;' },
    { korean: '차', emoji: '&#x1F375;' }, { korean: '복숭아', emoji: '&#x1F351;' },
    { korean: '옥수수', emoji: '&#x1F33D;' }, { korean: '당근', emoji: '&#x1F955;' },
    { korean: '치즈', emoji: '&#x1F9C0;' }, { korean: '초콜릿', emoji: '&#x1F36B;' },
  ]},
  { id: 'animals', name: '동물', unlockAt: 15, words: [
    { korean: '강아지', emoji: '&#x1F415;' }, { korean: '고양이', emoji: '&#x1F431;' },
    { korean: '토끼', emoji: '&#x1F430;' }, { korean: '새', emoji: '&#x1F426;' },
    { korean: '물고기', emoji: '&#x1F41F;' }, { korean: '곰', emoji: '&#x1F43B;' },
    { korean: '원숭이', emoji: '&#x1F435;' }, { korean: '호랑이', emoji: '&#x1F42F;' },
    { korean: '코끼리', emoji: '&#x1F418;' }, { korean: '쥐', emoji: '&#x1F42D;' },
  ]},
  { id: 'colors', name: '색깔', unlockAt: 30, words: [
    { korean: '빨간색', emoji: '&#x1F534;' }, { korean: '파란색', emoji: '&#x1F535;' },
    { korean: '노란색', emoji: '&#x1F7E1;' }, { korean: '초록색', emoji: '&#x1F7E2;' },
    { korean: '하얀색', emoji: '&#x26AA;' }, { korean: '까만색', emoji: '&#x26AB;' },
    { korean: '보라색', emoji: '&#x1F7E3;' }, { korean: '주황색', emoji: '&#x1F7E0;' },
  ]},
  { id: 'objects', name: '물건', unlockAt: 50, words: [
    { korean: '집', emoji: '&#x1F3E0;' }, { korean: '나무', emoji: '&#x1F333;' },
    { korean: '꽃', emoji: '&#x1F338;' }, { korean: '책', emoji: '&#x1F4D6;' },
    { korean: '연필', emoji: '&#x270F;&#xFE0F;' }, { korean: '가방', emoji: '&#x1F392;' },
    { korean: '시계', emoji: '&#x23F0;' }, { korean: '전화', emoji: '&#x1F4F1;' },
    { korean: '열쇠', emoji: '&#x1F511;' }, { korean: '우산', emoji: '&#x2602;&#xFE0F;' },
  ]},
  { id: 'weather', name: '날씨', unlockAt: 70, words: [
    { korean: '해', emoji: '&#x2600;&#xFE0F;' }, { korean: '비', emoji: '&#x1F327;&#xFE0F;' },
    { korean: '눈', emoji: '&#x2744;&#xFE0F;' }, { korean: '구름', emoji: '&#x2601;&#xFE0F;' },
    { korean: '바람', emoji: '&#x1F32C;&#xFE0F;' }, { korean: '번개', emoji: '&#x26A1;' },
    { korean: '무지개', emoji: '&#x1F308;' }, { korean: '별', emoji: '&#x2B50;' },
  ]},
  { id: 'body', name: '몸', unlockAt: 90, words: [
    { korean: '눈', emoji: '&#x1F441;&#xFE0F;' }, { korean: '코', emoji: '&#x1F443;' },
    { korean: '입', emoji: '&#x1F444;' }, { korean: '귀', emoji: '&#x1F442;' },
    { korean: '손', emoji: '&#x270B;' }, { korean: '발', emoji: '&#x1F9B6;' },
    { korean: '머리', emoji: '&#x1F5E3;&#xFE0F;' }, { korean: '하트', emoji: '&#x2764;&#xFE0F;' },
  ]},
  { id: 'numbers', name: '숫자', unlockAt: 110, words: [
    { korean: '하나', emoji: '1&#xFE0F;&#x20E3;' }, { korean: '둘', emoji: '2&#xFE0F;&#x20E3;' },
    { korean: '셋', emoji: '3&#xFE0F;&#x20E3;' }, { korean: '넷', emoji: '4&#xFE0F;&#x20E3;' },
    { korean: '다섯', emoji: '5&#xFE0F;&#x20E3;' },
  ]},
  { id: 'actions', name: '동작', unlockAt: 135, words: [
    { korean: '먹다', emoji: '&#x1F37D;&#xFE0F;' }, { korean: '자다', emoji: '&#x1F634;' },
    { korean: '걷다', emoji: '&#x1F6B6;' }, { korean: '달리다', emoji: '&#x1F3C3;' },
    { korean: '울다', emoji: '&#x1F622;' }, { korean: '웃다', emoji: '&#x1F60A;' },
    { korean: '노래', emoji: '&#x1F3B5;' }, { korean: '춤', emoji: '&#x1F483;' },
  ]},
];

// Flatten for quick lookup
export const WORDS: Word[] = CATEGORIES.flatMap(cat =>
  cat.words.map(w => ({ korean: w.korean, emoji: w.emoji, category: cat.id }))
);

export const ADJECTIVES: Adjective[] = [
  { korean: '빨간', english: 'red' },
  { korean: '큰', english: 'big' },
  { korean: '작은', english: 'small' },
  { korean: '차가운', english: 'cold' },
  { korean: '뜨거운', english: 'hot' },
];
