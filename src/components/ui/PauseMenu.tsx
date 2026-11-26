import {
  Backpack,
  Building2,
  CarFront,
  LogOut,
  Map,
  Play,
  Save,
  Settings,
  ShoppingBag,
  Target,
  Users,
} from 'lucide-react';
import { audioEngine } from '../../lib/audio';
import { useGameStore } from '../../store/gameStore';

interface PauseMenuProps {
  onOpenSettings: () => void;
}

export function PauseMenu({ onOpenSettings }: PauseMenuProps) {
  const screen = useGameStore((s) => s.screen);
  const activeModal = useGameStore((s) => s.activeModal);
  const setScreen = useGameStore((s) => s.setScreen);
  const setActiveModal = useGameStore((s) => s.setActiveModal);
  const saveProgress = useGameStore((s) => s.saveProgress);
  const respawnAfterFailure = useGameStore((s) => s.respawnAfterFailure);

  if (screen === 'wasted' || screen === 'busted') {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950/88 p-6 text-center">
        <h2
          className={`font-display text-5xl sm:text-6xl font-bold tracking-wider ${
            screen === 'wasted' ? 'text-rose-500' : 'text-blue-400'
          }`}
        >
          {screen === 'wasted' ? 'WASTED' : 'BUSTED'}
        </h2>
        <p className="mt-3 max-w-md text-sm text-zinc-300">
          {screen === 'wasted'
            ? 'Emergency trauma teams stabilized you at Bay Medical Center.'
            : 'SBPD officers apprehended you and impounded your active ride.'}
        </p>
        <button
          type="button"
          onClick={() => {
            audioEngine.playUiClick();
            respawnAfterFailure();
          }}
          className="mt-6 rounded-lg bg-amber-500 px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-400"
        >
          Continue in Solaris Bay
        </button>
      </div>
    );
  }

  if (screen !== 'paused' || activeModal !== 'none') return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-zinc-950/80 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-2xl">
        <div className="border-b border-white/10 pb-4">
          <h2 className="font-display text-2xl font-bold text-zinc-100">Game Paused</h2>
          <p className="mt-0.5 text-xs text-zinc-400">Solaris Bay · Single-Player Story</p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              audioEngine.playUiClick();
              setScreen('playing');
            }}
            className="flex items-center gap-3 rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-400"
          >
            <Play className="h-4 w-4 fill-zinc-950" />
            <span>Resume Game</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioEngine.playUiClick();
              saveProgress(false);
              setScreen('playing');
            }}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-800/80 px-4 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
          >
            <Save className="h-4 w-4 text-cyan-400" />
            <span>Save Progress</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                setScreen('playing');
                setActiveModal('map');
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <Map className="h-4 w-4 text-cyan-400" />
              <span>World Map</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                setScreen('playing');
                setActiveModal('characters');
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <Users className="h-4 w-4 text-amber-400" />
              <span>Switch Hero</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                setScreen('playing');
                setActiveModal('missions');
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <Target className="h-4 w-4 text-amber-400" />
              <span>Missions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                setScreen('playing');
                setActiveModal('garage');
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <CarFront className="h-4 w-4 text-emerald-400" />
              <span>Garage</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                setScreen('playing');
                setActiveModal('properties');
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span>Real Estate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                setScreen('playing');
                setActiveModal('shop');
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <ShoppingBag className="h-4 w-4 text-rose-400" />
              <span>Armory & Shop</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                setScreen('playing');
                setActiveModal('inventory');
              }}
              className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <Backpack className="h-4 w-4 text-cyan-400" />
              <span>Gear & Wardrobe</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              audioEngine.playUiClick();
              onOpenSettings();
            }}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            <Settings className="h-4 w-4 text-zinc-400" />
            <span>Settings & Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioEngine.playUiClick();
              saveProgress(true);
              setScreen('menu');
            }}
            className="mt-1 flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Save & Exit to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
