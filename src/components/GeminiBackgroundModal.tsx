import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Download,
  Check,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  AlertCircle,
  Wand2,
  Maximize2,
  ChevronRight,
  History,
} from 'lucide-react';

interface GeminiBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImage: (file: File, promptDescription: string) => Promise<void> | void;
  backdropBlur?: number;
  accentColor?: string;
  showFeedback?: (msg: string) => void;
}

interface GeneratedHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  createdAt: number;
}

const STYLE_OPTIONS = [
  { id: 'cinematic', label: 'Cinematisch', desc: 'Dramatisches Licht & Kinolook', icon: '🎬' },
  { id: 'nature', label: 'Natur & Landschaft', desc: 'Berge, Wälder, Seen & Dämmerung', icon: '🏔️' },
  { id: 'minimalist', label: 'Minimalistisch', desc: 'Ruhige Ästhetik & viel Freiraum', icon: '🎨' },
  { id: 'cyberpunk', label: 'Cyberpunk & Neon', desc: 'Regennasse Nachtstadt & Lichter', icon: '🌆' },
  { id: 'space', label: 'Deep Space', desc: 'Galaxien, Nebel & Sternenstaub', icon: '🌌' },
  { id: 'anime', label: 'Anime / Shinkai', desc: 'Malerischer Himmel & weiche Wolken', icon: '🌸' },
  { id: 'abstract', label: '3D Abstrakt', desc: 'Fließende Formen & Farbverläufe', icon: '✨' },
];

const PROMPT_INSPIRATIONS = [
  'Ein stiller Bergsee in den Alpen bei Sonnenaufgang mit aufsteigendem Frühnebel',
  'Leuchtender kosmischer Nebel im Weltraum mit feinem Sternenstaub und fernen Galaxien',
  'Cyberpunk-Metropole bei Nacht im Regen mit sanften bunten Neon-Spiegelungen',
  'Minimalistische geschwungene Sanddünen in der Sahara im goldenen Abendlicht',
  'Malerischer Sonnenuntergang über einem ruhigen Kiefernwald mit weichen Wolken',
  'Japanischer Zen-Garten mit Moos, glatten Kieselsteinen und Kirschblüten im Dämmerlicht',
  'Abstrakte fließende organische Formen mit sanftem Seidenglanz und tiefem Indigo-Kontrast',
  'Nordlichter Aurora Borealis über einer verschneiten Fjordszene in Norwegen',
];

const STORAGE_KEY = 'webclock_gemini_bg_history_v1';

export const GeminiBackgroundModal: React.FC<GeminiBackgroundModalProps> = ({
  isOpen,
  onClose,
  onApplyImage,
  backdropBlur = 20,
  accentColor = '#3b82f6',
  showFeedback,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [history, setHistory] = useState<GeneratedHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 12));
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (imageUrl: string, promptText: string, styleId: string) => {
    try {
      const newItem: GeneratedHistoryItem = {
        id: `bg-${Date.now()}`,
        imageUrl,
        prompt: promptText,
        style: styleId,
        createdAt: Date.now(),
      };
      setHistory((prev) => {
        const next = [newItem, ...prev.filter((i) => i.prompt !== promptText)].slice(0, 8);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // If storage full, remove older ones
          const trimmed = next.slice(0, 4);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        }
        return next;
      });
    } catch (e) {
      console.warn('Could not cache history to localStorage', e);
    }
  };

  // Cycling loading text
  useEffect(() => {
    if (!isLoading) return;
    const steps = [
      'Gemini KI interpretiert deine Beschreibung...',
      'Komposition & Kontraste für Uhren-Lesbarkeit werden optimiert...',
      'Atmosphärische Beleuchtung wird verfeinert...',
      'Hintergrundbild wird fertiggestellt...',
    ];
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isOpen) return null;

  // Convert base64 data URL to a File
  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAppliedSuccess(false);

    try {
      const res = await fetch('/api/gemini/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || 'Fehler beim Erstellen des Bildes');
      }

      setGeneratedImage(data.imageUrl);
      saveToHistory(data.imageUrl, prompt.trim(), selectedStyle);
      if (showFeedback) {
        showFeedback('Hintergrundbild erfolgreich generiert!');
      }
    } catch (err: any) {
      console.error('Error generating background:', err);
      setErrorMessage(
        err.message ||
          'Die Bilderstellung ist fehlgeschlagen. Bitte prüfe deine Eingabe oder versuche es in Kürze erneut.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (imgUrlToApply?: string) => {
    const targetUrl = imgUrlToApply || generatedImage;
    if (!targetUrl) return;

    try {
      const file = await dataUrlToFile(targetUrl, `gemini-background-${Date.now()}.png`);
      await onApplyImage(file, prompt || 'Gemini KI Hintergrund');
      setAppliedSuccess(true);
      if (showFeedback) {
        showFeedback('Hintergrundbild erfolgreich angewendet!');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to apply image', err);
      setErrorMessage('Das Bild konnte nicht als Hintergrund gesetzt werden.');
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `webclock-gemini-background-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      id="gemini-background-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 transition-opacity duration-300"
      style={{ backdropFilter: `blur(${Math.min(backdropBlur, 24)}px)` }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        id="gemini-background-modal-container"
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-inner"
              style={{
                backgroundColor: `${accentColor}25`,
                borderColor: `${accentColor}50`,
                borderWidth: '1px',
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Gemini KI Hintergrund-Studio
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Gemini Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Beschreibe dein Wunschbild und lasse es von Gemini als Uhr-Hintergrund erstellen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab((p) => (p === 'create' ? 'history' : 'create'))}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Bisherige KI-Bilder ansehen"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Verlauf ({history.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {activeTab === 'history' ? (
            /* History Gallery View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Kürzlich erstellte KI-Hintergründe
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Neues Bild erstellen
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 aspect-video flex flex-col justify-end"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

                    <div className="relative z-10 p-2.5 space-y-1.5">
                      <p className="text-[11px] font-medium text-slate-200 line-clamp-1">
                        {item.prompt}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleApply(item.imageUrl)}
                        className="w-full py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <Check className="w-3 h-3" />
                        Anwenden
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Create View */
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Bildbeschreibung (Prompt)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {prompt.length} Zeichen
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="z. B. Ein malerischer Bergsee in den Alpen bei Sonnenaufgang mit aufsteigendem Frühnebel und goldenen Sonnenstrahlen..."
                    rows={3}
                    disabled={isLoading}
                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none disabled:opacity-50"
                  />
                  {prompt.length > 0 && !isLoading && (
                    <button
                      type="button"
                      onClick={() => setPrompt('')}
                      className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inspiration Prompts Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  💡 Ideen & Inspirationen:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {PROMPT_INSPIRATIONS.map((insp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(insp)}
                      disabled={isLoading}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer text-left truncate max-w-full"
                    >
                      {insp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Künstlerischer Stil</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STYLE_OPTIONS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setSelectedStyle(st.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedStyle === st.id
                          ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-2 ring-blue-500/25 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span>{st.icon}</span>
                        <span className="truncate">{st.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-200 block">
                  Bildformat (Seitenverhältnis)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '16:9' as const, label: '16:9 Breitbild', desc: 'Desktop / Vollbild' },
                    { id: '9:16' as const, label: '9:16 Hochformat', desc: 'Smartphone / Tablet' },
                    { id: '1:1' as const, label: '1:1 Quadrat', desc: 'Zentriert' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        aspectRatio === ratio.id
                          ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="text-xs font-semibold">{ratio.label}</div>
                      <div className="text-[10px] text-slate-400">{ratio.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Bilderstellung fehlgeschlagen</p>
                    <p className="text-rose-300/90 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Live Image Preview (when generated) */}
              {generatedImage && !isLoading && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Erfolgreich generiert
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {aspectRatio} • {STYLE_OPTIONS.find((s) => s.id === selectedStyle)?.label}
                    </span>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 aspect-video max-h-64 flex items-center justify-center bg-black">
                    <img
                      src={generatedImage}
                      alt={prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Actions for generated image */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApply()}
                      disabled={appliedSuccess}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                        appliedSuccess
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {appliedSuccess ? 'Als Hintergrund aktiv!' : 'Als Uhr-Hintergrund anwenden'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Bild als PNG speichern"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerate()}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Mit gleichem Prompt neu generieren"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Neu</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State Animation */}
              {isLoading && (
                <div className="p-6 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-200">
                      Gemini generiert dein Hintergrundbild...
                    </p>
                    <p className="text-xs text-blue-300/80 animate-pulse">
                      {[
                        'Gemini KI interpretiert deine Beschreibung...',
                        'Komposition & Kontraste für Uhren-Lesbarkeit werden optimiert...',
                        'Atmosphärische Beleuchtung wird verfeinert...',
                        'Hintergrundbild wird fertiggestellt...',
                      ][loadingStep]}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit / Generate Button */}
              {!generatedImage && (
                <button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini generiert Bild...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Hintergrund mit Gemini generieren</span>
                    </>
                  )}
                </button>
              )}
            </form>
          )}
        </div>

        {/* Footer info note */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Erstellt mit Google Gemini GenAI Image Model</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
