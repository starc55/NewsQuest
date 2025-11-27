import { HistoryItem, RiddleData } from '../types';

const STORAGE_KEY = 'newsquest_solved_history';
const MAX_ITEMS = 12; // Limit items to prevent localStorage quota exceeded (images are heavy)

export const storageService = {
  getHistory: (): HistoryItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  },

  saveToHistory: (riddle: RiddleData, imageUrl: string): HistoryItem[] => {
    const newItem: HistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      timestamp: Date.now(),
      topic: riddle.news_topic || "Mystery Topic",
      question: riddle.riddle_question,
      answer: riddle.choices[riddle.answerIndex],
      fun_fact: riddle.fun_fact,
      image_url: imageUrl
    };

    let history = storageService.getHistory();
    // Prevent duplicates based on topic/question combo (simple check)
    if (history.some(h => h.question === newItem.question)) {
      return history;
    }

    // Add to top
    history.unshift(newItem); 

    // Enforce soft count limit
    if (history.length > MAX_ITEMS) {
      history = history.slice(0, MAX_ITEMS);
    }

    // Attempt to save, removing old items if quota still exceeded
    while (history.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return history;
      } catch (e) {
        // QuotaExceededError or similar
        console.warn("Storage quota exceeded, removing oldest item...");
        if (history.length > 1) {
           history.pop(); // Remove the oldest (last) item
        } else {
           console.error("Storage full, cannot save even one item.");
           break;
        }
      }
    }
    return history;
  },
  
  clearHistory: () => {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};