import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClockSettings,
  SettingsTab,
  ColorScheme,
  ClockFont,
  ClockWeight,
  DateFormat,
} from '../types';
import { CURATED_THEMES, GRADIENT_PRESETS, COLOR_PALETTES } from '../utils/presets';
import { saveCustomDefaultView, resetAllSettings } from '../utils/storage';
import { triggerHaptic } from '../utils/audio';
import { AtomicTimeState, formatTimeOffset, formatTimeOffsetDetailed } from '../utils/atomicTime';
import { exportClockSettingsToJson, importClockSettingsFromFile } from '../utils/themeExport';
import { MaterialSwitch } from './ui/MaterialSwitch';
import { ColorPickerCard } from './ui/ColorPickerCard';
import { TimeZonesSettingsSection } from './TimeZonesSettingsSection';
import { ParticleSettingsCard } from './ParticleSettingsCard';
import { BackdropBlurControl } from './BackdropBlurControl';
import { DigitTransitionControl } from './DigitTransitionControl';
import { GlowEffectControl } from './GlowEffectControl';
import { EntranceAnimationControl } from './EntranceAnimationControl';
import { ZenScheduleCard } from './ZenScheduleCard';
import { DailyQuoteSettingsCard } from './DailyQuoteSettingsCard';
import { AudioSettingsTab } from './AudioSettingsTab';
import { TYPOGRAPHY_SETS, inferTypographySet } from '../utils/typography';
import {
  X,
  Search,
  Palette,
  Clock,
  Volume2,
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
  Type,
  FileText,
  Upload,
  Trash2,
  Radio,
  RefreshCw,
  Globe,
  Gamepad2,
  Calendar,
  FileDown,
  FileUp,
  GraduationCap,
  Coffee,
  Lock,
  Unlock,
  Wand2,
  MessageSquareQuote,
  Bot,
  Image as ImageIcon,
} from 'lucide-react';
import { SchoolStatusResult, SchoolSimulationMode } from '../utils/timetable';
import { SavedWallpaperItem } from '../types';
import { getSavedWallpapers, setActiveWallpaper, deleteSavedWallpaper } from '../utils/storage';
import {
  CURATED_WALLPAPERS,
  WALLPAPER_CATEGORIES,
  WallpaperCategory,
  WallpaperItem,
} from '../data/wallpapers';

interface MaterialSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGames?: () => void;
  onOpenTimetable?: () => void;
  onOpenWallpapers?: () => void;
  onOpenGeminiBg?: () => void;
  onOpenChat?: () => void;
  statusResult?: SchoolStatusResult;
  onSetSimulationMode?: (mode: SchoolSimulationMode) => void;
  teacherOverride?: boolean;
  onToggleTeacherOverride?: () => void;
  settings: ClockSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ClockSettings>>;
  currentWallpaperUrl?: string | null;
  onSelectSavedWallpaper?: (id: string) => Promise<void> | void;
  onDeleteSavedWallpaper?: (id: string) => Promise<void> | void;
  onUploadImage?: (file: File) => void;
  onRemoveImage?: () => void;
  atomicState?: AtomicTimeState;
  onTriggerSync?: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  initialTab?: SettingsTab;
  onTogglePlayAmbient?: (type: any) => void;
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
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'einstellungen', label: 'Einstellungen', icon: Sliders },
  { id: 'hilfe', label: 'Hilfe', icon: HelpCircle },
  { id: 'rechtliches', label: 'Rechtliches', icon: Scale },
];

export const MaterialSettingsDrawer: React.FC<MaterialSettingsDrawerProps> = ({
  isOpen,
  onClose,
  onOpenGames,
  onOpenTimetable,
  onOpenWallpapers,
  onOpenGeminiBg,
  onOpenChat,
  statusResult,
  onSetSimulationMode,
  teacherOverride = false,
  onToggleTeacherOverride,
  settings,
  onUpdateSettings,
  currentWallpaperUrl,
  onSelectSavedWallpaper,
  onDeleteSavedWallpaper,
  onUploadImage,
  onRemoveImage,
  atomicState,
  onTriggerSync,
  isZenMode,
  onToggleZenMode,
  initialTab = 'darstellung',
  onTogglePlayAmbient,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'darstellung');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [savedWallpapers, setSavedWallpapers] = useState<SavedWallpaperItem[]>([]);
  const [isLoadingWallpapers, setIsLoadingWallpapers] = useState(false);
  const [drawerWallpaperCategory, setDrawerWallpaperCategory] = useState<WallpaperCategory>('all');

  const handleSelectCuratedWallpaper = (wp: WallpaperItem) => {
    triggerHaptic('success');
    onUpdateSettings((prev) => {
      const next: ClockSettings = {
        ...prev,
        bgType: 'image',
        hasCustomImage: true,
        activeWallpaperId: wp.id,
        activeWallpaperUrl: wp.url,
      };
      if (prev.wallpaperEngineAutoParticles !== false && wp.recommendedParticle) {
        next.particleEffect = wp.recommendedParticle;
      }
      if (prev.wallpaperEngineAutoColors) {
        next.clockColor = wp.recommendedClockColor;
        next.accentColor = wp.recommendedAccentColor;
      }
      return next;
    });
    showFeedback(`Wallpaper "${wp.title}" aktiviert!`);
  };

  const loadWallpapers = useCallback(async () => {
    setIsLoadingWallpapers(true);
    try {
      const list = await getSavedWallpapers();
      setSavedWallpapers(list);
    } catch (err) {
      console.warn('Failed to load wallpapers', err);
    } finally {
      setIsLoadingWallpapers(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadWallpapers();
    }
  }, [isOpen, loadWallpapers, currentWallpaperUrl]);

  const handleSelectWallpaperCard = async (wp: SavedWallpaperItem) => {
    try {
      if (onSelectSavedWallpaper) {
        await onSelectSavedWallpaper(wp.id);
      } else {
        await setActiveWallpaper(wp.id);
      }
      onUpdateSettings((prev) => ({
        ...prev,
        bgType: 'image',
        hasCustomImage: true,
      }));
      showFeedback(`Wallpaper "${wp.name || 'Ausgewählt'}" aktiviert!`);
      loadWallpapers();
    } catch (err) {
      console.error('Failed to select wallpaper', err);
    }
  };

  const handleDeleteWallpaperCard = async (e: React.MouseEvent, wpId: string) => {
    e.stopPropagation();
    if (window.confirm('Möchtest du dieses gespeicherte Wallpaper wirklich löschen?')) {
      if (onDeleteSavedWallpaper) {
        await onDeleteSavedWallpaper(wpId);
      } else {
        await deleteSavedWallpaper(wpId);
      }
      showFeedback('Wallpaper gelöscht');
      loadWallpapers();
    }
  };

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

  // Export current clock configuration to JSON file
  const handleExportConfig = () => {
    try {
      exportClockSettingsToJson(settings, 'webclock-design');
      showFeedback('Design erfolgreich als JSON exportiert!');
    } catch (err) {
      console.error('Export failed', err);
      showFeedback('Fehler beim Exportieren der JSON-Datei');
    }
  };

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  // Import clock configuration from uploaded JSON file
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const newSettings = await importClockSettingsFromFile(file);
      onUpdateSettings(newSettings);
      showFeedback(`Design aus "${file.name}" erfolgreich importiert!`);
    } catch (err: any) {
      console.error('Import failed', err);
      alert(err?.message || 'Fehler beim Laden der JSON-Konfigurationsdatei.');
    } finally {
      // Reset input value so same file can be uploaded again if needed
      e.target.value = '';
    }
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
      a: 'Die WebClock synchronisiert sich mit weltweiten Online-Atomuhren (UTC-Referenzzeit via WorldTimeAPI / NTP). Dadurch zeigt die Uhr die exakte Atomzeit – selbst wenn die interne Uhrzeit deines Smartphones oder PCs falsch eingestellt ist.',
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
    {
      q: 'Kann ich meine Designs mit Freunden teilen oder sichern?',
      a: 'Ja! Klicke im Menü unter "Darstellung" oder "Einstellungen" auf "JSON exportieren". Dadurch erhältst du eine .json-Datei mit all deinen Farben, Schriften, Effekten und Zeiteinstellungen. Diese Datei kann jederzeit über "JSON importieren" auf jedem Gerät wiederhergestellt werden.',
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
      { tab: 'darstellung' as SettingsTab, title: 'Animierte Partikeleffekte', desc: 'Schnee, Staub, funkelnde Sterne, Regen, Intensität und Partikelfarbe' },
      { tab: 'darstellung' as SettingsTab, title: 'Typografie-Sets (Mono-space, Serif, Sans-Serif)', desc: 'Vordefinierte Typografie-Kombinationen für den visuellen Stil der Uhr' },
      { tab: 'darstellung' as SettingsTab, title: 'Schriftart & Schriftstärke', desc: 'Outfit, Inter, Monospace Digital, Serif, Schulbuch' },
      { tab: 'darstellung' as SettingsTab, title: 'Größen-Skalierung', desc: 'Uhr vergrößern oder verkleinern' },
      { tab: 'darstellung' as SettingsTab, title: 'Uhr-Eingangsanimationen (Screen-Wake & Menü-Exit)', desc: 'Übergangseffekte (Slide Up/Down, Pure Fade, Rotate, Focus Zoom, 3D Flip) beim Aufwecken des Bildschirms oder Schließen von Menüs' },
      { tab: 'darstellung' as SettingsTab, title: 'Glüheffekt (Glow)', desc: 'Sanftes Ambient-Glühen der Ziffern' },
      { tab: 'darstellung' as SettingsTab, title: 'Puls-Animation', desc: 'Sanftes Atmen der Ziffern im Sekundentakt' },
      { tab: 'darstellung' as SettingsTab, title: 'Animationstyp (Zeitänderung)', desc: 'Wie die Zeitänderung visualisiert wird: Flipping (3D), sanftes Gleiten, Gleiten & Fade, einfaches Ausblenden' },
      { tab: 'uhr' as SettingsTab, title: 'Animationstyp (Zeitänderung)', desc: 'Flipping, sanftes Gleiten, einfaches Ausblenden oder direktes Umschalten beim Ziffernwechsel' },
      { tab: 'darstellung' as SettingsTab, title: 'Ziffern-Fading & Übergang', desc: 'Fließende Ein- und Ausblend-Animation beim Sekundentakt der Uhrzeit (Flipping, Gleiten, Fade)' },
      { tab: 'darstellung' as SettingsTab, title: 'Fließende Ziffern-Animation', desc: 'Subtiles Fading, sanftes Überblenden und Animationsgeschwindigkeit beim Zahlenwechsel' },
      { tab: 'darstellung' as SettingsTab, title: 'Hintergrund-Blur (Glassmorphism)', desc: 'Schieberegler für Intensität des Weichzeichnungs-Effekts (0px bis 40px) für alle Glaskarten, Modale und UI-Elemente' },
      { tab: 'darstellung' as SettingsTab, title: 'Themen-Presets', desc: 'Midnight Blue, Cyberpunk, OLED uvm.' },
      { tab: 'darstellung' as SettingsTab, title: 'Design exportieren (JSON)', desc: 'Aktuelle Farben, Schriftarten und Einstellungen als JSON-Datei speichern & teilen' },
      { tab: 'darstellung' as SettingsTab, title: 'Design importieren (JSON)', desc: 'Gespeichertes Design aus JSON-Datei laden' },
      { tab: 'uhr' as SettingsTab, title: 'Online-Atomuhr (NTP)', desc: 'Zeitsynchronisation mit Atomuhr-Servern' },
      { tab: 'uhr' as SettingsTab, title: 'Zusätzliche Zeitzonen (Weltuhr)', desc: 'Weltzeit-Uhren (z. B. New York, Tokio, London) unter der Hauptuhr' },
      { tab: 'uhr' as SettingsTab, title: 'Zen-Modus Zeitplan (Automatischer Timer)', desc: 'Zen-Modus automatisch zu bestimmten Uhrzeiten (z. B. 22:00 bis 07:00) aktivieren und deaktivieren' },
      { tab: 'darstellung' as SettingsTab, title: 'Zen-Modus Zeitplan', desc: 'Automatischer Timer für aufgeräumten Vollbild-Modus' },
      { tab: 'uhr' as SettingsTab, title: '24-Stunden-Format', desc: 'Umschalten zwischen 24h und 12h AM/PM' },
      { tab: 'uhr' as SettingsTab, title: 'Sekunden anzeigen', desc: 'Sekundenziffern ein- oder ausblenden' },
      { tab: 'uhr' as SettingsTab, title: 'Datum anzeigen', desc: 'Vollständiges Datum unter der Uhr' },
      { tab: 'uhr' as SettingsTab, title: 'Datumsformat', desc: 'Format zwischen DD.MM.YYYY, MM/DD/YYYY und YYYY-MM-DD wählen' },
      { tab: 'uhr' as SettingsTab, title: 'Wochentag anzeigen', desc: 'Wochentag im Datum einblenden' },
      { tab: 'uhr' as SettingsTab, title: 'Doppelpunkt-Pulsieren & Ticken (:)', desc: 'Subtile Animation und Intensität des Doppelpunkts im Sekundentakt (Pulsieren, Glühen, Sprung, Blinken)' },
      { tab: 'uhr' as SettingsTab, title: 'Rahmenkarte (Container)', desc: 'Gläserner Oberflächen-Hintergrund' },
      { tab: 'uhr' as SettingsTab, title: 'Glas-Unschärfe (Backdrop Blur)', desc: 'Intensität des Unschärfe-Filters (0px bis 40px) für Uhrenelemente' },
      { tab: 'audio' as SettingsTab, title: 'Hintergrundgeräusche (Audio)', desc: 'Beruhigende Klänge: Regen, Wald & Vögel, Meeresrauschen, Kaminfeuer, weißes Rauschen, rosa Rauschen' },
      { tab: 'audio' as SettingsTab, title: 'Regengeräusche (Rain)', desc: 'Beruhigendes Sommerregen-Prasseln auf Blättern & Fenstern' },
      { tab: 'audio' as SettingsTab, title: 'Wald & Vogelgezwitscher (Forest)', desc: 'Sanfter Waldwind mit dezenten Natur-Vogelstimmen' },
      { tab: 'audio' as SettingsTab, title: 'Weißes Rauschen (White Noise)', desc: 'Gleichmäßiges Klangspektrum zur Konzentration und Maskierung von Störgeräuschen' },
      { tab: 'audio' as SettingsTab, title: 'Rosa Rauschen (Pink Noise)', desc: 'Tieffrequentes sanftes 1/f-Rauschen zur Meditation & Tiefenentspannung' },
      { tab: 'audio' as SettingsTab, title: 'Meeresrauschen (Waves)', desc: 'Ozeanwellen im ruhigen Atem-Rhythmus' },
      { tab: 'audio' as SettingsTab, title: 'Kaminfeuer (Fireplace)', desc: 'Knistern von Holz und Glut' },
      { tab: 'audio' as SettingsTab, title: 'Audio-Lautstärke', desc: 'Lautstärkeregler für beruhigende Hintergrundklänge' },
      { tab: 'audio' as SettingsTab, title: 'Automatische Klang-Wiedergabe', desc: 'Klanglandschaft beim Starten der WebClock automatisch fortsetzen' },
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="material-settings-backdrop"
          id="material-settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="material-settings-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            id="settings-panel"
            className="relative w-full max-w-xl h-full bg-slate-950/90 text-slate-100 border-l border-slate-800/80 shadow-2xl flex flex-col select-none overflow-hidden"
            style={{
              backdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
              WebkitBackdropFilter: `blur(${settings.backdropBlurIntensity ?? 16}px)`,
            }}
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
                    key={`${m.tab}-${m.title}-${idx}`}
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

                  {/* Design Teilen: Export / Import JSON */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-200">
                          Design teilen (JSON)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Konfiguration als Datei sichern oder Entwürfe von Freunden laden
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        id="export-design-json-btn"
                        type="button"
                        onClick={handleExportConfig}
                        className="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-98 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
                        title="Aktuelle Farben, Schriftarten und Uhreneinstellungen als .json Datei herunterladen"
                      >
                        <FileDown className="w-4 h-4 text-sky-400" />
                        <span>Exportieren</span>
                      </button>

                      <button
                        id="import-design-json-btn"
                        type="button"
                        onClick={() => importFileInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-98 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
                        title="Eine gespeicherte WebClock JSON-Designdatei importieren"
                      >
                        <FileUp className="w-4 h-4 text-emerald-400" />
                        <span>Importieren</span>
                      </button>
                    </div>

                    {/* Hidden file input for importing JSON configuration */}
                    <input
                      ref={importFileInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleImportFileChange}
                    />
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Hintergrund-Typ
                    </span>
                    {onOpenGeminiBg && (
                      <button
                        type="button"
                        onClick={onOpenGeminiBg}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gemini KI-Bild</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'gradient', label: 'Farbverlauf' },
                      { id: 'color', label: 'Einfarbig' },
                      { id: 'image', label: 'Wallpapers' },
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

                  {/* Wallpaper Engine Featured Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-blue-950/40 to-indigo-950/50 border border-cyan-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Wallpaper Engine Galerie
                          </span>
                          <span className="text-[10px] text-cyan-200/80">
                            {CURATED_WALLPAPERS.length}+ 4K Hintergründe nach Kategorien & Partikel
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        4K Engine
                      </span>
                    </div>
                    {onOpenWallpapers && (
                      <button
                        type="button"
                        onClick={onOpenWallpapers}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-cyan-500/25"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Kategorisierte Wallpaper-Galerie öffnen</span>
                      </button>
                    )}
                  </div>

                  {/* Gemini AI Wallpaper Generator Banner */}
                  {onOpenGeminiBg && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-purple-950/50 border border-blue-500/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              Gemini KI-Hintergrund erstellen
                            </span>
                            <span className="text-[10px] text-blue-200/80">
                              Erzeuge individuelle Wallpaper per Text-Prompt
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Gemini
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenGeminiBg}
                        className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-blue-500/25"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>KI-Studio öffnen & Bild generieren</span>
                      </button>
                    </div>
                  )}

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

                  {/* Image Upload & Saved Wallpapers */}
                  {settings.bgType === 'image' && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-4">
                      {/* Wallpaper Engine 4K Curated Section */}
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Wallpaper Engine ({CURATED_WALLPAPERS.length} 4K Motive)
                            </span>
                          </div>
                          {onOpenWallpapers && (
                            <button
                              type="button"
                              onClick={onOpenWallpapers}
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                            >
                              <span>Vollbild-Galerie</span>
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Category Filter Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {WALLPAPER_CATEGORIES.map((cat) => {
                            const isSelected = drawerWallpaperCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setDrawerWallpaperCategory(cat.id)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30'
                                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                                }`}
                              >
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>

                        {/* Curated Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                          {CURATED_WALLPAPERS.filter(
                            (w) =>
                              drawerWallpaperCategory === 'all' ||
                              w.category === drawerWallpaperCategory
                          ).map((wp) => {
                            const isActive =
                              settings.activeWallpaperId === wp.id ||
                              (currentWallpaperUrl && wp.url === currentWallpaperUrl);
                            return (
                              <div
                                key={wp.id}
                                onClick={() => handleSelectCuratedWallpaper(wp)}
                                className={`group relative rounded-xl overflow-hidden border aspect-video cursor-pointer transition-all ${
                                  isActive
                                    ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-md scale-[1.02]'
                                    : 'border-slate-800 hover:border-slate-600 bg-slate-950/60'
                                }`}
                                title={`${wp.title} (${wp.resolution})`}
                              >
                                <img
                                  src={wp.url}
                                  alt={wp.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                                <div className="absolute top-1.5 left-1.5 z-10">
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-900/90 text-cyan-300 border border-cyan-500/30 shadow-sm">
                                    {wp.resolution}
                                  </span>
                                </div>

                                {isActive && (
                                  <div className="absolute top-1.5 right-1.5 z-10">
                                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 shadow-md">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      <span>Aktiv</span>
                                    </span>
                                  </div>
                                )}

                                <div className="absolute bottom-1 left-1.5 right-1.5 z-10 pointer-events-none">
                                  <p className="text-[10px] font-medium text-white line-clamp-1 drop-shadow-sm">
                                    {wp.title}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Smart Engine Automation Toggles */}
                        <div className="pt-2 border-t border-slate-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-300 font-medium block">
                                Auto-Partikel
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Passt Partikeleffekt automatisch ans Wallpaper an
                              </span>
                            </div>
                            <MaterialSwitch
                              checked={settings.wallpaperEngineAutoParticles ?? true}
                              onChange={(checked) =>
                                onUpdateSettings((p) => ({
                                  ...p,
                                  wallpaperEngineAutoParticles: checked,
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-300 font-medium block">
                                Farben harmonisieren
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Stimmt Ziffern- und Akzentfarbe auf das Motiv ab
                              </span>
                            </div>
                            <MaterialSwitch
                              checked={settings.wallpaperEngineAutoColors ?? false}
                              onChange={(checked) =>
                                onUpdateSettings((p) => ({
                                  ...p,
                                  wallpaperEngineAutoColors: checked,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Saved Wallpapers & Custom Uploads */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Eigene Wallpapers & KI ({savedWallpapers.length})
                          </span>
                        </div>
                        {settings.hasCustomImage && onRemoveImage && (
                          <button
                            type="button"
                            onClick={onRemoveImage}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hintergrund entfernen
                          </button>
                        )}
                      </div>

                      {/* Saved Wallpapers Gallery Grid */}
                      {savedWallpapers.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-400">
                            Wähle eines deiner erstellten KI-Bilder oder hochgeladenen Fotos als aktives Uhr-Wallpaper:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                            {savedWallpapers.map((wp) => {
                              const isActive =
                                wp.isActive || (currentWallpaperUrl && wp.url === currentWallpaperUrl);
                              return (
                                <div
                                  key={wp.id}
                                  onClick={() => handleSelectWallpaperCard(wp)}
                                  className={`group relative rounded-2xl overflow-hidden border aspect-video cursor-pointer transition-all ${
                                    isActive
                                      ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg scale-[1.02]'
                                      : 'border-slate-800 hover:border-slate-600 bg-slate-950/60'
                                  }`}
                                  title={wp.prompt || wp.name}
                                >
                                  {wp.url ? (
                                    <img
                                      src={wp.url}
                                      alt={wp.name || 'Wallpaper'}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-600">
                                      <ImageIcon className="w-6 h-6" />
                                    </div>
                                  )}

                                  {/* Vignette */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                                  {/* Badge: KI vs Foto */}
                                  <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/90 text-blue-300 border border-slate-700/80 shadow-sm">
                                      {wp.isAi ? 'KI' : 'Foto'}
                                    </span>
                                  </div>

                                  {/* Active Badge */}
                                  {isActive && (
                                    <div className="absolute top-2 right-2 z-10">
                                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-md">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>Aktiv</span>
                                      </span>
                                    </div>
                                  )}

                                  {/* Delete button on hover for non-active */}
                                  {!isActive && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteWallpaperCard(e, wp.id)}
                                      className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-900/90 text-slate-400 hover:text-rose-200 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                                      title="Wallpaper löschen"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}

                                  {/* Caption */}
                                  <div className="absolute bottom-1.5 left-2 right-2 z-10 pointer-events-none">
                                    <p className="text-[10px] font-semibold text-white line-clamp-1 drop-shadow-sm">
                                      {wp.prompt || wp.name}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center space-y-1.5">
                          <p className="text-xs font-semibold text-slate-300">
                            Noch keine eigenen Wallpapers gespeichert
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Erstelle ein einzigartiges Bild mit dem Gemini KI-Studio oder lade ein Foto hoch.
                          </p>
                        </div>
                      )}

                      {/* Action options: Gemini Studio & Upload */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Option 1: Gemini Bild-Studio (Erstellen & Bearbeiten) */}
                        {onOpenGeminiBg && (
                          <button
                            type="button"
                            onClick={onOpenGeminiBg}
                            className="flex flex-col items-center justify-center p-4 border border-blue-500/50 hover:border-blue-400 rounded-2xl bg-gradient-to-b from-blue-950/40 to-indigo-950/40 hover:from-blue-900/50 hover:to-indigo-900/50 transition-all cursor-pointer group text-center shadow-sm"
                          >
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 mb-2 group-hover:scale-110 transition-transform">
                              <Wand2 className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-white">Gemini Bild-Studio</span>
                            <span className="text-[10px] text-blue-300/80 mt-0.5">
                              Bilder per Prompt erstellen & bearbeiten
                            </span>
                          </button>
                        )}

                        {/* Option 2: Lokale Bilddatei auswählen */}
                        <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-2xl cursor-pointer bg-slate-900/40 transition-colors text-center ${!onOpenGeminiBg ? 'col-span-2' : ''}`}>
                          <Upload className="w-5 h-5 text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-200">
                            Datei hochladen
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            PNG, JPG, WebP bis 10 MB
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file && onUploadImage) {
                                await onUploadImage(file);
                                loadWallpapers();
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Option 3: Gemini Chatbot Schnellzugriff */}
                      {onOpenChat && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={onOpenChat}
                            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-purple-950/40 hover:from-indigo-900/50 hover:to-purple-900/50 border border-indigo-500/40 text-left transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform">
                                <MessageSquareQuote className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white block">
                                  Gemini KI-Chatbot
                                </span>
                                <span className="text-[10px] text-indigo-300/80">
                                  Multi-Turn Chat, Zeit-Coach, Code-Experte & Rollen
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-indigo-400 font-semibold group-hover:text-white transition-colors">
                              Öffnen →
                            </span>
                          </button>
                        </div>
                      )}
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

                {/* Animierte Partikeleffekte (Schnee, Staub, Sterne etc.) */}
                <ParticleSettingsCard
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                  showFeedback={showFeedback}
                />

                {/* Schriftart & Typografie mit Vordefinierten Typography-Sets */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Type className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                          Typografie & Schriftstil
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Wähle ein vorkonfiguriertes Typografie-Set oder passe die Schrift an
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown für Vordefinierte Typografie-Sets */}
                  <div className="space-y-2">
                    <label
                      htmlFor="typography-set-select"
                      className="text-xs font-semibold text-slate-300 flex items-center justify-between"
                    >
                      <span>Vordefiniertes Typografie-Set:</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {inferTypographySet(settings.clockFont, settings.clockWeight).badge}
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        id="typography-set-select"
                        value={
                          settings.typographySet ||
                          inferTypographySet(settings.clockFont, settings.clockWeight).id
                        }
                        onChange={(e) => {
                          const chosenSet = TYPOGRAPHY_SETS.find((t) => t.id === e.target.value);
                          if (chosenSet) {
                            onUpdateSettings((p) => ({
                              ...p,
                              clockFont: chosenSet.font,
                              clockWeight: chosenSet.defaultWeight,
                              typographySet: chosenSet.id,
                            }));
                            triggerHaptic(settings.vibrationEnabled);
                            showFeedback(`${chosenSet.name} aktiviert`);
                          }
                        }}
                        className="w-full appearance-none bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 pr-10"
                      >
                        <optgroup label="Typografie-Stile">
                          {TYPOGRAPHY_SETS.map((t) => (
                            <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                              {t.category}: {t.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Aktive Set-Vorschaukarte */}
                    {(() => {
                      const activeSet = inferTypographySet(settings.clockFont, settings.clockWeight);
                      return (
                        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-medium text-slate-300 truncate">
                              {activeSet.tagline}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              {activeSet.description}
                            </div>
                          </div>
                          <div
                            className={`text-base font-semibold px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-100 ${activeSet.fontClass} ${activeSet.trackingClass} tabular-numbers select-none`}
                            title="Live-Schriftprobe"
                          >
                            12:34:56
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Individuelle Einzelschriftart-Auswahl */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">
                      Schriftart manuell wählen
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'mono' as ClockFont, label: 'Mono-space', desc: 'Terminal', fontCls: 'font-mono-digital' },
                        { id: 'serif' as ClockFont, label: 'Serif', desc: 'Klassisch', fontCls: 'font-serif-clock' },
                        { id: 'inter' as ClockFont, label: 'Sans-Serif', desc: 'Minimal', fontCls: 'font-inter' },
                        { id: 'outfit' as ClockFont, label: 'Geometric', desc: 'Modern', fontCls: 'font-outfit' },
                        { id: 'school' as ClockFont, label: 'Rund Display', desc: 'Comfortaa', fontCls: 'font-school' },
                        { id: 'sans' as ClockFont, label: 'Clean Sans', desc: 'Neutral', fontCls: 'font-sans-clock' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            onUpdateSettings((p) => ({ ...p, clockFont: f.id, typographySet: undefined }));
                            triggerHaptic(settings.vibrationEnabled);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            settings.clockFont === f.id
                              ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-2 ring-blue-500/30'
                              : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-[11px] font-semibold truncate">{f.label}</div>
                          <div className={`text-xs mt-1 ${f.fontCls} text-slate-200 opacity-90`}>
                            12:34
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schriftstärke */}
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block mb-2">
                      Schriftstärke (Gewicht)
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
                          onClick={() => {
                            onUpdateSettings((p) => ({ ...p, clockWeight: w.id }));
                            triggerHaptic(settings.vibrationEnabled);
                          }}
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
                  <MaterialSwitch
                    label="Automatische Schriftgrößen-Skalierung"
                    description="Passt die Zifferngröße der Uhr dynamisch an die Fenster- und Bildschirmgröße an, um den Anzeigebereich stets optimal auszufüllen"
                    checked={settings.autoScaleFontSize ?? true}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, autoScaleFontSize: v }))}
                  />

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div>
                        <span className="font-semibold text-slate-200">Größen-Skalierung</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          {settings.autoScaleFontSize ? '(Feinabstimmung)' : '(Statisch)'}
                        </span>
                      </div>
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
                    label="Puls-Animation (Atmung)"
                    description="Subtiles rhythmisches Atmen der Ziffern im Sekundentakt"
                    checked={settings.enableBreathingAnimation}
                    onChange={(v) =>
                      onUpdateSettings((p) => ({ ...p, enableBreathingAnimation: v }))
                    }
                  />
                </div>

                {/* Ziffern-Glow & Hinterleuchtung (Intensität & Ausbreitung) */}
                <GlowEffectControl
                  enabled={settings.enableGlow}
                  intensity={settings.glowIntensity ?? 55}
                  spread={settings.glowSpread ?? 45}
                  glowColor={settings.glowColor}
                  clockColor={settings.clockColor}
                  onToggleEnabled={(enabled) =>
                    onUpdateSettings((prev) => ({ ...prev, enableGlow: enabled }))
                  }
                  onChangeIntensity={(intensity) =>
                    onUpdateSettings((prev) => ({ ...prev, glowIntensity: intensity }))
                  }
                  onChangeSpread={(spread) =>
                    onUpdateSettings((prev) => ({ ...prev, glowSpread: spread }))
                  }
                  onChangeGlowColor={(glowColor) =>
                    onUpdateSettings((prev) => ({ ...prev, glowColor }))
                  }
                  showFeedback={showFeedback}
                  vibrationEnabled={settings.vibrationEnabled}
                />

                {/* CSS-basierte Eingangsanimation (Screen-Wake, Menü-Exit & Zen-Modus) */}
                <EntranceAnimationControl
                  enabled={settings.enableEntranceAnimation ?? true}
                  animationType={settings.entranceAnimationType ?? 'slide-up'}
                  wakeScreenEnabled={settings.entranceWakeScreenEnabled ?? true}
                  menuExitEnabled={settings.entranceMenuExitEnabled ?? true}
                  zenToggleEnabled={settings.entranceZenToggleEnabled ?? true}
                  onToggleEnabled={(enabled) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      enableEntranceAnimation: enabled,
                    }))
                  }
                  onChangeAnimationType={(type) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      entranceAnimationType: type,
                    }))
                  }
                  onToggleWakeScreen={(enabled) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      entranceWakeScreenEnabled: enabled,
                    }))
                  }
                  onToggleMenuExit={(enabled) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      entranceMenuExitEnabled: enabled,
                    }))
                  }
                  onToggleZenToggle={(enabled) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      entranceZenToggleEnabled: enabled,
                    }))
                  }
                  showFeedback={showFeedback}
                  vibrationEnabled={settings.vibrationEnabled}
                />

                {/* Animationstyp (Zeitänderung / Ziffernwechsel: Flipping, sanftes Gleiten, einfaches Ausblenden) */}
                <DigitTransitionControl
                  transitionType={settings.digitTransition ?? 'flip'}
                  durationMs={settings.digitFadeDuration ?? 340}
                  onChangeTransition={(type) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      digitTransition: type,
                      _digitTransitionCustomized: true,
                    }))
                  }
                  onChangeDuration={(dur) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      digitFadeDuration: dur,
                    }))
                  }
                  showFeedback={showFeedback}
                  vibrationEnabled={settings.vibrationEnabled}
                />

                {/* Hintergrund-Blur (Glassmorphism) Schieberegler */}
                <BackdropBlurControl
                  value={settings.backdropBlurIntensity ?? 16}
                  onChange={(val) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      backdropBlurIntensity: val,
                    }))
                  }
                  showFeedback={showFeedback}
                  vibrationEnabled={settings.vibrationEnabled}
                />
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
                {/* Zeitzone & Synchronisation */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Zeitzone & Atomzeit-Standort
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Stellt sicher, dass alle Geräte synchron die exakte Uhrzeit anzeigen – selbst wenn ein Laptop eine falsche Windows-Zeitzone oder deaktivierte Sommerzeit hat.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <label htmlFor="settings-timezone-select" className="text-xs font-semibold text-slate-300 block">
                      Aktive Zeitzone
                    </label>
                    <select
                      id="settings-timezone-select"
                      value={settings.timeZone || 'Europe/Berlin'}
                      onChange={(e) =>
                        onUpdateSettings((p) => ({
                          ...p,
                          timeZone: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="Europe/Berlin">
                        Deutschland, Österreich, Schweiz (Berlin, Wien, Zürich – MEZ / MESZ) [Standard]
                      </option>
                      <option value="auto">
                        Automatisch (Lokale System-Zeitzone des Geräts)
                      </option>
                      <option value="Europe/London">
                        Großbritannien (London – GMT / BST)
                      </option>
                      <option value="UTC">
                        Koordinierte Weltzeit (UTC)
                      </option>
                      <option value="America/New_York">
                        USA Ostküste (New York – EST / EDT)
                      </option>
                      <option value="Asia/Tokyo">
                        Japan (Tokio – JST)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Online-Atomuhr Synchronisation */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Online-Atomuhr (NTP)
                      </span>
                    </div>
                    {atomicState && (
                      <span
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md font-semibold border ${
                          atomicState.status === 'synced'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : atomicState.status === 'syncing'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {atomicState.status === 'synced'
                          ? 'Synchronisiert'
                          : atomicState.status === 'syncing'
                          ? 'Sync läuft...'
                          : 'Offline-Fallback'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Gleicht die Uhrzeit über NTP-Protokolle mit weltweiten Atomuhr-Servern ab. Deine Uhrzeit ist damit sekundengenau synchronisiert – unabhängig von der Systemzeit deines Geräts.
                  </p>

                  {/* Offset Notification if device clock is inaccurate */}
                  {atomicState && Math.abs(atomicState.offsetMs) > 1000 && (
                    <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-xs text-blue-200 space-y-1">
                      <div className="font-semibold text-blue-100 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span>Geräte-Uhr automatisch korrigiert</span>
                      </div>
                      <p className="text-[11px] text-blue-300/90 leading-relaxed">
                        Deine interne Systemuhr {formatTimeOffsetDetailed(atomicState.offsetMs)}. Die WebClock gleicht diesen Unterschied automatisch aus, damit deine Uhrzeit mit allen anderen Geräten übereinstimmt!
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Korrektur zur Geräte-Uhr:</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {atomicState ? `${formatTimeOffset(atomicState.offsetMs)} (${atomicState.offsetMs} ms)` : '0 ms'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Zeitserver-Quelle:</span>
                      <span className="text-slate-200 font-medium truncate max-w-[200px]">
                        {atomicState?.syncSource || 'Online UTC Atomuhr'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Netzwerk-Latenz (RTT):</span>
                      <span className="font-mono text-slate-200">
                        {atomicState?.latencyMs ? `${atomicState.latencyMs} ms` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Letzter Abgleich:</span>
                      <span className="text-slate-200">
                        {atomicState?.lastSyncTime
                          ? atomicState.lastSyncTime.toLocaleTimeString()
                          : 'Wird ermittelt...'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (onTriggerSync) onTriggerSync();
                        showFeedback('Atomuhr-Abgleich gestartet...');
                      }}
                      disabled={atomicState?.status === 'syncing'}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          atomicState?.status === 'syncing' ? 'animate-spin' : ''
                        }`}
                      />
                      <span>Jetzt mit Atomuhr abgleichen</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 divide-y divide-slate-800/40">
                    <MaterialSwitch
                      label="Atomuhr-Synchronisation verwenden"
                      description="Uhrzeit nach Online-Atomuhr statt nach lokaler Geräte-Uhr ausrichten"
                      checked={settings.useAtomicSync}
                      onChange={(v) => onUpdateSettings((p) => ({ ...p, useAtomicSync: v }))}
                    />

                    <MaterialSwitch
                      label="Atomuhr-Status im Header"
                      description="Kompaktes Status-Badge oben links einblenden"
                      checked={settings.showSyncBadge}
                      onChange={(v) => onUpdateSettings((p) => ({ ...p, showSyncBadge: v }))}
                    />
                  </div>
                </div>

                {/* Zusätzliche Zeitzonen (Weltuhr unter Hauptuhr) */}
                <TimeZonesSettingsSection
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                  showFeedback={showFeedback}
                />

                {/* Automatischer Zen-Modus Zeitplan (Timer) */}
                <ZenScheduleCard
                  enabled={settings.zenScheduleEnabled ?? false}
                  startTime={settings.zenScheduleStartTime ?? '22:00'}
                  endTime={settings.zenScheduleEndTime ?? '07:00'}
                  is24Hour={settings.is24Hour}
                  onToggleEnabled={(enabled) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      zenScheduleEnabled: enabled,
                    }))
                  }
                  onChangeTimes={(startTime, endTime) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      zenScheduleStartTime: startTime,
                      zenScheduleEndTime: endTime,
                    }))
                  }
                  onToggleZenNow={onToggleZenMode}
                  isCurrentlyZen={isZenMode}
                  showFeedback={showFeedback}
                  vibrationEnabled={settings.vibrationEnabled}
                />

                {/* Display & Layout Options */}
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
                    <div className="py-3 px-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <span>Datumsformat</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {settings.dateFormat || 'DD.MM.YYYY'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'DD.MM.YYYY' as DateFormat, label: 'DD.MM.YYYY', region: 'DE / EU' },
                          { id: 'MM/DD/YYYY' as DateFormat, label: 'MM/DD/YYYY', region: 'US' },
                          { id: 'YYYY-MM-DD' as DateFormat, label: 'YYYY-MM-DD', region: 'ISO' },
                        ].map((fmt) => {
                          const isSelected = (settings.dateFormat || 'DD.MM.YYYY') === fmt.id;
                          return (
                            <button
                              key={fmt.id}
                              type="button"
                              onClick={() => {
                                onUpdateSettings((p) => ({ ...p, dateFormat: fmt.id }));
                                triggerHaptic(settings.vibrationEnabled);
                              }}
                              className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                isSelected
                                  ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-2 ring-blue-500/25 shadow-sm'
                                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              <span className="font-mono text-xs font-bold tracking-tight">
                                {fmt.label}
                              </span>
                              <span className="text-[10px] opacity-75 font-medium">
                                {fmt.region}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {settings.showDate && (
                    <MaterialSwitch
                      label="Wochentag einblenden"
                      description="Name des Wochentags (z.B. Dienstag) vor das Datum setzen"
                      checked={settings.showDayOfWeek}
                      onChange={(v) => onUpdateSettings((p) => ({ ...p, showDayOfWeek: v }))}
                    />
                  )}

                  {/* Weltuhren auf Hauptbildschirm anzeigen */}
                  <MaterialSwitch
                    label="Weltuhren auf Hauptbildschirm anzeigen"
                    description="Ausgewählte Weltzeitzonen mit Live-Uhrzeiten direkt unter der großen Digitaluhr ein- oder ausblenden"
                    checked={settings.showAdditionalTimeZones}
                    onChange={(v) => {
                      onUpdateSettings((p) => ({ ...p, showAdditionalTimeZones: v }));
                      showFeedback(v ? 'Weltuhren eingeblendet' : 'Weltuhren ausgeblendet');
                    }}
                  />

                  {/* Mobile Akku-Anzeige */}
                  <MaterialSwitch
                    label="Akku-Anzeige auf Mobilgeräten"
                    description="Dezente Akkuladestands-Anzeige auf Smartphones & Tablets (wird im Vollbildmodus automatisch ausgeblendet)"
                    checked={settings.showBatteryIndicator ?? true}
                    onChange={(v) => {
                      onUpdateSettings((p) => ({ ...p, showBatteryIndicator: v }));
                      showFeedback(v ? 'Akku-Anzeige aktiviert' : 'Akku-Anzeige deaktiviert');
                    }}
                  />

                  {/* Animationstyp (Zeitänderung / Ziffernwechsel: Flipping, sanftes Gleiten, einfaches Ausblenden) */}
                  <DigitTransitionControl
                    transitionType={settings.digitTransition ?? 'flip'}
                    durationMs={settings.digitFadeDuration ?? 340}
                    onChangeTransition={(type) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        digitTransition: type,
                        _digitTransitionCustomized: true,
                      }))
                    }
                    onChangeDuration={(dur) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        digitFadeDuration: dur,
                      }))
                    }
                    showFeedback={showFeedback}
                    vibrationEnabled={settings.vibrationEnabled}
                    title="Animationstyp (Zeitänderung)"
                    description="Wähle, wie die Zeitänderung der Ziffern visualisiert wird (z. B. Flipping, sanftes Gleiten oder einfaches Ausblenden)"
                  />

                  {/* Colon Separator Animation & Pulse Customization */}
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-200">
                          Doppelpunkt-Pulsieren & Ticken (:)
                        </span>
                        <span className="text-xs text-slate-400">
                          Subtile Animation zur optischen Untermalung des Sekundentakts
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 uppercase">
                        {settings.colonAnimation || (settings.showBlinkingSeparator ? 'blink' : 'pulse')}
                      </span>
                    </div>

                    {/* Mode selection buttons */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
                      {[
                        { id: 'pulse', label: 'Pulsieren', hint: 'Weich' },
                        { id: 'glow', label: 'Glühen', hint: 'Akzent' },
                        { id: 'bounce', label: 'Sprung', hint: 'Mikro' },
                        { id: 'blink', label: 'Blinken', hint: 'Klassisch' },
                        { id: 'static', label: 'Statisch', hint: 'Aus' },
                      ].map((mode) => {
                        const currentMode =
                          settings.colonAnimation || (settings.showBlinkingSeparator ? 'blink' : 'pulse');
                        const isSelected = currentMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() =>
                              onUpdateSettings((p) => ({
                                ...p,
                                colonAnimation: mode.id as any,
                                showBlinkingSeparator: mode.id === 'blink',
                              }))
                            }
                            className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-sky-500/20 border-sky-500/60 text-sky-200 font-semibold shadow-sm'
                                : 'bg-slate-900/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="text-xs">{mode.label}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{mode.hint}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Pulse & Ticking Intensity Slider (when not static) */}
                    {(settings.colonAnimation || (settings.showBlinkingSeparator ? 'blink' : 'pulse')) !== 'static' && (
                      <div className="pt-2 border-t border-slate-700/40 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">Animations-Intensität</span>
                          <span className="font-mono text-sky-400 font-semibold">
                            {Math.round((settings.colonPulseIntensity ?? 0.6) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-500">Subtil</span>
                          <input
                            id="colon-pulse-intensity-slider"
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={settings.colonPulseIntensity ?? 0.6}
                            onChange={(e) =>
                              onUpdateSettings((p) => ({
                                ...p,
                                colonPulseIntensity: parseFloat(e.target.value),
                              }))
                            }
                            className="flex-1 accent-sky-500 cursor-pointer"
                            aria-label="Doppelpunkt Puls Intensität"
                          />
                          <span className="text-[10px] font-mono text-slate-500">Kräftig</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <MaterialSwitch
                    label="Oberflächen-Rahmenkarte"
                    description="Dezente gläserne Material-Karte um die Zeitanzeige"
                    checked={settings.showCardContainer}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, showCardContainer: v }))}
                  />

                  {/* Hintergrund-Blur & Glassmorphism Regler */}
                  <BackdropBlurControl
                    value={settings.backdropBlurIntensity ?? 16}
                    onChange={(val) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        backdropBlurIntensity: val,
                      }))
                    }
                    showFeedback={showFeedback}
                    vibrationEnabled={settings.vibrationEnabled}
                    className="mt-3"
                  />
                </div>
              </motion.div>
            )}

            {/* === 3. AUDIO (Beruhigende Hintergrundgeräusche & Soundeffekte) === */}
            {activeTab === 'audio' && (
              <motion.div
                key="tab-audio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <AudioSettingsTab
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                  showFeedback={showFeedback}
                  onTogglePlayAmbient={(type) => {
                    if (onTogglePlayAmbient) {
                      onTogglePlayAmbient(type);
                    } else {
                      // Fallback: update local settings directly
                      onUpdateSettings((prev) => {
                        const current = prev.ambientSound || {
                          activeSound: 'none',
                          volume: 0.35,
                          isPlaying: false,
                          autoPlayOnStart: false,
                        };
                        const nextIsPlaying =
                          type === 'none'
                            ? false
                            : current.activeSound === type && current.isPlaying
                            ? false
                            : true;
                        return {
                          ...prev,
                          ambientSound: {
                            ...current,
                            activeSound: type,
                            isPlaying: nextIsPlaying,
                          },
                        };
                      });
                    }
                  }}
                />
              </motion.div>
            )}

            {/* === 4. EINSTELLUNGEN (Allgemeine Optionen) === */}
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

                  {/* Ton an/aus (Standard: Aus) */}
                  <MaterialSwitch
                    label="Töne & Audioeffekte"
                    description="Dezentes akustisches Ticken im Sekundentakt (Standard: Aus)"
                    checked={settings.soundEnabled}
                    onChange={(v) => {
                      try {
                        localStorage.setItem('webclock_sound_explicit_choice_v1', 'true');
                      } catch {}
                      onUpdateSettings((p) => ({ ...p, soundEnabled: v }));
                    }}
                  />

                  {/* Vibration */}
                  <MaterialSwitch
                    label="Haptisches Feedback (Vibration)"
                    description="Kurze Impulse auf Touchscreens bei Interaktionen"
                    checked={settings.vibrationEnabled}
                    onChange={(v) => onUpdateSettings((p) => ({ ...p, vibrationEnabled: v }))}
                  />
                </div>

                {/* Schul-Stundenplan & Pausen-Sperre Card */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">
                          Schul-Stundenplan & Pausen-Sperre
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Klasse HO 2 • Klassenlehrerin Frau Schmitz (2026/27)
                        </p>
                      </div>
                    </div>
                    {onOpenTimetable && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenTimetable();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>Stundenplan</span>
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-800/80 pt-1">
                    <MaterialSwitch
                      label="Pausen-Sperre für Games aktivieren"
                      description="Games dürfen nur während der offiziellen Schulpausen (10:30-11:00 & 13:15-14:10 Uhr) gespielt werden"
                      checked={settings.schoolBreakGameLockEnabled}
                      onChange={(v) => onUpdateSettings((p) => ({ ...p, schoolBreakGameLockEnabled: v }))}
                    />

                    <MaterialSwitch
                      label="Schulstatus auf der Startseite"
                      description="Aktuelle Stunde, Pause & Countdown unter der Uhr anzeigen"
                      checked={settings.showSchoolBadge}
                      onChange={(v) => onUpdateSettings((p) => ({ ...p, showSchoolBadge: v }))}
                    />

                    {/* Sperrmodus Auswahl */}
                    <div className="py-3 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Sperr-Verhalten
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {[
                          { id: 'school_breaks_only', label: 'Schultag-Modus', desc: 'Nur im Unterricht gesperrt' },
                          { id: 'strict_breaks_only', label: 'Strikter Modus', desc: 'Nur in Pausen erlaubt' },
                          { id: 'always_allowed', label: 'Deaktiviert', desc: 'Games jederzeit spielbar' },
                        ].map((mode) => {
                          const isSelected = (settings.schoolBreakLockMode || 'school_breaks_only') === mode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() =>
                                onUpdateSettings((p) => ({ ...p, schoolBreakLockMode: mode.id as any }))
                              }
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-blue-600/30 border-blue-500 text-blue-100 ring-1 ring-blue-500/30'
                                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className="text-xs font-bold text-white">{mode.label}</span>
                              <span className="text-[10px] opacity-80 mt-0.5">{mode.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Simulation / Test Modus Buttons */}
                    <div className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          <span>Simulation & Testen</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Zum Ausprobieren der Pausensperre
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: 'live', label: 'Live (Echtzeit)' },
                          { id: 'lesson', label: '🔒 Unterricht (09:25)' },
                          { id: 'break_1', label: '🟢 1. Pause (10:45)' },
                          { id: 'break_2', label: '🟢 Mittag (13:35)' },
                        ].map((sim) => {
                          const isSelected = (settings.schoolSimulationMode || 'live') === sim.id;
                          return (
                            <button
                              key={sim.id}
                              type="button"
                              onClick={() => {
                                onUpdateSettings((p) => ({ ...p, schoolSimulationMode: sim.id as any }));
                                onSetSimulationMode?.(sim.id as any);
                              }}
                              className={`py-1.5 px-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-600 border-sky-400 text-white shadow-sm ring-1 ring-sky-300/30'
                                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              {sim.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lehrer-Freischaltung Toggle */}
                    <div className="pt-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <Unlock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Lehrer-Freigabe (Sofort entsperren)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Ermöglicht Lehrkräften das Spielen außerhalb der Pausen freizuschalten
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onToggleTeacherOverride?.();
                          onUpdateSettings((p) => ({
                            ...p,
                            teacherOverrideActive: !p.teacherOverrideActive,
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                          teacherOverride || settings.teacherOverrideActive
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {teacherOverride || settings.teacherOverrideActive ? 'Aktiviert' : 'Deaktiviert'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pausen-Spiele Schnellzugriff */}
                {onOpenGames && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        <Gamepad2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          Pausen-Spiele (Arcade)
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Tetris, 2048, Snake, Minesweeper, Memory & Flappy Bird
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGames();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                    >
                      Spielen
                    </button>
                  </div>
                )}

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

                  {/* Design-Konfiguration als JSON exportieren / importieren */}
                  <div className="pt-3 border-t border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Design als Datei sichern & teilen
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                      Exportiere alle Farben, Schriften, Partikel & Optionen als JSON-Datei oder lade ein gespeichertes Design.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleExportConfig}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-98 cursor-pointer"
                      >
                        <FileDown className="w-4 h-4 text-sky-400" />
                        JSON exportieren
                      </button>

                      <button
                        type="button"
                        onClick={() => importFileInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-98 cursor-pointer"
                      >
                        <FileUp className="w-4 h-4 text-emerald-400" />
                        JSON importieren
                      </button>
                    </div>
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

                {/* Datenschutz & Atomuhr Kurzhinweis */}
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                  <Radio className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Online-Atomuhr aktiv:</span> Diese Anwendung gleicht die Uhrzeit mit offiziellen UTC-Atomuhr-Servern ab und kompensiert Übertragungsverzögerungen. Deine Uhrzeit ist dadurch absolut präzise und unabhängig von lokalen Uhrenfehlern.
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
                      { key: 'A', desc: 'Audio & Hintergrundgeräusche öffnen' },
                      { key: 'G', desc: 'Pausen-Spiele (Games) öffnen' },
                      { key: 'F', desc: 'Vollbildmodus umschalten' },
                      { key: 'S', desc: 'Einstellungen / Menü öffnen oder schließen' },
                      { key: 'Esc', desc: 'Menü oder Spiel schließen' },
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};
