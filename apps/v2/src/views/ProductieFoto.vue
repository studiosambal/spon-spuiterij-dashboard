<template>
  <div v-if="!done">
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="ti ti-arrow-left" /> Terug
      </button>
      <h1>{{ isBefore ? 'Foto bij ontvangst' : 'Opleverfoto' }}</h1>
      <div class="subtitle">{{ klantPlaats(order) }} &middot; <span style="font-family:monospace">{{ order?.id }}</span></div>
    </header>

    <main class="page-content" style="padding-bottom:100px">

      <!-- Instructie -->
      <div class="alert alert-info">
        <strong>{{ isBefore ? 'Foto bij ontvangst' : 'Opleverfoto' }}</strong>
        {{ isBefore
          ? 'Maak foto\'s van alle kanten. Je bewijs van hoe het binnenkwam.'
          : 'Fotografeer het afgewerkte product van alle kanten. Beschermt je bij latere schademeldingen.' }}
      </div>

      <!-- Verborgen camera-input -->
      <input
        ref="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        style="display:none"
        @change="onCameraCapture"
      />

      <!-- Genomen foto's grid -->
      <div v-if="capturedCount > 0" class="photo-grid">
        <div v-for="(photo, i) in photos" :key="i"
             class="photo-thumb captured"
             style="position:relative"
             @click="verwijderFoto(i)"
             :aria-label="`Foto ${i + 1} verwijderen`"
             role="button">
          <i class="ti ti-circle-x" style="position:absolute;top:4px;right:4px;font-size:20px;color:#dc2626;background:#fff;border-radius:50%" />
          <i class="ti ti-photo" style="font-size:22px" />
          <span class="photo-thumb-label">Foto {{ i + 1 }}</span>
        </div>
      </div>
      <div v-if="capturedCount > 0" style="font-size:12px;color:var(--muted);margin-top:6px;text-align:center">
        Tik op een foto om te verwijderen
      </div>

      <!-- Foto maken knop — prominent, altijd zichtbaar -->
      <button
        style="width:100%;background:#f1f5f9;border:2px dashed var(--border);border-radius:12px;padding:24px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s"
        @click="maakFoto">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center">
          <i class="ti ti-camera" style="font-size:24px;color:#fff" />
        </div>
        <div style="font-size:15px;font-weight:700;color:var(--text)">Foto maken</div>
        <div style="font-size:13px;color:var(--muted)">
          {{ capturedCount === 0 ? 'Minimaal 1 foto vereist' : `${capturedCount} foto${capturedCount === 1 ? '' : '\'s'} gemaakt, tik voor meer` }}
        </div>
      </button>

    </main>

    <div class="bottom-bar">
      <PButton
        :disabled="capturedCount === 0"
        :label="isBefore ? 'Foto opslaan' : 'Opslaan'"
        icon="ti ti-circle-check"
        @click="bevestig" />
    </div>
  </div>

  <div v-else style="min-height:100dvh;display:flex;flex-direction:column">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center">

      <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:20px">
        <i class="ti ti-camera" style="font-size:36px;color:#fff" />
      </div>

      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:8px">
        {{ isBefore ? 'Foto opgeslagen' : 'Productie afgerond' }}
      </div>
      <div style="font-size:15px;color:var(--muted);line-height:1.5">
        {{ capturedCount }} foto{{ capturedCount === 1 ? '' : '\'s' }} vastgelegd voor {{ order?.klant }}
      </div>

      <div v-if="isBefore" class="alert alert-info" style="width:100%;margin-top:24px;text-align:left">
        <strong>Bewaard als bewijs</strong>
        Vastgelegd hoe het binnenkwam — sterk bewijs als er later schade wordt geclaimd.
      </div>
      <div v-else class="alert alert-info" style="width:100%;margin-top:24px;text-align:left">
        <strong>Volgende stap</strong>
        SpuitwerkOnline verwerkt de betaling. De klant krijgt een ophaalmelding.
      </div>
    </div>

    <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
      <PButton label="Naar order" icon="ti ti-arrow-right"
               @click="router.push('/order/' + route.params.id)" />
      <PButton label="Naar overzicht" icon="ti ti-home" outlined
               @click="router.push('/')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrders, klantPlaats } from '@/composables/useOrders'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus, markBeforeFoto } = useOrders()

const order    = computed(() => getOrder(route.params.id as string))
const isBefore = computed(() => route.params.type === 'before')
const done     = ref(false)

interface Photo { id: number }
const photos      = ref<Photo[]>([])
const nextId      = ref(1)
const capturedCount = computed(() => photos.value.length)

// Camera
const cameraInput = ref<HTMLInputElement | null>(null)

function maakFoto() {
  cameraInput.value?.click()
}

function onCameraCapture() {
  if (cameraInput.value?.files?.length) {
    photos.value.push({ id: nextId.value++ })
    cameraInput.value.value = ''
  }
}

function verwijderFoto(i: number) {
  photos.value.splice(i, 1)
}

function bevestig() {
  const id = route.params.id as string
  if (isBefore.value) {
    markBeforeFoto(id)   // foto bij ontvangst: bevestigd → ontvangen
  } else {
    updateStatus(id, 'productie_gereed')
  }
  done.value = true
}
</script>
