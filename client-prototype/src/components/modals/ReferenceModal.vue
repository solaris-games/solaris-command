<template>
  <BaseModal
    :show="show"
    title="Reference Manual"
    size="modal-xl"
    @close="$emit('close')"
  >
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
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="oos-tab"
          data-bs-toggle="tab"
          data-bs-target="#oos"
          type="button"
          role="tab"
          aria-controls="oos"
          aria-selected="false"
        >
          Out of Supply
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
          The result of a combat is determined by the Net Score, which is the
          Odds Score plus any shift modifiers.
        </p>
        <table
          class="table table-sm table-striped table-hover table-dark table-bordered"
        >
          <thead>
            <tr>
              <th>Net Score</th>
              <th>Attacker Losses</th>
              <th>Attacker Suppressed</th>
              <th>Attacker Disorganised</th>
              <th>Defender Losses</th>
              <th>Defender Suppressed</th>
              <th>Defender Disorganised</th>
              <th>Defender Retreats</th>
              <th>Result Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="[score, result] in sortedCombatResults" :key="score">
              <td class="text-end">{{ score }}</td>
              <td class="text-end">{{ result.attacker.losses }}</td>
              <td class="text-end">{{ result.attacker.suppressed }}</td>
              <td>{{ result.attacker.disorganised ? "Yes" : "No" }}</td>
              <td class="text-end">{{ result.defender.losses }}</td>
              <td class="text-end">{{ result.defender.suppressed }}</td>
              <td>{{ result.defender.disorganised ? "Yes" : "No" }}</td>
              <td>{{ result.defender.retreat ? "Yes" : "No" }}</td>
              <td>{{ result.resultType }}</td>
            </tr>
          </tbody>
        </table>

        <h5 class="mt-4">Forced Feint Attack</h5>
        <table
          class="table table-sm table-striped table-hover table-dark table-bordered"
        >
          <thead>
            <tr>
              <th>Attacker Losses</th>
              <th>Attacker Suppressed</th>
              <th>Attacker Disorganised</th>
              <th>Defender Losses</th>
              <th>Defender Suppressed</th>
              <th>Defender Disorganised</th>
              <th>Defender Retreats</th>
              <th>Result Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-end">
                {{ COMBAT_RESULT_FORCED_FEINT_ATTACK.attacker.losses }}
              </td>
              <td class="text-end">
                {{ COMBAT_RESULT_FORCED_FEINT_ATTACK.attacker.suppressed }}
              </td>
              <td>
                {{
                  COMBAT_RESULT_FORCED_FEINT_ATTACK.attacker.disorganised
                    ? "Yes"
                    : "No"
                }}
              </td>
              <td class="text-end">
                {{ COMBAT_RESULT_FORCED_FEINT_ATTACK.defender.losses }}
              </td>
              <td class="text-end">
                {{ COMBAT_RESULT_FORCED_FEINT_ATTACK.defender.suppressed }}
              </td>
              <td>
                {{
                  COMBAT_RESULT_FORCED_FEINT_ATTACK.defender.disorganised
                    ? "Yes"
                    : "No"
                }}
              </td>
              <td>
                {{
                  COMBAT_RESULT_FORCED_FEINT_ATTACK.defender.retreat
                    ? "Yes"
                    : "No"
                }}
              </td>
              <td>
                {{ COMBAT_RESULT_FORCED_FEINT_ATTACK.resultType }}
              </td>
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
              <th>Attacker Disorganised</th>
              <th>Defender Losses</th>
              <th>Defender Suppressed</th>
              <th>Defender Disorganised</th>
              <th>Defender Retreats</th>
              <th>Result Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-end">
                {{ COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.attacker.losses }}
              </td>
              <td class="text-end">
                {{ COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.attacker.suppressed }}
              </td>
              <td>
                {{
                  COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.attacker.disorganised
                    ? "Yes"
                    : "No"
                }}
              </td>
              <td class="text-end">
                {{ COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.defender.losses }}
              </td>
              <td class="text-end">
                {{ COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.defender.suppressed }}
              </td>
              <td>
                {{
                  COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE.defender.disorganised
                    ? "Yes"
                    : "No"
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
              <th>Prestige Cost</th>
              <th>Attack</th>
              <th>Defense</th>
              <th>Shock</th>
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
              <td>{{ unit.class.replaceAll("_", " ") }}</td>
              <td class="text-end">{{ unit.cost }}</td>
              <td class="text-end">{{ unit.stats.attack }}</td>
              <td class="text-end">{{ unit.stats.defense }}</td>
              <td class="text-end">{{ unit.stats.shock }}</td>
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
              <th>Prestige Cost</th>
              <th>Attack</th>
              <th>Defense</th>
              <th>Shock</th>
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
              <td class="text-end">{{ spec.stats.shock }}</td>
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
              <td>{{ type.replaceAll("_", " ") }}</td>
              <td class="text-end">{{ cost }}</td>
              <td>
                {{
                  COMBAT_SHIFTS_TERRAIN[type]?.type.replaceAll("_", " ") ||
                  "N/A"
                }}
              </td>
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
              <td>{{ COMBAT_SHIFT_PLANETS.type.replaceAll("_", " ") }}</td>
              <td class="text-end">{{ COMBAT_SHIFT_PLANETS.value }}</td>
            </tr>
            <tr>
              <td>Defender Regrouping</td>
              <td>
                {{
                  COMBAT_SHIFT_DEFENDER_DISORGANISED.type.replaceAll("_", " ")
                }}
              </td>
              <td class="text-end">
                {{ COMBAT_SHIFT_DEFENDER_DISORGANISED.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="tab-pane fade table-scroll-container"
        id="oos"
        role="tabpanel"
        aria-labelledby="oos-tab"
      >
        <h5>Out of Supply Effects</h5>
        <table
          class="table table-sm table-striped table-hover table-dark table-bordered"
        >
          <thead>
            <tr>
              <th>Cycles</th>
              <th>Effect</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1 Cycle</td>
              <td>
                <strong class="text-danger">Disruption</strong>: Cannot recover
                suppressed steps. <strong>Max MP is halved</strong>.
              </td>
            </tr>
            <tr>
              <td>2 Cycles</td>
              <td>
                <strong class="text-danger">Starvation</strong>: Unit has 0 AP
                (Cannot attack). 2 Steps are Suppressed immediately.
              </td>
            </tr>
            <tr>
              <td>3 Cycles</td>
              <td>
                <strong class="text-danger">Crippled</strong>: 0 AP. All
                remaining steps are Suppressed. The unit is useless.
              </td>
            </tr>
            <tr>
              <td>4 Cycles</td>
              <td>
                <strong class="text-danger">Collapse</strong>: All above
                effects. Plus 3 Steps are Destroyed per cycle. The fleet
                dissolves.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  COMBAT_RESULTS_TABLE,
  COMBAT_RESULT_FORCED_FEINT_ATTACK,
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
import BaseModal from "./BaseModal.vue";

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});

defineEmits(["close"]);

const sortedCombatResults = computed(() => {
  return Object.entries(COMBAT_RESULTS_TABLE).sort(([scoreA], [scoreB]) => {
    return Number(scoreA) - Number(scoreB);
  });
});
</script>

<style scoped>
.tab-content {
  margin-top: 1rem;
}
.table-scroll-container {
  max-height: 400px; /* Adjust as needed */
  overflow-y: auto;
  width: 100%;
}
</style>
