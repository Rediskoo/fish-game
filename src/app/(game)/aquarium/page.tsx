import { AquariumHud } from "@/features/fish/aquarium-hud";
import { AquariumClient } from "@/features/fish/aquarium-client";

export default function AquariumPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <AquariumClient />
      <AquariumHud />
    </div>
  );
}
