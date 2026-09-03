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
      <PMessage severity="info">
        {{ isBefore
          ? 'Maak foto\'s van alle kanten. Dit is je bewijs van hoe het binnenkwam.'
          : 'Fotografeer het afgewerkte product van alle kanten. Daarmee sta je sterk bij latere schadeklachten.' }}
      </PMessage>

      <!-- Verborgen camera-input -->
      <input
        ref="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        style="display:none"
        @change="onCameraCapture"
      />

      <!-- Genomen foto's. De hele tegel aantikken verwijderde de foto — met vieze
           handen te riskant. Verwijderen kan alleen via de knop, en is terug te
           draaien zolang je op dit scherm bent. -->
      <div v-if="capturedCount > 0" class="photo-grid">
        <div v-for="(photo, i) in photos" :key="photo.id" class="foto-tegel">
          <img :src="photo.url" :alt="`Foto ${i + 1}`" />
          <button class="foto-verwijder" :aria-label="`Foto ${i + 1} verwijderen`"
                  @click="verwijderFoto(i)">
            <i class="ti ti-x" />
          </button>
        </div>
      </div>
      <div v-if="verwijderd" style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:var(--text-sm);color:var(--muted)">
        <span>Foto verwijderd</span>
        <button class="tekst-actie" @click="herstelFoto">Ongedaan maken</button>
      </div>

      <!-- Foto maken knop — prominent, altijd zichtbaar -->
      <button
        style="width:100%;background:var(--p-surface-100);border:2px dashed var(--border);border-radius:12px;padding:24px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s"
        @click="maakFoto">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center">
          <i class="ti ti-camera" style="font-size:24px;color:var(--p-surface-0)" />
        </div>
        <div style="font-size:var(--text-base);font-weight:700;color:var(--text)">Foto maken</div>
        <div style="font-size:var(--text-sm);color:var(--muted)">
          {{ capturedCount === 0 ? 'Minimaal 1 foto vereist' : `${capturedCount} foto${capturedCount === 1 ? '' : '\'s'} gemaakt, tik voor meer` }}
        </div>
      </button>

    </main>

    <div class="bottom-bar">
      <PButton
        :disabled="capturedCount === 0"
        label="Foto's opslaan"
        icon="ti ti-circle-check"
        @click="bevestig" />
    </div>
  </div>

  <div v-else style="min-height:100dvh;display:flex;flex-direction:column">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center">

      <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:20px">
        <i class="ti ti-camera" style="font-size:36px;color:var(--p-surface-0)" />
      </div>

      <div style="font-size:var(--text-xl);font-weight:700;color:var(--text);margin-bottom:8px">
        {{ isBefore ? 'Foto opgeslagen' : 'Productie afgerond' }}
      </div>
      <div style="font-size:var(--text-base);color:var(--muted);line-height:1.5">
        {{ capturedCount }} foto{{ capturedCount === 1 ? '' : '\'s' }} vastgelegd voor {{ order?.klant }}
      </div>

      <PMessage severity="info" v-if="isBefore" style="width:100%;margin-top:24px;text-align:left">
        <strong>Bewaard als bewijs</strong>
        Je hebt vastgelegd hoe het binnenkwam. Daarmee sta je sterk bij een latere schadeklacht.
      </PMessage>
      <PMessage severity="info" v-else style="width:100%;margin-top:24px;text-align:left">
        <strong>Volgende stap</strong>
        SpuitwerkOnline verwerkt de betaling. De klant krijgt een ophaalmelding.
      </PMessage>
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

interface Photo { id: number; url: string }
const photos      = ref<Photo[]>([])
const nextId      = ref(1)
const capturedCount = computed(() => photos.value.length)
// Laatst verwijderde foto vasthouden zodat één misklik niet je bewijs kost
const verwijderd  = ref<{ foto: Photo; index: number } | null>(null)

// Camera
const cameraInput = ref<HTMLInputElement | null>(null)

function maakFoto() {
  cameraInput.value?.click()
}

function onCameraCapture() {
  const file = cameraInput.value?.files?.[0]
  if (!file) return
  // Echte thumbnail i.p.v. een generiek vakje: de spuiter moet kunnen zien dát
  // hij het juiste heeft vastgelegd.
  photos.value.push({ id: nextId.value++, url: URL.createObjectURL(file) })
  if (cameraInput.value) cameraInput.value.value = ''
}

function verwijderFoto(i: number) {
  const [foto] = photos.value.splice(i, 1)
  verwijderd.value = { foto, index: i }
}

function herstelFoto() {
  if (!verwijderd.value) return
  photos.value.splice(verwijderd.value.index, 0, verwijderd.value.foto)
  verwijderd.value = null
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
