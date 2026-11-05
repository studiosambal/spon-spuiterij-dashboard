<template>
  <!-- Al gemeld? Dan toont dit scherm de verzonden melding. 'Bekijk meerwerk'
       hoort nooit op een leeg formulier uit te komen. -->
  <div v-if="fase === 'invoer' && bestaandeMelding" class="pagina-smal">
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: String(route.params.id), to: '/order/' + String(route.params.id) }, { label: 'Gemeld meerwerk' }]" />
      <h1>Gemeld meerwerk</h1>
      <div class="subtitle">{{ klantPlaats(order) }} &middot; <span class="tnum">{{ order?.id }}</span></div>
    </header>

    <main class="page-content">
      <PMessage severity="warn">
        <strong>Gemeld op {{ bestaandeMelding.datum }}</strong>
        {{ bestaandeMelding.behandelaar }} is aan zet. {{ bestaandeMelding.laatsteUpdate }}.
      </PMessage>

      <div class="section-label">Wat je hebt gemeld</div>
      <div class="card">
        <div v-if="bestaandeMelding.aantallen.length" class="detail-row">
          <span class="label">Aantallen</span>
          <span class="value">
            <span v-for="(a, i) in bestaandeMelding.aantallen" :key="i" style="display:block">
              {{ a.regel }}: <span class="tnum">{{ a.geteld }}</span> in plaats van <span class="tnum">{{ a.was }}</span>
            </span>
          </span>
        </div>
        <div v-if="bestaandeMelding.extraItems.length" class="detail-row">
          <span class="label">Extra items</span>
          <span class="value">
            <span v-for="(it, i) in bestaandeMelding.extraItems" :key="i" style="display:block">
              {{ itemTekst(it) }}
            </span>
          </span>
        </div>
        <div v-if="bestaandeMelding.specificaties" class="detail-row">
          <span class="label">Specificaties</span>
          <span class="value">{{ bestaandeMelding.specificaties }}</span>
        </div>
        <div v-if="bestaandeMelding.overig" class="detail-row">
          <span class="label">Overige</span>
          <span class="value">{{ bestaandeMelding.overig }}</span>
        </div>
        <div v-if="bestaandeMelding.omschrijving" class="detail-row">
          <span class="label">Huidige afwerking</span>
          <span class="value">{{ bestaandeMelding.omschrijving }}</span>
        </div>
        <div v-if="bestaandeMelding.indicatie" class="detail-row">
          <span class="label">Geschatte meerkosten</span>
          <span class="value">{{ formatEuro(bestaandeMelding.indicatie) }}
            <span style="display:block;color:var(--muted)">Telt mee zodra de klant akkoord is</span></span>
        </div>
        <div class="detail-row">
          <span class="label">Opleverdatum</span>
          <span class="value" style="color:var(--muted)">Zodra de klant heeft besloten, krijg je bericht. Daarin staat ook of de opleverdatum verschuift.</span>
        </div>
      </div>

      <button class="tekst-actie" style="align-self:center" @click="fase = 'nieuw'">
        Nog een afwijking melden
      </button>
    </main>
  </div>

  <!-- FASE 1: Spuiter meldt de afwijking -->
  <div v-else-if="(fase === 'invoer' || fase === 'nieuw') && order" class="pagina-smal">
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: String(route.params.id), to: '/order/' + String(route.params.id) }, { label: 'Afwijking melden' }]" />
      <h1>Afwijking melden</h1>
      <div class="subtitle">{{ klantPlaats(order) }} &middot; <span class="tnum">{{ order.id }}</span></div>
    </header>

    <main class="page-content ruimte-balk">

      <PMessage severity="info">
        Wij regelen het akkoord met de klant. Je krijgt bericht zodra je verder kunt.
      </PMessage>

      <!-- Eerst wát er afwijkt: dan ziet de spuiter alleen de velden die erbij horen,
           en weet SpuitwerkOnline meteen om welk soort afwijking het gaat. -->
      <div class="card">
        <div style="font-weight:700;font-size:var(--text-base)">Wat wijkt er af?</div>
        <div style="margin-top:2px;font-size:var(--text-sm);color:var(--muted)">Vink aan wat je ziet. Meer dan één mag.</div>
        <ul class="keuze-lijst">
          <li v-for="k in KEUZES" :key="k.id">
            <label class="keuze" :for="'keuze-' + k.id">
              <PCheckbox v-model="soorten" :value="k.id" :inputId="'keuze-' + k.id" />
              <span class="keuze-tekst">
                <span class="keuze-titel">{{ k.titel }}</span>
                <span class="keuze-uitleg">{{ k.uitleg }}</span>
              </span>
            </label>
          </li>
        </ul>
      </div>

      <!-- Staat van het werk: ondergrond of huidige afwerking vraagt extra werk.
           Hier geeft de spuiter zelf zijn prijs op, met een foto als bewijs voor de klant. -->
      <div v-if="gekozen('staat')" class="card">
        <div style="font-weight:700;font-size:var(--text-base)">Huidige afwerking is anders</div>

        <div class="field" style="margin-top:12px">
          <div class="field-label">Wat zie je?</div>
          <PTextarea v-model="omschrijving" rows="3"
                     placeholder="Bijv. geschilderd oppervlak, folie zit los, hout is gezwollen"
                     style="width:100%;font-family:inherit;font-size:var(--text-base);resize:none" />
        </div>

        <template v-if="gekozen('staat')">
          <div class="field" style="margin-top:12px">
            <div class="field-label">Foto van wat je ziet</div>
            <input ref="cameraInput" type="file" accept="image/*" capture="environment" style="display:none" @change="onFoto" />
            <div class="photo-grid">
              <!-- Foto van de binnenkomst al gemaakt? Die kan direct mee. -->
              <button v-if="order.beforeFotoGemaakt" type="button"
                      :class="['photo-thumb', { captured: binnenkomstFotoMee }]"
                      :aria-pressed="binnenkomstFotoMee"
                      @click="binnenkomstFotoMee = !binnenkomstFotoMee">
                <i :class="binnenkomstFotoMee ? 'ti ti-circle-check' : 'ti ti-photo'" style="font-size:22px" />
                <span class="photo-thumb-label">Binnenkomst</span>
              </button>
              <button v-for="(f, i) in fotos" :key="f" type="button" class="photo-thumb captured"
                      :aria-label="`Foto ${i + 1} verwijderen`" @click="fotos.splice(i, 1)">
                <i class="ti ti-photo" style="font-size:22px" />
                <span class="photo-thumb-label">Foto {{ i + 1 }}</span>
              </button>
              <button type="button" class="photo-add" :aria-label="heeftMuis ? 'Foto toevoegen' : 'Foto maken'" @click="maakFoto">
                <i class="ti ti-camera" />
              </button>
            </div>
          </div>

          <div class="field" style="margin-top:12px">
            <div class="field-label">Jouw geschatte meerkosten</div>
            <div class="amount-input-wrap">
              <span>&euro;</span>
              <input v-model="bedrag" type="text" inputmode="decimal" placeholder="0,00" />
            </div>
            <div style="font-size:var(--text-xs);color:var(--muted);margin-top:4px">Wat jij extra rekent. Wij leggen het met de foto voor aan de klant.</div>
          </div>
        </template>
      </div>

      <!-- Specificaties: de hele configuratie in beeld, zodat de spuiter aanwijst wat niet
           klopt. Aantallen met plus en min, de rest (maten, soort, materiaal) in woorden,
           en wat niet besteld is als extra item. SpuitwerkOnline prijst het zelf. -->
      <div v-if="gekozen('spec')" class="card">
        <div style="font-weight:700;font-size:var(--text-base)">Specificaties</div>
        <div style="margin-top:2px;font-size:var(--text-sm);color:var(--muted)">Zo is het besteld. Pas aan wat niet klopt.</div>

        <template v-for="(dienst, di) in order.diensten" :key="di">
          <div class="regel-dienst">{{ dienst.naam }}</div>
          <div style="font-size:var(--text-sm);color:var(--muted)">
            {{ OPPERVLAK_LABELS[dienst.oppervlaktemateriaal] }} &middot; {{ dienst.zijdig }} &middot; {{ dienst.kleur }}
          </div>
          <ul class="regels">
            <li v-for="(p, i) in dienst.panelen" :key="i"
                :class="['regel', { gewijzigd: geteld(di, i) !== p.aantal }]">
              <span class="regel-wat">
                {{ regelNaam(p, i) }}
                <span v-if="regelMaat(p)" class="regel-maat tnum">{{ regelMaat(p) }}</span>
                <span v-if="geteld(di, i) !== p.aantal" class="regel-was tnum">was {{ p.aantal }}</span>
              </span>
              <span class="teller" role="group" :aria-label="`Aantal ${regelNaam(p, i)}`">
                <button type="button" :disabled="geteld(di, i) === 0" aria-label="Eén minder"
                        @click="zetGeteld(di, i, geteld(di, i) - 1)"><i class="ti ti-minus" /></button>
                <output>{{ geteld(di, i) }}</output>
                <button type="button" aria-label="Eén meer"
                        @click="zetGeteld(di, i, geteld(di, i) + 1)"><i class="ti ti-plus" /></button>
              </span>
            </li>
          </ul>
        </template>

        <div class="field" style="margin-top:12px">
          <div class="field-label">Wat klopt er verder niet? <span style="color:var(--muted)">(als dat zo is)</span></div>
          <PTextarea v-model="specTekst" rows="2"
                     placeholder="Bijv. deur is 4 cm breder, het is eiken in plaats van MDF"
                     style="width:100%;font-family:inherit;font-size:var(--text-base);resize:none" />
        </div>

        <!-- Iets dat niet in de bestelling stond, dus met afmetingen -->
        <div v-for="(it, i) in extraItems" :key="'x' + i"
             style="background:var(--p-surface-50);border-radius:var(--radius);padding:12px;margin-top:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="font-size:var(--text-base);font-weight:600;color:var(--text)">Extra item {{ i + 1 }}</span>
            <button style="background:none;border:none;color:var(--muted);font-size:var(--text-xs);cursor:pointer;font-family:inherit;min-height:44px"
                    @click="extraItems.splice(i, 1)">Verwijderen</button>
          </div>
          <div class="field" style="margin-bottom:8px">
            <div class="field-label">Wat is het?</div>
            <PInputText v-model="it.omschrijving" placeholder="bijv. Extra zijpaneel"
                        style="width:100%;font-size:var(--text-base);height:44px" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
            <div class="field">
              <div class="field-label">Aantal</div>
              <PInputText v-model="it.aantal" type="number" inputmode="numeric" placeholder="1"
                          style="width:100%;font-size:var(--text-base);height:44px" />
            </div>
            <div class="field">
              <div class="field-label">Breedte</div>
              <PInputText v-model="it.breedte" type="number" inputmode="numeric" placeholder="cm"
                          style="width:100%;font-size:var(--text-base);height:44px" />
            </div>
            <div class="field">
              <div class="field-label">Hoogte</div>
              <PInputText v-model="it.hoogte" type="number" inputmode="numeric" placeholder="cm"
                          style="width:100%;font-size:var(--text-base);height:44px" />
            </div>
          </div>
        </div>

        <button style="width:100%;margin-top:10px;border:1.5px dashed var(--border);background:none;border-radius:8px;padding:10px;min-height:44px;font-size:var(--text-base);font-weight:600;color:var(--primary);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px"
                @click="extraItems.push({ aantal: '1', breedte: '', hoogte: '', omschrijving: '' })">
          <i class="ti ti-plus" /> {{ extraItems.length ? 'Nog een extra item' : 'Er zit iets extra bij' }}
        </button>
      </div>

      <!-- Overige: alles wat niet in de andere hokjes past. Vrije tekst, en meerkosten
           als die er zijn — zo hoeft niemand een afwijking in een verkeerd hokje te
           proppen om er een prijs bij te kunnen zetten. -->
      <div v-if="gekozen('overig')" class="card">
        <div style="font-weight:700;font-size:var(--text-base)">Overige</div>
        <div class="field" style="margin-top:12px">
          <div class="field-label">Wat wijkt er af?</div>
          <PTextarea v-model="overig" rows="3"
                     placeholder="Bijv. kleurcode onduidelijk"
                     style="width:100%;font-family:inherit;font-size:var(--text-base);resize:none" />
        </div>
        <div class="field" style="margin-top:12px">
          <div class="field-label">Jouw geschatte meerkosten <span style="color:var(--muted)">(als die er zijn)</span></div>
          <div class="amount-input-wrap">
            <span>&euro;</span>
            <input v-model="overigBedrag" type="text" inputmode="decimal" placeholder="0,00" />
          </div>
        </div>
      </div>

    </main>

    <div class="bottom-bar">
      <PButton label="Melden bij SpuitwerkOnline" icon="ti ti-send"
               :disabled="!!blokkade" @click="meld" />
      <div v-if="blokkade" class="balk-hint">{{ blokkade }}</div>
    </div>
  </div>

  <!-- FASE 2: Gemeld bij SpuitwerkOnline -->
  <div v-else-if="fase === 'gemeld'">
    <!-- Bevestiging in de stijl van Ontvangst: kruimelpad op de brede container, de
         inhoud gecentreerd in een smalle kolom (Stripe-bevestigingspatroon). -->
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: String(route.params.id), to: '/order/' + String(route.params.id) }, { label: 'Afwijking melden' }]" />
    </header>
    <main class="page-content ont">
      <div class="ont-kolom">
        <section class="ont-kop">
          <span class="ont-vink" aria-hidden="true"><i class="ti ti-check" /></span>
          <h1>Gemeld bij SpuitwerkOnline</h1>
          <p class="ont-sub">{{ klantPlaats(order) }} &middot; <span class="tnum">{{ order?.id }}</span></p>
        </section>
        <section class="od-stap" role="status">
          <div class="od-stap-actie">
            <div class="od-stap-tekst">Bedankt! Wij regelen het akkoord met de klant en laten het je weten.</div>
          </div>
        </section>
        <!-- Wat je hebt gemeld, als korte samenvatting (zoals een ontvangstbewijs) -->
        <section class="card" style="padding:4px 16px">
          <div v-if="aantalWijzigingen.length" class="detail-row">
            <span class="label">Aantallen</span>
            <span class="value">
              <span v-for="(a, i) in aantalWijzigingen" :key="i" style="display:block">
                {{ a.regel }}: <span class="tnum">{{ a.geteld }}</span> in plaats van <span class="tnum">{{ a.was }}</span>
              </span>
            </span>
          </div>
          <div v-if="ingevuldeItems.length" class="detail-row">
            <span class="label">Extra items</span>
            <span class="value">
              <span v-for="(it, i) in ingevuldeItems" :key="i" style="display:block">{{ itemTekst(it) }}</span>
            </span>
          </div>
          <div v-if="heeftSpecTekst" class="detail-row">
            <span class="label">Specificaties</span>
            <span class="value">{{ specTekst.trim() }}</span>
          </div>
          <div v-if="heeftOverig" class="detail-row">
            <span class="label">Overige</span>
            <span class="value">{{ overig.trim() }}</span>
          </div>
          <div v-if="heeftStaat" class="detail-row">
            <span class="label">Huidige afwerking</span>
            <span class="value">{{ omschrijving }}</span>
          </div>
          <div v-if="totaalKosten > 0" class="detail-row">
            <span class="label">Geschatte meerkosten</span>
            <span class="value tnum" style="font-weight:600">&euro; {{ formatBedrag(totaalKosten) }}</span>
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
import { useOrders, klantPlaats, regelNaam, regelMaat, OPPERVLAK_LABELS, type AantalWijziging, type MeerwerkPaneel } from '@/composables/useOrders'
import { useMuis } from '@/composables/useMuis'

const router = useRouter()
const route  = useRoute()
const { getOrder, meldMeerwerk } = useOrders()
const { heeftMuis } = useMuis()
const order  = computed(() => getOrder(route.params.id as string))

// Al een melding verstuurd? Dan toont dit scherm die melding, niet een leeg
// formulier — 'Bekijk meerwerk' hoort te laten zien wát er gemeld is.
const bestaandeMelding = computed(() => order.value?.meerwerk)

type Fase = 'invoer' | 'nieuw' | 'gemeld'
const fase = ref<Fase>('invoer')

function formatEuro(n: number): string {
  return '€' + n.toLocaleString('nl-NL')
}
function formatBedrag(n: number): string {
  return n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function itemTekst(it: MeerwerkPaneel): string {
  const maat = it.breedte && it.hoogte ? ` ${it.breedte} × ${it.hoogte} cm` : ''
  return `${it.aantal || 1}× ${it.omschrijving || 'Item'}${maat}`
}

// ── Wat wijkt er af: bepaalt welke kaarten het formulier toont ──
// Volgorde volgens Robert (5 nov): afwerking eerst, dan specificaties, overig als laatste
type Soort = 'staat' | 'spec' | 'overig'
const KEUZES: { id: Soort; titel: string; uitleg: string }[] = [
  { id: 'staat',  titel: 'Huidige afwerking is anders', uitleg: 'Vraagt extra werk, bijvoorbeeld door folie of oude lak' },
  { id: 'spec',   titel: 'Specificaties kloppen niet',  uitleg: 'Aantal, maten, soort of materiaal' },
  { id: 'overig', titel: 'Overige',                     uitleg: 'Iets anders, zoals de kleur' },
]
const soorten = ref<Soort[]>([])
const gekozen = (s: Soort) => soorten.value.includes(s)

// ── Aantallen: telling per orderregel, start op het bestelde aantal ──
const tellingen = ref<Record<string, number>>({})
function geteld(di: number, i: number): number {
  return tellingen.value[`${di}-${i}`] ?? order.value?.diensten[di]?.panelen[i]?.aantal ?? 0
}
function zetGeteld(di: number, i: number, n: number) {
  tellingen.value = { ...tellingen.value, [`${di}-${i}`]: Math.max(0, n) }
}
const aantalWijzigingen = computed<AantalWijziging[]>(() => {
  const o = order.value
  if (!o || !gekozen('spec')) return []
  return o.diensten.flatMap((d, di) => d.panelen.flatMap((p, i) => {
    const n = geteld(di, i)
    if (n === p.aantal) return []
    const maat = regelMaat(p)
    return [{ dienst: d.naam, regel: maat ? `${regelNaam(p, i)} ${maat}` : regelNaam(p, i), was: p.aantal, geteld: n }]
  }))
})

// ── Extra items: niet besteld, dus met afmetingen ──
const extraItems = ref<MeerwerkPaneel[]>([])
const ingevuldeItems = computed(() => !gekozen('spec') ? [] :
  extraItems.value.filter(it => it.omschrijving.trim() || it.breedte || it.hoogte)
)

// ── Specificaties in woorden: maten, soort, materiaal ──
const specTekst      = ref('')
const heeftSpecTekst = computed(() => gekozen('spec') && specTekst.value.trim().length >= 3)

// ── Staat van het werk: omschrijving, foto en wat de spuiter extra rekent ──
const omschrijving = ref('')
const heeftStaat = computed(() => gekozen('staat') && omschrijving.value.trim().length >= 3)

// ── Overige: vrije tekst, meerkosten optioneel ──
const overig       = ref('')
const heeftOverig  = computed(() => gekozen('overig') && overig.value.trim().length >= 3)
const overigBedrag = ref('')
const overigNum    = computed(() => heeftOverig.value ? (parseFloat(overigBedrag.value.replace(',', '.')) || 0) : 0)

const cameraInput = ref<HTMLInputElement | null>(null)
const fotos = ref<number[]>([])
const nextFotoId = ref(0)
const binnenkomstFotoMee = ref(false)
function maakFoto() { cameraInput.value?.click() }
function onFoto() {
  if (cameraInput.value?.files?.length) {
    fotos.value.push(nextFotoId.value++)
    cameraInput.value.value = ''
  }
}
const aantalFotos = computed(() => fotos.value.length + (binnenkomstFotoMee.value ? 1 : 0))

const bedrag    = ref('')
const bedragNum = computed(() => parseFloat(bedrag.value.replace(',', '.')) || 0)
// Eén bedrag naar SpuitwerkOnline: staat van het werk plus eventuele overige meerkosten
const totaalKosten = computed(() => (heeftStaat.value ? bedragNum.value : 0) + overigNum.value)

// ── Validatie & melden ──────────────────────────────────────────────
// Eén reden tegelijk, in de volgorde waarin de spuiter het formulier doorloopt.
const blokkade = computed<string | null>(() => {
  if (!soorten.value.length) return 'Vink aan wat er afwijkt'
  if (gekozen('staat') && !heeftStaat.value) return 'Beschrijf wat je ziet'
  if (gekozen('staat') && aantalFotos.value === 0) return 'Voeg een foto toe van wat je ziet'
  if (gekozen('staat') && bedragNum.value <= 0) return 'Vul je geschatte meerkosten in'
  if (gekozen('spec') && !aantalWijzigingen.value.length && !ingevuldeItems.value.length && !heeftSpecTekst.value)
    return 'Geef aan wat er niet klopt'
  if (gekozen('overig') && !heeftOverig.value) return 'Beschrijf wat er afwijkt'
  return null
})

function meld() {
  if (blokkade.value) return
  // De melding hoort bij de order te blijven: de spuiter moet later kunnen
  // terugzien wát hij gemeld heeft, wanneer, en wie er aan zet is.
  meldMeerwerk(route.params.id as string, {
    aantallen: aantalWijzigingen.value,
    extraItems: ingevuldeItems.value,
    specificaties: heeftSpecTekst.value ? specTekst.value.trim() : undefined,
    overig: heeftOverig.value ? overig.value.trim() : undefined,
    overigKosten: overigNum.value > 0 ? overigNum.value : undefined,
    omschrijving: heeftStaat.value ? omschrijving.value.trim() : undefined,
    fotos: heeftStaat.value ? aantalFotos.value : undefined,
    indicatie: totaalKosten.value > 0 ? totaalKosten.value : undefined,
  })
  fase.value = 'gemeld'
}
</script>
