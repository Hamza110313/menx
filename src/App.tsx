import { useState } from 'react';
import { KeyboardControls } from './components/controls/KeyboardControls';
import { MobileControls } from './components/controls/MobileControls';
import { GameCanvas } from './components/game/GameCanvas';
import { ActiveWorldModals } from './components/ui/GarageModal';
import { HUD } from './components/ui/HUD';
import { MainMenu } from './components/ui/MainMenu';
import { PauseMenu } from './components/ui/PauseMenu';
import { SettingsModal } from './components/ui/SettingsModal';
import { WorldMapModal } from './components/ui/WorldMapModal';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <GameCanvas />
      <KeyboardControls />
      <HUD />
      <MobileControls />
      <MainMenu onOpenSettings={() => setSettingsOpen(true)} />
      <PauseMenu onOpenSettings={() => setSettingsOpen(true)} />
      <ActiveWorldModals />
      <WorldMapModal />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
