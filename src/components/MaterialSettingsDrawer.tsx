import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClockSettings,
  SettingsTab,
  ColorScheme,
  ClockFont,
  QuizDifficulty,
  TimeLanguage,
} from '../types';
import { CURATED_THEMES } from '../utils/presets';
import { saveCustomDefaultView, resetAllSettings } from '../utils/storage';
import { triggerHaptic } from '../utils/audio';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { ColorPickerCard } from './ui/ColorPickerCard';
import {
  X,
  Search,
  Palette,
  Clock,
  GraduationCap,
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
  Volume2,
  VolumeX,
  Vibrate,
  ShieldCheck,
  Keyboard,
  Mail,
  FileText,
  Info,
  ExternalLink,
} from 'lucide-react';

interface MaterialSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  onOpenQuiz: () => void;
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
  { id: 'quiz', label: 'Quiz & Lernen', icon: GraduationCap, badge: 'Interaktiv' },
  { id: 'einstellungen', label: 'Einstellungen', icon: Sliders },
  { id: 'hilfe', label: 'Hilfe', icon: HelpCircle },
  { id: 'rechtliches', label: 'Rechtliches', icon: Scale },
];

export const MaterialSettingsDrawer: React.FC<MaterialSettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenQuiz,
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
      // system
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
      hourHandColor: theme.hourHandColor || prev.hourHandColor,
      minuteHandColor: theme.minuteHandColor || prev.minuteHandColor,
      secondHandColor: theme.secondHandColor || prev.secondHandColor,
      ringColor: theme.ringColor || prev.ringColor,
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
      q: 'Wie stelle ich die Schuluhr manuell ein?',
      a: 'Tippe oder klicke direkt auf den blauen Stunden- oder roten Minutenzeiger und ziehe ihn im Kreis. Alternativ kannst du die Stepper-Buttons unter der Uhr nutzen (-1h, +5m usw.). Dadurch wechselt die Uhr automatisch in den interaktiven Lernmodus.',
    },
    {
      q: 'Was bedeuten die 4 bunten Viertelkreise?',
      a: 'Die farbigen Sektoren sind eine didaktische Lernhilfe aus der Grundschule: Grün (0–15 Min.) steht für "Viertel nach", Gelb (15–30 Min.) für "Vor halb", Rot (30–45 Min.) für "Nach halb / Viertel vor" und Blau (45–60 Min.) für "Vor der vollen Stunde".',
    },
    {
      q: 'Wie funktioniert der Quiz-Modus?',
      a: 'Klicke im Menü unter "Quiz & Lernen" oder direkt auf dem Bildschirm auf "Quiz starten". Die Uhr stellt eine zufällige Zeit ein und du kannst aus 4 Antworten die richtige auswählen. Richtige Antworten geben Punkte und eine Erfolgsserie!',
    },
    {
      q: 'Kann ich die Schuluhr auf einem Smartboard oder Beamer nutzen?',
      a: 'Ja! Drücke einfach die Taste "F" oder den Vollbild-Button. Für helle Klassenzimmer empfehlen wir das Thema "Klassenzimmer Hell (Light)".',
    },
  ];

  // Search filter matches
  const searchNormalized = searchQuery.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (!searchNormalized) return null;
    const matches: { tab: SettingsTab; title: string; desc: string }[] = [];

    const catalog = [
      { tab: 'darstellung' as SettingsTab, title: 'Hintergrundfarbe', desc: 'Farbe des Hintergrunds' },
      { tab: 'darstellung' as SettingsTab, title: 'Zeigerfarben', desc: 'Stunden-, Minuten- und Sekundenzeiger' },
      { tab: 'darstellung' as SettingsTab, title: 'Ringfarbe', desc: 'Außenrand des Zifferblatts' },
      { tab: 'darstellung' as SettingsTab, title: 'Schriftart', desc: 'Outfit, Inter, JetBrains Mono' },
      { tab: 'darstellung' as SettingsTab, title: 'Akzentfarbe', desc: 'Farbe für Buttons und Highlights' },
      { tab: 'darstellung' as SettingsTab, title: 'Transparenz', desc: 'Deckkraft des Zifferblatts' },
      { tab: 'darstellung' as SettingsTab, title: 'Größen und Skalierung', desc: 'Uhr-Skalierung von 70% bis 140%' },
      { tab: 'darstellung' as SettingsTab, title: 'Animationen', desc: 'Fließende Übergänge ein/aus' },
      { tab: 'darstellung' as SettingsTab, title: 'Theme-Auswahl', desc: 'Hell, Dunkel, System und Presets' },
      { tab: 'uhr' as SettingsTab, title: 'Minutenring', desc: '05, 10, 15 ... 60 Minutenbeschriftung' },
      { tab: 'uhr' as SettingsTab, title: 'Stundenzahlen', desc: '1 bis 12 Hauptziffern' },
      { tab: 'uhr' as SettingsTab, title: '24-Stunden-Zahlen', desc: '13 bis 24 Innenring' },
      { tab: 'uhr' as SettingsTab, title: 'Hilfslinien', desc: 'Minuten- und Fünf-Minuten-Striche' },
      { tab: 'uhr' as SettingsTab, title: 'Viertel/Halbkreis', desc: 'Farbige Kreissektoren zum Uhrzeit lernen' },
      { tab: 'uhr' as SettingsTab, title: 'Digitaluhr', desc: 'Zuschaltbare digitale Begleitanzeige' },
      { tab: 'uhr' as SettingsTab, title: 'Sekundenzeiger', desc: 'Sekundenanzeige tickend oder fließend' },
      { tab: 'uhr' as SettingsTab, title: 'Jetzt-Modus', desc: 'Live-Echtzeit vs. manueller Lernmodus' },
      { tab: 'quiz' as SettingsTab, title: 'Quiz starten', desc: 'Interaktives Lernquiz aktivieren' },
      { tab: 'quiz' as SettingsTab, title: 'Schwierigkeitsgrad', desc: 'Leicht, Mittel, Schwer, Experte' },
      { tab: 'quiz' as SettingsTab, title: 'Uhrsprache', desc: 'Standarddeutsch, Regionaldeutsch, Englisch' },
      { tab: 'quiz' as SettingsTab, title: 'Lösungen anzeigen', desc: 'Hilfetext zur Lösung' },
      { tab: 'quiz' as SettingsTab, title: 'Timer', desc: 'Zeitlimit für Quizfragen' },
      { tab: 'einstellungen' as SettingsTab, title: 'Sprache', desc: 'Sprache der Benutzeroberfläche' },
      { tab: 'einstellungen' as SettingsTab, title: 'Ton an/aus', desc: 'Ticken und Soundeffekte' },
      { tab: 'einstellungen' as SettingsTab, title: 'Vibration', desc: 'Haptisches Feedback auf Mobilgeräten' },
      { tab: 'einstellungen' as SettingsTab, title: 'Standardansicht speichern', desc: 'Aktuelle Ansicht als Standard sichern' },
      { tab: 'einstellungen' as SettingsTab, title: 'Einstellungen zurücksetzen', desc: 'Alles auf Werkseinstellungen zurücksetzen' },
      { tab: 'einstellungen' as SettingsTab, title: 'Datenschutz', desc: 'Informationen zur Datenspeicherung' },
      { tab: 'hilfe' as SettingsTab, title: 'FAQ', desc: 'Häufig gestellte Fragen' },
      { tab: 'hilfe' as SettingsTab, title: 'Bedienungsanleitung', desc: 'Anleitung für Unterricht und Schüler' },
      { tab: 'hilfe' as SettingsTab, title: 'Tastenkombinationen', desc: 'Hotkeys für schnelle Bedienung' },
      { tab: 'hilfe' as SettingsTab, title: 'Kontakt', desc: 'Support und Feedback' },
      { tab: 'rechtliches' as SettingsTab, title: 'Impressum', desc: 'Angaben zum Anbieter' },
      { tab: 'rechtliches' as SettingsTab, title: 'Datenschutzerklärung', desc: 'Datenschutzhinweise' },
      { tab: 'rechtliches' as SettingsTab, title: 'Lizenz', desc: 'Open Educational License' },
      { tab: 'rechtliches' as SettingsTab, title: 'Version der Website', desc: 'Versionsinformationen' },
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
        {/* Top Header: Title & Close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Schuluhr Menü</h2>
              <p className="text-xs text-slate-400">Material 3 Einstellungszentrale</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Menü schließen"
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Einstellungen durchsuchen..."
              className="w-full pl-9.5 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Result List */}
          {searchMatches && (
            <div className="mt-2 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 rounded-2xl border border-slate-800 p-1.5 shadow-xl">
              {searchMatches.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  Keine Einstellungen zu "{searchQuery}" gefunden.
                </div>
              ) : (
                searchMatches.map((item) => (
                  <button
                    key={`${item.tab}-${item.title}`}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.tab);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{item.title}</span>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {item.tab}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Navigation Tabs (Material 3 Segmented Rail) */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-800/60 overflow-x-auto custom-scrollbar shrink-0 bg-slate-950">
          {NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (settings.vibrationEnabled) triggerHaptic(10);
                }}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && !isActive && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Toast */}
        <AnimatePresence>
          {saveToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-3 px-4 py-2.5 rounded-2xl bg-emerald-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{saveToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area for Active Tab */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* === 1. DARSTELLUNG (Alle Designoptionen ausschließlich hier!) === */}
            {activeTab === 'darstellung' && (
              <motion.div
                key="tab-darstellung"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Theme Mode Selector (Hell, Dunkel, System) */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                    Theme-Modus
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light' as ColorScheme, label: 'Hell', icon: Sun },
                      { id: 'dark' as ColorScheme, label: 'Dunkel', icon: Moon },
                      { id: 'system' as ColorScheme, label: 'System', icon: Laptop },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = settings.colorScheme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSetColorScheme(opt.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
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
                    Komplett abgestimmte Designkombinationen für Zeiger, Ziffern und Hintergrund.
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

                {/* Zeigerfarben (Stundenzeiger, Minutenzeiger, Sekundenzeiger) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    Zeiger- & Zifferblattfarben
                  </h3>
                  <ColorPickerCard
                    label="Stundenzeiger Farbe"
                    description="Standard: Didaktisches Schuluhr-Blau"
                    value={settings.hourHandColor}
                    onChange={(c) => onUpdateSettings((p) => ({ ...p, hourHandColor: c }))}
                  />
                  <ColorPickerCard
                    label="Minutenzeiger Farbe"
                    description="Standard: Didaktisches Schuluhr-Rot"
                    value={settings.minuteHandColor}
                    onChange={(c) => onUpdateSettings((p) => ({ ...p, minuteHandColor: c }))}
                  />
                  <ColorPickerCard
                    label="Sekundenzeiger Farbe"
                    description="Standard: Didaktisches Sonnengelb"
                    value={settings.secondHandColor}
                    onChange={(c) => onUpdateSettings((p) => ({ ...p, secondHandColor: c }))}
                  />
                  <ColorPickerCard
                    label="Ringfarbe (Außenrand)"
                    description="Farbe des Zifferblatt-Rings"
                    value={settings.ringColor}
                    onChange={(c) => onUpdateSettings((p) => ({ ...p, ringColor: c }))}
                  />
                  <ColorPickerCard
                    label="Hintergrundfarbe"
                    description="Hintergrund der gesamten Lernumgebung"
                    value={settings.bgColor}
                    onChange={(c) =>
                      onUpdateSettings((p) => ({ ...p, bgColor: c, bgType: 'color' }))
                    }
                  />
                  <ColorPickerCard
                    label="Akzentfarbe"
                    description="Farbe für Schaltflächen, Badges und Glüh-Effekte"
                    value={settings.accentColor}
                    onChange={(c) => onUpdateSettings((p) => ({ ...p, accentColor: c }))}
                  />
                </div>

                {/* Schriftart */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                    Schriftart
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'outfit' as ClockFont, label: 'Outfit (Modern)', preview: '12:34' },
                      { id: 'inter' as ClockFont, label: 'Inter (Klar)', preview: '12:34' },
                      { id: 'school' as ClockFont, label: 'Schulbuch (Klassik)', preview: '12:34' },
                      { id: 'mono' as ClockFont, label: 'Monospace (Digital)', preview: '12:34' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onUpdateSettings((p) => ({ ...p, clockFont: f.id }))}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          settings.clockFont === f.id
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-semibold">{f.label}</div>
                        <div className="font-mono text-sm mt-1 opacity-80">{f.preview}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparenz & Skalierung & Animationen */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-200">Zifferblatt-Transparenz</span>
                      <span className="font-mono text-slate-400">{settings.dialTransparency}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={settings.dialTransparency}
                      onChange={(e) =>
                        onUpdateSettings((p) => ({
                          ...p,
                          dialTransparency: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-200">Größen-Skalierung</span>
                      <span className="font-mono text-slate-400">{settings.clockScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="135"
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
                    label="Fließende Animationen"
                    description="Sanfte Übergänge beim Verstellen der Zeiger"
                    checked={settings.enableAnimations}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, enableAnimations: v }))}
                  />
                </div>
              </motion.div>
            )}

            {/* === 2. UHR (Schuluhr-Funktionen) === */}
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
                    label="Jetzt-Modus (Echtzeit)"
                    description="Uhr läuft synchron zur aktuellen Uhrzeit. Bei Deaktivierung kann die Uhr frei gestellt werden."
                    checked={settings.isLiveMode}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, isLiveMode: v }))}
                  />

                  <MaterialSwitch
                    label="Minutenring (05, 10, 15 ... 60)"
                    description="Äußerer Zahlenkranz für die 5-Minuten-Schritte zum leichten Ablesen"
                    checked={settings.showMinuteRing}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showMinuteRing: v }))}
                  />

                  <MaterialSwitch
                    label="Stundenzahlen (1 bis 12)"
                    description="Klassische große Stundenbeschriftung"
                    checked={settings.showHourNumbers}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showHourNumbers: v }))}
                  />

                  <MaterialSwitch
                    label="24-Stunden-Zahlen (13 bis 24)"
                    description="Zusätzliche Beschriftung für den Nachmittag (z.B. 14 Uhr = 2 Uhr)"
                    checked={settings.show24HourNumbers}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, show24HourNumbers: v }))}
                  />

                  <MaterialSwitch
                    label="Hilfslinien & Teilstriche"
                    description="Genaue Minutenstriche und hervorgehobene 5-Minuten-Markierungen"
                    checked={settings.showHelpLines}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showHelpLines: v }))}
                  />

                  <MaterialSwitch
                    label="Viertel/Halbkreis-Sektoren"
                    description="Farbige Viertelkreise zur didaktischen Veranschaulichung (Viertel nach, Halb, Viertel vor)"
                    checked={settings.showQuarterHalfSectors}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showQuarterHalfSectors: v }))}
                  />

                  <MaterialSwitch
                    label="Sekundenzeiger"
                    description="Sekundenanzeige mit Gegengewicht"
                    checked={settings.showSecondHand}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showSecondHand: v }))}
                  />

                  {settings.showSecondHand && (
                    <div className="py-2 px-3 flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium">
                        Sekundenzeiger-Bewegung
                      </span>
                      <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700/60">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSettings((p) => ({ ...p, secondHandMode: 'smooth' }))
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            settings.secondHandMode === 'smooth'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          Fließend
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSettings((p) => ({ ...p, secondHandMode: 'ticking' }))
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            settings.secondHandMode === 'ticking'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          Tickend
                        </button>
                      </div>
                    </div>
                  )}

                  <MaterialSwitch
                    label="Digitaluhr einblenden"
                    description="Digitale Begleitanzeige unter dem Zifferblatt als direkte Lernkontrolle"
                    checked={settings.showDigitalClock}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showDigitalClock: v }))}
                  />

                  {settings.showDigitalClock && (
                    <MaterialSwitch
                      label="24-Stunden-Format in Digitaluhr"
                      description="Anzeige als 14:00 statt 02:00 PM"
                      checked={settings.is24Hour}
                      onChange={(v) => onUpdateSettings((p) => ({ ...p, is24Hour: v }))}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* === 3. QUIZ & LERNEN === */}
            {activeTab === 'quiz' && (
              <motion.div
                key="tab-quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Quiz Start Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/60 to-blue-900/60 border border-purple-700/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-2xl bg-purple-500/30 text-purple-300">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Interaktives Schuluhr Quiz</h3>
                      <p className="text-xs text-purple-200">
                        Uhrzeit spielerisch ablesen und festigen.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenQuiz();
                      onClose();
                    }}
                    className="w-full mt-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Quiz jetzt starten
                  </button>
                </div>

                {/* Schwierigkeitsgrad */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                    Schwierigkeitsgrad
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'easy' as QuizDifficulty, label: 'Stufe 1: Leicht', desc: 'Volle & halbe Stunden' },
                      { id: 'medium' as QuizDifficulty, label: 'Stufe 2: Mittel', desc: 'Viertelstunden (15m/45m)' },
                      { id: 'hard' as QuizDifficulty, label: 'Stufe 3: Schwer', desc: '5-Minuten-Schritte' },
                      { id: 'expert' as QuizDifficulty, label: 'Stufe 4: Experte', desc: 'Minutengenau' },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings((p) => ({ ...p, quizDifficulty: lvl.id }))
                        }
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          settings.quizDifficulty === lvl.id
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200 ring-2 ring-purple-500/30'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-semibold">{lvl.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{lvl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Uhrsprache (de-standard, de-regional, en) */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                    Uhrsprache & Sprachformate
                  </span>
                  <div className="space-y-2">
                    {[
                      {
                        id: 'de-standard' as TimeLanguage,
                        label: 'Deutsch (Standard)',
                        example: '„Viertel nach drei“, „Viertel vor vier“',
                      },
                      {
                        id: 'de-regional' as TimeLanguage,
                        label: 'Deutsch (Regional / Ost & Süd)',
                        example: '„Viertel vier“, „Dreiviertel vier“',
                      },
                      {
                        id: 'en' as TimeLanguage,
                        label: 'Englisch (English)',
                        example: '„Quarter past three“, „Quarter to four“',
                      },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings((p) => ({ ...p, timeLanguage: lang.id }))
                        }
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          settings.timeLanguage === lang.id
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{lang.label}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{lang.example}</div>
                        </div>
                        {settings.timeLanguage === lang.id && (
                          <Check className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lösungen anzeigen & Timer */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 divide-y divide-slate-800/60">
                  <MaterialSwitch
                    label="Lösungshinweise anzeigen"
                    description="Zeigt bei Fragen auf Wunsch eine didaktische Erklärung zur Zeigerstellung"
                    checked={settings.showQuizSolutionHint}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showQuizSolutionHint: v }))}
                  />

                  <div className="py-3 px-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-200 font-medium block">
                        Quiz-Timer (Zeitlimit)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Sekunden pro Quizfrage (0 = ohne Zeitlimit)
                      </span>
                    </div>
                    <select
                      value={settings.quizTimerDuration}
                      onChange={(e) =>
                        onUpdateSettings((p) => ({
                          ...p,
                          quizTimerDuration: Number(e.target.value),
                        }))
                      }
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value={0}>Ohne Timer</option>
                      <option value={15}>15 Sekunden</option>
                      <option value={30}>30 Sekunden</option>
                      <option value={45}>45 Sekunden</option>
                      <option value={60}>60 Sekunden</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === 4. EINSTELLUNGEN (Nur allgemeine Einstellungen - KEINE Designoptionen!) === */}
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
                      <span className="text-xs text-slate-200 font-medium block">
                        App-Sprache
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Sprache der Menüs und Dialoge
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
                    description="Dezentes Ticken der Uhr und Erfolgs-Chimes bei richtigen Quiz-Antworten"
                    checked={settings.soundEnabled}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, soundEnabled: v }))}
                  />

                  {/* Vibration */}
                  <MaterialSwitch
                    label="Haptisches Feedback (Vibration)"
                    description="Kurze taktile Impulse auf Touchscreens beim Umschalten und Stellen"
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
                      Speichert deine aktuell eingestellten Zifferblätter, Farben und Optionen als persönlichen Standard ab.
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
                      Setzt alle Zeigerfarben, Ziffern- und Soundeinstellungen auf die Auslieferungs-Werkseinstellungen zurück.
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
                    <span className="font-semibold text-slate-200">Datenschutzgarantie:</span> Alle deine Einstellungen werden ausschließlich lokal in deinem Browser (LocalStorage) gespeichert. Es findet keinerlei Tracking oder Datenübertragung an externe Server statt.
                  </div>
                </div>
              </motion.div>
            )}

            {/* === 5. HILFE === */}
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

                {/* Bedienungsanleitung */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Bedienungsanleitung
                  </h3>
                  <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      <strong className="text-slate-200">Uhrzeit stellen:</strong> Klicke direkt auf die Zeiger und bewege sie im Kreis oder nutze die Leiste unter der Uhr.
                    </li>
                    <li>
                      <strong className="text-slate-200">Zurück zur Echtzeit:</strong> Klicke auf den grünen Button "Jetzt", um die Schuluhr wieder mit der echten Uhrzeit synchronisieren zu lassen.
                    </li>
                    <li>
                      <strong className="text-slate-200">Didaktische Ringe anpassen:</strong> Im Menü unter "Uhr" kannst du den 24-Stunden-Ring, den Minutenring oder die Viertelstunden-Farbsektoren gezielt für den Unterrichtsstoff aktivieren.
                    </li>
                  </ol>
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
                      { key: 'Q', desc: 'Quiz-Modus starten' },
                      { key: 'Esc', desc: 'Menü oder Quiz schließen' },
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
                      <p className="text-[11px] text-slate-400">Anregungen für die Schuluhr?</p>
                    </div>
                  </div>
                  <a
                    href="mailto:support@webclock.school?subject=Feedback%20Schuluhr"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all active:scale-95"
                  >
                    Kontakt aufnehmen
                  </a>
                </div>
              </motion.div>
            )}

            {/* === 6. RECHTLICHES (Eigener Bereich ganz unten) === */}
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
                    <p className="font-semibold text-slate-200">WebClock – Interaktive Schuluhr</p>
                    <p>Open Educational Resource (OER) für Schulen, Lehrer und Schüler.</p>
                    <p>Bereitgestellt als freie Bildungs- und Unterrichtssoftware.</p>
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
                      Der Schutz deiner personenbezogenen Daten hat höchste Priorität. Diese Webanwendung:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Verwendet keine externen Tracking- oder Werbe-Cookies.</li>
                      <li>Erhebt keine personenbezogenen Schüler- oder Lehrerdaten.</li>
                      <li>Speichert Designeinstellungen rein lokal auf deinem Endgerät (LocalStorage).</li>
                      <li>Erfüllt die Vorgaben der europäischen Datenschutz-Grundverordnung (DSGVO).</li>
                    </ul>
                  </div>
                </div>

                {/* Lizenz */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Lizenz
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Freigegeben unter der <strong>MIT License</strong>. Kostenlos nutzbar für Bildungseinrichtungen, Grundschulen, Gesamtschulen, Gymnasien sowie den privaten Gebrauch.
                  </p>
                </div>

                {/* Version der Website */}
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Version der Website</span>
                  <span className="font-mono text-slate-200 font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                    v3.2.0 (Material 3 Schuluhr)
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
