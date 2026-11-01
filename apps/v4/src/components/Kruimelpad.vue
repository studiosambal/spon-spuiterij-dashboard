<template>
  <!-- Eén kruimelpad voor alle subpagina's: links in blauw, de huidige pagina in grijs.
       Het eerste item heeft een pijltje, zodat het op de telefoon ook als 'terug' leest. -->
  <nav class="kruimel" aria-label="Kruimelpad">
    <template v-for="(item, i) in items" :key="i">
      <span v-if="i > 0" class="kruimel-sep" aria-hidden="true">/</span>
      <button v-if="item.to && i < items.length - 1" class="kruimel-link" @click="router.push(item.to)">
        <i v-if="i === 0" class="ti ti-chevron-left" aria-hidden="true" />{{ item.label }}
      </button>
      <span v-else class="kruimel-hier" aria-current="page">{{ item.label }}</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{ items: { label: string; to?: string }[] }>()
const router = useRouter()
</script>
