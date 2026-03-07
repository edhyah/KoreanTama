import type { EmotionalStates } from '../types';

export const EMOTIONAL_STATES: EmotionalStates = {
  // Neutral - cyan
  sleepy: {
    color: "#7EC8E3", scaleX: 1.02, scaleY: 0.96, offY: 2,
    eyeW: 16, eyeH: 16, pupilR: 5, lidTop: 0.35,
    mouth: "yawn", blush: false, anim: "drift",
    phrases: ["졸려요...💤", "잘 자요~", "눈이 감겨요..."]
  },
  // Positive - warm green
  greeting: {
    color: "#95E1A3", scaleX: 1.0, scaleY: 1.0, offY: 0,
    eyeW: 18, eyeH: 22, pupilR: 8, lidTop: 0.0,
    mouth: "bigSmile", blush: true, anim: "bounce",
    phrases: ["안녕! 나는 보리야!", "반가워요!", "잘 지냈어요?"]
  },
  // Negative - muted gray-blue
  hungry: {
    color: "#B0B8C4", scaleX: 0.96, scaleY: 0.93, offY: 4,
    eyeW: 20, eyeH: 24, pupilR: 9, lidTop: 0.0,
    mouth: "open", blush: false, anim: "wobble",
    phrases: ["배고파요...", "밥 주세요!", "먹고 싶어요..."]
  },
  // Negative - muted gray-blue
  bored: {
    color: "#B0B8C4", scaleX: 1.0, scaleY: 0.95, offY: 2,
    eyeW: 16, eyeH: 14, pupilR: 7, lidTop: 0.35,
    mouth: "flat", blush: false, anim: "drift",
    phrases: ["심심해요...", "놀아 줘요!", "뭐 할까요?"]
  },
  // Positive - warm green
  playing: {
    color: "#95E1A3", scaleX: 1.05, scaleY: 1.03, offY: -1,
    eyeW: 19, eyeH: 22, pupilR: 8, lidTop: 0.0,
    mouth: "bigSmile", blush: false, anim: "jump",
    phrases: ["놀자!", "재밌어요!", "같이 놀아요!"]
  },
  // Positive - warm green
  eating: {
    color: "#95E1A3", scaleX: 1.01, scaleY: 0.98, offY: 1,
    eyeW: 14, eyeH: 14, pupilR: 7, lidTop: 0.2,
    mouth: "munch", blush: true, anim: "munch",
    phrases: ["냠냠!", "맛있어요!", "더 주세요~"]
  },
  // Positive - warm green
  happy: {
    color: "#95E1A3", scaleX: 1.03, scaleY: 1.02, offY: -1,
    eyeW: 17, eyeH: 20, pupilR: 8, lidTop: 0.0,
    mouth: "bigSmile", blush: true, anim: "bounce",
    phrases: ["행복해요!", "기분 좋아요!", "헤헤~"]
  },
  // Negative - muted gray-blue
  sad: {
    color: "#B0B8C4", scaleX: 0.97, scaleY: 0.93, offY: 4,
    eyeW: 18, eyeH: 24, pupilR: 9, lidTop: 0.15,
    mouth: "frown", blush: false, anim: "drift",
    phrases: ["슬퍼요...", "기분이 안 좋아요", "위로해 줘요..."]
  },
  // Positive - warm green
  excited: {
    color: "#95E1A3", scaleX: 1.06, scaleY: 1.04, offY: -2,
    eyeW: 20, eyeH: 24, pupilR: 9, lidTop: 0.0,
    mouth: "bigSmile", blush: true, anim: "jump",
    phrases: ["와아아!", "대박이다!", "최고! 최고!"]
  },
  // Positive - warm green
  proud: {
    color: "#95E1A3", scaleX: 1.03, scaleY: 1.03, offY: -1,
    eyeW: 16, eyeH: 18, pupilR: 7, lidTop: 0.15,
    mouth: "smirk", blush: true, anim: "nod",
    phrases: ["잘했지?", "나 멋있어!", "역시 나야!"]
  },
  // Positive - warm green
  thanking: {
    color: "#95E1A3", scaleX: 1.0, scaleY: 0.97, offY: 1,
    eyeW: 16, eyeH: 20, pupilR: 7, lidTop: 0.15,
    mouth: "smile", blush: true, anim: "nod",
    phrases: ["고마워요!", "감사합니다!", "최고예요!"]
  },
  // Negative - muted gray-blue
  annoyed: {
    color: "#B0B8C4", scaleX: 0.98, scaleY: 0.97, offY: 1,
    eyeW: 15, eyeH: 16, pupilR: 6, lidTop: 0.25,
    mouth: "pout", blush: false, anim: "shiver",
    phrases: ["으으...", "왜 그래요!", "그만해요~"]
  }
};

export const TRANSITION_DURATION = 600; // ms
