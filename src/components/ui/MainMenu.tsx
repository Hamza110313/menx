import { useState } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Settings, ShieldAlert } from 'lucide-react';
import { MISSIONS, getDistrictName } from '../../lib/gameConfig';
import { audioEngine } from '../../lib/audio';
import { useGameStore } from '../../store/gameStore';

interface MainMenuProps {
  onOpenSettings: () => void;
}

export function MainMenu({ onOpenSettings }: MainMenuProps) {
  const screen = useGameStore((s) => s.screen);
  const hasSaveFile = useGameStore((s) => s.hasSaveFile);
  const savedPreview = useGameStore((s) => s.savedPreview);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const continueSavedGame = useGameStore((s) => s.continueSavedGame);

  const [confirmReset, setConfirmReset] = useState(false);

  if (screen !== 'menu') return null;

  const handleNewGameClick = () => {
    audioEngine.playUiClick();
    if (hasSaveFile) {
      setConfirmReset(true);
    } else {
      startNewGame();
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-between bg-gradient-to-r from-zinc-950/92 via-zinc-950/65 to-zinc-950/35 px-6 sm:px-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 48 48"
            className="h-11 w-11 shrink-0"
            aria-hidden="true"
          >
            <polygon
              points="24,2 44,13 44,35 24,46 4,35 4,13"
              fill="#18181b"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <polygon points="24,10 34,26 14,26" fill="#f59e0b" />
            <rect x="14" y="29" width="20" height="3.5" rx="1" fill="#e4e4e7" />
            <rect x="18" y="35" width="12" height="2.5" rx="1" fill="#38bdf8" />
          </svg>
          <div>
            <div className="text-xs font-semibold tracking-wider text-amber-400">
              Open-World Action · Story Mode
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-50 text-balance">
              Solaris Bay: City Crime
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-md">
          Roam a living coastal metropolis. Hijack or customize high-performance rides, take on
          high-stakes contracts, and outrun the Solaris Bay Police Department.
        </p>

        {/* Primary Menu Actions */}
        <div className="mt-8 flex flex-col gap-3 max-w-sm">
          {hasSaveFile && savedPreview && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                continueSavedGame();
              }}
              className="group flex items-center justify-between rounded-lg bg-amber-500 px-5 py-3.5 text-left text-zinc-950 shadow-lg hover:bg-amber-400 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Play className="h-4 w-4 fill-zinc-950" />
                  <span>Continue Game</span>
                </div>
                <div className="mt-0.5 text-xs font-medium text-zinc-900/80 font-mono-num">
                  ${savedPreview.money.toLocaleString()} ·{' '}
                  {getDistrictName(savedPreview.playerPos.x, savedPreview.playerPos.z)} ·{' '}
                  {savedPreview.completedMissionIds.length}/{MISSIONS.length} Missions
                </div>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={handleNewGameClick}
            className={`flex items-center gap-2.5 rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors ${
              hasSaveFile
                ? 'border border-white/15 bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800'
                : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Start New Game</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioEngine.playUiClick();
              onOpenSettings();
            }}
            className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-zinc-900/90 px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Settings className="h-4 w-4 text-zinc-400" />
            <span>Settings & Audio</span>
          </button>
        </div>

        {/* Compact Controls Summary */}
        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-zinc-400 max-w-lg">
          WASD Move / Drive · Drag Look · V Camera · 1-6 Weapon · G Map · Tab Hero · E Interact · Esc Pause
        </div>
      </motion.div>

      {/* New Game Confirmation Dialog */}
      {confirmReset && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/80 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
              <h2 className="font-display text-lg font-bold text-zinc-100">Overwrite Saved Progress?</h2>
            </div>
            <p className="mt-2 text-sm text-zinc-300">
              Starting a new game will reset your cash, unlocked vehicles, and mission progress in
              Solaris Bay.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  startNewGame();
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Reset & Start New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
