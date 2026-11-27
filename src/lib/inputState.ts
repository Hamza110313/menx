export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jumpOrBrake: boolean;
  nitro: boolean;
  crouch: boolean;
  // Helicopter / vertical flight
  descend: boolean;
  // Mobile analog overrides (-1..1)
  joyX: number;
  joyY: number;
  // Camera look deltas accumulated from mouse/touch
  lookDeltaX: number;
  lookDeltaY: number;
  // One-shot action triggers
  interactPressed: boolean;
  repairOrActionPressed: boolean;
  firePressed: boolean;
  fireHeld: boolean;
  reloadPressed: boolean;
  headlightTogglePressed: boolean;
  taxiTogglePressed: boolean;
  flyTogglePressed: boolean;
  shockwavePressed: boolean;
}

export const gameInput: InputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jumpOrBrake: false,
  nitro: false,
  crouch: false,
  descend: false,
  joyX: 0,
  joyY: 0,
  lookDeltaX: 0,
  lookDeltaY: 0,
  interactPressed: false,
  repairOrActionPressed: false,
  firePressed: false,
  fireHeld: false,
  reloadPressed: false,
  headlightTogglePressed: false,
  taxiTogglePressed: false,
  flyTogglePressed: false,
  shockwavePressed: false,
};

export function resetContinuousInputs(): void {
  gameInput.forward = false;
  gameInput.backward = false;
  gameInput.left = false;
  gameInput.right = false;
  gameInput.sprint = false;
  gameInput.jumpOrBrake = false;
  gameInput.nitro = false;
  gameInput.crouch = false;
  gameInput.descend = false;
  gameInput.joyX = 0;
  gameInput.joyY = 0;
  gameInput.firePressed = false;
  gameInput.fireHeld = false;
}
