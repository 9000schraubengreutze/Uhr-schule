import React, { useState, useEffect, useCallback } from 'react';
import { Quote, RefreshCw, Copy, Check } from 'lucide-react';
import { ClockFont } from '../types';
import { fetchDailyQuote, QuoteData } from '../utils/quotes';

interface DailyQuoteWidgetProps {
  font?: ClockFont;
  color?: string;
  authorColor?: string;
  backdropBlur?: number;
  isZenMode?: boolean;
}

export const DailyQuoteWidget: React.FC<DailyQuoteWidgetProps> = ({
  font = 'serif',
  color = '#e2e8f0',
  authorColor,
  backdropBlur = 16,
  isZenMode = false,
}) => {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const loadQuote = useCallback(async (force: boolean = false) => {
    setIsLoading(true);
    try {
      const data = await fetchDailyQuote(force);
      setQuoteData(data);
    } catch (err) {
      console.warn('Failed to load quote:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuote(false);
  }, [loadQuote]);

  // Copy quote text + author to clipboard
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!quoteData) return;
    try {
      const textToCopy = `„${quoteData.quote}“ — ${quoteData.author}`;
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard fallback
      setIsCopied(false);
    }
  };

  // Resolve font CSS class
  const fontClass = (() => {
    switch (font) {
      case 'serif':
        return 'font-serif-clock italic tracking-wide';
      case 'outfit':
        return 'font-outfit tracking-tight';
      case 'mono':
        return 'font-mono-digital tracking-tight';
      case 'school':
        return 'font-school tracking-normal';
      case 'inter':
      case 'sans':
      default:
        return 'font-inter tracking-normal';
    }
  })();

  // Do not render in Zen mode to keep Zen mode strictly uncluttered
  if (isZenMode) {
    return null;
  }

  if (!quoteData) {
    return null;
  }

  const effectiveAuthorColor = authorColor || 'rgba(255, 255, 255, 0.65)';

  return (
    <div
      id="daily-quote-widget"
      className="relative mt-4 sm:mt-5 max-w-xl sm:max-w-2xl px-4 py-2.5 mx-auto flex flex-col items-center justify-center text-center transition-all duration-300 group select-text"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        textShadow: '0 2px 14px rgba(0, 0, 0, 0.7), 0 1px 4px rgba(0, 0, 0, 0.85)',
      }}
    >
      {/* Decorative backdrop pill when hovered or on tap for better legibility */}
      <div
        className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none ${
          isHovered
            ? 'bg-slate-950/40 border border-white/10 shadow-lg'
            : 'bg-transparent border border-transparent'
        }`}
        style={{
          backdropFilter: isHovered ? `blur(${backdropBlur}px)` : 'none',
          WebkitBackdropFilter: isHovered ? `blur(${backdropBlur}px)` : 'none',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-1.5 w-full">
        {/* Quote text with opening quotation mark icon */}
        <div className="flex items-start justify-center gap-2 max-w-full">
          <Quote
            className="w-4 h-4 shrink-0 mt-0.5 opacity-60 transition-opacity"
            style={{ color }}
          />
          <p
            className={`text-sm sm:text-base leading-relaxed ${fontClass} transition-colors duration-200 select-text`}
            style={{ color }}
          >
            „{quoteData.quote}“
          </p>
        </div>

        {/* Author attribution & interactive actions */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium tracking-wider uppercase mt-0.5">
          <span
            className="opacity-80 transition-colors duration-200"
            style={{ color: effectiveAuthorColor }}
          >
            — {quoteData.author}
          </span>

          {/* Action buttons (Refresh & Copy) */}
          <div
            className={`flex items-center gap-1 ml-2 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100'
            }`}
          >
            <button
              type="button"
              onClick={() => loadQuote(true)}
              disabled={isLoading}
              title="Neues Zitat laden (Zufälliges Zitat abrufen)"
              aria-label="Neues Zitat laden"
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              title={isCopied ? 'Kopiert!' : 'Zitat in Zwischenablage kopieren'}
              aria-label="Zitat kopieren"
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
