import { defineStore } from "pinia";
import { useGalaxyStore } from "./galaxy";
import { CombatCalculator } from "@solaris-command/core/src/utils/combat-calculator";
import { CombatTables } from "@solaris-command/core/src/data/combat-tables";
import { CombatOperation } from "@solaris-command/core/src/types/combat";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { getValidAttackTargetHexes } from "@/utils/combatUtils";

type APIUnit = GameGalaxyResponseSchema["units"][0];

export const useCombatStore = defineStore("combat", {
  state: () => ({
    isAttackMode: false,
    targetUnit: null as APIUnit | null,
    selectedOperation: CombatOperation.STANDARD,
    advanceOnVictory: false
  }),
  getters: {
    validTargetHexes: (state) => {
      if (!state.isAttackMode) {
        return []
      }

      return getValidAttackTargetHexes()
    },
    prediction: (state) => {
      const galaxyStore = useGalaxyStore();
      const attacker = galaxyStore.selectedUnit;
      const defender = state.targetUnit;

      if (!attacker || !defender) return null;

      const hex = galaxyStore.getHex(defender.location.q, defender.location.r);
      if (!hex) return null;

      const prediction = CombatCalculator.calculate(
        attacker as any,
        defender as any,
        hex as any,
        state.selectedOperation
      );

      const outcome = prediction.forcedResult || CombatTables.getResult(prediction.finalScore);

      return {
          prediction,
          outcome
      };
    },
  },
  actions: {
    toggleAttackMode() {
      const galaxyStore = useGalaxyStore();
      if (!galaxyStore.selectedUnit) return;

      this.isAttackMode = !this.isAttackMode;
      // Reset target when toggling off
      if (!this.isAttackMode) {
        this.targetUnit = null;
        this.selectedOperation = CombatOperation.STANDARD;
      }
    },
    setTarget(unit: APIUnit) {
      if (!this.isAttackMode) return;
      this.targetUnit = unit;
    },
    setOperation(op: CombatOperation) {
      this.selectedOperation = op;
    },
    setAdvanceOnVictory(val: boolean) {
      this.advanceOnVictory = val;
    },
    clearTarget() {
      this.targetUnit = null;
      this.selectedOperation = CombatOperation.STANDARD;
    },
    async confirmAttack() {
      const galaxyStore = useGalaxyStore();
      if (!galaxyStore.selectedUnit || !this.targetUnit) return;

      try {
        await galaxyStore.handleAttackSelection(this.targetUnit, this.selectedOperation, this.advanceOnVictory);
        // Reset state after successful attack
        this.isAttackMode = false;
        this.targetUnit = null;
        this.selectedOperation = CombatOperation.STANDARD;
        this.advanceOnVictory = false
      } catch (e) {
        console.error("Attack failed", e);
      }
    }
  },
});
