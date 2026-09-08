import React from 'react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../../utils/audio';

interface MaterialSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  vibrationEnabled?: boolean;
}

export const MaterialSwitch: React.FC<MaterialSwitchProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  vibrationEnabled = true,
}) => {
  const handleClick = () => {
    if (disabled) return;
    if (vibrationEnabled) {
      triggerHaptic(12);
    }
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 py-2.5 px-3 rounded-2xl transition-colors cursor-pointer select-none ${
        disabled ? 'opacity-40 pointer-events-none' : 'hover:bg-white/5 active:bg-white/10'
      }`}
      onClick={handleClick}
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      id={id}
    >
      {(label || description) && (
        <div className="flex-1 pr-2">
          {label && <div className="text-sm font-medium text-slate-100 tracking-wide">{label}</div>}
          {description && (
            <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</div>
          )}
        </div>
      )}

      {/* Material 3 Switch Track */}
      <div
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors duration-250 ease-out border ${
          checked
            ? 'bg-blue-600 border-blue-500 shadow-sm shadow-blue-500/30'
            : 'bg-slate-800/80 border-slate-600/70 hover:border-slate-500'
        }`}
      >
        {/* Sliding Thumb */}
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`pointer-events-none inline-block h-5.5 w-5.5 rounded-full bg-white shadow-md transform ${
            checked ? 'translate-x-5' : 'translate-x-0 bg-slate-300'
          }`}
        >
          {checked ? (
            <span className="flex items-center justify-center h-full w-full text-blue-600">
              <svg className="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          ) : null}
        </motion.span>
      </div>
    </div>
  );
};
