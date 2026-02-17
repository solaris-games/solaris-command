<template>
  <div v-if="unitCatalog">
    <p>
      <em>{{ unitCatalog.description }}</em>
    </p>
    <p>
      <strong>Base Stats:</strong>
    </p>
    <div class="row">
      <div class="col">
        <table class="table table-sm table-striped table-hover">
          <tbody>
            <tr>
              <td>Attack</td>
              <td class="text-end">{{ unitCatalog.stats.attack }}</td>
            </tr>
            <tr>
              <td>Defense</td>
              <td class="text-end">{{ unitCatalog.stats.defense }}</td>
            </tr>
            <tr>
              <td>Armour</td>
              <td class="text-end">{{ unitCatalog.stats.armour }}</td>
            </tr>
            <tr>
              <td>AP</td>
              <td class="text-end">{{ unitCatalog.stats.maxAP }}</td>
            </tr>
            <tr>
              <td>MP</td>
              <td class="text-end">{{ unitCatalog.stats.maxMP }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="col">
        <table class="table table-sm table-striped table-hover">
          <tbody>
            <tr>
              <td>Steps</td>
              <td class="text-end">
                {{ unitCatalog.stats.defaultSteps }}
              </td>
            </tr>
            <tr>
              <td>Max Steps</td>
              <td class="text-end">{{ unitCatalog.stats.maxSteps }}</td>
            </tr>
            <tr>
              <td>Initiative</td>
              <td class="text-end">{{ unitCatalog.stats.initiative }}</td>
            </tr>
            <tr>
              <td>Emits ZOC</td>
              <td class="text-end">
                {{ unitCatalog.stats.zoc ? "Yes" : "No" }}
              </td>
            </tr>
            <tr>
              <td>Vision Range</td>
              <td class="text-end">{{ unitCatalog.stats.los }} Hexes</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";

const props = defineProps<{
  catalogId: string;
}>();

const unitCatalog = computed(() => {
  if (!props.catalogId) return null;
  return UNIT_CATALOG_ID_MAP.get(props.catalogId);
});
</script>
