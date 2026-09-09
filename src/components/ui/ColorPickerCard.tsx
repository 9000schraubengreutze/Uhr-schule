import React from 'react';
import { COLOR_PALETTES } from '../../utils/presets';

interface ColorPickerCardProps {
  label: string;
  description?: string;
  value: string;
  onChange: (color: string) => void;
  presetPalette?: { name: string; value: string }[];
}

export const ColorPickerCard: React.FC<ColorPickerCardProps> = ({
  label,
  description,
  value,
  onChange,
  presetPalette = COLOR_PALETTES,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div>
          <span className="text-xs font-semibold text-slate-200 tracking-wide">{label}</span>
          {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Color Preview Swatch with Hidden Native Picker */}
          <label className="relative flex items-center justify-center w-7 h-7 rounded-full border border-white/25 shadow-inner cursor-pointer overflow-hidden transition-transform hover:scale-105 active:scale-95">
            <span
              className="absolute inset-0"
              style={{ backgroundColor: value }}
            />
            <input
              type="color"
              value={value.startsWith('#') ? value : '#3b82f6'}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label={label}
            />
          </label>
          <span className="font-mono text-xs text-slate-300 uppercase tracking-wider bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/60">
            {value}
          </span>
        </div>
      </div>

      {/* Quick Swatches */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {presetPalette.slice(0, 8).map((color, idx) => {
          const isSelected = value.toLowerCase() === color.value.toLowerCase();
          return (
            <button
              key={`${color.name}-${color.value}-${idx}`}
              type="button"
              title={color.name}
              onClick={() => onChange(color.value)}
              className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                isSelected
                  ? 'scale-115 border-white ring-2 ring-blue-500/70 shadow-sm'
                  : 'border-white/20 hover:scale-105 opacity-85 hover:opacity-100'
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={color.name}
            />
          );
        })}
      </div>
    </div>
  );
};
