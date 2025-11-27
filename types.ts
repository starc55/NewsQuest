export interface RiddleData {
  image_prompt: string;
  riddle_question: string;
  choices: string[];
  answerIndex: number;
  hints: string[];
  fun_fact: string;
  news_topic?: string;
  difficulty?: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface HistoryItem {
  id: string;
  timestamp: number;
  topic: string;
  question: string;
  answer: string;
  fun_fact: string;
  image_url: string;
  difficulty?: string;
}

export interface GameState {
  status: 'idle' | 'searching' | 'generating_riddle' | 'generating_image' | 'playing' | 'solved' | 'failed' | 'error' | 'history';
  riddle: RiddleData | null;
  imageUrl: string | null;
  selectedAnswer: number | null;
  hintsRevealed: number;
  error?: string;
  score: number;
}

export enum GameActionType {
  START_SEARCH = 'START_SEARCH',
  START_GEN_RIDDLE = 'START_GEN_RIDDLE',
  START_GEN_IMAGE = 'START_GEN_IMAGE',
  RIDDLE_READY = 'RIDDLE_READY',
  IMAGE_READY = 'IMAGE_READY',
  ANSWER_SELECTED = 'ANSWER_SELECTED',
  REVEAL_HINT = 'REVEAL_HINT',
  RESET = 'RESET',
  ERROR = 'ERROR',
  OPEN_HISTORY = 'OPEN_HISTORY',
  CLOSE_HISTORY = 'CLOSE_HISTORY'
}

export interface GameAction {
  type: GameActionType;
  payload?: any;
}