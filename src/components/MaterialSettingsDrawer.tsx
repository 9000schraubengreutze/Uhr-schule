import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClockSettings,
  SettingsTab,
  ColorScheme,
  ClockFont,
  ClockWeight,
} from '../types';
import { CURATED_THEMES, GRADIENT_PRESETS, COLOR_PALETTES } from '../utils/presets';
import { saveCustomDefaultView, resetAllSettings } from '../utils/storage';
import { triggerHaptic } from '../utils/audio';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { ColorPickerCard } from './ui/ColorPickerCard';
import {
  X,
  Search,
  Palette,
  Clock,
  Sliders,
  HelpCircle,
  Scale,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Check,
  ChevronDown,
  RotateCcw,
  Save,
  ShieldCheck,
  Keyboard,
  Mail,
  FileText,
  Upload,
  Trash2,
} from 'lucide-react';

interface MaterialSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  onUploadImage?: (file: File) => void;
  onRemoveImage?: () => void;
}

interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'darstellung', label: 'Darstellung', icon: Palette },
  { id: 'uhr', label: 'Uhr', icon: Clock },
  { id: 'einstellungen', label: 'Einstellungen', icon: Sliders },
  { id: 'hilfe', label: 'Hilfe', icon: HelpCircle },
  { id: 'rechtliches', label: 'Rechtliches', icon: Scale },
];

export const MaterialSettingsDrawer: React.FC<MaterialSettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onUploadImage,
  onRemoveImage,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('darstellung');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setSaveToast(msg);
    if (settings.vibrationEnabled) triggerHaptic(20);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Switch Color Scheme (Light, Dark, System)
  const handleSetColorScheme = (scheme: ColorScheme) => {
    let mode: 'dark' | 'light' = 'dark';
    if (scheme === 'light') {
      mode = 'light';
    } else if (scheme === 'dark') {
      mode = 'dark';
    } else {
      mode =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
    }

    onUpdateSettings((prev) => ({
      ...prev,
      colorScheme: scheme,
      themeMode: mode,
      bgColor: mode === 'light' ? '#f8fafc' : '#0f172a',
      clockColor: mode === 'light' ? '#0f172a' : '#f8fafc',
    }));
  };

  // Curated Theme Selection
  const handleSelectTheme = (theme: typeof CURATED_THEMES[0]) => {
    onUpdateSettings((prev) => ({
      ...prev,
      themeId: theme.id,
      clockFont: theme.clockFont,
      clockWeight: theme.clockWeight,
      clockColor: theme.clockColor,
      accentColor: theme.accentColor,
      bgType: theme.bgType,
      bgColor: theme.bgColor || prev.bgColor,
      gradientPresetId: theme.gradientPresetId || prev.gradientPresetId,
      themeMode: theme.themeMode || prev.themeMode,
      colorScheme: (theme.themeMode as ColorScheme) || prev.colorScheme,
    }));
    showFeedback(`Thema "${theme.name}" angewendet`);
  };

  // Save current view as permanent default
  const handleSaveDefault = () => {
    saveCustomDefaultView(settings);
    showFeedback('Aktuelle Ansicht als Standard gespeichert!');
  };

  // Reset all settings
  const handleResetSettings = () => {
    if (window.confirm('Möchtest du wirklich alle Einstellungen auf die Werkseinstellungen zurücksetzen?')) {
      const def = resetAllSettings();
      onUpdateSettings(def);
      showFeedback('Auf Werkseinstellungen zurückgesetzt');
    }
  };

  // FAQ Accordion Content
  const FAQ_ITEMS = [
    {
      q: 'Welche Uhrzeit wird verwendet?',
      a: 'Die WebClock nutzt direkt und ausschließlich die interne Systemuhr deines Endgeräts (Smartphone, Tablet oder PC). Es werden keine externen Server oder Atomuhren abgefragt, wodurch die Uhr ohne Verzögerung und offline funktioniert.',
    },
    {
      q: 'Wie schalte ich zwischen 24- und 12-Stunden-Format um?',
      a: 'Im Menü unter dem Reiter "Uhr" findest du den Schalter "24-Stunden-Format". Bei Deaktivierung wechselt die Uhr automatisch ins 12-Stunden-Format mit eleganter AM/PM-Kennzeichnung.',
    },
    {
      q: 'Kann ich die Uhr als Vollbild-Display verwenden?',
      a: 'Ja! Drücke einfach die Taste "F" auf deiner Tastatur oder tippe oben rechts auf das Vollbild-Symbol. Durch den automatischen Bildschirmschoner-Modus eignet sich die Uhr ideal als Wand- oder Nachttischuhr.',
    },
    {
      q: 'Wie lade ich ein eigenes Hintergrundbild hoch?',
      a: 'Unter "Darstellung" kannst du als Hintergrund "Eigenes Bild" wählen und eine Bilddatei von deinem Gerät auswählen. Das Bild wird sicher und lokal in deinem Browser gespeichert.',
    },
  ];

  // Search filter matches
  const searchNormalized = searchQuery.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (!searchNormalized) return null;

    const catalog = [
      { tab: 'darstellung' as SettingsTab, title: 'Ziffernfarbe', desc: 'Textfarbe der digitalen Uhr' },
      { tab: 'darstellung' as SettingsTab, title: 'Akzentfarbe', desc: 'Farbe für Glüheffekte und Badges' },
      { tab: 'darstellung' as SettingsTab, title: 'Hintergrund', desc: 'Farbe, Farbverlauf oder eigenes Bild' },
      { tab: 'darstellung' as SettingsTab, title: 'Schriftart', desc: 'Outfit, Inter, Monospace Digital, Schulbuch' },
      { tab: 'darstellung' as SettingsTab, title: 'Schriftstärke', desc: 'Light, Normal, Semibold, Extrabold' },
      { tab: 'darstellung' as SettingsTab, title: 'Größen-Skalierung', desc: 'Uhr vergrößern oder verkleinern' },
      { tab: 'darstellung' as SettingsTab, title: 'Glüheffekt (Glow)', desc: 'Sanftes Ambient-Glühen der Ziffern' },
      { tab: 'darstellung' as SettingsTab, title: 'Puls-Animation', desc: 'Sanftes Atmen der Ziffern im Sekundentakt' },
      { tab: 'darstellung' as SettingsTab, title: 'Themen-Presets', desc: 'Midnight Blue, Cyberpunk, OLED uvm.' },
      { tab: 'uhr' as SettingsTab, title: '24-Stunden-Format', desc: 'Umschalten zwischen 24h und 12h AM/PM' },
      { tab: 'uhr' as SettingsTab, title: 'Sekunden anzeigen', desc: 'Sekundenziffern ein- oder ausblenden' },
      { tab: 'uhr' as SettingsTab, title: 'Datum anzeigen', desc: 'Vollständiges Datum unter der Uhr' },
      { tab: 'uhr' as SettingsTab, title: 'Wochentag anzeigen', desc: 'Wochentag im Datum einblenden' },
      { tab: 'uhr' as SettingsTab, title: 'Blinkender Doppelpunkt', desc: 'Doppelpunkt pulsiert im Sekundentakt' },
      { tab: 'uhr' as SettingsTab, title: 'Rahmenkarte (Container)', desc: 'Gläserner Oberflächen-Hintergrund' },
      { tab: 'einstellungen' as SettingsTab, title: 'App-Sprache', desc: 'Deutsch oder Englisch' },
      { tab: 'einstellungen' as SettingsTab, title: 'Töne (Sekundenticken)', desc: 'Akustisches Ticken im Sekundentakt' },
      { tab: 'einstellungen' as SettingsTab, title: 'Haptisches Feedback', desc: 'Vibration auf Touchscreens' },
      { tab: 'einstellungen' as SettingsTab, title: 'Standardansicht speichern', desc: 'Aktuelles Layout als Standard sichern' },
      { tab: 'einstellungen' as SettingsTab, title: 'Werkseinstellungen', desc: 'Alle Optionen zurücksetzen' },
      { tab: 'hilfe' as SettingsTab, title: 'FAQ & Hilfe', desc: 'Häufige Fragen zur digitalen Uhr' },
      { tab: 'hilfe' as SettingsTab, title: 'Tastenkombinationen', desc: 'F für Vollbild, S für Menü, Esc' },
      { tab: 'rechtliches' as SettingsTab, title: 'Impressum & Datenschutz', desc: 'Rechtliche Hinweise und DSGVO' },
    ];

    return catalog.filter(
      (item) =>
        item.title.toLowerCase().includes(searchNormalized) ||
        item.desc.toLowerCase().includes(searchNormalized)
    );
  }, [searchNormalized]);

  if (!isOpen) return null;

  return (
    <div
      id="material-settings-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        id="settings-panel"
        className="relative w-full max-w-xl h-full bg-slate-950/95 text-slate-100 border-l border-slate-800/80 shadow-2xl flex flex-col select-none overflow-hidden backdrop-blur-2xl"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Digitale Uhr Menü</h2>
              <p className="text-xs text-slate-400">Material 3 Einstellungen & Personalisierung</p>
            </div>
          </div>

          <button
            id="close-settings-btn"
            type="button"
            onClick={onClose}
            aria-label="Menü schließen"
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Search Field */}
        <div className="px-6 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="settings-search-input"
              type="text"
              placeholder="Einstellungen durchsuchen (z.B. Sekunden, Farben, Schrift)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown (if searching) */}
        {searchMatches && (
          <div className="px-6 py-2 border-b border-slate-800/80 bg-slate-900/40 shrink-0 max-h-48 overflow-y-auto">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Suchergebnisse ({searchMatches.length})
            </div>
            {searchMatches.length === 0 ? (
              <div className="text-xs text-slate-500 py-2">Keine passenden Optionen gefunden.</div>
            ) : (
              <div className="space-y-1">
                {searchMatches.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveTab(m.tab);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{m.title}</div>
                      <div className="text-[11px] text-slate-400">{m.desc}</div>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      {m.tab}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs (Material 3 Segmented Bar) */}
        <div className="px-6 pt-2 pb-3 border-b border-slate-800/80 shrink-0">
          <div
            role="tablist"
            className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-x-auto no-scrollbar"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (settings.vibrationEnabled) triggerHaptic(10);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Toast Banner */}
        {saveToast && (
          <div className="mx-6 mt-3 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 shrink-0">
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Main Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <AnimatePresence mode="wait">
            {/* === 1. DARSTELLUNG (Designoptionen) === */}
            {activeTab === 'darstellung' && (
              <motion.div
                key="tab-darstellung"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Theme Mode: Hell, Dunkel, System */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                    Farbschema
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'dark' as ColorScheme, label: 'Dunkel', icon: Moon },
                      { id: 'light' as ColorScheme, label: 'Hell', icon: Sun },
                      { id: 'system' as ColorScheme, label: 'System', icon: Laptop },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = settings.colorScheme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSetColorScheme(opt.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-2 ring-blue-500/30 shadow-md'
                              : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-5 h-5 mb-1.5" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vordefinierte Curated Themes */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Themen-Presets
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3.5">
                    Kuratierte Farbkombinationen für Ziffern, Akzente und Hintergründe.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CURATED_THEMES.map((th) => {
                      const active = settings.themeId === th.id;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => handleSelectTheme(th)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg scale-[1.01]'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                          style={{ background: th.previewBg }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-xs font-bold"
                              style={{ color: th.previewTextColor }}
                            >
                              {th.name}
                            </span>
                            {active && (
                              <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/70 line-clamp-1">{th.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ziffern- & Akzentfarben */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    Farben
                  </h3>
                  <ColorPickerCard
                    label="Ziffernfarbe"
                    description="Textfarbe der digitalen Uhrzeitanzeige"
                    value={settings.clockColor}
                    onChange={(c) => onUpdateSettings((p) => ({ ...p, clockColor: c }))}
                  />
                  <ColorPickerCard
                    label="Akzentfarbe & Glühen"
                    description="Farbe für Schaltflächen und den Umgebungsglüheffekt"
                    value={settings.accentColor}
                    onChange={(c) => onUpdateSettings((p) => ({ ...p, accentColor: c }))}
                  />
                </div>

                {/* Hintergrundauswahl */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Hintergrund-Typ
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'gradient', label: 'Farbverlauf' },
                      { id: 'color', label: 'Einfarbig' },
                      { id: 'image', label: 'Eigenes Bild' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings((p) => ({ ...p, bgType: mode.id as any }))
                        }
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          settings.bgType === mode.id
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Gradient Presets */}
                  {settings.bgType === 'gradient' && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-xs text-slate-300 font-medium block">
                        Verlaufs-Vorlagen
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {GRADIENT_PRESETS.map((gp) => (
                          <button
                            key={gp.id}
                            type="button"
                            onClick={() =>
                              onUpdateSettings((p) => ({
                                ...p,
                                gradientPresetId: gp.id,
                                themeId: undefined,
                              }))
                            }
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              settings.gradientPresetId === gp.id
                                ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                                : 'border-slate-800 hover:border-slate-700'
                            }`}
                            style={{ background: gp.css }}
                          >
                            <span
                              className="text-xs font-semibold"
                              style={{ color: gp.textColorHint || '#ffffff' }}
                            >
                              {gp.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solid Color */}
                  {settings.bgType === 'color' && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <ColorPickerCard
                        label="Hintergrundfarbe"
                        description="Vollflächige Hintergrundfarbe"
                        value={settings.bgColor}
                        onChange={(c) => onUpdateSettings((p) => ({ ...p, bgColor: c }))}
                      />
                    </div>
                  )}

                  {/* Image Upload */}
                  {settings.bgType === 'image' && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Hintergrundbild</span>
                        {settings.hasCustomImage && onRemoveImage && (
                          <button
                            type="button"
                            onClick={onRemoveImage}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Bild entfernen
                          </button>
                        )}
                      </div>
                      <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl cursor-pointer bg-slate-900/40 transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-200">
                          Bilddatei auswählen
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          PNG, JPG, WebP bis 10 MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && onUploadImage) onUploadImage(file);
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {/* Background Blur & Dimming */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-200">Hintergrund-Abdunklung</span>
                        <span className="font-mono text-slate-400">{settings.bgOverlayOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="85"
                        value={settings.bgOverlayOpacity}
                        onChange={(e) =>
                          onUpdateSettings((p) => ({
                            ...p,
                            bgOverlayOpacity: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-200">Hintergrund-Unschärfe (Blur)</span>
                        <span className="font-mono text-slate-400">{settings.bgBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={settings.bgBlur}
                        onChange={(e) =>
                          onUpdateSettings((p) => ({
                            ...p,
                            bgBlur: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Schriftart & Schriftstärke */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Schriftart & Typografie
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'outfit' as ClockFont, label: 'Outfit (Modern)', sample: '12:34' },
                      { id: 'inter' as ClockFont, label: 'Inter (Klassisch)', sample: '12:34' },
                      { id: 'mono' as ClockFont, label: 'Monospace (Digital)', sample: '12:34' },
                      { id: 'school' as ClockFont, label: 'Schulbuch (Rund)', sample: '12:34' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onUpdateSettings((p) => ({ ...p, clockFont: f.id }))}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          settings.clockFont === f.id
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-2 ring-blue-500/30'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-semibold">{f.label}</div>
                        <div className="font-mono text-sm mt-1 opacity-85">{f.sample}</div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-300 block mb-2">
                      Schriftstärke
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: '300' as ClockWeight, label: 'Light' },
                        { id: '400' as ClockWeight, label: 'Normal' },
                        { id: '600' as ClockWeight, label: 'Semibold' },
                        { id: '800' as ClockWeight, label: 'Bold' },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => onUpdateSettings((p) => ({ ...p, clockWeight: w.id }))}
                          className={`py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            settings.clockWeight === w.id
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skalierung & Effekte */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-200">Größen-Skalierung</span>
                      <span className="font-mono text-slate-400">{settings.clockScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="140"
                      value={settings.clockScale}
                      onChange={(e) =>
                        onUpdateSettings((p) => ({
                          ...p,
                          clockScale: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <MaterialSwitch
                    label="Glüheffekt (Ambient Glow)"
                    description="Sanftes Leuchten um die Ziffern passend zur Akzentfarbe"
                    checked={settings.enableGlow}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, enableGlow: v }))}
                  />

                  <MaterialSwitch
                    label="Puls-Animation (Atmung)"
                    description="Subtiles rhythmisches Atmen der Ziffern im Sekundentakt"
                    checked={settings.enableBreathingAnimation}
                    onChange={(v) =>
                      onUpdateSettings((p) => ({ ...p, enableBreathingAnimation: v }))
                    }
                  />
                </div>
              </motion.div>
            )}

            {/* === 2. UHR (Digitale Uhr-Funktionen) === */}
            {activeTab === 'uhr' && (
              <motion.div
                key="tab-uhr"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 divide-y divide-slate-800/60">
                  <MaterialSwitch
                    label="24-Stunden-Format"
                    description="Anzeige als 24-Stunden-Uhr (z.B. 14:30) statt 12-Stunden mit AM/PM"
                    checked={settings.is24Hour}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, is24Hour: v }))}
                  />

                  <MaterialSwitch
                    label="Sekunden anzeigen"
                    description="Sekundenziffern neben den Minuten einblenden"
                    checked={settings.showSeconds}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showSeconds: v }))}
                  />

                  <MaterialSwitch
                    label="Datum anzeigen"
                    description="Ausgeschriebenes Datum unterhalb der Ziffern einblenden"
                    checked={settings.showDate}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showDate: v }))}
                  />

                  {settings.showDate && (
                    <MaterialSwitch
                      label="Wochentag einblenden"
                      description="Name des Wochentags (z.B. Dienstag) vor das Datum setzen"
                      checked={settings.showDayOfWeek}
                      onChange={(v) => onUpdateSettings((p) => ({ ...p, showDayOfWeek: v }))}
                    />
                  )}

                  <MaterialSwitch
                    label="Blinkender Doppelpunkt (:)"
                    description="Doppelpunkt pulsiert im Sekundentakt für den klassischen Digitaluhr-Look"
                    checked={settings.showBlinkingSeparator}
                    onChange={(v) =>
                      onUpdateSettings((p) => ({ ...p, showBlinkingSeparator: v }))
                    }
                  />

                  <MaterialSwitch
                    label="Oberflächen-Rahmenkarte"
                    description="Dezente gläserne Material-Karte um die Zeitanzeige"
                    checked={settings.showCardContainer}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showCardContainer: v }))}
                  />
                </div>
              </motion.div>
            )}

            {/* === 3. EINSTELLUNGEN (Allgemeine Optionen) === */}
            {activeTab === 'einstellungen' && (
              <motion.div
                key="tab-einstellungen"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 divide-y divide-slate-800/60">
                  {/* Sprache */}
                  <div className="py-3 px-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-200 font-medium block">App-Sprache</span>
                      <span className="text-[11px] text-slate-400">
                        Sprache für Datum und Menü
                      </span>
                    </div>
                    <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => onUpdateSettings((p) => ({ ...p, appLanguage: 'de' }))}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          settings.appLanguage === 'de'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        Deutsch
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateSettings((p) => ({ ...p, appLanguage: 'en' }))}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          settings.appLanguage === 'en'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* Ton an/aus */}
                  <MaterialSwitch
                    label="Töne & Audioeffekte"
                    description="Dezentes akustisches Ticken im Sekundentakt"
                    checked={settings.soundEnabled}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, soundEnabled: v }))}
                  />

                  {/* Vibration */}
                  <MaterialSwitch
                    label="Haptisches Feedback (Vibration)"
                    description="Kurze Impulse auf Touchscreens bei Interaktionen"
                    checked={settings.vibrationEnabled}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, vibrationEnabled: v }))}
                  />
                </div>

                {/* Standardansicht speichern & Reset */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Standardansicht festlegen
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                      Speichert dein aktuelles Design als deinen persönlichen Standard ab.
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveDefault}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-98 cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-blue-400" />
                      Standardansicht speichern
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">
                      Einstellungen zurücksetzen
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                      Setzt alle Ziffern- und Farbeinstellungen auf die Werkseinstellungen zurück.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-800/50 transition-all active:scale-98 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Einstellungen zurücksetzen
                    </button>
                  </div>
                </div>

                {/* Datenschutz Kurzhinweis */}
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">100% Geräte-Uhr:</span> Diese Anwendung liest die Zeit direkt und verzögerungsfrei von der Systemuhr deines Geräts ab. Keine Atomuhr-Abfragen oder Datenübertragungen an externe Server.
                  </div>
                </div>
              </motion.div>
            )}

            {/* === 4. HILFE === */}
            {activeTab === 'hilfe' && (
              <motion.div
                key="tab-hilfe"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* FAQ Akkordeon-Liste */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Häufig gestellte Fragen (FAQ)
                  </h3>
                  <div className="space-y-2">
                    {FAQ_ITEMS.map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={item.q}
                          className="border border-slate-800/80 rounded-xl overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full p-3 text-left text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800/80 flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <span>{item.q}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="p-3 text-xs text-slate-400 leading-relaxed bg-slate-950/40 border-t border-slate-800/60">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tastenkombinationen */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Keyboard className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Tastenkombinationen
                    </h3>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { key: 'F', desc: 'Vollbildmodus umschalten' },
                      { key: 'S', desc: 'Einstellungen / Menü öffnen oder schließen' },
                      { key: 'Esc', desc: 'Menü schließen' },
                      { key: 'Doppelklick', desc: 'Vollbildmodus starten / beenden' },
                    ].map((hk) => (
                      <div
                        key={hk.key}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800"
                      >
                        <span className="text-slate-300">{hk.desc}</span>
                        <kbd className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
                          {hk.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kontakt */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Support & Feedback</div>
                      <p className="text-[11px] text-slate-400">Anregungen für die Digitaluhr?</p>
                    </div>
                  </div>
                  <a
                    href="mailto:support@webclock.digital?subject=Feedback%20Digitaluhr"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all active:scale-95"
                  >
                    Kontakt
                  </a>
                </div>
              </motion.div>
            )}

            {/* === 5. RECHTLICHES === */}
            {activeTab === 'rechtliches' && (
              <motion.div
                key="tab-rechtliches"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Impressum */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Impressum
                    </h3>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
                    <p className="font-semibold text-slate-200">WebClock – Moderne Digitale Uhr</p>
                    <p>Bereitgestellt als freie, quelloffene Webanwendung.</p>
                  </div>
                </div>

                {/* Datenschutzerklärung */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Datenschutzerklärung
                    </h3>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                    <p>
                      Der Schutz deiner Privatsphäre ist elementar. Diese Webanwendung:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Verwendet keine Tracking- oder Werbe-Cookies.</li>
                      <li>Speichert Designeinstellungen rein lokal im Browser (LocalStorage).</li>
                      <li>Erfasst keinerlei IP-Adressen oder persönliche Daten.</li>
                      <li>Ist vollständig DSGVO-konform.</li>
                    </ul>
                  </div>
                </div>

                {/* Lizenz */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Lizenz
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Freigegeben unter der <strong>MIT License</strong>. Frei nutzbar für private, schulische und gewerbliche Zwecke.
                  </p>
                </div>

                {/* Version der Website */}
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Version der Website</span>
                  <span className="font-mono text-slate-200 font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                    v4.0.0 (Material 3 Digitaluhr)
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
