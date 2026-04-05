import type { Position } from '../types';

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPosition(a: Position, b: Position, t: number): Position {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + 180) % 360) - 180;
  if (diff < -180) diff += 360;
  return a + diff * t;
}

export function interpolatePath(
  path: Position[],
  progress: number,
  rotations?: number[]
): { position: Position; rotation: number } {
  if (path.length === 0) return { position: { x: 0, y: 0 }, rotation: 0 };
  if (path.length === 1) return { position: path[0], rotation: rotations?.[0] ?? 0 };

  const clamped = Math.max(0, Math.min(1, progress));
  const segments = path.length - 1;
  const segIndex = Math.min(Math.floor(clamped * segments), segments - 1);
  const segProgress = (clamped * segments) - segIndex;

  const pos = lerpPosition(path[segIndex], path[segIndex + 1], segProgress);

  let rotation = 0;
  if (rotations && rotations.length > 1) {
    const rIndex = Math.min(segIndex, rotations.length - 2);
    const rProgress = (clamped * segments) - rIndex;
    rotation = lerpAngle(rotations[rIndex], rotations[rIndex + 1], Math.min(rProgress, 1));
  } else if (rotations && rotations.length === 1) {
    rotation = rotations[0];
  } else {
    const dx = path[segIndex + 1].x - path[segIndex].x;
    const dy = path[segIndex + 1].y - path[segIndex].y;
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01)
      rotation = Math.atan2(dy, dx) * (180 / Math.PI) - 90;
  }

  return { position: pos, rotation };
}

export function computeStepProgress(
  step: { duration: number },
  globalProgress: number,
  allSteps: { duration: number }[]
): number {
  const maxDuration = Math.max(...allSteps.map(s => s.duration));
  if (maxDuration === 0) return 1;
  const stepFraction = step.duration / maxDuration;
  if (stepFraction === 0) return 1;
  return Math.min(globalProgress / stepFraction, 1);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 25 + Math.random() * 45;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotation: Math.random() * 360,
      size: 2 + Math.random() * 4,
      color: ['#FF4500', '#FF6B00', '#FFD700', '#FF2200', '#FFA500'][i % 5],
      delay: Math.random() * 0.08,
    };
  });
}
