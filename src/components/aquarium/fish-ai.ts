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
  burstUntil: number;
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
    nextDecision: Math.random() * 2,
    burstUntil: 0
  };
}

export function reactToFishClick(agent: FishAgent, x: number, y: number, agents: FishAgent[]) {
  const margin = 42;
  const dx = agent.x - x;
  const dy = agent.y - y;
  const len = Math.max(1, Math.hypot(dx, dy));
  if (agent.fish.personality === "CURIOUS") {
    agent.targetX = x;
    agent.targetY = y;
  } else if (agent.fish.personality === "CALM") {
    agent.targetX = agent.x + Math.cos(agent.phase) * 90;
    agent.targetY = agent.y + Math.sin(agent.phase) * 60;
  } else if (agent.fish.personality === "LAZY") {
    agent.targetX = agent.x + (dx / len) * 70;
    agent.targetY = agent.y + (dy / len) * 45;
  } else if (agent.fish.personality === "SOCIAL") {
    for (const other of agents.slice(0, 4)) {
      other.targetX = x + (Math.random() - 0.5) * 120;
      other.targetY = y + (Math.random() - 0.5) * 90;
      other.nextDecision = 1.2;
    }
  } else if (agent.fish.personality === "SHY") {
    agent.targetX = agent.x + (dx / len) * 180;
    agent.targetY = agent.y + (dy / len) * 140;
    agent.burstUntil = 0.7;
  } else if (agent.fish.personality === "AGGRESSIVE") {
    agent.targetX = x - (dx / len) * margin;
    agent.targetY = y - (dy / len) * margin;
    agent.burstUntil = 0.45;
  } else {
    agent.targetX = x + Math.sin(agent.phase) * 80;
    agent.targetY = y + Math.cos(agent.phase) * 80;
    agent.burstUntil = 0.6;
  }
  agent.nextDecision = 1.4;
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
  const burst = agent.burstUntil > 0 ? 2.3 : 1;
  const easing = Math.min(1, (speed * deltaSeconds) / len);

  agent.x += dx * easing * burst;
  agent.y += dy * easing * burst;
  agent.y += Math.sin(agent.phase) * 0.12;
  agent.phase += deltaSeconds * 4.6;
  agent.direction = dx >= 0 ? 1 : -1;
  agent.burstUntil = Math.max(0, agent.burstUntil - deltaSeconds);
  agent.x = clamp(agent.x, margin, width - margin);
  agent.y = clamp(agent.y, margin, height - margin);
}

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
