import { useEffect } from 'react';
import { audioEngine } from '../../lib/audio';
import { gameInput, resetContinuousInputs } from '../../lib/inputState';
import { useGameStore } from '../../store/gameStore';

export function KeyboardControls() {
  useEffect(() => {
    let lastSpacePressAt = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const store = useGameStore.getState();

      if (e.code === 'Escape') {
        if (store.screen === 'playing') {
          if (store.activeModal !== 'none') {
            store.setActiveModal('none');
          } else {
            store.setScreen('paused');
          }
          audioEngine.playUiClick();
        } else if (store.screen === 'paused') {
          store.setScreen('playing');
          audioEngine.playUiClick();
        }
        resetContinuousInputs();
        return;
      }

      // Allow quick-closing active modal with its hotkey
      if (store.screen === 'playing' && store.activeModal !== 'none' && !e.repeat) {
        if (
          (e.code === 'KeyG' && store.activeModal === 'map') ||
          (e.code === 'KeyM' && store.activeModal === 'missions') ||
          (e.code === 'KeyI' && store.activeModal === 'inventory') ||
          ((e.code === 'Tab' || e.code === 'KeyZ') && store.activeModal === 'characters')
        ) {
          if (e.code === 'Tab') e.preventDefault();
          store.setActiveModal('none');
          audioEngine.playUiClick();
          return;
        }
      }

      if (store.screen !== 'playing' || store.activeModal !== 'none') return;

      audioEngine.init();

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          gameInput.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          gameInput.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          gameInput.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          gameInput.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          gameInput.sprint = true;
          break;
        case 'Space':
          e.preventDefault();
          if (!e.repeat) {
            const now = performance.now();
            if (now - lastSpacePressAt < 340) {
              gameInput.flyTogglePressed = true;
              lastSpacePressAt = 0;
            } else {
              lastSpacePressAt = now;
            }
          }
          gameInput.jumpOrBrake = true;
          break;
        case 'KeyH':
          if (!e.repeat) {
            gameInput.flyTogglePressed = true;
          }
          break;
        case 'ControlLeft':
        case 'ControlRight':
          gameInput.descend = true;
          break;
        case 'KeyC':
          if (!e.repeat) {
            gameInput.crouch = !gameInput.crouch;
          }
          break;
        case 'KeyN':
          gameInput.nitro = true;
          break;
        case 'KeyE':
          if (!e.repeat) gameInput.interactPressed = true;
          break;
        case 'KeyF':
          if (!e.repeat) gameInput.repairOrActionPressed = true;
          break;
        case 'KeyQ':
          if (!e.repeat) gameInput.firePressed = true;
          gameInput.fireHeld = true;
          break;
        case 'KeyR':
          if (!e.repeat) gameInput.reloadPressed = true;
          break;
        case 'KeyL':
          if (!e.repeat) gameInput.headlightTogglePressed = true;
          break;
        case 'KeyT':
          if (!e.repeat) gameInput.taxiTogglePressed = true;
          break;
        case 'KeyV':
          if (!e.repeat) store.cycleCameraMode();
          break;
        case 'Digit1':
          if (!e.repeat) store.selectWeapon('unarmed');
          break;
        case 'Digit2':
          if (!e.repeat) store.selectWeapon('pistol');
          break;
        case 'Digit3':
          if (!e.repeat) store.selectWeapon('rifle');
          break;
        case 'Digit4':
          if (!e.repeat) store.selectWeapon('shotgun');
          break;
        case 'KeyG':
          if (!e.repeat) {
            store.setActiveModal('map');
            resetContinuousInputs();
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (!e.repeat) {
            store.setActiveModal('characters');
            resetContinuousInputs();
          }
          break;
        case 'KeyZ':
          if (!e.repeat) {
            store.setActiveModal('characters');
            resetContinuousInputs();
          }
          break;
        case 'KeyI':
          if (!e.repeat) {
            store.setActiveModal('inventory');
            resetContinuousInputs();
          }
          break;
        case 'KeyM':
          if (!e.repeat) {
            store.setActiveModal('missions');
            resetContinuousInputs();
          }
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          gameInput.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          gameInput.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          gameInput.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          gameInput.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          gameInput.sprint = false;
          break;
        case 'Space':
          gameInput.jumpOrBrake = false;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          gameInput.descend = false;
          break;
        case 'KeyN':
          gameInput.nitro = false;
          break;
        case 'KeyQ':
          gameInput.fireHeld = false;
          break;
      }
    };

    const onBlur = () => resetContinuousInputs();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return null;
}
