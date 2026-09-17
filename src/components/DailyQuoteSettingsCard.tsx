import React, { useState, useEffect } from 'react';
import { Quote, RefreshCw, Sparkles, Check, Type, Palette } from 'lucide-react';
import { ClockFont } from '../types';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { fetchDailyQuote, QuoteData } from '../utils/quotes';

interface DailyQuoteSettingsCardProps {
  enabled: boolean;
  font: ClockFont;
  color: string;
  clockColor: string;
  onToggle: (enabled: boolean) => void;
  onChangeFont: (font: ClockFont) => void;
  onChangeColor: (color: string) => void;
  showFeedback?: (msg: string) => void;
}

interface FontOption {
  id: ClockFont;
  name: string;
  badge: string;
  previewClass: string;
}

const FONT_OPTIONS: FontOption[] = [
  { id: 'serif', name: 'Playfair Display', badge: 'Klassisch / Zitat', previewClass: 'font-serif-clock italic' },
  { id: 'outfit', name: 'Outfit', badge: 'Geometrisch', previewClass: 'font-outfit' },
  { id: 'inter', name: 'Inter', badge: 'Sans-Serif', previewClass: 'font-inter' },
  { id: 'mono', name: 'JetBrains Mono', badge: 'Monospace', previewClass: 'font-mono-digital' },
  { id: 'school', name: 'Comfortaa', badge: 'Rund & Weich', previewClass: 'font-school' },
];

const PRESET_COLORS = [
  { label: 'Klassisch Weiß', hex: '#ffffff' },
  { label: 'Helles Schiefergrau', hex: '#e2e8f0' },
  { label: 'Goldgelb (Inspirierend)', hex: '#fde047' },
  { label: 'Himmelblau', hex: '#38bdf8' },
  { label: 'Roségold', hex: '#f472b6' },
  { label: 'Smaragdgrün', hex: '#34d399' },
];

export const DailyQuoteSettingsCard: React.FC<DailyQuoteSettingsCardProps> = ({
  enabled,
  font,
  color,
  clockColor,
  onToggle,
  onChangeFont,
  onChangeColor,
  showFeedback,
}) => {
  const [sampleQuote, setSampleQuote] = useState<QuoteData | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  useEffect(() => {
    fetchDailyQuote(false).then((q) => setSampleQuote(q));
  }, []);

  const handleRefreshSample = async () => {
    setIsLoadingSample(true);
    try {
      const q = await fetchDailyQuote(true);
      setSampleQuote(q);
      showFeedback?.('Neues Zitat erfolgreich geladen');
    } catch {
      // Ignored
    } finally {
      setIsLoadingSample(false);
    }
  };

  const selectedFontClass = (() => {
    switch (font) {
      case 'serif':
        return 'font-serif-clock italic';
      case 'outfit':
        return 'font-outfit';
      case 'mono':
        return 'font-mono-digital';
      case 'school':
        return 'font-school';
      case 'inter':
      case 'sans':
      default:
        return 'font-inter';
    }
  })();

  return (
    <div
      id="daily-quote-settings-card"
      className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4 transition-all"
    >
      {/* Header & Toggle Switch */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-100">
                Tägliches Zitat (Daily Quote)
              </h4>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                Inspirierend
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Lädt ein motivierendes Zitat von einer kostenlosen öffentlichen API unterhalb der Uhr
            </p>
          </div>
        </div>

        <MaterialSwitch
          checked={enabled}
          onChange={(val) => {
            onToggle(val);
            showFeedback?.(val ? 'Tägliches Zitat aktiviert' : 'Tägliches Zitat deaktiviert');
          }}
          aria-label="Tägliches Zitat ein- oder ausschalten"
        />
      </div>

      {/* Expanded Configuration when enabled */}
      {enabled && (
        <div className="space-y-4 pt-2 border-t border-slate-800/70">
          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Live-Vorschau</span>
            </div>

            <p
              className={`text-sm sm:text-base leading-relaxed ${selectedFontClass} transition-all duration-200`}
              style={{ color: color || '#e2e8f0' }}
            >
              „{sampleQuote?.quote || 'The secret of getting ahead is getting started.'}“
            </p>

            <span className="text-xs text-slate-400 mt-1">
              — {sampleQuote?.author || 'Mark Twain'}
            </span>

            {/* Test button to fetch new quote right in settings */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={handleRefreshSample}
                disabled={isLoadingSample}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700/60 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSample ? 'animate-spin text-sky-400' : ''}`} />
                <span>Neues Zitat testen</span>
              </button>
            </div>
          </div>

          {/* Font Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              <span>Schriftart für das Zitat</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {FONT_OPTIONS.map((f) => {
                const isSelected = font === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onChangeFont(f.id);
                      showFeedback?.(`Schriftart auf ${f.name} geändert`);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/50 text-white shadow-sm'
                        : 'bg-slate-800/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-xs font-medium ${f.previewClass}`}>
                        {f.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {f.badge}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>Textfarbe des Zitats</span>
              </label>

              {/* Inherit clock color button */}
              <button
                type="button"
                onClick={() => {
                  onChangeColor(clockColor);
                  showFeedback?.('Farbe der Digitaluhr übernommen');
                }}
                className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Uhr-Farbe ({clockColor}) übernehmen</span>
              </button>
            </div>

            {/* Quick Color Swatches */}
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((p) => {
                const isCurrent = color?.toLowerCase() === p.hex.toLowerCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => {
                      onChangeColor(p.hex);
                      showFeedback?.(`Farbe auf ${p.label} geändert`);
                    }}
                    title={p.label}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-white bg-slate-800 text-white shadow-sm ring-1 ring-white/30'
                        : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="text-[11px]">{p.label}</span>
                  </button>
                );
              })}

              {/* Custom Native Color Input */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-800 bg-slate-800/50">
                <input
                  type="color"
                  value={color && color.startsWith('#') ? color : '#ffffff'}
                  onChange={(e) => onChangeColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                  title="Eigene Hex-Farbe auswählen"
                />
                <span className="text-[11px] font-mono text-slate-300">
                  {color || '#ffffff'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
