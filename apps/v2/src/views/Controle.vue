<template>
  <div v-if="!done && order">
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="pi pi-arrow-left" /> Terug
      </button>
      <h1>Controle</h1>
      <div class="subtitle">{{ order.klant }} &middot; <span style="font-family:monospace">{{ order.id }}</span></div>
    </header>

    <main class="page-content">

      <!-- Wanneer -->
      <div class="alert alert-info">
        <strong>Dit is je moment om te melden</strong>
        Controleer kleur en maten. Klopt iets niet? Meld het nu. Na de start van de productie kan het niet meer.
      </div>

      <!-- Stap 1: Kleuren -->
      <div class="card" :style="kleurStapOk ? cardDoneStyle : {}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span :style="kleurStapOk ? stepDotDone : stepDotPending">1</span>
            <span style="font-weight:700;font-size:15px">{{ order.diensten.length > 1 ? 'Kleuren bevestigen' : 'Kleur bevestigen' }}</span>
          </div>
          <PCheckbox v-if="alleKleurenBekend"
                     :modelValue="kleurBevestigd" :binary="true"
                     @change="kleurBevestigd = !kleurBevestigd" />
        </div>

        <div v-for="(dienst, di) in order.diensten" :key="di"
             :style="di > 0 ? { marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' } : {}">

          <!-- Weergave -->
          <template v-if="editIndex !== di">

            <!-- Nog geen kleur: één heldere call-to-action -->
            <button v-if="kleurOpenstaand(dienst, di)"
                    style="width:100%;border:1.5px dashed var(--primary-border);background:var(--primary-light);border-radius:8px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:inherit;text-align:left"
                    @click="openKleurEdit(di)">
              <i class="pi pi-palette" style="font-size:20px;color:var(--primary);flex-shrink:0" />
              <div style="flex:1;min-width:0">
                <div v-if="order.diensten.length > 1" style="font-size:12px;font-weight:700;color:var(--muted)">{{ dienst.naam }}</div>
                <div style="font-size:15px;font-weight:700;color:var(--primary)">Kleur vastleggen</div>
                <div style="font-size:13px;color:var(--muted)">{{ GLANSGRAAD_LABELS[dienst.glansgraad] }} &middot; {{ dienst.zijdig }}</div>
              </div>
              <i class="pi pi-chevron-right" style="color:var(--primary);flex-shrink:0" />
            </button>

            <!-- Kleur vastgelegd: weergave + aanpassen -->
            <template v-else>
              <div style="display:flex;align-items:stretch;border-radius:8px;overflow:hidden;border:1px solid var(--border)">
                <div :style="{ width:'56px', flexShrink:'0', background:kleurToHex(dienst.kleur), boxShadow:'inset -1px 0 0 rgba(0,0,0,0.08)' }" />
                <div style="padding:10px 12px;flex:1;min-width:0">
                  <div v-if="order.diensten.length > 1" style="font-size:12px;font-weight:700;color:var(--muted)">{{ dienst.naam }}</div>
                  <div style="font-size:16px;font-weight:700;color:var(--text)">{{ dienst.kleur }}</div>
                  <div style="font-size:13px;color:var(--muted);margin-top:2px">
                    {{ KLEUR_METHODE_LABELS[dienst.kleur_methode] }} &middot; {{ GLANSGRAAD_LABELS[dienst.glansgraad] }} &middot; {{ dienst.zijdig }}
                  </div>
                  <div v-if="dienst.kleur_recept"
                       style="font-size:12px;color:var(--text);margin-top:6px;background:#f8fafc;border:1px solid var(--border);border-radius:6px;padding:6px 8px;font-family:monospace;white-space:pre-wrap">{{ dienst.kleur_recept }}</div>
                </div>
              </div>
              <button style="background:none;border:none;color:var(--primary);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;min-height:44px;padding:8px 0 0;display:flex;align-items:center;gap:4px"
                      @click="openKleurEdit(di)">
                <i class="pi pi-pencil" style="font-size:11px" />
                Kleur aanpassen
              </button>
            </template>

          </template>

          <!-- Bewerken — getypte invoer: kies hóe de kleur bepaald is -->
          <template v-else>
            <div class="field">
              <div class="field-label">Hoe is de kleur bepaald?{{ order.diensten.length > 1 ? ` (${dienst.naam})` : '' }}</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                <button v-for="m in kleurMethodes" :key="m.id"
                        :class="['tag', { selected: editMethode === m.id }]"
                        style="display:flex;align-items:center;gap:6px"
                        @click="editMethode = m.id">
                  <i :class="m.icon" style="font-size:13px" /> {{ m.label }}
                </button>
              </div>
            </div>

            <div v-if="editMethode === 'ral_ncs'" class="field" style="margin-top:12px">
              <div class="field-label">Kleurcode (RAL of NCS)</div>
              <PInputText v-model="kleurInput" placeholder="bijv. RAL 9005 of NCS S 9000-N"
                          style="width:100%;font-size:15px;height:48px" />
            </div>
            <div v-else-if="editMethode === 'ander_merk'" class="field" style="margin-top:12px">
              <div class="field-label">Merk en code</div>
              <PInputText v-model="kleurInput" placeholder="bijv. Sikkens BN.00.86"
                          style="width:100%;font-size:15px;height:48px" />
            </div>
            <template v-else-if="editMethode === 'mengverhouding'">
              <div class="field" style="margin-top:12px">
                <div class="field-label">Naam <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--muted)">(optioneel)</span></div>
                <PInputText v-model="kleurInput" placeholder="bijv. Saliegroen (mengkleur)"
                            style="width:100%;font-size:15px;height:48px" />
              </div>
              <div class="field" style="margin-top:10px">
                <div class="field-label">Mengrecept</div>
                <PTextarea v-model="receptInput" rows="3"
                           placeholder="Noteer je recept zoals je hem gebruikt, bijv. Sikkens basis WN + 12% RAL 6021 + 3% zwart 9005"
                           style="width:100%;font-family:inherit;font-size:14px;resize:none" />
              </div>
            </template>
            <div v-else-if="editMethode === 'kleurvoorbeeld'" class="alert alert-info" style="margin-top:12px">
              <strong>Volgens meegeleverd kleurstaal</strong>
              Je werkt op kleur van het fysieke staal. Heb je al een code? Kies dan RAL/NCS of Ander merk en vul 'm in.
            </div>

            <div style="display:flex;gap:8px;margin-top:12px">
              <PButton label="Opslaan" icon="pi pi-check" :disabled="!kleurOpslaanKan"
                       style="flex:1" @click="slaKleurOp(di)" />
              <PButton label="Annuleren" outlined style="flex:1" @click="editIndex = null" />
            </div>
          </template>
        </div>
      </div>

      <!-- Stap 2: Maten controleren -->
      <div class="card" :style="matenBevestigd ? cardDoneStyle : {}" style="padding:0;overflow:hidden">
        <div style="padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <span :style="matenBevestigd ? stepDotDone : stepDotPending">2</span>
            <span style="font-weight:700;font-size:15px">Maten controleren</span>
          </div>
          <PCheckbox :modelValue="matenBevestigd" :binary="true" @change="matenBevestigd = !matenBevestigd" />
        </div>
        <div style="padding:0 16px 8px;font-size:13px;color:var(--muted)">
          {{ totalStuks }} stuks verwacht, tel na en vergelijk de afmetingen
        </div>

        <template v-for="(dienst, di) in order.diensten" :key="di">
          <div v-if="order.diensten.length > 1"
               style="padding:8px 16px 2px;font-size:12px;font-weight:700;color:var(--muted)">{{ dienst.naam }}</div>
          <table class="panel-table">
            <thead>
              <tr>
                <th v-if="heeftAfmetingen(dienst)">B&times;H (cm)</th>
                <th v-else>Onderdeel</th>
                <th>Aantal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in dienst.panelen" :key="i">
                <td v-if="heeftAfmetingen(dienst)">{{ paneelMaat(p) }}</td>
                <td v-else>{{ p.omschrijving || `Onderdeel ${i + 1}` }}</td>
                <td><strong>{{ p.aantal }}</strong></td>
              </tr>
            </tbody>
          </table>
        </template>
        <div style="height:14px" />
      </div>

      <!-- Optioneel: afwijkende opleverduur (alleen als het afwijkt van standaard 15) -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <div>
            <div style="font-weight:700;font-size:15px">Verwachte opleverduur</div>
            <div style="font-size:13px;color:var(--muted);margin-top:2px">Standaard 15 werkdagen, pas aan als het afwijkt.</div>
          </div>
          <button :style="{ flexShrink:0, minHeight:'44px', background:'#f1f5f9', color:'var(--text)', border:'2px solid var(--border)', borderRadius:'8px', padding:'8px 14px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }"
                  @click="toonOpleverduur = !toonOpleverduur">
            {{ werkdagen }} werkdagen <i :class="toonOpleverduur ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="font-size:11px;margin-left:4px" />
          </button>
        </div>
        <div v-if="toonOpleverduur" style="display:flex;gap:10px;margin-top:12px">
          <button v-for="d in [5, 10, 15, 20]" :key="d"
                  :style="werkdagen === d
                    ? { flex:1, minHeight:'44px', background:'var(--primary)', color:'#fff', border:'2px solid var(--primary)', borderRadius:'8px', padding:'12px 8px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }
                    : { flex:1, minHeight:'44px', background:'#f1f5f9', color:'var(--text)', border:'2px solid var(--border)', borderRadius:'8px', padding:'12px 8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }"
                  @click="werkdagen = d">
            {{ d }}d
          </button>
        </div>
      </div>

      <PButton label="Afwijking melden" icon="pi pi-flag" outlined
               @click="router.push('/order/' + route.params.id + '/meerwerk')" />
      <PButton label="Productie starten" icon="pi pi-check-circle"
               :disabled="hasUnchecked" @click="startProductie" />
      <div v-if="hasUnchecked" style="text-align:center;font-size:12px;color:var(--muted);margin-top:2px">
        {{ !alleKleurenBekend ? 'Leg eerst de kleur vast' : 'Vink kleur en maten af' }} om te starten.
      </div>

    </main>
  </div>

  <div v-else-if="done" style="min-height:100dvh;display:flex;flex-direction:column">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center;gap:0">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:20px">
        <i class="pi pi-check" style="font-size:36px;color:#fff" />
      </div>
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:8px">Productie gestart</div>
      <div style="font-size:15px;color:var(--muted);line-height:1.5;max-width:280px">
        {{ order?.klant }} &middot; <span style="font-family:monospace">{{ order?.id }}</span>
      </div>
      <div style="width:100%;margin-top:32px;padding:16px;background:#fff;border-radius:var(--radius);border:1px solid var(--border);text-align:left">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:4px">Volgende stap</div>
        <div style="font-size:15px;color:var(--text)">Als het spuitwerk klaar is, maak je een opleverfoto om de order af te ronden.</div>
      </div>
    </div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
      <PButton label="Naar order" icon="pi pi-arrow-right"
               @click="router.push('/order/' + route.params.id)" />
      <PButton label="Naar overzicht" icon="pi pi-home" outlined
               @click="router.push('/')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrders, GLANSGRAAD_LABELS, KLEUR_METHODE_LABELS, type Dienst, type PaneelMaat, type KleurMethode } from '@/composables/useOrders'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus, updateKleur, updateVerwachtGereed } = useOrders()
const order  = computed(() => getOrder(route.params.id as string))
const done   = ref(false)

// Opleverduur — standaard 15, alleen aanpassen als het afwijkt
const werkdagen = ref<number>(order.value?.verwacht_gereed_werkdagen ?? 15)
const toonOpleverduur = ref(false)

// ── Kleur per dienst — getypte invoer (code, merk, mengverhouding of staal) ──
const kleurMethodes: { id: KleurMethode; label: string; icon: string }[] = [
  { id: 'ral_ncs',        label: 'RAL / NCS',          icon: 'pi pi-palette' },
  { id: 'ander_merk',     label: 'Ander merk',         icon: 'pi pi-tag' },
  { id: 'mengverhouding', label: 'Mengverhouding',     icon: 'pi pi-sliders-h' },
  { id: 'kleurvoorbeeld', label: 'Volgens kleurstaal', icon: 'pi pi-image' },
]

// Een kleur die nog 'later' is, of een nog niet vastgelegd kleurstaal, vraagt actie bij de controle
const geregeld = ref<Set<number>>(new Set())
function kleurOpenstaand(d: Dienst, i: number): boolean {
  if (d.kleur_methode === 'later') return true
  if (d.kleur_methode === 'kleurvoorbeeld') return !geregeld.value.has(i)
  return false
}
const alleKleurenBekend = computed(() =>
  order.value?.diensten.every((d, i) => !kleurOpenstaand(d, i)) ?? false
)
const kleurBevestigd = ref(false)
const kleurStapOk = computed(() => alleKleurenBekend.value && kleurBevestigd.value)

const editIndex   = ref<number | null>(null)
const editMethode = ref<KleurMethode>('ral_ncs')
const kleurInput  = ref('')
const receptInput = ref('')

const kleurOpslaanKan = computed(() => {
  switch (editMethode.value) {
    case 'ral_ncs':
    case 'ander_merk':     return kleurInput.value.trim().length > 0
    case 'mengverhouding': return receptInput.value.trim().length > 0
    case 'kleurvoorbeeld': return true
    default:               return false
  }
})

function openKleurEdit(di: number) {
  const d = order.value?.diensten[di]
  editIndex.value   = di
  kleurInput.value  = ''
  receptInput.value = ''
  editMethode.value = 'ral_ncs'
  if (!d) return
  if (d.kleur_methode === 'ral_ncs' || d.kleur_methode === 'ander_merk') {
    editMethode.value = d.kleur_methode
    kleurInput.value  = d.kleur
  } else if (d.kleur_methode === 'mengverhouding') {
    editMethode.value = 'mengverhouding'
    kleurInput.value  = d.kleur
    receptInput.value = d.kleur_recept ?? ''
  } else if (d.kleur_methode === 'kleurvoorbeeld') {
    editMethode.value = 'kleurvoorbeeld'
  }
}

function slaKleurOp(di: number) {
  if (!order.value || !kleurOpslaanKan.value) return
  let kleur = ''
  let recept: string | undefined
  if (editMethode.value === 'ral_ncs' || editMethode.value === 'ander_merk') {
    kleur = kleurInput.value.trim()
  } else if (editMethode.value === 'mengverhouding') {
    kleur  = kleurInput.value.trim() || 'Mengkleur'
    recept = receptInput.value.trim()
  } else if (editMethode.value === 'kleurvoorbeeld') {
    kleur = 'Volgens kleurstaal'
  }
  updateKleur(order.value.id, di, { kleur, methode: editMethode.value, recept })
  geregeld.value = new Set(geregeld.value).add(di)  // nieuwe Set → reactief
  editIndex.value = null
  if (alleKleurenBekend.value) kleurBevestigd.value = true
}


// ── Maten ────────────────────────────────────────────────────────────
const matenBevestigd = ref(false)
const totalStuks = computed(() =>
  order.value?.diensten.reduce((sum, d) => sum + d.panelen.reduce((s, p) => s + p.aantal, 0), 0) ?? 0
)
function heeftAfmetingen(d: Dienst): boolean {
  return d.panelen.some(p => p.breedte > 0 && p.hoogte > 0)
}
function paneelMaat(p: PaneelMaat): string {
  if (p.breedte > 0 && p.hoogte > 0) return `${p.breedte}x${p.hoogte}`
  if (p.breedte > 0 || p.hoogte > 0) return `${Math.max(p.breedte, p.hoogte)} cm`
  return p.omschrijving
}

// ── Validatie ────────────────────────────────────────────────────────
const hasUnchecked = computed(() => !kleurStapOk.value || !matenBevestigd.value)

// ── Stijlen ──────────────────────────────────────────────────────────
const cardDoneStyle = { background: '#f0fdf4', borderColor: '#86efac' }
const stepDotDone   = {
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:'26px', height:'26px', borderRadius:'50%', flexShrink:'0',
  fontSize:'12px', fontWeight:'700', background:'var(--primary)', color:'#fff'
}
const stepDotPending = {
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:'26px', height:'26px', borderRadius:'50%', flexShrink:'0',
  fontSize:'12px', fontWeight:'700', background:'#f1f5f9', color:'#94a3b8', border:'2px solid var(--border)'
}

function kleurToHex(k: string): string {
  const l = k.toLowerCase()
  if (l.includes('zwart') || l.includes('9005') || l.includes('piano')) return '#18181b'
  if (l.includes('gebroken wit') || l.includes('9001')) return '#f5f0e8'
  if (l.includes('wit') || l.includes('9003') || l.includes('9016')) return '#f0f0f0'
  if (l.includes('rood') || l.includes('3020')) return '#dc2626'
  if (l.includes('blauw') || l.includes('5011')) return '#1d4ed8'
  if (l.includes('saliegreen') || l.includes('salige') || l.includes('6021')) return '#7aab78'
  if (l.includes('groen')) return '#15803d'
  if (l.includes('antraciet') || l.includes('7016')) return '#374151'
  if (l.includes('grijs') || l.includes('7035')) return '#9ca3af'
  if (l.includes('taupe') || l.includes('beige')) return '#a89880'
  if (l.includes('oranje')) return '#ea580c'
  if (l.includes('petrol') || l.includes('5021')) return '#0e7490'
  if (l.includes('bn.00.86') || l.includes('sikkens')) return '#c8bfb0'
  return '#e2e8f0'
}

function startProductie() {
  const id = route.params.id as string
  updateVerwachtGereed(id, werkdagen.value)
  updateStatus(id, 'in_productie')
  done.value = true
}
</script>
