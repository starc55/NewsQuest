import React, { useState, useEffect } from 'react';
import { GameState, GameAction, GameActionType, HistoryItem, Difficulty } from './types';
import { fetchTrendingNews, generateRiddleFromTopic, generateRiddleImage } from './services/geminiService';
import { audioService } from './services/audioService';
import { storageService } from './services/storageService';
import LoadingView from './components/LoadingView';
import GameScreen from './components/GameScreen';
import HistoryScreen from './components/HistoryScreen';
import { Search, Sparkles, AlertCircle, Volume2, VolumeX, Trophy, Globe, Cpu, Trophy as TrophyIcon, Film, Flame, Zap, Brain, Hexagon } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    riddle: null,
    imageUrl: null,
    selectedAnswer: null,
    hintsRevealed: 0,
    score: 0
  });

  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isMuted, setIsMuted] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [streak, setStreak] = useState(0);

  // Initialize history, streak, and mute state
  useEffect(() => {
    audioService.setMuted(isMuted);
    setHistory(storageService.getHistory());
    
    const savedStreak = localStorage.getItem('newsquest_streak');
    if (savedStreak) setStreak(parseInt(savedStreak, 10));
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const updateStreak = (increment: boolean) => {
    const newStreak = increment ? streak + 1 : 0;
    setStreak(newStreak);
    localStorage.setItem('newsquest_streak', newStreak.toString());
  };

  const dispatch = (action: GameAction) => {
    switch (action.type) {
      case GameActionType.START_SEARCH:
        setGameState(prev => ({ ...prev, status: 'searching', error: undefined }));
        break;
      case GameActionType.START_GEN_RIDDLE:
        setGameState(prev => ({ ...prev, status: 'generating_riddle', error: undefined }));
        break;
      case GameActionType.RIDDLE_READY:
        setGameState(prev => ({ ...prev, status: 'generating_image', riddle: action.payload }));
        break;
      case GameActionType.IMAGE_READY:
        setGameState(prev => ({ ...prev, status: 'playing', imageUrl: action.payload }));
        break;
      case GameActionType.RESET:
        setGameState(prev => ({ 
            ...prev, 
            status: 'idle', 
            riddle: null, 
            imageUrl: null, 
            selectedAnswer: null, 
            hintsRevealed: 0,
            error: undefined
        }));
        setCustomTopic('');
        break;
      case GameActionType.ERROR:
        setGameState(prev => ({ ...prev, status: 'error', error: action.payload }));
        break;
      case GameActionType.OPEN_HISTORY:
        setGameState(prev => ({ ...prev, status: 'history' }));
        break;
      case GameActionType.CLOSE_HISTORY:
        setGameState(prev => ({ ...prev, status: 'idle' }));
        break;
    }
  };

  const handleStartGame = async (useTrending: boolean, category?: string) => {
    try {
      audioService.startBGM();
      let topic = customTopic;

      if (useTrending) {
        dispatch({ type: GameActionType.START_SEARCH });
        topic = await fetchTrendingNews(category);
      } else {
        if (!topic.trim()) return;
      }

      dispatch({ type: GameActionType.START_GEN_RIDDLE });
      const riddleData = await generateRiddleFromTopic(topic, difficulty);
      
      dispatch({ type: GameActionType.RIDDLE_READY, payload: riddleData });

      const imageUrl = await generateRiddleImage(riddleData.image_prompt);
      dispatch({ type: GameActionType.IMAGE_READY, payload: imageUrl });

    } catch (error: any) {
      dispatch({ type: GameActionType.ERROR, payload: error.message || "An unexpected error occurred." });
    }
  };

  const handleGameComplete = (isCorrect: boolean) => {
    updateStreak(isCorrect);
    if (isCorrect && gameState.riddle && gameState.imageUrl) {
      const updatedHistory = storageService.saveToHistory(gameState.riddle, gameState.imageUrl);
      setHistory(updatedHistory);
    }
  };

  const handleClearHistory = () => {
    const empty = storageService.clearHistory();
    setHistory(empty);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center">
      
      {/* Navbar / Header */}
      <header className="w-full p-6 flex justify-between items-center max-w-6xl z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => dispatch({type: GameActionType.RESET})}>
          <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
             <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white hidden sm:block leading-none">NewsQuest</h1>
            <span className="text-xs text-blue-300 font-medium hidden sm:block">Daily Riddle</span>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          {/* Streak Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-full border border-slate-700 mr-2" title="Current Winning Streak">
            <Flame size={18} className={`${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-600'}`} />
            <span className={`text-sm font-bold ${streak > 0 ? 'text-orange-200' : 'text-slate-500'}`}>{streak}</span>
          </div>

          {history.length > 0 && gameState.status === 'idle' && (
            <button
              onClick={() => dispatch({ type: GameActionType.OPEN_HISTORY })}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors mr-1 border border-slate-700"
            >
              <TrophyIcon size={18} className="text-yellow-500" />
              <span className="text-sm font-semibold hidden md:inline">Collection</span>
            </button>
          )}

          <button 
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center p-4 relative">
        
        {/* State: IDLE (Menu) */}
        {gameState.status === 'idle' && (
          <div className="w-full max-w-2xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-300 to-blue-200 pb-2">
                The Daily Riddle
              </h2>
              <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
                Turn trending headlines into mind-bending visual puzzles. <br/>Choose a difficulty and start your quest.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
              
              {/* Difficulty Selector */}
              <div className="flex justify-center">
                <div className="bg-slate-900/60 p-1.5 rounded-xl flex gap-1 border border-slate-700 shadow-inner">
                  <button
                    onClick={() => setDifficulty('easy')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      difficulty === 'easy' 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Zap size={16} /> Easy
                  </button>
                  <button
                    onClick={() => setDifficulty('medium')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      difficulty === 'medium' 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Brain size={16} /> Medium
                  </button>
                  <button
                    onClick={() => setDifficulty('hard')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      difficulty === 'hard' 
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Hexagon size={16} /> Hard
                  </button>
                </div>
              </div>

              {/* Option 1: Trending Categories Grid */}
              <div className="space-y-3 pt-2">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-center mb-2">Explore Trending Topics</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button 
                      onClick={() => handleStartGame(true, "World News")}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-700/50 hover:bg-blue-600/20 hover:border-blue-500/50 border border-slate-600 rounded-xl transition-all hover:-translate-y-1 group"
                    >
                      <Globe className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-sm font-semibold text-slate-200">World</span>
                    </button>
                    <button 
                      onClick={() => handleStartGame(true, "Technology")}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-700/50 hover:bg-purple-600/20 hover:border-purple-500/50 border border-slate-600 rounded-xl transition-all hover:-translate-y-1 group"
                    >
                      <Cpu className="text-purple-400 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-sm font-semibold text-slate-200">Tech</span>
                    </button>
                    <button 
                      onClick={() => handleStartGame(true, "Sports")}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-700/50 hover:bg-green-600/20 hover:border-green-500/50 border border-slate-600 rounded-xl transition-all hover:-translate-y-1 group"
                    >
                      <TrophyIcon className="text-green-400 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-sm font-semibold text-slate-200">Sports</span>
                    </button>
                    <button 
                      onClick={() => handleStartGame(true, "Entertainment")}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-700/50 hover:bg-pink-600/20 hover:border-pink-500/50 border border-slate-600 rounded-xl transition-all hover:-translate-y-1 group"
                    >
                      <Film className="text-pink-400 group-hover:scale-110 transition-transform" size={24} />
                      <span className="text-sm font-semibold text-slate-200">Pop Culture</span>
                    </button>
                 </div>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-600/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-800 px-2 text-slate-500 rounded-full">Or Create Your Own</span>
                </div>
              </div>

              {/* Option 2: Custom */}
              <div className="space-y-3">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Enter any topic (e.g., Mars, Ramen, Jazz...)"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartGame(false)}
                    className="w-full bg-slate-900/80 border border-slate-600 group-hover:border-slate-500 rounded-xl px-4 py-4 pl-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                  />
                  <Search className="absolute left-4 top-5 text-slate-500 w-5 h-5 group-hover:text-slate-300 transition-colors" />
                </div>
                <button
                  onClick={() => handleStartGame(false)}
                  disabled={!customTopic.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} /> Generate Riddle
                </button>
              </div>

            </div>

            {/* Quick Link to History if not empty */}
            {history.length > 0 && (
              <div className="flex justify-center">
                <button 
                  onClick={() => dispatch({ type: GameActionType.OPEN_HISTORY })}
                  className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2 transition-colors"
                >
                  <TrophyIcon size={14} /> View your {history.length} solved mysteries
                </button>
              </div>
            )}
          </div>
        )}

        {/* State: LOADING */}
        {(gameState.status === 'searching' || gameState.status === 'generating_riddle' || gameState.status === 'generating_image') && (
          <LoadingView status={gameState.status} />
        )}

        {/* State: PLAYING / SOLVED / FAILED */}
        {(gameState.status === 'playing' || gameState.status === 'solved' || gameState.status === 'failed') && gameState.riddle && gameState.imageUrl && (
          <GameScreen 
            riddle={gameState.riddle} 
            imageUrl={gameState.imageUrl} 
            onReset={() => dispatch({ type: GameActionType.RESET })}
            onGameComplete={handleGameComplete}
          />
        )}

        {/* State: HISTORY */}
        {gameState.status === 'history' && (
          <HistoryScreen 
            history={history} 
            onBack={() => dispatch({ type: GameActionType.CLOSE_HISTORY })} 
            onClear={handleClearHistory}
          />
        )}

        {/* State: ERROR */}
        {gameState.status === 'error' && (
          <div className="text-center p-8 bg-red-900/20 border border-red-500/50 rounded-2xl max-w-md animate-in zoom-in-95">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-200 mb-2">Oops! Something went wrong.</h3>
            <p className="text-red-300 mb-6">{gameState.error}</p>
            <button
              onClick={() => dispatch({ type: GameActionType.RESET })}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg border border-red-500/50 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

      </main>

      <footer className="w-full p-6 text-center text-slate-600 text-sm z-10">
        <p>Generated by Google Gemini 2.5 • Flash & Flash-Image Models</p>
      </footer>

    </div>
  );
};

export default App;