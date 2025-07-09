import React from 'react';

interface TypingAnimationProps {
  speaker: "Dr Ada" | "Sam";
  isVisible: boolean;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({ speaker, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/20 border border-dashed animate-fade-in">
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
          speaker === "Dr Ada" 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-secondary-foreground"
        }`}>
          {speaker === "Dr Ada" ? "A" : "S"}
        </div>
      </div>
      <div className="flex-1 flex items-center gap-3">
        <div className="flex items-center space-x-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm text-muted-foreground ml-3">
            {speaker} is thinking...
          </span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-medium">LIVE</span>
        </div>
      </div>
    </div>
  );
};