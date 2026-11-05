<template>
  <div v-if="!done" class="pagina-smal">
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: String(route.params.id), to: '/order/' + String(route.params.id) }, { label: isBefore ? 'Foto bij ontvangst' : 'Gereed melden' }]" />
      <h1>{{ isBefore ? 'Foto bij ontvangst' : 'Gereed melden' }}</h1>
      <div class="subtitle">{{ klantPlaats(order) }} &middot; <span class="tnum">{{ order?.id }}</span></div>
    </header>

    <main class="page-content ruimte-balk">

      <!-- Instructie -->
      <PMessage severity="info">
        {{ isBefore
          ? 'Maak foto\'s van alle kanten. Dit is je bewijs van hoe het binnenkwam.'
          : 'Maak een foto van het resultaat, dan weten wij dat de order klaar is.' }}
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
        style="width:100%;background:var(--p-surface-100);border:2px dashed var(--border);border-radius:var(--radius);padding:24px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s"
        @click="maakFoto">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center">
          <i class="ti ti-camera" style="font-size:24px;color:var(--p-surface-0)" />
        </div>
        <div style="font-size:var(--text-base);font-weight:700;color:var(--text)">{{ heeftMuis ? 'Foto toevoegen' : 'Foto maken' }}</div>
        <div style="font-size:var(--text-sm);color:var(--muted)">
          {{ capturedCount === 0 ? 'Eén foto is al genoeg' : `${capturedCount} foto${capturedCount === 1 ? '' : '\'s'} gemaakt, ${heeftMuis ? 'klik' : 'tik'} voor meer` }}
        </div>
      </button>

    </main>

    <div class="bottom-bar">
      <PButton
        :disabled="capturedCount === 0"
        :label="isBefore ? 'Foto\'s opslaan' : 'Gereed melden'"
        icon="ti ti-circle-check"
        @click="bevestig" />
    </div>
  </div>

  <div v-else>
    <!-- Bevestiging in de stijl van Ontvangst: kruimelpad op de brede container, de
         inhoud gecentreerd in een smalle kolom (Stripe-bevestigingspatroon). -->
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: String(route.params.id), to: '/order/' + String(route.params.id) }, { label: isBefore ? 'Foto bij ontvangst' : 'Gereed melden' }]" />
    </header>
    <main class="page-content ont">
      <div class="ont-kolom">
        <section class="ont-kop">
          <span class="ont-vink" aria-hidden="true"><i class="ti ti-check" /></span>
          <h1>{{ isBefore ? 'Foto\'s opgeslagen' : 'Gereed gemeld' }}</h1>
          <p class="ont-sub">{{ capturedCount }} foto{{ capturedCount === 1 ? '' : '\'s' }} &middot; {{ klantPlaats(order) }} &middot; <span class="tnum">{{ order?.id }}</span></p>
        </section>
        <section class="od-stap" role="status">
          <div class="od-stap-actie">
            <div v-if="isBefore" class="od-stap-tekst">Vastgelegd hoe het binnenkwam. Dat helpt bij schadevragen.</div>
            <div v-else-if="order?.status === 'klaar'" class="od-stap-tekst">Bedankt! De klant heeft al betaald, dus het mag meteen mee.</div>
            <div v-else class="od-stap-tekst">Bedankt! Wij vragen de klant om te betalen. Meegeven kan zodra dat binnen is.</div>
          </div>
        </section>
        <section class="ont-acties">
          <PButton label="Naar overzicht" icon="ti ti-home" outlined @click="router.push('/')" />
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Kruimelpad from '@/components/Kruimelpad.vue'
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrders, klantPlaats } from '@/composables/useOrders'
import { useMuis } from '@/composables/useMuis'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus, markBeforeFoto } = useOrders()

const order    = computed(() => getOrder(route.params.id as string))
const isBefore = computed(() => route.params.type === 'before')
const done     = ref(false)
const { heeftMuis } = useMuis()

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
    // Klant al betaald? Dan mag het meteen mee, anders eerst wachten op de betaling
    updateStatus(id, getOrder(id)?.betaald ? 'klaar' : 'productie_gereed')
  }
  done.value = true
}
</script>
