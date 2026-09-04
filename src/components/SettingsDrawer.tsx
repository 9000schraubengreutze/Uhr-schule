import React, { useRef } from 'react';
import {
  X,
  Clock,
  Palette,
  Image as ImageIcon,
  Sliders,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sun,
  Moon,
  Upload,
  Trash2,
  Check,
  Radio,
  RefreshCw,
  Globe,
  Info,
  Sparkles,
} from 'lucide-react';
import { ClockFont, ClockSettings, ClockWeight, CuratedTheme } from '../types';
import {
  BG_COLOR_PALETTES,
  CLOCK_COLOR_PALETTES,
  CURATED_THEMES,
  DEFAULT_SETTINGS,
  GRADIENT_PRESETS,
} from '../utils/presets';
import { AtomicTimeState } from '../utils/atomicTime';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
  onUpdateSettings: (updater: (prev: ClockSettings) => ClockSettings) => void;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  atomicState?: AtomicTimeState;
  onTriggerSync?: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onUploadImage,
  onRemoveImage,
  isFullscreen,
  onToggleFullscreen,
  atomicState,
  onTriggerSync,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
      // Reset input value so same file can be reselected if needed
      e.target.value = '';
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Möchten Sie alle Einstellungen auf den Standard zurücksetzen?')) {
      onRemoveImage();
      onUpdateSettings(() => DEFAULT_SETTINGS);
    }
  };

  const applyThemeMode = (mode: 'dark' | 'light') => {
    if (mode === 'light') {
      onUpdateSettings((prev) => ({
        ...prev,
        themeMode: 'light',
        bgType: 'gradient',
        gradientPresetId: 'minimal-light',
        clockColor: '#0f172a',
        bgOverlayOpacity: 0,
      }));
    } else {
      onUpdateSettings((prev) => ({
        ...prev,
        themeMode: 'dark',
        bgType: 'gradient',
        gradientPresetId: 'deep-space',
        clockColor: '#ffffff',
        bgOverlayOpacity: 20,
      }));
    }
  };

  const isThemeActive = (theme: CuratedTheme) => {
    if (settings.themeId === theme.id) return true;
    if (
      settings.clockColor.toLowerCase() === theme.clockColor.toLowerCase() &&
      settings.bgType === theme.bgType
    ) {
      if (theme.bgType === 'gradient' && settings.gradientPresetId === theme.gradientPresetId) {
        return true;
      }
      if (theme.bgType === 'color' && settings.bgColor.toLowerCase() === (theme.bgColor || '').toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  const handleSelectTheme = (theme: CuratedTheme) => {
    onRemoveImage();
    onUpdateSettings((prev) => ({
      ...prev,
      themeId: theme.id,
      clockColor: theme.clockColor,
      clockFont: theme.clockFont,
      clockWeight: theme.clockWeight,
      bgType: theme.bgType,
      bgColor: theme.bgColor || prev.bgColor,
      gradientPresetId: theme.gradientPresetId || prev.gradientPresetId,
      customGradient: theme.customGradient || prev.customGradient,
      accentColor: theme.accentColor,
      themeMode: theme.themeMode || 'dark',
      hasCustomImage: false,
      bgOverlayOpacity: 0,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        id="settings-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Drawer Panel */}
      <aside
        id="settings-panel"
        className="relative z-10 w-full sm:w-[380px] h-full bg-[#0a0a0c]/80 bg-white/5 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold tracking-tight text-white">
              WebClock Einstellungen
            </h2>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            aria-label="Einstellungen schließen"
            className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7 custom-scrollbar">
          {/* Quick Mode & Fullscreen */}
          <div className="grid grid-cols-2 gap-3">
            <button
              id="toggle-fullscreen-btn"
              onClick={onToggleFullscreen}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white/90 font-medium transition-all"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-neutral-300" />
                  <span>Vollbild aus</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-neutral-300" />
                  <span>Vollbild</span>
                </>
              )}
            </button>

            <button
              id="toggle-theme-mode-btn"
              onClick={() => applyThemeMode(settings.themeMode === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white/90 font-medium transition-all"
            >
              {settings.themeMode === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Hellmodus</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-300" />
                  <span>Dunkelmodus</span>
                </>
              )}
            </button>
          </div>

          {/* SECTION 0: Atomic Clock Synchronization */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Atomuhr-Synchronisation
                </h3>
              </div>
              <button
                id="toggle-atomic-sync-btn"
                onClick={() =>
                  onUpdateSettings((prev) => ({ ...prev, useAtomicSync: !prev.useAtomicSync }))
                }
                title={settings.useAtomicSync ? 'Auf PC-Systemzeit umschalten' : 'Atomuhr-Sync aktivieren'}
                className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-200 cursor-pointer ${
                  settings.useAtomicSync ? 'bg-emerald-600' : 'bg-white/10 border border-white/10'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    settings.useAtomicSync ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              {settings.useAtomicSync
                ? 'Aktiviert: WebClock korrigiert Abweichungen Ihrer PC-Uhr automatisch über atomare NTP-Zeitserver.'
                : 'Deaktiviert: Die Uhr zeigt die unkorrigierte lokale Systemzeit Ihres Computers an.'}
            </p>

            {settings.useAtomicSync && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                {/* Status Indicator Row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Status</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    {atomicState?.status === 'syncing' ? (
                      <span className="text-blue-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Gleiche ab...
                      </span>
                    ) : atomicState?.status === 'synced' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        Präzise synchron
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Radio className="w-3 h-3" />
                        PC-Uhr (Offline)
                      </span>
                    )}
                  </div>
                </div>

                {/* Offset / Drift Info */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Abweichung zur PC-Uhr</span>
                  <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded text-[11px]">
                    {atomicState?.offsetMs !== undefined
                      ? `${atomicState.offsetMs > 0 ? '+' : ''}${(atomicState.offsetMs / 1000).toFixed(3)} s (${atomicState.offsetMs > 0 ? '+' : ''}${Math.round(atomicState.offsetMs)} ms)`
                      : 'Wird ermittelt...'}
                  </span>
                </div>

                {/* Round Trip Ping */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Netzwerk-Latenz (RTT)</span>
                  <span className="text-white/80 font-mono text-[11px]">
                    {atomicState?.latencyMs ? `${atomicState.latencyMs} ms` : '—'}
                  </span>
                </div>

                {/* Source */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Referenzquelle</span>
                  <span className="text-white/80 text-[11px] truncate max-w-[180px]" title={atomicState?.syncSource}>
                    {atomicState?.syncSource || 'Digitale Atomuhr (NTP)'}
                  </span>
                </div>

                {/* Manual Sync Button */}
                <button
                  id="trigger-atomic-sync-btn"
                  onClick={onTriggerSync}
                  disabled={atomicState?.status === 'syncing'}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/15 text-xs text-white font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${atomicState?.status === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Jetzt neu synchronisieren</span>
                </button>
              </div>
            )}
          </section>

          {/* SECTION: Themes */}
          <section id="settings-themes-section">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-color, #3b82f6)' }} />
                <h3 className="text-xs font-bold text-white/90 uppercase tracking-widest">
                  Themes
                </h3>
              </div>
              <span
                className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-white/10"
                style={{ color: 'var(--accent-color, #38bdf8)', backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                Presets
              </span>
            </div>
            <p className="text-xs text-white/60 mb-3.5 leading-relaxed">
              Vordefinierte Themes aktualisieren die globalen CSS-Variablen für Zeittypografie, Hintergrundverläufe und Akzente gleichzeitig.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CURATED_THEMES.map((theme) => {
                const active = isThemeActive(theme);
                return (
                  <button
                    key={theme.id}
                    id={`curated-theme-${theme.id}`}
                    onClick={() => handleSelectTheme(theme)}
                    className={`relative p-3 rounded-xl text-left transition-all duration-200 cursor-pointer overflow-hidden border group ${
                      active
                        ? 'scale-[1.02]'
                        : 'border-white/15 hover:border-white/35 hover:scale-[1.01]'
                    }`}
                    style={{
                      background: theme.previewBg,
                      borderColor: active ? theme.accentColor : undefined,
                      boxShadow: active
                        ? `0 0 18px ${theme.accentGlow || 'rgba(59,130,246,0.35)'}`
                        : undefined,
                    }}
                  >
                    {/* Top Row: Mini Time Preview & Status Check */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-base font-bold tracking-tight tabular-numbers drop-shadow-md"
                        style={{
                          color: theme.clockColor,
                          fontFamily:
                            theme.clockFont === 'mono'
                              ? 'JetBrains Mono, monospace'
                              : theme.clockFont === 'outfit'
                              ? 'Outfit, sans-serif'
                              : 'Inter, sans-serif',
                        }}
                      >
                        12:34:56
                      </span>
                      {active ? (
                        <span
                          className="flex items-center justify-center w-5 h-5 rounded-full text-white shadow-md"
                          style={{
                            backgroundColor: theme.accentColor,
                            boxShadow: `0 0 8px ${theme.accentGlow || 'rgba(59,130,246,0.5)'}`,
                          }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-white/70 border border-white/10 backdrop-blur-sm group-hover:text-white">
                          {theme.bgType === 'gradient' ? 'Verlauf' : 'Farbe'}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div className="text-xs font-semibold text-white drop-shadow-sm truncate">
                      {theme.name}
                    </div>
                    <div className="text-[10px] text-white/75 truncate mt-0.5 leading-tight">
                      {theme.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 1: Clock & Time Settings */}
          <section>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Anzeige
            </h3>

            <div className="space-y-4">
              {/* Show Date */}
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Datum anzeigen</span>
                <button
                  id="toggle-date-btn"
                  onClick={() =>
                    onUpdateSettings((prev) => ({ ...prev, showDate: !prev.showDate }))
                  }
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-200 cursor-pointer ${
                    settings.showDate ? 'bg-blue-600' : 'bg-white/10 border border-white/10'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      settings.showDate ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Show Seconds */}
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Sekunden anzeigen</span>
                <button
                  id="toggle-seconds-btn"
                  onClick={() =>
                    onUpdateSettings((prev) => ({ ...prev, showSeconds: !prev.showSeconds }))
                  }
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-200 cursor-pointer ${
                    settings.showSeconds ? 'bg-blue-600' : 'bg-white/10 border border-white/10'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      settings.showSeconds ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 24-Hour vs 12-Hour format */}
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">24-Stunden-Format</span>
                <button
                  id="toggle-24h-format-btn"
                  onClick={() =>
                    onUpdateSettings((prev) => ({ ...prev, is24Hour: !prev.is24Hour }))
                  }
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-200 cursor-pointer ${
                    settings.is24Hour ? 'bg-blue-600' : 'bg-white/10 border border-white/10'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      settings.is24Hour ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Blinking separator */}
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Blinkende Doppelpunkte</span>
                <button
                  id="toggle-blinking-separator-btn"
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      showBlinkingSeparator: !prev.showBlinkingSeparator,
                    }))
                  }
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-200 cursor-pointer ${
                    settings.showBlinkingSeparator ? 'bg-blue-600' : 'bg-white/10 border border-white/10'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      settings.showBlinkingSeparator ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Breathing animation toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white/80 text-sm block">Atmende Animation</span>
                  <span className="text-white/40 text-[11px]">Sanfter Impuls bei jedem Sekundensprung</span>
                </div>
                <button
                  id="toggle-breathing-anim-btn"
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      enableBreathingAnimation: !prev.enableBreathingAnimation,
                    }))
                  }
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-200 cursor-pointer ${
                    settings.enableBreathingAnimation ? 'bg-blue-600' : 'bg-white/10 border border-white/10'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      settings.enableBreathingAnimation ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 2: Typography & Clock Color */}
          <section>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Farben
            </h3>

            {/* Color swatches in grid */}
            <div className="grid grid-cols-5 gap-2.5 mb-3">
              {CLOCK_COLOR_PALETTES.slice(0, 4).map((c) => (
                <button
                  key={c.name}
                  title={c.name}
                  onClick={() => onUpdateSettings((prev) => ({ ...prev, clockColor: c.value }))}
                  className={`aspect-square rounded-lg transition-transform hover:scale-105 flex items-center justify-center ${
                    settings.clockColor.toLowerCase() === c.value.toLowerCase()
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0a0c]'
                      : 'border border-white/20'
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {settings.clockColor.toLowerCase() === c.value.toLowerCase() && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        c.value === '#ffffff' || c.value === '#00FF00' || c.value === '#F27D26'
                          ? 'text-black'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}

              {/* Native color picker button matching design '+' style */}
              <label
                title="Eigene Farbe wählen"
                className="aspect-square rounded-lg border border-white/20 bg-transparent hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white cursor-pointer relative"
              >
                <input
                  id="clock-color-picker"
                  type="color"
                  value={settings.clockColor}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({ ...prev, clockColor: e.target.value }))
                  }
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <span className="text-lg font-light leading-none">+</span>
              </label>
            </div>

            {/* Additional swatches */}
            <div className="flex flex-wrap gap-2 pt-1 mb-5">
              {CLOCK_COLOR_PALETTES.slice(4).map((c) => (
                <button
                  key={c.name}
                  title={c.name}
                  onClick={() => onUpdateSettings((prev) => ({ ...prev, clockColor: c.value }))}
                  className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c.value }}
                >
                  {settings.clockColor.toLowerCase() === c.value.toLowerCase() && (
                    <Check className="w-3 h-3 text-black" />
                  )}
                </button>
              ))}
            </div>

            {/* Typography options */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <label className="block text-xs font-medium text-white/80">Schriftart</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'inter', label: 'Inter (Bold)', class: 'font-inter font-bold' },
                  { id: 'mono', label: 'Mono', class: 'font-mono-digital' },
                  { id: 'outfit', label: 'Outfit', class: 'font-outfit' },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        clockFont: font.id as ClockFont,
                      }))
                    }
                    className={`px-2 py-2 text-xs rounded-lg border text-center transition-all ${
                      settings.clockFont === font.id
                        ? 'border-blue-500 bg-blue-500/20 text-white font-semibold ring-1 ring-blue-500'
                        : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                    } ${font.class}`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { weight: '300', label: 'Fein' },
                  { weight: '400', label: 'Normal' },
                  { weight: '600', label: 'Fett' },
                  { weight: '800', label: 'Ultra' },
                ].map((w) => (
                  <button
                    key={w.weight}
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        clockWeight: w.weight as ClockWeight,
                      }))
                    }
                    className={`py-1.5 text-xs rounded-lg border text-center transition-all ${
                      settings.clockWeight === w.weight
                        ? 'border-blue-500 bg-blue-500/20 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 3: Background Customization */}
          <section>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Hintergrund
            </h3>

            {/* Mode selection buttons matching Bold Typography design */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                id="bg-tab-color"
                onClick={() => onUpdateSettings((prev) => ({ ...prev, bgType: 'color' }))}
                className={`text-xs py-3 rounded-lg border transition-all ${
                  settings.bgType === 'color'
                    ? 'bg-white/20 text-white font-semibold border-white/40'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/10'
                }`}
              >
                Einfarbig
              </button>
              <button
                id="bg-tab-gradient"
                onClick={() => onUpdateSettings((prev) => ({ ...prev, bgType: 'gradient' }))}
                className={`text-xs py-3 rounded-lg border transition-all ${
                  settings.bgType === 'gradient'
                    ? 'bg-white/20 text-white font-semibold border-white/40'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/10'
                }`}
              >
                Gradient
              </button>
            </div>

            {/* Custom Image Upload Button matching theme */}
            <input
              ref={fileInputRef}
              id="image-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              id="choose-image-btn"
              onClick={() => {
                onUpdateSettings((prev) => ({ ...prev, bgType: 'image' }));
                fileInputRef.current?.click();
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white text-xs py-3 rounded-lg border border-white/10 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Eigenes Bild</span>
            </button>

            {settings.hasCustomImage && (
              <button
                id="remove-image-btn"
                onClick={onRemoveImage}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-medium text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hintergrundbild entfernen</span>
              </button>
            )}

            {/* Gradient Options when gradient is active */}
            {settings.bgType === 'gradient' && (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                <div className="text-xs font-medium text-white/80">Gradient Presets</div>
                <div className="grid grid-cols-2 gap-2">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          gradientPresetId: preset.id,
                        }))
                      }
                      className={`relative h-14 rounded-lg overflow-hidden border p-2 text-left transition-all ${
                        settings.gradientPresetId === preset.id
                          ? 'border-white ring-2 ring-blue-500 scale-[1.02]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      style={{ background: preset.css }}
                    >
                      <span className="absolute bottom-1.5 left-2 text-[10px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Solid Color Options */}
            {settings.bgType === 'color' && (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">Farbe wählen</span>
                  <input
                    id="bg-color-picker"
                    type="color"
                    value={settings.bgColor}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({ ...prev, bgColor: e.target.value }))
                    }
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {BG_COLOR_PALETTES.map((c) => (
                    <button
                      key={c.name}
                      title={c.name}
                      onClick={() => onUpdateSettings((prev) => ({ ...prev, bgColor: c.value }))}
                      className="w-7 h-7 rounded-lg border border-white/20 transition-transform hover:scale-105"
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* SECTION 4: Fullscreen Button matching Design Theme */}
          <section className="pt-4 border-t border-white/10 space-y-3">
            <button
              onClick={onToggleFullscreen}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm cursor-pointer"
            >
              {isFullscreen ? 'Vollbild beenden' : 'Vollbild aktivieren'}
            </button>
          </section>
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-white/10 flex items-center justify-between bg-black/30 shrink-0">
          <button
            id="reset-settings-btn"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zurücksetzen</span>
          </button>
          <button
            id="apply-settings-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all border border-white/10"
          >
            Schließen
          </button>
        </footer>
      </aside>
    </div>
  );
};
