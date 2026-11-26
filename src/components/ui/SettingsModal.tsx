import { X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { GraphicsQuality, TimeMode, WeatherType } from '../../types/game';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="w-full max-w-lg rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="font-display text-xl font-bold text-zinc-100">Settings & Environment</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Graphics Quality */}
          <div>
            <label className="text-xs font-semibold text-zinc-300">Graphics Quality</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['high', 'medium'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => updateSettings({ graphicsQuality: q })}
                  className={`rounded-lg py-2 px-3 text-xs font-semibold capitalize transition-colors ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-zinc-950'
                      : 'border border-white/10 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label className="text-xs font-semibold text-zinc-300">Day & Night Cycle</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(['dynamic', 'noon', 'sunset', 'midnight'] as TimeMode[]).map((tm) => (
                <button
                  key={tm}
                  type="button"
                  onClick={() => updateSettings({ timeMode: tm })}
                  className={`rounded-lg py-2 px-2 text-xs font-semibold capitalize transition-colors ${
                    settings.timeMode === tm
                      ? 'bg-amber-500 text-zinc-950'
                      : 'border border-white/10 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {tm}
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div>
            <label className="text-xs font-semibold text-zinc-300">Weather Conditions</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(['dynamic', 'sunny', 'rain', 'fog'] as Array<WeatherType | 'dynamic'>).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => updateSettings({ weatherMode: w })}
                  className={`rounded-lg py-2 px-2 text-xs font-semibold capitalize transition-colors ${
                    settings.weatherMode === w
                      ? 'bg-amber-500 text-zinc-950'
                      : 'border border-white/10 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Sliders */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-300">Music Volume</span>
              <span className="font-mono-num text-zinc-400">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              onChange={(e) => updateSettings({ musicVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-300">Sound Effects Volume</span>
              <span className="font-mono-num text-zinc-400">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(e) => updateSettings({ sfxVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-300">Ambient City & Rain Volume</span>
              <span className="font-mono-num text-zinc-400">
                {Math.round(settings.ambientVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.ambientVolume}
              onChange={(e) => updateSettings({ ambientVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-medium text-zinc-300">Camera Sensitivity</span>
              <span className="font-mono-num text-zinc-400">
                {settings.cameraSensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={settings.cameraSensitivity}
              onChange={(e) => updateSettings({ cameraSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Mobile Controls Toggle */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              <div className="text-xs font-semibold text-zinc-200">On-Screen Touch Controls</div>
              <div className="text-[11px] text-zinc-400">
                Show virtual joystick and driving pedals on desktop
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ showMobileControls: !settings.showMobileControls })}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                settings.showMobileControls
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {settings.showMobileControls ? 'Enabled' : 'Auto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
