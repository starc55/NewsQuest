import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { ArrowLeft, Trash2, Calendar, Newspaper, Trophy, MoreVertical, Share2, Copy, Search, ExternalLink } from 'lucide-react';

interface HistoryScreenProps {
  history: HistoryItem[];
  onBack: () => void;
  onClear: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onBack, onClear }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: HistoryItem } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleClick);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, item: HistoryItem) => {
    e.preventDefault();
    const menuWidth = 200;
    const menuHeight = 160;
    let x = e.clientX;
    let y = e.clientY;

    // Boundary detection
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 20;
    if (y + menuHeight > window.innerHeight) y = e.clientY - menuHeight;

    setContextMenu({ x, y, item });
  };

  const performAction = async (action: 'share' | 'search' | 'copy') => {
    if (!contextMenu) return;
    const { item } = contextMenu;

    if (action === 'share') {
      try {
        let shareData: any = {
           title: 'NewsQuest Riddle',
           text: `${item.question}\n\nAnswer: ${item.answer}`,
        };

        // Try to share image if possible
        if (navigator.share) {
           try {
             const blob = await (await fetch(item.image_url)).blob();
             const file = new File([blob], 'riddle.png', { type: blob.type });
             if (navigator.canShare && navigator.canShare({ files: [file] })) {
                shareData.files = [file];
             }
           } catch (e) {
             console.warn("Could not process image for sharing", e);
           }
           await navigator.share(shareData);
        } else {
           // Fallback to clipboard
           performAction('copy');
           alert("Sharing not supported on this device. Details copied to clipboard!");
        }
      } catch (e) {
        console.warn("Share failed", e);
      }
    } else if (action === 'search') {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(item.topic + " news story")}`, '_blank');
    } else if (action === 'copy') {
      const text = `Topic: ${item.topic}\nQ: ${item.question}\nA: ${item.answer}\nFact: ${item.fun_fact}`;
      navigator.clipboard.writeText(text);
    }
    
    setContextMenu(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 animate-in slide-in-from-right-4 duration-500 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 backdrop-blur-md sticky top-4 z-20 shadow-xl">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors font-semibold"
        >
          <ArrowLeft size={20} /> Back to Menu
        </button>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-400" /> Collection ({history.length})
        </h2>
        <button 
          onClick={() => {
            if (window.confirm("Are you sure you want to clear your collection?")) {
              onClear();
            }
          }}
          disabled={history.length === 0}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Trash2 size={16} /> Clear
        </button>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
          <Trophy size={64} className="opacity-20" />
          <p className="text-lg">No solved riddles yet.</p>
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
          >
            Start Playing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {history.map((item) => (
            <div 
              key={item.id} 
              onContextMenu={(e) => handleContextMenu(e, item)}
              className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col group relative"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img 
                  src={item.image_url} 
                  alt={item.topic} 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                
                {/* Date Badge - Moved to left */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-xs font-mono text-slate-300 px-2 py-1 rounded flex items-center gap-1">
                  <Calendar size={10} /> {new Date(item.timestamp).toLocaleDateString()}
                </div>

                {/* Context Menu Trigger Button */}
                <button
                   onClick={(e) => {
                     e.stopPropagation();
                     e.preventDefault();
                     const rect = e.currentTarget.getBoundingClientRect();
                     // Position menu slightly below and to the left of the button
                     setContextMenu({ x: rect.left - 150, y: rect.bottom + 5, item });
                   }}
                   className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/80 rounded-full text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                   aria-label="More options"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Newspaper size={14} className="text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300 truncate">
                    {item.topic}
                  </span>
                </div>
                
                <h3 className="text-white font-bold mb-2 line-clamp-2 leading-tight">
                  {item.question}
                </h3>
                
                <div className="mt-auto pt-4 border-t border-slate-700/50">
                  <p className="text-green-400 text-sm font-bold mb-1">
                    Answer: {item.answer}
                  </p>
                  <p className="text-slate-400 text-xs italic line-clamp-3">
                    "{item.fun_fact}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Context Menu Portal/Overlay */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl py-1 w-48 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => performAction('share')}
            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
          >
            <Share2 size={16} className="text-blue-400" /> Share
          </button>
          <button 
            onClick={() => performAction('copy')}
            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
          >
            <Copy size={16} className="text-emerald-400" /> Save for later
          </button>
          <div className="h-px bg-slate-700 my-1 mx-2" />
          <button 
            onClick={() => performAction('search')}
            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
          >
            <Search size={16} className="text-purple-400" /> View related news
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;