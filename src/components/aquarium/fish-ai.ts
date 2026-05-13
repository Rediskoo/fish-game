import type { FishView } from "@/types/game";

export type FishAgent = {
  id: string;
  fish: FishView;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: 1 | -1;
  phase: number;
  nextDecision: number;
};

export function createFishAgent(fish: FishView, width: number, height: number): FishAgent {
  const state = fish.animationState as Partial<{ x: number; y: number; direction: 1 | -1 }> | null;
  const x = (state?.x ?? Math.random()) * width;
  const y = (state?.y ?? Math.random()) * height;
  return {
    id: fish.id,
    fish,
    x,
    y,
    targetX: Math.random() * width,
    targetY: Math.random() * height,
    direction: state?.direction ?? 1,
    phase: Math.random() * Math.PI * 2,
    nextDecision: Math.random() * 2
  };
}

export function updateFishAgent(agent: FishAgent, deltaSeconds: number, width: number, height: number) {
  agent.nextDecision -= deltaSeconds;
  const margin = 42;
  const hungerSlowdown = agent.fish.hunger > 80 ? 0.48 : agent.fish.hunger > 60 ? 0.72 : 1;

  if (agent.nextDecision <= 0 || distance(agent.x, agent.y, agent.targetX, agent.targetY) < 24) {
    agent.targetX = margin + Math.random() * Math.max(1, width - margin * 2);
    agent.targetY = margin + Math.random() * Math.max(1, height - margin * 2);
    agent.nextDecision = 1.6 + Math.random() * 3.4;
  }

  const dx = agent.targetX - agent.x;
  const dy = agent.targetY - agent.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const speed = agent.fish.swimSpeed * hungerSlowdown;
  const easing = Math.min(1, (speed * deltaSeconds) / len);

  agent.x += dx * easing;
  agent.y += dy * easing;
  agent.y += Math.sin(agent.phase) * 0.12;
  agent.phase += deltaSeconds * 4.6;
  agent.direction = dx >= 0 ? 1 : -1;
  agent.x = clamp(agent.x, margin, width - margin);
  agent.y = clamp(agent.y, margin, height - margin);
}

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
