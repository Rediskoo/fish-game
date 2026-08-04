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
  return { id: fish.id, fish, x, y, targetX: Math.random() * width, targetY: Math.random() * height, direction: state?.direction ?? 1, phase: Math.random() * Math.PI * 2, nextDecision: Math.random() * 2, burstUntil: 0 };
}

export function reactToFishClick(agent: FishAgent, x: number, y: number, agents: FishAgent[]) {
  const dx = agent.x - x;
  const dy = agent.y - y;
  const len = Math.max(1, Math.hypot(dx, dy));
  if (agent.fish.personality === "CURIOUS") {
    agent.targetX = x; agent.targetY = y;
  } else if (agent.fish.personality === "SOCIAL") {
    for (const other of agents.filter((item) => item.fish.personality === "SOCIAL" || item.fish.species === agent.fish.species).slice(0, 5)) {
      other.targetX = x + (Math.random() - 0.5) * 105;
      other.targetY = y + (Math.random() - 0.5) * 80;
      other.nextDecision = 1;
    }
  } else if (agent.fish.personality === "SHY") {
    agent.targetX = agent.x + (dx / len) * 190; agent.targetY = agent.y + (dy / len) * 135; agent.burstUntil = 0.75;
  } else if (agent.fish.personality === "AGGRESSIVE") {
    agent.targetX = x - (dx / len) * 35; agent.targetY = y - (dy / len) * 30; agent.burstUntil = 0.5;
  } else {
    agent.targetX = agent.x + Math.cos(agent.phase) * 90; agent.targetY = agent.y + Math.sin(agent.phase) * 60;
  }
  agent.nextDecision = 1.25;
}

export function updateFishAgent(agent: FishAgent, deltaSeconds: number, width: number, height: number, agents: FishAgent[]) {
  agent.nextDecision -= deltaSeconds;
  const margin = 42;
  const hungerSlowdown = agent.fish.hunger > 80 ? 0.48 : agent.fish.hunger > 60 ? 0.72 : 1;

  if (agent.nextDecision <= 0 || distance(agent.x, agent.y, agent.targetX, agent.targetY) < 24) {
    const peers = agents.filter((item) => item.id !== agent.id);
    const isGuppy = agent.fish.species === "GUPPY";
    const school = peers.filter((item) => isGuppy ? item.fish.species === "GUPPY" : item.fish.personality === "SOCIAL" || item.fish.species === agent.fish.species).slice(0, 5);
    if ((agent.fish.personality === "SOCIAL" || isGuppy) && school.length) {
      const centerX = school.reduce((sum, item) => sum + item.x, agent.x) / (school.length + 1);
      const centerY = school.reduce((sum, item) => sum + item.y, agent.y) / (school.length + 1);
      agent.targetX = centerX + Math.cos(agent.phase * 1.7) * (20 + Math.random() * 36);
      agent.targetY = centerY + Math.sin(agent.phase * 1.2) * (14 + Math.random() * 30);
      agent.nextDecision = isGuppy ? 0.45 + Math.random() * 0.65 : 0.7 + Math.random() * 1.2;
    } else if (agent.fish.personality === "AGGRESSIVE" && peers.length) {
      const nearest = peers.reduce((best, item) => distance(agent.x, agent.y, item.x, item.y) < distance(agent.x, agent.y, best.x, best.y) ? item : best, peers[0]);
      const awayX = agent.x - nearest.x;
      const awayY = agent.y - nearest.y;
      const len = Math.max(1, Math.hypot(awayX, awayY));
      agent.targetX = agent.x + (awayX / len) * (90 + Math.random() * 85);
      agent.targetY = agent.y + (awayY / len) * (50 + Math.random() * 70);
      agent.nextDecision = 2.5 + Math.random() * 2;
    } else {
      agent.targetX = margin + Math.random() * Math.max(1, width - margin * 2);
      agent.targetY = margin + Math.random() * Math.max(1, height - margin * 2);
      agent.nextDecision = agent.fish.personality === "LAZY" ? 3.5 + Math.random() * 3 : 1.6 + Math.random() * 3.4;
    }
  }

  const dx = agent.targetX - agent.x;
  const dy = agent.targetY - agent.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const speed = agent.fish.swimSpeed * hungerSlowdown;
  const burst = agent.burstUntil > 0 ? 2.25 : 1;
  const easing = Math.min(1, (speed * deltaSeconds) / len);
  agent.x += dx * easing * burst;
  agent.y += dy * easing * burst + Math.sin(agent.phase) * 0.12;
  agent.phase += deltaSeconds * (agent.fish.personality === "LAZY" ? 2.4 : 4.6);
  agent.direction = dx >= 0 ? 1 : -1;
  agent.burstUntil = Math.max(0, agent.burstUntil - deltaSeconds);
  agent.x = clamp(agent.x, margin, width - margin);
  agent.y = clamp(agent.y, margin, height - margin);
}

function distance(x1: number, y1: number, x2: number, y2: number) { return Math.hypot(x2 - x1, y2 - y1); }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
