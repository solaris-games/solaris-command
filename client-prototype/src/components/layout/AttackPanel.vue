<template>
  <div class="attack-panel">
    <div class="card p-1">
      <div class="card-header fw-bold bg-danger" style="border-radius: 0">
        <i class="fas fa-bolt-lightning me-1"></i>
        <span class="text-white">DECLARE ATTACK</span>
      </div>
      <div class="card-body bg-dark p-2">
        <!-- Attacker Details (Top) -->
        <div class="mb-1">
          <h6 class="text-uppercase text-success mb-1">Attacker</h6>
          <UnitDetails v-if="attacker" :unit="attacker" :compact="true" />
        </div>

        <hr class="mt-2 mb-2" />

        <!-- Target Selection / Defender Details -->
        <div class="mb-2">
          <h6 class="text-uppercase text-danger mb-1">Defender</h6>
          <div
            v-if="!defender"
            class="text-center py-3 text-muted border border-secondary border-dashed rounded"
          >
            <h1 class="mb-0"><i class="fas fa-crosshairs"></i></h1>
            <p class="mt-0 mb-0">Select an adjacent enemy unit</p>
          </div>
          <div v-else>
            <div
              class="defender-header mb-1 d-flex justify-content-between align-items-center"
            >
              <span :style="{ color: defenderColor }">
                <i
                  class="fas me-1"
                  :class="{
                    'fa-user': !defenderOwner?.isAIControlled,
                    'fa-robot': defenderOwner?.isAIControlled,
                  }"
                ></i>
                {{ defenderOwner?.alias || "Unknown" }}</span
              >
              <button
                class="btn btn-sm btn-danger"
                @click="combatStore.clearTarget"
              >
                <i class="fas fa-xmark"></i>
              </button>
            </div>
            <UnitDetails :unit="defender" :compact="true" />
          </div>
        </div>

        <!-- Combat Prediction -->
        <div v-if="prediction" class="mb-0">
          <hr class="mt-0 mb-2" />

          <h6 class="text-uppercase text-muted mb-0 text-center">
            Combat Prediction
          </h6>

          <!-- Operation Selection -->
          <div class="mb-2">
            <div class="form-group">
              <label class="col-form-label text-muted small">Operation</label>
              <select
                class="form-select form-select-sm"
                :value="combatStore.selectedOperation"
                @change="
                  (e) =>
                    combatStore.setOperation(
                      (e.target as HTMLSelectElement).value as any,
                    )
                "
              >
                <option v-for="op in CombatOperation" :key="op" :value="op">
                  {{ op.replaceAll("_", " ") }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <div class="col-form-label text-muted small"></div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="chkAdvanceOnVictory"
                  :value="combatStore.advanceOnVictory"
                />
                <label class="form-check-label" for="chkAdvanceOnVictory">
                  Advance on Victory
                </label>
              </div>
            </div>
          </div>

          <!-- Odds -->
          <div class="text-center mb-2">
            <div class="display-6 fw-bold text-warning">
              <span v-if="prediction.prediction.oddsRatio >= 1"
                >{{ prediction.prediction.oddsRatio }}:1</span
              >
              <span v-else
                >1:{{
                  prediction.prediction.oddsRatio !== 0
                    ? 1 / prediction.prediction.oddsRatio
                    : 1
                }}</span
              >
            </div>
            <!-- <div class="small text-muted">
              Raw Ratio: {{ prediction.oddsRatio.toFixed(2) }}
            </div> -->
            <div class="small text-muted">
              Final Score: {{ prediction.prediction.finalScore }}
            </div>
          </div>

          <!-- Totals -->
          <div class="row text-center mb-2">
            <div class="col-6 border-end border-secondary">
              <div class="fw-bold text-info">
                {{ prediction.prediction.attackPower }}
              </div>
              <div class="small text-muted">Attack Power</div>
            </div>
            <div class="col-6">
              <div class="fw-bold text-info">
                {{ prediction.prediction.defensePower }}
              </div>
              <div class="small text-muted">Defense Power</div>
            </div>
          </div>

          <!-- Shifts -->
          <div
            class="row text-center mb-2 small"
            v-if="prediction.prediction.shifts.length"
          >
            <div class="col-6 border-end border-secondary">
              <div
                v-for="(shift, i) in prediction.prediction.shifts.filter(
                  (s) => s.value > 0,
                )"
                :key="i"
                class="text-success"
              >
                {{ shift.type.replaceAll("_", " ") }} (+{{ shift.value }})
              </div>
            </div>
            <div class="col-6">
              <div
                v-for="(shift, i) in prediction.prediction.shifts.filter(
                  (s) => s.value < 0,
                )"
                :key="i"
                class="text-danger"
              >
                {{ shift.type.replaceAll("_", " ") }} ({{ shift.value }})
              </div>
            </div>
          </div>

          <!-- Outcome Prediction -->
          <div class="row text-center mb-2" v-if="attacker && defender">
            <div class="col-6 border-end border-secondary">
              <div>
                <span
                  v-for="(step, index) in attacker.steps"
                  :key="index"
                  class="step-dot"
                  :class="{
                    active: !step.isSuppressed,
                    suppressed: step.isSuppressed,
                  }"
                ></span>
                <i class="fas fa-arrow-right mx-1"></i>
                <!-- Simplified visualization for predicted steps -->
                <span
                  v-for="i in Math.min(
                    attacker.steps.length,
                    prediction.outcome.attacker.losses,
                  )"
                  :key="'lost' + i"
                  class="step-dot lost"
                  >X</span
                >
                <span
                  v-for="i in Math.max(
                    0,
                    Math.min(
                      attacker.steps.length -
                        prediction.outcome.attacker.losses,
                      prediction.outcome.attacker.suppressed,
                    ),
                  )"
                  :key="'lost' + i"
                  class="step-dot suppressed"
                ></span>
                <span
                  v-for="i in Math.max(
                    0,
                    attacker.steps.length -
                      prediction.outcome.attacker.losses -
                      prediction.outcome.attacker.suppressed,
                  )"
                  :key="i"
                  class="step-dot active"
                ></span>
              </div>
            </div>
            <div class="col-6">
              <div>
                <span
                  v-for="(step, index) in defender.steps"
                  :key="index"
                  class="step-dot"
                  :class="{
                    active: !step.isSuppressed,
                    suppressed: step.isSuppressed,
                  }"
                ></span>
                <i class="fas fa-arrow-right mx-1"></i>
                <span
                  v-for="i in Math.min(
                    defender.steps.length,
                    prediction.outcome.defender.losses,
                  )"
                  :key="'lost' + i"
                  class="step-dot lost"
                  >X</span
                >
                <span
                  v-for="i in Math.max(
                    0,
                    Math.min(
                      defender.steps.length -
                        prediction.outcome.defender.losses,
                      prediction.outcome.defender.suppressed,
                    ),
                  )"
                  :key="'lost' + i"
                  class="step-dot suppressed"
                ></span>
                <span
                  v-for="i in Math.max(
                    0,
                    defender.steps.length -
                      prediction.outcome.defender.losses -
                      prediction.outcome.defender.suppressed,
                  )"
                  :key="i"
                  class="step-dot active"
                ></span>
              </div>
              <div
                v-if="prediction.outcome.defender.retreat"
                class="text-warning mt-1"
              >
                <i class="fas fa-rotate-left"></i> Retreat
              </div>
            </div>
          </div>

          <div class="d-grid gap-2 mb-1">
            <button class="btn btn-warning" @click="combatStore.confirmAttack">
              <i class="fas fa-crosshairs"></i> Confirm Attack
            </button>
          </div>
        </div>

        <!-- Cancel Button (Always visible) -->
        <div>
          <button
            class="btn btn-outline-danger w-100"
            @click="combatStore.toggleAttackMode"
          >
            Cancel
          </button>
        </div>
      </div>
      <!-- card-arrow -->
      <div class="card-arrow">
        <div class="card-arrow-top-left"></div>
        <div class="card-arrow-top-right"></div>
        <div class="card-arrow-bottom-left"></div>
        <div class="card-arrow-bottom-right"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useCombatStore } from "../../stores/combat";
import UnitDetails from "./UnitDetails.vue";
import { CombatOperation } from "@solaris-command/core/src/types/combat";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";

const galaxyStore = useGalaxyStore();
const combatStore = useCombatStore();

const attacker = computed(() => galaxyStore.selectedUnit);
const defender = computed(() => combatStore.targetUnit);
const prediction = computed(() => combatStore.prediction);

const defenderOwner = computed(() => {
  if (!defender.value || !galaxyStore.playerLookup) return null;
  return galaxyStore.playerLookup.get(String(defender.value.playerId));
});

const defenderColor = computed(() => {
  if (defenderOwner.value) {
    const color = PLAYER_COLOR_LOOKUP.get(defenderOwner.value.color);
    return color?.foreground || "#fff";
  }
  return "#fff";
});
</script>

<style scoped>
.attack-panel {
  max-height: 90vh;
  overflow-y: auto;
}

.step-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 2px;
  background-color: #555;
}
.step-dot.active {
  background-color: #fff;
}
.step-dot.lost {
  background-color: transparent;
  color: red;
  font-weight: bold;
  font-size: 10px;
  line-height: 10px;
  text-align: center;
  width: auto;
}
.step-dot.suppressed {
  border-color: #fff;
  border-style: solid;
  border-width: 1px;
}
.border-dashed {
  border-style: dashed !important;
}
</style>
