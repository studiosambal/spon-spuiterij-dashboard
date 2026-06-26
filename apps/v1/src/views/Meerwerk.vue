<template>
  <!-- FASE 1: Spuiter vult meerwerk in -->
  <div v-if="fase === 'invoer'">
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="pi pi-arrow-left" /> Terug
      </button>
      <h1>Meerwerk & Schades</h1>
      <div class="subtitle">{{ order?.klant }} &middot; <span style="font-family:monospace">{{ order?.id }}</span></div>
    </header>

    <main class="page-content" style="padding-bottom:100px">

      <!-- Type selectie -->
      <div class="card">
        <div class="field-label" style="margin-bottom:10px">
          Type <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">(meerdere mogelijk)</span>
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

      <!-- Type A: Maten wijken af / Extra panelen -->
      <template v-if="heeftMatenType">
        <div class="card">
          <div style="background:var(--primary-light);border:1px solid var(--primary-border);border-radius:8px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px">
            <i class="pi pi-calculator" style="color:var(--primary);font-size:20px;flex-shrink:0;margin-top:1px" />
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--primary)">Meerkosten worden automatisch berekend</div>
              <div style="font-size:13px;color:#075985;margin-top:2px;line-height:1.4">SpuitwerkOnline berekent de meerprijs direct op basis van de aangepaste panelen en vaste tarieven. Geen handmatige prijsinvoer nodig.</div>
            </div>
          </div>
          <div class="field-label" style="margin-bottom:12px">Panelen aanpassen</div>

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
                <div class="field-label">Breedte (cm)</div>
                <PInputText v-model="p.breedte" type="number" placeholder="60"
                            style="width:100%;font-size:15px;height:44px" />
              </div>
              <div class="field">
                <div class="field-label">Hoogte (cm)</div>
                <PInputText v-model="p.hoogte" type="number" placeholder="72"
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
            <i class="pi pi-plus" /> Paneel toevoegen
          </button>

          <!-- Live berekening — alleen klantprijs tonen -->
          <div v-if="berekendeMeerkosten > 0"
               style="margin-top:14px;padding:12px 14px;border-radius:8px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;color:var(--muted)">Meerkosten</span>
            <span style="font-size:18px;font-weight:700;color:var(--primary)">&euro; {{ formatBedrag(Math.round(berekendeMeerkosten * MARGE * 100) / 100) }}</span>
          </div>

        </div>
      </template>

      <!-- Type B: Schade / Overig (prijs bepaalt spuiter) -->
      <template v-if="heeftPrijsType">
        <div class="card">
          <div style="display:flex;flex-direction:column;gap:16px">

            <div class="field">
              <div class="field-label">Omschrijving</div>
              <PTextarea v-model="beschrijving" rows="3"
                         placeholder="Beschrijf de schade of het extra werk..."
                         style="width:100%;font-family:inherit;font-size:14px;resize:none" />
            </div>

            <div class="field">
              <div class="field-label">Jouw vergoeding</div>
              <div class="amount-input-wrap">
                <span>&euro;</span>
                <input v-model="bedrag" type="text" inputmode="decimal" placeholder="0,00" />
              </div>
              <div style="font-size:12px;color:#92400e;margin-top:4px">Let op: hier gaat onze marge nog vanaf</div>
            </div>

            <!-- Prijssplitsing -->
            <div v-if="bedragNum > 0" style="border-radius:8px;overflow:hidden;border:1px solid var(--border)">
              <div style="padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)">
                <span style="font-size:14px;color:var(--muted)">Jouw vergoeding</span>
                <span style="font-size:16px;font-weight:700;color:var(--text)">&euro; {{ formatBedrag(bedragNum) }}</span>
              </div>
              <div style="padding:10px 14px;display:flex;justify-content:space-between;align-items:center;background:#f8fafc">
                <div>
                  <span style="font-size:14px;color:var(--muted)">Prijs voor klant</span>
                  <div style="font-size:11px;color:var(--muted);margin-top:1px">incl. SpuitwerkOnline kosten</div>
                </div>
                <span style="font-size:16px;font-weight:700;color:var(--text)">&euro; {{ formatBedrag(klantPrijs) }}</span>
              </div>
            </div>

          </div>
        </div>
      </template>

      <!-- Algemene omschrijving als geen prijstype -->
      <template v-if="heeftMatenType && !heeftPrijsType">
        <div class="card">
          <div class="field">
            <div class="field-label">Toelichting (optioneel)</div>
            <PTextarea v-model="beschrijving" rows="2"
                       placeholder="Eventuele aanvullende opmerkingen..."
                       style="width:100%;font-family:inherit;font-size:14px;resize:none" />
          </div>
        </div>
      </template>

      <!-- Hoe verder? — pas relevant als inhoud is ingevuld -->
      <div v-if="selectedTypes.length > 0" class="card" style="padding:12px 14px">
        <div class="field-label" style="margin-bottom:8px">Hoe is het product aangeleverd?</div>
        <div style="display:flex;gap:8px">
          <button :class="['tag', { selected: klantAanwezig === true }]"
                  style="flex:1;text-align:center"
                  @click="klantAanwezig = true">
            <i class="pi pi-user" style="margin-right:5px" />Klant is aanwezig
          </button>
          <button :class="['tag', { selected: klantAanwezig === false }]"
                  style="flex:1;text-align:center"
                  @click="klantAanwezig = false">
            <i class="pi pi-truck" style="margin-right:5px" />Via koerier
          </button>
        </div>
      </div>

    </main>

    <div class="bottom-bar">
      <PButton v-if="klantAanwezig === true"
               label="Toon aan klant voor handtekening" icon="pi pi-pen-to-square"
               :disabled="!kanDoornaar" @click="fase = 'akkoord'" />
      <PButton v-else-if="klantAanwezig === false"
               label="Stuur akkoordverzoek naar klant" icon="pi pi-send"
               :disabled="!kanDoornaar" @click="verstuurDigitaal" />
      <PButton v-else label="Kies eerst hoe het product is aangeleverd"
               icon="pi pi-arrow-up" :disabled="true" />
    </div>
  </div>

  <!-- FASE 2: Klant geeft akkoord -->
  <div v-else-if="fase === 'akkoord'" style="background:#fff;min-height:100dvh">
    <header style="background:var(--primary);padding:14px 16px;display:flex;align-items:center;gap:12px">
      <button @click="fase = 'invoer'"
              style="background:rgba(255,255,255,.2);border:none;border-radius:6px;padding:6px 10px;color:#fff;cursor:pointer;font-family:inherit;font-size:13px">
        <i class="pi pi-arrow-left" /> Terug
      </button>
      <div>
        <div style="color:#fff;font-size:15px;font-weight:700">Akkoord gevraagd</div>
        <div style="color:rgba(255,255,255,.8);font-size:12px">{{ order?.klant }} &middot; {{ order?.id }}</div>
      </div>
    </header>

    <div style="padding:16px;display:flex;flex-direction:column;gap:14px;padding-bottom:100px">

      <div class="card">
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:10px">Overzicht meerwerk</p>
        <div class="detail-row">
          <span class="label">Type</span>
          <span class="value">{{ selectedTypes.map(id => types.find(t => t.id === id)?.label).join(', ') }}</span>
        </div>
        <div v-if="beschrijving" class="detail-row">
          <span class="label">Omschrijving</span>
          <span class="value">{{ beschrijving }}</span>
        </div>
        <div v-if="heeftPrijsType && bedragNum > 0" class="detail-row">
          <span class="label">Meerkosten</span>
          <span class="value" style="font-weight:700;font-size:18px">&euro; {{ formatBedrag(klantPrijs) }}</span>
        </div>
        <div v-if="heeftMatenType" class="detail-row">
          <span class="label">Aangepaste panelen</span>
          <span class="value">
            <span v-for="(p, i) in extraPanelen" :key="i" style="display:block">
              {{ p.aantal }}x {{ p.omschrijving || `Paneel ${i + 1}` }}{{ p.breedte && p.hoogte ? ` (${p.breedte}x${p.hoogte} cm)` : '' }}
            </span>
          </span>
        </div>
        <div v-if="heeftMatenType" class="detail-row">
          <span class="label">Meerkosten</span>
          <span class="value" style="font-weight:700;font-size:18px;color:var(--primary)">&euro; {{ formatBedrag(Math.round(berekendeMeerkosten * MARGE * 100) / 100) }}</span>
          <span style="font-size:12px;color:var(--muted);margin-top:2px">Berekend op basis van vaste tarieven SpuitwerkOnline</span>
        </div>
      </div>

      <PMessage severity="info" :closable="false" style="border-radius:10px;font-size:14px">
        Controleer bovenstaande informatie. Zet uw naam en handtekening om akkoord te geven.
      </PMessage>

      <div class="field">
        <div class="field-label">Uw naam</div>
        <PInputText v-model="klantNaam" placeholder="Voor- en achternaam"
                    style="width:100%;font-size:16px;height:48px" />
      </div>

      <div class="field">
        <div class="field-label" style="display:flex;justify-content:space-between;align-items:center">
          <span>Handtekening</span>
          <button @click="clearSignature"
                  style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:inherit">
            Wissen
          </button>
        </div>
        <div style="position:relative;margin:0 -16px;border-top:1.5px solid var(--border);border-bottom:1.5px solid var(--border);background:#fafafa;touch-action:none">
          <canvas ref="canvasRef"
                  :width="canvasWidth" :height="canvasHeight"
                  style="display:block;width:100vw;height:80vw;cursor:crosshair"
                  @mousedown="startDraw" @mousemove="draw" @mouseup="stopDraw" @mouseleave="stopDraw"
                  @touchstart.prevent="startDrawTouch" @touchmove.prevent="drawTouch" @touchend="stopDraw" />
          <p v-if="!heeftHandtekening"
             style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#cbd5e1;font-size:14px;pointer-events:none;white-space:nowrap">
            Teken hier uw handtekening
          </p>
        </div>
      </div>

    </div>

    <div class="bottom-bar" style="background:#fff">
      <PButton label="Akkoord geven" icon="pi pi-check-circle"
               :disabled="!klantNaam.trim() || !heeftHandtekening"
               @click="geefAkkoord" />
    </div>
  </div>

  <!-- FASE 3b: Digitaal verzoek verstuurd -->
  <div v-else-if="fase === 'digitaal_verstuurd'" style="min-height:100dvh;display:flex;flex-direction:column">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:20px">
        <i class="pi pi-send" style="font-size:36px;color:#fff" />
      </div>
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:8px">Verzoek verstuurd</div>
      <div style="font-size:15px;color:var(--muted);line-height:1.5;max-width:280px">
        De klant ontvangt een akkoordverzoek. Je kunt pas verder zodra de klant akkoord heeft gegeven.
      </div>
      <div class="card" style="width:100%;text-align:left;margin-top:24px">
        <div class="detail-row">
          <span class="label">Type</span>
          <span class="value">{{ selectedTypes.map(id => types.find(t => t.id === id)?.label).join(', ') }}</span>
        </div>
        <div v-if="heeftPrijsType && bedragNum > 0" class="detail-row">
          <span class="label">Meerkosten voor klant</span>
          <span class="value" style="font-weight:700">&euro; {{ formatBedrag(klantPrijs) }}</span>
        </div>
      </div>
    </div>
    <div style="padding:16px">
      <PButton label="Terug naar overzicht" icon="pi pi-home" @click="router.push('/')" />
    </div>
  </div>

  <!-- FASE 3: Ter plekke getekend -->
  <div v-else style="min-height:100dvh;display:flex;flex-direction:column">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center">
      <div style="width:80px;height:80px;border-radius:50%;background:#15803d;display:flex;align-items:center;justify-content:center;margin-bottom:20px">
        <i class="pi pi-check" style="font-size:36px;color:#fff" />
      </div>
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:8px">Akkoord ontvangen</div>
      <div style="font-size:15px;color:var(--muted);line-height:1.5;max-width:280px">
        {{ klantNaam }} heeft het meerwerk goedgekeurd.
      </div>
      <div class="card" style="width:100%;text-align:left;margin-top:24px">
        <div class="detail-row">
          <span class="label">Type</span>
          <span class="value">{{ selectedTypes.map(id => types.find(t => t.id === id)?.label).join(', ') }}</span>
        </div>
        <div v-if="heeftPrijsType && bedragNum > 0" class="detail-row">
          <span class="label">Meerkosten</span>
          <span class="value" style="font-weight:700">&euro; {{ formatBedrag(klantPrijs) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Getekend door</span>
          <span class="value">{{ klantNaam }}</span>
        </div>
      </div>
    </div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
      <PButton label="Doorgaan met opdracht" icon="pi pi-arrow-right"
               @click="router.push('/order/' + route.params.id)" />
      <PButton label="Terug naar overzicht" icon="pi pi-home" outlined
               @click="router.push('/')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrders } from '@/composables/useOrders'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus } = useOrders()
const order  = computed(() => getOrder(route.params.id as string))

type Fase = 'invoer' | 'akkoord' | 'digitaal_verstuurd' | 'done'
const fase = ref<Fase>('invoer')

// ── Types ──────────────────────────────────────────────────────────
const types = [
  { id: 'maten',  label: 'Maten wijken af / Extra panelen', desc: 'Meerkosten automatisch berekend via SpuitwerkOnline', icon: 'pi pi-table' },
  { id: 'schade', label: 'Schade aanwezig (Herstel)',        desc: 'Spuiter bepaalt vergoeding',                          icon: 'pi pi-exclamation-triangle' },
  { id: 'overig', label: 'Overig extra werk',                desc: 'Handmatige invoer',                                   icon: 'pi pi-plus-circle' },
]

const selectedTypes  = ref<string[]>([])
const klantAanwezig  = ref<boolean | null>(null)

const heeftMatenType = computed(() => selectedTypes.value.includes('maten'))
const heeftPrijsType = computed(() => selectedTypes.value.includes('schade') || selectedTypes.value.includes('overig'))


// ── Type A: Extra panelen ──────────────────────────────────────────
interface ExtraPaneel { aantal: string; breedte: string; hoogte: string; omschrijving: string }

const extraPanelen = ref<ExtraPaneel[]>([])

function toggleType(id: string) {
  const i = selectedTypes.value.indexOf(id)
  if (i >= 0) {
    selectedTypes.value.splice(i, 1)
  } else {
    selectedTypes.value.push(id)
    // Vul panelen vanuit order bij eerste selectie van maten-type
    if (id === 'maten' && extraPanelen.value.length === 0 && order.value) {
      extraPanelen.value = order.value.panelen.map(p => ({
        aantal:       String(p.aantal),
        breedte:      p.breedte > 0 ? String(p.breedte) : '',
        hoogte:       p.hoogte  > 0 ? String(p.hoogte)  : '',
        omschrijving: p.omschrijving
      }))
    }
  }
}

// ── Type B: Prijs ──────────────────────────────────────────────────
const beschrijving = ref('')
const bedrag       = ref('')
const MARGE        = 1.25  // 25% SpuitwerkOnline marge

const bedragNum  = computed(() => parseFloat(bedrag.value.replace(',', '.')) || 0)
const klantPrijs = computed(() => Math.round(bedragNum.value * MARGE * 100) / 100)

// ── Type A: Live berekening meerkosten panelen ─────────────────────
const TARIEF_PER_M2 = 8.50  // SpuitwerkOnline basistarief per m²

const berekendeMeerkosten = computed(() => {
  const zijdigFactor = order.value?.zijdig === '2-zijdig' ? 2 : 1
  const totaal = extraPanelen.value.reduce((sum, p) => {
    const aantal  = parseFloat(p.aantal)  || 1
    const breedte = parseFloat(p.breedte) || 0
    const hoogte  = parseFloat(p.hoogte)  || 0
    if (breedte > 0 && hoogte > 0) {
      return sum + aantal * (breedte / 100) * (hoogte / 100) * TARIEF_PER_M2 * zijdigFactor
    }
    return sum + aantal * 25 // vaste prijs per stuk zonder maten
  }, 0)
  return Math.round(totaal * 100) / 100
})

function formatBedrag(n: number): string {
  return n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Validatie ──────────────────────────────────────────────────────
const kanDoornaar = computed(() => {
  if (selectedTypes.value.length === 0) return false
  if (heeftPrijsType.value && (beschrijving.value.length < 3 || bedragNum.value <= 0)) return false
  if (heeftMatenType.value && !heeftPrijsType.value && extraPanelen.value.length === 0) return false
  return true
})

// ── Handtekening ───────────────────────────────────────────────────
const klantNaam         = ref('')
const canvasRef         = ref<HTMLCanvasElement | null>(null)
const canvasWidth       = ref(390)
const canvasHeight      = ref(312)
const heeftHandtekening = ref(false)
let drawing = false
let ctx: CanvasRenderingContext2D | null = null

onMounted(() => {
  canvasWidth.value  = window.innerWidth
  canvasHeight.value = Math.round(window.innerWidth * 0.8)
})

async function initCanvas() {
  await nextTick()
  if (!canvasRef.value) return
  ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

watch(() => fase.value, async (v) => {
  if (v === 'akkoord') {
    canvasWidth.value  = window.innerWidth
    canvasHeight.value = Math.round(window.innerWidth * 0.8)
    await initCanvas()
  }
})

function getPos(e: MouseEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  const scaleX = canvasRef.value!.width / rect.width
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleX }
}
function getTouchPos(e: TouchEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  const scaleX = canvasRef.value!.width / rect.width
  const t = e.touches[0]
  return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleX }
}
function startDraw(e: MouseEvent)  { if (!ctx) return; drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
function draw(e: MouseEvent)       { if (!drawing || !ctx) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); heeftHandtekening.value = true }
function startDrawTouch(e: TouchEvent) { if (!ctx) return; drawing = true; const p = getTouchPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
function drawTouch(e: TouchEvent)  { if (!drawing || !ctx) return; const p = getTouchPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); heeftHandtekening.value = true }
function stopDraw()                { drawing = false }
function clearSignature()          { if (!ctx || !canvasRef.value) return; ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height); heeftHandtekening.value = false }

// ── Acties ─────────────────────────────────────────────────────────
function verstuurDigitaal() {
  updateStatus(route.params.id as string, 'meerwerk_wacht')
  fase.value = 'digitaal_verstuurd'
}
function geefAkkoord() {
  updateStatus(route.params.id as string, 'ontvangen')
  fase.value = 'done'
}
</script>
