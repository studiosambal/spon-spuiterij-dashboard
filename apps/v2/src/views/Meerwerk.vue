<template>
  <!-- FASE 1: Spuiter meldt de afwijking -->
  <div v-if="fase === 'invoer'">
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="ti ti-arrow-left" /> Terug
      </button>
      <h1>Afwijking melden</h1>
      <div class="subtitle">{{ klantPlaats(order) }} &middot; <span style="font-family:monospace">{{ order?.id }}</span></div>
    </header>

    <main class="page-content" style="padding-bottom:100px">

      <!-- Hoe het werkt -->
      <div class="alert alert-info">
		Is er meerwerk nodig of wijkt iets af van de bestelling? Meld het hier. SpuitwerkOnline neemt contact op met de klant voor akkoord. Je krijgt bericht zodra je verder kunt.
      </div>

      <!-- Open invoerveld — de kern van de melding -->
      <div class="card">
        <div class="field">
          <div class="field-label">Wat wijkt af?</div>
          <PTextarea v-model="omschrijving" rows="4"
                     placeholder="Beschrijf kort wat er afwijkt. Bijv. oppervlak valt tegen, of aantallen kloppen niet."
                     style="width:100%;font-family:inherit;font-size:14px;resize:none" />
        </div>
      </div>

      <!-- Optioneel: categorie kiezen (helpt SpuitwerkOnline) -->
      <div class="card">
        <div class="field-label" style="margin-bottom:10px">
          Categorie <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">(optioneel, meerdere mogelijk)</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button v-for="type in types" :key="type.id"
                  :class="['tag', { selected: selectedTypes.includes(type.id) }]"
                  style="width:100%;text-align:left;display:flex;align-items:center;gap:8px"
                  @click="toggleType(type.id)">
            <i :class="type.icon" style="font-size:15px;flex-shrink:0" />
            <div>
              <div style="font-weight:600">{{ type.label }}</div>
              <div style="font-size:12px;font-weight:400;opacity:.7;text-transform:none;letter-spacing:0;margin-top:1px">{{ type.desc }}</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Maten: panelen aanpassen → indicatie meerkosten -->
      <template v-if="heeftMatenType">
        <div class="card">
          <div class="field-label" style="margin-bottom:12px">Aangepaste panelen</div>

          <div v-for="(p, i) in extraPanelen" :key="i"
               style="border:1.5px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span style="font-size:14px;font-weight:600;color:var(--text)">Paneel {{ i + 1 }}</span>
              <button style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:inherit"
                      @click="extraPanelen.splice(i, 1)">Verwijderen</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">
              <div class="field">
                <div class="field-label">Aantal</div>
                <PInputText v-model="p.aantal" type="number" placeholder="1"
                            style="width:100%;font-size:15px;height:44px" />
              </div>
              <div class="field">
                <div class="field-label">Breedte</div>
                <PInputText v-model="p.breedte" type="number" placeholder="cm"
                            style="width:100%;font-size:15px;height:44px" />
              </div>
              <div class="field">
                <div class="field-label">Hoogte</div>
                <PInputText v-model="p.hoogte" type="number" placeholder="cm"
                            style="width:100%;font-size:15px;height:44px" />
              </div>
            </div>
            <div class="field">
              <div class="field-label">Omschrijving</div>
              <PInputText v-model="p.omschrijving" placeholder="bijv. Extra zijpaneel"
                          style="width:100%;font-size:15px;height:44px" />
            </div>
          </div>

          <button style="width:100%;border:1.5px dashed var(--border);background:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;color:var(--primary);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px"
                  @click="extraPanelen.push({ aantal:'1', breedte:'', hoogte:'', omschrijving:'' })">
            <i class="ti ti-plus" /> Paneel toevoegen
          </button>

          <!-- Indicatie meerkosten (definitief bedrag bepaalt SpuitwerkOnline met de klant) -->
          <div v-if="berekendeMeerkosten > 0"
               style="margin-top:14px;padding:12px 14px;border-radius:8px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="font-size:14px;color:var(--muted)">Indicatie meerkosten</span>
              <div style="font-size:11px;color:var(--muted);margin-top:1px">SpuitwerkOnline stelt het definitieve bedrag vast</div>
            </div>
            <span style="font-size:18px;font-weight:700;color:var(--primary)">&euro; {{ formatBedrag(berekendeMeerkosten) }}</span>
          </div>
        </div>
      </template>

      <!-- Schade / Overig: optionele indicatie vergoeding -->
      <template v-if="heeftPrijsType">
        <div class="card">
          <div class="field">
            <div class="field-label">Indicatie vergoeding <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">(optioneel)</span></div>
            <div class="amount-input-wrap">
              <span>&euro;</span>
              <input v-model="bedrag" type="text" inputmode="decimal" placeholder="0,00" />
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">Een richtbedrag voor jouw werk. SpuitwerkOnline bepaalt de definitieve prijs met de klant.</div>
          </div>
        </div>
      </template>

    </main>

    <div class="bottom-bar">
      <PButton label="Melden bij SpuitwerkOnline" icon="ti ti-send"
               :disabled="!kanMelden" @click="meld" />
      <div v-if="!kanMelden" style="text-align:center;font-size:12px;color:var(--muted);margin-top:2px">
        Beschrijf eerst kort wat er afwijkt
      </div>
    </div>
  </div>

  <!-- FASE 2: Gemeld bij SpuitwerkOnline -->
  <div v-else style="min-height:100dvh;display:flex;flex-direction:column">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:20px">
        <i class="ti ti-send" style="font-size:36px;color:#fff" />
      </div>
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:8px">Gemeld bij SpuitwerkOnline</div>
      <div style="font-size:15px;color:var(--muted);line-height:1.5;max-width:300px">
        SpuitwerkOnline neemt contact op met de klant, regelt het akkoord en bevestigt het aan jou. Je krijgt bericht zodra je verder kunt.
      </div>
      <div class="card" style="width:100%;text-align:left;margin-top:24px">
        <div v-if="selectedTypes.length > 0" class="detail-row">
          <span class="label">Categorie</span>
          <span class="value">{{ selectedTypes.map(id => types.find(t => t.id === id)?.label).join(', ') }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Afwijking</span>
          <span class="value">{{ omschrijving }}</span>
        </div>
        <div v-if="heeftMatenType && berekendeMeerkosten > 0" class="detail-row">
          <span class="label">Indicatie meerkosten</span>
          <span class="value" style="font-weight:700">&euro; {{ formatBedrag(berekendeMeerkosten) }}</span>
        </div>
        <div v-if="heeftPrijsType && bedragNum > 0" class="detail-row">
          <span class="label">Indicatie vergoeding</span>
          <span class="value" style="font-weight:700">&euro; {{ formatBedrag(bedragNum) }}</span>
        </div>
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
const { getOrder, updateStatus } = useOrders()
const order  = computed(() => getOrder(route.params.id as string))

type Fase = 'invoer' | 'gemeld'
const fase = ref<Fase>('invoer')

// ── Categorieën (optioneel, helpt SpuitwerkOnline standaardiseren) ──
const types = [
  { id: 'maten',  label: 'Maten / aantallen wijken af', desc: 'Andere afmetingen of extra panelen', icon: 'ti ti-table' },
  { id: 'schade', label: 'Schade aan goederen',       desc: 'Slechte staat, extra herstel nodig',  icon: 'ti ti-alert-triangle' },
  { id: 'overig', label: 'Overig',                        desc: 'Andere afwijking',                    icon: 'ti ti-circle-plus' },
]

const selectedTypes  = ref<string[]>([])
const heeftMatenType = computed(() => selectedTypes.value.includes('maten'))
const heeftPrijsType = computed(() => selectedTypes.value.includes('schade') || selectedTypes.value.includes('overig'))

// ── Open invoerveld — verplicht ─────────────────────────────────────
const omschrijving = ref('')

// ── Maten: extra panelen ────────────────────────────────────────────
interface ExtraPaneel { aantal: string; breedte: string; hoogte: string; omschrijving: string }
const extraPanelen = ref<ExtraPaneel[]>([])

function toggleType(id: string) {
  const i = selectedTypes.value.indexOf(id)
  if (i >= 0) {
    selectedTypes.value.splice(i, 1)
  } else {
    selectedTypes.value.push(id)
    // Start leeg: alleen de gewijzigde/extra panelen invoeren, niet het hele bestaande werk
    if (id === 'maten' && extraPanelen.value.length === 0) {
      extraPanelen.value = [{ aantal: '1', breedte: '', hoogte: '', omschrijving: '' }]
    }
  }
}

// ── Indicatie vergoeding (schade/overig) ────────────────────────────
const bedrag    = ref('')
const bedragNum = computed(() => parseFloat(bedrag.value.replace(',', '.')) || 0)

// ── Indicatie meerkosten panelen ────────────────────────────────────
const TARIEF_PER_M2 = 8.50  // SpuitwerkOnline basistarief per m²

const berekendeMeerkosten = computed(() => {
  const zijdigFactor = order.value?.diensten[0]?.zijdig === '2-zijdig' ? 2 : 1
  const totaal = extraPanelen.value.reduce((sum, p) => {
    const aantal  = parseFloat(p.aantal)  || 1
    const breedte = parseFloat(p.breedte) || 0
    const hoogte  = parseFloat(p.hoogte)  || 0
    if (breedte > 0 && hoogte > 0) {
      return sum + aantal * (breedte / 100) * (hoogte / 100) * TARIEF_PER_M2 * zijdigFactor
    }
    return sum // pas meetellen zodra de maten zijn ingevuld
  }, 0)
  return Math.round(totaal * 100) / 100
})

function formatBedrag(n: number): string {
  return n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Validatie & melden ──────────────────────────────────────────────
const kanMelden = computed(() => omschrijving.value.trim().length >= 3)

function meld() {
  if (!kanMelden.value) return
  updateStatus(route.params.id as string, 'meerwerk_wacht')
  fase.value = 'gemeld'
}
</script>
