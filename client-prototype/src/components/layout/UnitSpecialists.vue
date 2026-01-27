<template>
  <div v-if="specialistStepsWithStats.length > 0">
    <table class="table table-sm table-striped table-hover">
      <thead class="table-dark">
        <tr>
          <th scope="col">Bonuses</th>
          <th
            v-for="(step, index) in specialistStepsWithStats"
            :key="index"
            data-bs-toggle="tooltip"
            :title="
              step.specialistId
                ? `${SPECIALIST_STEP_ID_MAP.get(step.specialistId)?.name}: ${
                    SPECIALIST_STEP_ID_MAP.get(step.specialistId)?.description
                  }`
                : ''
            "
          >
            <div class="d-flex justify-content-end">
              <div
                class="step-square-small"
                :class="{ suppressed: step.isSuppressed }"
              >
                <span
                  v-if="step.specialistId"
                  class="specialist-symbol-small flex-shrink-0"
                  >{{ getSpecialistSymbol(step.specialistId) }}</span
                >
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr></tr>
        <tr>
          <th scope="row" data-bs-toggle="tooltip" title="Attack">Atk.</th>
          <td
            v-for="(step, index) in specialistStepsWithStats"
            :key="index"
            class="text-end"
          >
            {{ step.specialist?.stats.attack }}
          </td>
        </tr>
        <tr>
          <th scope="row" data-bs-toggle="tooltip" title="Defense">Def.</th>
          <td
            v-for="(step, index) in specialistStepsWithStats"
            :key="index"
            class="text-end"
          >
            {{ step.specialist?.stats.defense }}
          </td>
        </tr>
        <tr>
          <th scope="row" data-bs-toggle="tooltip" title="Armour">Arm.</th>
          <td
            v-for="(step, index) in specialistStepsWithStats"
            :key="index"
            class="text-end"
          >
            {{ step.specialist?.stats.armour }}
          </td>
        </tr>
        <tr>
          <th scope="row" data-bs-toggle="tooltip" title="Artillery">Art.</th>
          <td
            v-for="(step, index) in specialistStepsWithStats"
            :key="index"
            class="text-end"
          >
            {{ step.specialist?.stats.artillery }}
          </td>
        </tr>
        <tr>
          <th scope="row" data-bs-toggle="tooltip" title="Siege">Sge.</th>
          <td
            v-for="(step, index) in specialistStepsWithStats"
            :key="index"
            class="text-end"
          >
            {{ step.specialist?.stats.siege }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  SPECIALIST_STEP_ID_MAP,
  SPECIALIST_STEP_SYMBOL_MAP,
} from "@solaris-command/core/src/data/specialists";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const props = defineProps<{
  unit: APIUnit;
}>();

const getSpecialistSymbol = (specialistId: string) => {
  const specialist = SPECIALIST_STEP_ID_MAP.get(specialistId);
  if (!specialist) return "";
  return SPECIALIST_STEP_SYMBOL_MAP.get(specialist.type);
};

const specialistStepsWithStats = computed(() => {
  if (!props.unit) return [];
  return props.unit.steps
    .filter((step) => step.specialistId)
    .map((step) => {
      const specialist = SPECIALIST_STEP_ID_MAP.get(step.specialistId!);
      return {
        ...step,
        specialist,
      };
    });
});
</script>

<style scoped>
hr {
  margin: 0.5rem 0;
}
.step-square-small {
  min-width: 20px;
  min-height: 20px;
  background-color: #fff;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.step-square-small .specialist-symbol-small {
  color: #000;
}
.step-square-small.suppressed {
  background-color: transparent;
  border: 1px solid #fff;
}
.step-square-small.suppressed .specialist-symbol-small {
  color: #fff;
}
</style>
