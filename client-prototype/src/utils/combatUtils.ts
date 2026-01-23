import { useGalaxyStore } from "@/stores/galaxy";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";

export const getValidAttackTargetHexes = () => {
  const galaxyStore = useGalaxyStore();
  const attacker = galaxyStore.selectedUnit;
  if (!attacker) return [];

  const attackerHex = galaxyStore.getHex(
    attacker.location.q,
    attacker.location.r,
  );
  if (!attackerHex) return [];

  const units = galaxyStore.units;
  const currentPlayerId = galaxyStore.currentPlayerId;

  const neighbors = HexUtils.neighbors(attackerHex.location);
  const targets = [];

  for (const n of neighbors) {
    const hex = galaxyStore.getHex(n.q, n.r);
    if (hex) {
      const enemyUnit = units.find(
        (u) =>
          u.location.q === hex.location.q &&
          u.location.r === hex.location.r &&
          String(u.playerId) !== String(currentPlayerId),
      );
      if (enemyUnit) {
        targets.push(hex);
      }
    }
  }
  return targets;
};
