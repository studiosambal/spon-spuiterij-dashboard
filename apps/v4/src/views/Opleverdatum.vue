<template>
  <!-- FASE 1: nieuwe datum en reden kiezen -->
  <div v-if="!gedaan && order" class="pagina-smal">
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: order.id, to: '/order/' + order.id }, { label: 'Opleverdatum' }]" />
      <h1>Nieuwe opleverdatum</h1>
      <div class="subtitle">{{ klantPlaats(order) }} &middot; <span class="tnum">{{ order.id }}</span></div>
    </header>

    <main class="page-content ruimte-balk">
      <!-- Collegiaal, niet controlerend: uitlopen gebeurt, wij regelen de klant -->
      <PMessage severity="info">
        Loopt het anders dan gepland? Geef een nieuwe datum door, dan laten wij de klant het weten.
      </PMessage>

      <div class="card">
        <div style="font-weight:700;font-size:var(--text-base)">Wanneer is het klaar?</div>
        <div style="margin-top:2px;font-size:var(--text-sm);color:var(--muted)">
          Nu staat <span class="tnum">{{ order.verwacht_gereed_datum }}</span>.
        </div>
        <ul class="keuze-lijst" role="radiogroup" aria-label="Nieuwe opleverdatum">
          <li v-for="k in DATUM_KEUZES" :key="k.id">
            <label class="keuze" :for="'datum-' + k.id">
              <PRadioButton v-model="datumKeuze" :value="k.id" :inputId="'datum-' + k.id" name="datum" />
              <span class="keuze-tekst">
                <span class="keuze-titel tnum">{{ k.titel }}</span>
                <span class="keuze-uitleg">{{ k.uitleg }}</span>
              </span>
            </label>
          </li>
        </ul>
        <div v-if="datumKeuze === 'eigen'" class="field" style="margin-top:4px">
          <label class="field-label" for="eigen-datum">Kies een datum</label>
          <PInputText id="eigen-datum" v-model="eigenDatum" type="date" :min="morgenIso"
                      style="width:100%;font-size:var(--text-base);height:44px" />
        </div>
      </div>

      <div class="card">
        <div style="font-weight:700;font-size:var(--text-base)">Wat speelt er?</div>
        <ul class="keuze-lijst" role="radiogroup" aria-label="Reden">
          <li v-for="r in REDENEN" :key="r.id">
            <label class="keuze" :for="'reden-' + r.id">
              <PRadioButton v-model="reden" :value="r.id" :inputId="'reden-' + r.id" name="reden" />
              <span class="keuze-tekst">
                <span class="keuze-titel">{{ DATUM_REDEN_LABELS[r.id] }}</span>
                <span class="keuze-uitleg">{{ r.uitleg }}</span>
              </span>
            </label>
          </li>
        </ul>
        <div v-if="reden" class="field" style="margin-top:4px">
          <label class="field-label" for="toelichting">
            Toelichting <span v-if="reden !== 'overig'">(optioneel)</span>
          </label>
          <PTextarea id="toelichting" v-model="toelichting" rows="3"
                     :placeholder="reden === 'overig' ? 'Wat houdt je op?' : 'Iets dat wij de klant kunnen vertellen'"
                     style="width:100%;font-family:inherit;font-size:var(--text-base);resize:none" />
        </div>
      </div>
    </main>

    <div class="bottom-bar">
      <PButton label="Nieuwe datum doorgeven" icon="ti ti-calendar" :disabled="!!blokkade" @click="opslaan" />
      <div v-if="blokkade" class="balk-hint">{{ blokkade }}</div>
    </div>
  </div>

  <!-- FASE 2: bevestiging, zelfde patroon als de andere bevestigingsschermen -->
  <div v-else-if="gedaan && order">
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: order.id, to: '/order/' + order.id }, { label: 'Opleverdatum' }]" />
    </header>
    <main class="page-content ont">
      <div class="ont-kolom">
        <section class="ont-kop">
          <span class="ont-vink" aria-hidden="true"><i class="ti ti-check" /></span>
          <h1>Nieuwe datum doorgegeven</h1>
          <p class="ont-sub">{{ klantPlaats(order) }} &middot; <span class="tnum">{{ order.id }}</span></p>
        </section>
        <section class="od-stap" role="status">
          <div class="od-stap-feit">
            <div class="od-stap-label">Opleveren vóór</div>
            <div class="od-stap-datum"><span class="tnum">{{ order.verwacht_gereed_datum }}</span></div>
          </div>
          <div class="od-stap-actie">
            <div class="od-stap-tekst">Bedankt voor het doorgeven! Wij laten de klant weten dat het iets later wordt.</div>
          </div>
        </section>
        <section class="ont-acties">
          <PButton label="Terug naar de order" icon="ti ti-arrow-left" outlined
                   @click="router.push('/order/' + order.id)" />
          <button class="tekst-actie ont-ongedaan" @click="ongedaanMaken">
            Toch niet? Ongedaan maken
          </button>
        </section>
      </div>
    </main>
  </div>

  <div v-else class="page-content">
    <div class="card" style="color:var(--muted);font-size:var(--text-base)">Order niet gevonden.</div>
  </div>
</template>

<script setup lang="ts">
import Kruimelpad from '@/components/Kruimelpad.vue'
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrders, klantPlaats, datumKort, plusWerkdagen, DATUM_REDEN_LABELS, type DatumReden } from '@/composables/useOrders'

const router = useRouter()
const route  = useRoute()
const { getOrder, verschuifOplevering, maakVerschuivingOngedaan } = useOrders()
const order  = computed(() => getOrder(route.params.id as string))
const gedaan = ref(false)

// ── Datum: twee snelle keuzes vanaf vandaag, of zelf een datum kiezen ──
const vandaag = new Date()
type DatumKeuze = 'week' | 'twee' | 'eigen'
const snel = { week: plusWerkdagen(5, vandaag), twee: plusWerkdagen(10, vandaag) }
const DATUM_KEUZES: { id: DatumKeuze; titel: string; uitleg: string }[] = [
  { id: 'week',  titel: datumKort(snel.week), uitleg: 'Over een week' },
  { id: 'twee',  titel: datumKort(snel.twee), uitleg: 'Over twee weken' },
  { id: 'eigen', titel: 'Andere datum',       uitleg: 'Kies zelf een dag' },
]
const datumKeuze = ref<DatumKeuze | null>(null)
const eigenDatum = ref('')
const isoDatum = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const morgen = new Date(vandaag); morgen.setDate(morgen.getDate() + 1)
const morgenIso = isoDatum(morgen)

const nieuweDatum = computed<Date | null>(() => {
  if (datumKeuze.value === 'week') return snel.week
  if (datumKeuze.value === 'twee') return snel.twee
  if (datumKeuze.value === 'eigen' && eigenDatum.value >= morgenIso) return new Date(eigenDatum.value + 'T12:00')
  return null
})

// ── Reden: Robert wil zien waarom een datum schuift ──
const REDENEN: { id: DatumReden; uitleg: string }[] = [
  { id: 'drukte',     uitleg: 'Het werk loopt achter op de planning' },
  { id: 'ondergrond', uitleg: 'Bijvoorbeeld inbranden of een afwerking die tegenwerkt' },
  { id: 'overig',     uitleg: 'Iets anders' },
]
const reden       = ref<DatumReden | null>(null)
const toelichting = ref('')

// Eén reden tegelijk, in de volgorde van het formulier
const blokkade = computed<string | null>(() => {
  if (!datumKeuze.value) return 'Kies een nieuwe datum'
  if (!nieuweDatum.value) return 'Kies een datum vanaf morgen'
  if (!reden.value) return 'Kies wat er speelt'
  if (reden.value === 'overig' && toelichting.value.trim().length < 3) return 'Vertel kort wat je ophoudt'
  return null
})

function opslaan() {
  if (blokkade.value || !order.value || !nieuweDatum.value || !reden.value) return
  verschuifOplevering(order.value.id, nieuweDatum.value, reden.value, toelichting.value.trim() || undefined)
  gedaan.value = true
}

function ongedaanMaken() {
  if (!order.value) return
  maakVerschuivingOngedaan(order.value.id)
  router.replace('/order/' + order.value.id)
}
</script>
