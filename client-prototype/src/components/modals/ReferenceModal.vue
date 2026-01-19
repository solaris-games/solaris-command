<template>
  <div class="reference-modal">
    <div class="modal-content">
      <div class="card p-1">
        <div class="card-header bg-dark fw-bold">
          Reference Manual
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
            data-bs-toggle="tooltip"
            title="Close this dialog"
          ></button>
        </div>
        <div class="card-body bg-dark">
          <ul class="nav nav-tabs" id="referenceTab" role="tablist">
            <li class="nav-item" role="presentation">
              <button
                class="nav-link active"
                id="combat-tab"
                data-bs-toggle="tab"
                data-bs-target="#combat"
                type="button"
                role="tab"
                aria-controls="combat"
                aria-selected="true"
              >
                Combat
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                id="units-tab"
                data-bs-toggle="tab"
                data-bs-target="#units"
                type="button"
                role="tab"
                aria-controls="units"
                aria-selected="false"
              >
                Units
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                id="specialists-tab"
                data-bs-toggle="tab"
                data-bs-target="#specialists"
                type="button"
                role="tab"
                aria-controls="specialists"
                aria-selected="false"
              >
                Specialists
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                id="terrain-tab"
                data-bs-toggle="tab"
                data-bs-target="#terrain"
                type="button"
                role="tab"
                aria-controls="terrain"
                aria-selected="false"
              >
                Terrain
              </button>
            </li>
          </ul>
          <div class="tab-content" id="referenceTabContent">
            <div
              class="tab-pane fade show active table-scroll-container"
              id="combat"
              role="tabpanel"
              aria-labelledby="combat-tab"
            >
              <h5>Combat Results Table (CRT)</h5>
              <p class="small text-muted">
                The result of a combat is determined by the Net Score, which is
                the Odds Score plus any shift modifiers.
              </p>
              <table
                class="table table-sm table-striped table-hover table-dark table-bordered"
              >
                <thead>
                  <tr>
                    <th>Net Score</th>
                    <th>Attacker Losses</th>
                    <th>Attacker Suppressed</th>
                    <th>Defender Losses</th>
                    <th>Defender Suppressed</th>
                    <th>Defender Retreats</th>
                    <th>Result Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="[score, result] in sortedCombatResults"
                    :key="score"
                  >
                    <td class="text-end">{{ score }}</td>
                    <td class="text-end">{{ result.attacker.losses }}</td>
                    <td class="text-end">{{ result.attacker.suppressed }}</td>
                    <td class="text-end">{{ result.defender.losses }}</td>
                    <td class="text-end">{{ result.defender.suppressed }}</td>
                    <td>{{ result.defender.retreat ? "Yes" : "No" }}</td>
                    <td>{{ result.resultType }}</td>
                  </tr>
                </tbody>
              </table>

              <h5 class="mt-4">Forced Suppressive Fire</h5>
              <table
                class="table table-sm table-striped table-hover table-dark table-bordered"
              >
                <thead>
                  <tr>
                    <th>Attacker Losses</th>
                    <th>Attacker Suppressed</th>
                    <th>Defender Losses</th>
                    <th>Defender Suppressed</th>
                    <th>Defender Retreats</th>
                    <th>Result Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-end">
                      {{
                        COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.attacker.losses
                      }}
                    </td>
                    <td class="text-end">
                      {{
                        COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.attacker
                          .suppressed
                      }}
                    </td>
                    <td class="text-end">
                      {{
                        COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.defender.losses
                      }}
                    </td>
                    <td class="text-end">
                      {{
                        COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.defender
                          .suppressed
                      }}
                    </td>
                    <td>
                      {{
                        COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.defender.retreat
                          ? "Yes"
                          : "No"
                      }}
                    </td>
                    <td>
                      {{ COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.resultType }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              class="tab-pane fade table-scroll-container"
              id="units"
              role="tabpanel"
              aria-labelledby="units-tab"
            >
              <h5>Unit Catalog</h5>
              <table
                class="table table-sm table-striped table-hover table-dark table-bordered"
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Cost</th>
                    <th>Attack</th>
                    <th>Defense</th>
                    <th>Armour</th>
                    <th>Max AP</th>
                    <th>Max MP</th>
                    <th>Steps</th>
                    <th>Initiative</th>
                    <th>ZOC</th>
                    <th>LOS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="unit in UNIT_CATALOG" :key="unit.id">
                    <td>{{ unit.name }}</td>
                    <td>{{ unit.class }}</td>
                    <td class="text-end">{{ unit.cost }}</td>
                    <td class="text-end">{{ unit.stats.attack }}</td>
                    <td class="text-end">{{ unit.stats.defense }}</td>
                    <td class="text-end">{{ unit.stats.armour }}</td>
                    <td class="text-end">{{ unit.stats.maxAP }}</td>
                    <td class="text-end">{{ unit.stats.maxMP }}</td>
                    <td class="text-end">
                      {{ unit.stats.defaultSteps }} ({{ unit.stats.maxSteps }})
                    </td>
                    <td class="text-end">{{ unit.stats.initiative }}</td>
                    <td>{{ unit.stats.zoc ? "Yes" : "No" }}</td>
                    <td class="text-end">{{ unit.stats.los }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              class="tab-pane fade table-scroll-container"
              id="specialists"
              role="tabpanel"
              aria-labelledby="specialists-tab"
            >
              <h5>Specialist Catalog</h5>
              <table
                class="table table-sm table-striped table-hover table-dark table-bordered"
              >
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th>Attack</th>
                    <th>Defense</th>
                    <th>Armour</th>
                    <th>Artillery</th>
                    <th>Siege</th>
                    <th>Bonuses</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="spec in SPECIALIST_STEP_CATALOG" :key="spec.id">
                    <td>{{ SPECIALIST_STEP_SYMBOL_MAP.get(spec.type) }}</td>
                    <td>{{ spec.name }}</td>
                    <td>{{ spec.description }}</td>
                    <td class="text-end">{{ spec.cost }}</td>
                    <td class="text-end">{{ spec.stats.attack }}</td>
                    <td class="text-end">{{ spec.stats.defense }}</td>
                    <td class="text-end">{{ spec.stats.armour }}</td>
                    <td class="text-end">{{ spec.stats.artillery }}</td>
                    <td class="text-end">{{ spec.stats.siege }}</td>
                    <td>
                      <ul class="list-unstyled mb-0">
                        <li v-if="spec.bonuses.mpMultiplier !== 1">
                          MP Multiplier: x{{ spec.bonuses.mpMultiplier }}
                        </li>
                        <li v-if="spec.bonuses.apAdd !== 0">
                          AP Add: +{{ spec.bonuses.apAdd }}
                        </li>
                        <li v-if="spec.bonuses.visionAdd !== 0">
                          Vision Add: +{{ spec.bonuses.visionAdd }}
                        </li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              class="tab-pane fade table-scroll-container"
              id="terrain"
              role="tabpanel"
              aria-labelledby="terrain-tab"
            >
              <h5>Terrain Effects</h5>
              <table
                class="table table-sm table-striped table-hover table-dark table-bordered"
              >
                <thead>
                  <tr>
                    <th>Terrain Type</th>
                    <th>MP Cost</th>
                    <th>Combat Shift Type</th>
                    <th>Combat Shift Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(cost, type) in TERRAIN_MP_COSTS" :key="type">
                    <td>{{ type }}</td>
                    <td class="text-end">{{ cost }}</td>
                    <td>{{ COMBAT_SHIFTS_TERRAIN[type]?.type || "N/A" }}</td>
                    <td class="text-end">
                      {{ COMBAT_SHIFTS_TERRAIN[type]?.value || "N/A" }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h5 class="mt-4">Other Combat Shifts</h5>
              <table
                class="table table-sm table-striped table-hover table-dark table-bordered"
              >
                <thead>
                  <tr>
                    <th>Condition</th>
                    <th>Shift Type</th>
                    <th>Shift Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Planet</td>
                    <td>{{ COMBAT_SHIFT_PLANETS.type }}</td>
                    <td class="text-end">{{ COMBAT_SHIFT_PLANETS.value }}</td>
                  </tr>
                  <tr>
                    <td>Defender Disorganised</td>
                    <td>{{ COMBAT_SHIFT_DEFENDER_DISORGANISED.type }}</td>
                    <td class="text-end">
                      {{ COMBAT_SHIFT_DEFENDER_DISORGANISED.value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  COMBAT_RESULTS_TABLE,
  COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE,
} from "@solaris-command/core/src/data/combat-tables";
import { UNIT_CATALOG } from "@solaris-command/core/src/data/units";
import {
  SPECIALIST_STEP_CATALOG,
  SPECIALIST_STEP_SYMBOL_MAP,
} from "@solaris-command/core/src/data/specialists";
import {
  TERRAIN_MP_COSTS,
  COMBAT_SHIFTS_TERRAIN,
  COMBAT_SHIFT_PLANETS,
  COMBAT_SHIFT_DEFENDER_DISORGANISED,
} from "@solaris-command/core/src/data/terrain";
import { TerrainTypes } from "@solaris-command/core/src/types/hex";

defineEmits(["close"]);

const sortedCombatResults = computed(() => {
  return Object.entries(COMBAT_RESULTS_TABLE).sort(([scoreA], [scoreB]) => {
    return Number(scoreA) - Number(scoreB);
  });
});
</script>

<style scoped>
.btn-close {
  position: absolute;
  top: 8px;
  right: 8px;
}
.tab-content {
  margin-top: 1rem;
}
.table-scroll-container {
  max-height: 400px; /* Adjust as needed */
  overflow-y: auto;
  width: 100%;
}
</style>
