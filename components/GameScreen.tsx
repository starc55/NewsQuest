import React, { useState } from 'react';
import { RiddleData } from '../types';
import { Lightbulb, CheckCircle2, XCircle, Info, ArrowRight, Maximize2, X, Share2, Download, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioService } from '../services/audioService';

interface GameScreenProps {
  riddle: RiddleData;
  imageUrl: string;
  onReset: () => void;
  onGameComplete: (isCorrect: boolean) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ riddle, imageUrl, onReset, onGameComplete }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'success' | 'copied'>('idle');

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    const correct = index === riddle.answerIndex;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      audioService.playCorrect();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      audioService.playIncorrect();
    }
    
    // Notify parent to save history if correct
    onGameComplete(correct);
  };

  const revealHint = () => {
    if (revealedHints < riddle.hints.length) {
      audioService.playHint();
      setRevealedHints(prev => prev + 1);
    }
  };

  const handleShare = async () => {
    if (shareState === 'sharing') return;
    setShareState('sharing');

    const shareText = `🕵️ NewsQuest Challenge!\n\nTopic: ${riddle.news_topic}\n\nRiddle: ${riddle.riddle_question}\n\nCan you solve it? #NewsQuest #DailyRiddle`;
    const shareTitle = "NewsQuest Daily Riddle";

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        // Fetch image and convert to blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'newsquest-riddle.png', { type: blob.type });

        const shareData = {
          title: shareTitle,
          text: shareText,
          files: [file]
        };

        // Check if files are shareable (some browsers only support text/url)
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setShareState('success');
        } else {
          // Fallback to text-only share via native API
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: window.location.href // Optional: link to app
          });
          setShareState('success');
        }
      } else {
        throw new Error("Web Share API not supported");
      }
    } catch (error: any) {
      // Fallback: Copy to clipboard + Download Image
      if (error.name !== 'AbortError') {
        console.warn("Share failed or not supported, falling back to clipboard", error);
        
        try {
          await navigator.clipboard.writeText(shareText);
          
          // Trigger image download so user has the file
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `newsquest-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setShareState('copied');
        } catch (clipboardError) {
          console.error("Clipboard failed", clipboardError);
          setShareState('idle');
        }
      } else {
        setShareState('idle');
      }
    }

    // Reset state after delay
    setTimeout(() => {
      setShareState('idle');
    }, 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="mb-6 flex justify-between items-center bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-slate-700">
        <div>
           <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Topic</h2>
           <p className="text-lg font-semibold text-white truncate max-w-[200px] md:max-w-md">{riddle.news_topic || "Mystery Topic"}</p>
        </div>
        <button 
          onClick={onReset}
          className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full transition-colors border border-slate-600"
        >
          New Game
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Image */}
        <div className="space-y-4">
          <div className="relative group rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 aspect-square lg:aspect-[4/3] bg-slate-900">
            <img 
              src={imageUrl} 
              alt={`Visual riddle clue: ${riddle.image_prompt}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
              onClick={() => setIsImageOpen(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <button 
              onClick={() => setIsImageOpen(true)}
              className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
              aria-label="Maximize image"
            >
              <Maximize2 size={20} />
            </button>
          </div>
          
          {/* Hints Section */}
          <div className="flex gap-2 justify-center">
            {riddle.hints.map((hint, idx) => (
              <button
                key={idx}
                onClick={revealHint}
                disabled={revealedHints > idx || showResult}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  revealedHints > idx
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    : showResult 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
                }`}
                aria-label={revealedHints > idx ? `Hint ${idx + 1}: ${hint}` : `Reveal Hint ${idx + 1}`}
              >
                {revealedHints > idx ? (
                  <span className="flex items-center justify-center gap-2 animate-fade-in-up">
                    <Lightbulb size={14} aria-hidden="true" /> {hint}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lightbulb size={14} aria-hidden="true" /> Reveal Hint {idx + 1}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Question & Interaction */}
        <div className="flex flex-col justify-center space-y-6">
          
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <h3 className="text-2xl font-bold text-white mb-2 leading-tight relative z-10">{riddle.riddle_question}</h3>
            <p className="text-slate-400 text-sm relative z-10">Select the correct answer based on the image and news context.</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {riddle.choices.map((choice, idx) => {
              let btnClass = "p-4 rounded-xl text-left border-2 transition-all duration-300 transform font-medium text-lg relative overflow-hidden ";
              
              if (showResult) {
                if (idx === riddle.answerIndex) {
                  btnClass += "bg-green-500/20 border-green-500 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pop";
                } else if (idx === selected) {
                  btnClass += "bg-red-500/20 border-red-500 text-red-100 animate-shake";
                } else {
                  btnClass += "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
                }
              } else {
                btnClass += "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:scale-[1.02] active:scale-[0.98]";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={showResult}
                  className={btnClass}
                  aria-pressed={selected === idx}
                >
                  <span className="mr-3 opacity-50">{String.fromCharCode(65 + idx)}.</span>
                  {choice}
                  {showResult && idx === riddle.answerIndex && (
                     <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 animate-in zoom-in spin-in-12 duration-500" aria-label="Correct answer" />
                  )}
                  {showResult && idx === selected && idx !== riddle.answerIndex && (
                     <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 animate-in zoom-in duration-300" aria-label="Incorrect answer" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Result & Fun Fact Panel */}
          {showResult && (
            <div className={`p-5 rounded-xl border animate-in slide-in-from-bottom-2 duration-500 ${isCorrect ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`} role="status">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <Info className={isCorrect ? 'text-green-400' : 'text-red-400'} size={24} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h4 className={`text-lg font-bold mb-1 ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                    {isCorrect ? "Correct!" : "Nice try!"}
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    <span className="font-bold text-slate-200 uppercase text-xs tracking-wider block mb-1">Fun Fact</span>
                    {riddle.fun_fact}
                  </p>
                  
                  <div className="flex gap-2">
                     <button 
                      onClick={onReset}
                      className="flex-1 py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      Next Riddle <ArrowRight size={16} aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(riddle.news_topic || "")} news`, '_blank')}
                      className="px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 border text-sm bg-slate-800 text-blue-300 hover:bg-slate-700 border-slate-600 hover:text-blue-200"
                      title="Read related news"
                      aria-label="Read related news"
                    >
                       <ExternalLink size={18} aria-hidden="true" />
                    </button>

                    {isCorrect && (
                       <button 
                       onClick={handleShare}
                       disabled={shareState === 'sharing'}
                       className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 border text-sm min-w-[100px]
                         ${shareState === 'copied' || shareState === 'success'
                           ? 'bg-green-600/20 border-green-500/50 text-green-300' 
                           : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-600'
                         }`}
                       title={shareState === 'copied' ? "Text Copied, Image Downloading" : "Share Riddle"}
                     >
                       {shareState === 'sharing' ? (
                         <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                       ) : shareState === 'copied' ? (
                         <><CheckCircle2 size={16} className="text-green-400" aria-hidden="true"/> Copied!</>
                       ) : shareState === 'success' ? (
                         <><CheckCircle2 size={16} className="text-green-400" aria-hidden="true"/> Shared!</>
                       ) : (
                         <><Share2 size={16} aria-hidden="true" /> Share</>
                       )}
                     </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Image Modal */}
      {isImageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsImageOpen(false)} role="dialog" aria-label="Image view">
          <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors" aria-label="Close image">
            <X size={32} />
          </button>
          <img 
            src={imageUrl} 
            alt={`Enlarged visual riddle clue: ${riddle.image_prompt}`}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          />
        </div>
      )}

    </div>
  );
};

export default GameScreen;