import React from 'react';
import { Loader2, Newspaper, Palette, BrainCircuit } from 'lucide-react';

interface LoadingViewProps {
  status: 'searching' | 'generating_riddle' | 'generating_image';
}

const LoadingView: React.FC<LoadingViewProps> = ({ status }) => {
  const getMessage = () => {
    switch (status) {
      case 'searching':
        return { icon: <Newspaper className="w-12 h-12 text-blue-400 mb-4 animate-bounce" />, text: "Scouring the globe for trending news..." };
      case 'generating_riddle':
        return { icon: <BrainCircuit className="w-12 h-12 text-purple-400 mb-4 animate-pulse" />, text: "Crafting a clever riddle..." };
      case 'generating_image':
        return { icon: <Palette className="w-12 h-12 text-pink-400 mb-4 animate-spin-slow" />, text: "Painting the clues..." };
      default:
        return { icon: <Loader2 className="w-12 h-12 animate-spin" />, text: "Loading..." };
    }
  };

  const { icon, text } = getMessage();

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
      {icon}
      <h3 className="text-xl font-bold text-slate-200 text-center">{text}</h3>
      <p className="text-slate-400 mt-2 text-sm text-center max-w-xs">Powered by Gemini 2.5 Flash</p>
    </div>
  );
};

export default LoadingView;