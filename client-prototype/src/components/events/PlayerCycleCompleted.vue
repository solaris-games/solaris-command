<template>
    <div class="d-flex align-items-center">
        <div class="flex-shrink-0">
            <i class="fas fa-sack-dollar"></i>
        </div>
        <div class="flex-grow-1 ms-3">
            <p class="mb-0">Cycle complete.</p>
            <p class="mb-0 small text-muted">
                You now have {{ (event.data as any).newPrestige }} prestige and {{ (event.data as any).newVP }} victory points.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { GameEventsResponseSchema } from '@solaris-command/core/src/types/api';

defineProps<{
    event: GameEventsResponseSchema
}>();
</script>
