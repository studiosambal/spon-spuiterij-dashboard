<template>
  <div v-if="!done && order" class="pagina-smal">
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: String(route.params.id), to: '/order/' + String(route.params.id) }, { label: 'Controle' }]" />
      <h1>Controle</h1>
      <div class="subtitle">{{ klantPlaats(order) }} &middot; <span class="tnum">{{ order.id }}</span></div>
    </header>

    <main class="page-content">

      <!-- Wanneer -->
      <PMessage severity="info">
        <strong>Even nalopen</strong>
        Klopt er iets niet met kleur of aantallen? Laat het ons nu weten, dan regelen wij het met de klant voordat je begint.
      </PMessage>

      <!-- Stap 1: Kleuren -->
      <div class="card" :style="kleurStapOk ? cardDoneStyle : {}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span :style="kleurStapOk ? stepDotDone : stepDotPending">1</span>
            <span style="font-weight:700;font-size:var(--text-base)">{{ order.diensten.length > 1 ? 'Kleuren bevestigen' : 'Kleur bevestigen' }}</span>
          </div>
          <PCheckbox v-if="alleKleurenBekend"
                     :modelValue="kleurBevestigd" :binary="true"
                     @change="kleurBevestigd = !kleurBevestigd" />
        </div>

        <div v-for="(dienst, di) in order.diensten" :key="di"
             :style="di > 0 ? { marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--hairline)' } : {}">

          <!-- Weergave -->
          <template v-if="editIndex !== di">

            <!-- Nog geen kleur: één heldere call-to-action -->
            <button v-if="kleurOpenstaand(dienst, di)"
                    style="width:100%;border:1.5px dashed var(--primary-border);background:var(--primary-light);border-radius:8px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:inherit;text-align:left"
                    @click="openKleurEdit(di)">
              <i class="ti ti-palette" style="font-size:20px;color:var(--primary);flex-shrink:0" />
              <div style="flex:1;min-width:0">
                <div v-if="order.diensten.length > 1" style="font-size:var(--text-xs);font-weight:700;color:var(--muted)">{{ dienst.naam }}</div>
                <div style="font-size:var(--text-base);font-weight:700;color:var(--primary)">Kleur vastleggen</div>
                <div style="font-size:var(--text-sm);color:var(--muted)">{{ GLANSGRAAD_LABELS[dienst.glansgraad] }} &middot; {{ dienst.zijdig }}</div>
              </div>
              <i class="ti ti-chevron-right" style="color:var(--primary);flex-shrink:0" />
            </button>

            <!-- Kleur vastgelegd: weergave + aanpassen (dienst-kop zoals dashboard/detail) -->
            <template v-else>
              <div class="subpaneel">
                <div style="display:flex;align-items:center;gap:12px;padding:10px 12px">
                  <div class="oc-thumb">
                    <img :src="dienstImage(dienst.naam)" :alt="dienst.naam" />
                  </div>
                  <div style="min-width:0;flex:1">
                    <div v-if="order.diensten.length > 1" style="font-size:var(--text-sm);font-weight:600;color:var(--muted)">{{ dienst.naam }}</div>
                    <!-- Geen kleurstaal juist hier: de spuiter vergelijkt fysieke goederen
                         met deze spec. Een op trefwoord geraden hex kan een valse match
                         opleveren. De code en het mengrecept zijn de waarheid. -->
                    <div style="font-size:var(--text-lg);font-weight:700;color:var(--text);margin-top:1px">{{ dienst.kleur }}</div>
                    <div style="font-size:var(--text-sm);color:var(--muted);margin-top:3px">
                      {{ KLEUR_METHODE_LABELS[dienst.kleur_methode] }} &middot; {{ GLANSGRAAD_LABELS[dienst.glansgraad] }} &middot; {{ dienst.zijdig }}
                    </div>
                  </div>
                </div>
                <div v-if="dienst.kleur_recept"
                     style="border-top:1px solid var(--hairline);padding:8px 12px;font-size:var(--text-xs);color:var(--text);background:var(--p-surface-50);font-family:monospace;white-space:pre-wrap">{{ dienst.kleur_recept }}</div>
              </div>
              <button style="background:none;border:none;color:var(--primary);font-size:var(--text-sm);font-weight:600;cursor:pointer;font-family:inherit;min-height:44px;padding:8px 0 0;display:flex;align-items:center;gap:4px"
                      @click="openKleurEdit(di)">
                <i class="ti ti-pencil" style="font-size:11px" />
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
                          style="width:100%;font-size:var(--text-base);height:48px" />
            </div>
            <div v-else-if="editMethode === 'ander_merk'" class="field" style="margin-top:12px">
              <div class="field-label">Merk en code</div>
              <PInputText v-model="kleurInput" placeholder="bijv. Sikkens BN.00.86"
                          style="width:100%;font-size:var(--text-base);height:48px" />
            </div>
            <template v-else-if="editMethode === 'mengverhouding'">
              <div class="field" style="margin-top:12px">
                <div class="field-label">Naam <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--muted)">(optioneel)</span></div>
                <PInputText v-model="kleurInput" placeholder="bijv. Saliegroen (mengkleur)"
                            style="width:100%;font-size:var(--text-base);height:48px" />
              </div>
              <div class="field" style="margin-top:10px">
                <div class="field-label">Mengrecept</div>
                <PTextarea v-model="receptInput" rows="3"
                           placeholder="Noteer je recept zoals je hem gebruikt, bijv. Sikkens basis WN + 12% RAL 6021 + 3% zwart 9005"
                           style="width:100%;font-family:inherit;font-size:var(--text-base);resize:none" />
              </div>
            </template>
            <PMessage severity="info" v-else-if="editMethode === 'kleurvoorbeeld'" style="margin-top:12px">
              <strong>Volgens meegeleverd kleurstaal</strong>
              Je werkt op kleur van het fysieke staal. Heb je al een code? Kies dan RAL/NCS of Ander merk en vul 'm in.
            </PMessage>

            <div style="display:flex;gap:8px;margin-top:12px">
              <PButton label="Opslaan" icon="ti ti-check" :disabled="!kleurOpslaanKan"
                       style="flex:1" @click="slaKleurOp(di)" />
              <PButton label="Annuleren" outlined style="flex:1" @click="editIndex = null" />
            </div>
          </template>
        </div>
      </div>

      <!-- Stap 2: Aantallen tellen. Spuiters meten niet na, ze tellen wel: het aantal
           staat voorop, de maat alleen om de regel te herkennen. -->
      <div class="card" :style="matenBevestigd ? cardDoneStyle : {}">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <span :style="matenBevestigd ? stepDotDone : stepDotPending">2</span>
            <span style="font-weight:700;font-size:var(--text-base)">Aantallen tellen</span>
          </div>
          <PCheckbox :modelValue="matenBevestigd" :binary="true" @change="matenBevestigd = !matenBevestigd" />
        </div>
        <div style="margin-top:4px;font-size:var(--text-sm);color:var(--muted)">
          Tel na of alles er is. Klopt een aantal niet? Meld het als afwijking.
        </div>

        <template v-for="(dienst, di) in order.diensten" :key="di">
          <div v-if="order.diensten.length > 1" class="regel-dienst">{{ dienst.naam }}</div>
          <ul class="regels">
            <li v-for="(p, i) in dienst.panelen" :key="i" class="regel">
              <span class="regel-aantal tnum">{{ p.aantal }}&times;</span>
              <span class="regel-wat">
                {{ regelNaam(p, i) }}
                <span v-if="regelMaat(p)" class="regel-maat tnum">{{ regelMaat(p) }}</span>
              </span>
            </li>
          </ul>
        </template>
        <div class="regel-totaal"><span>Totaal verwacht</span><strong class="tnum">{{ totalStuks }} stuks</strong></div>
      </div>

      <!-- Foto's maken — inline; meerdere mogelijk. Alleen als ze er nog niet zijn -->
      <div v-if="startZonderFoto" class="card">
        <div style="font-weight:700;font-size:var(--text-base)">Foto's maken <span style="font-weight:400;font-size:var(--text-sm);color:var(--muted)">(aanbevolen)</span></div>
        <div style="font-size:var(--text-sm);color:var(--muted);margin-top:2px;margin-bottom:12px">Leg vast hoe het binnenkwam. Dat helpt bij schadevragen.</div>

        <input ref="cameraInput" type="file" accept="image/*" capture="environment" style="display:none" @change="onFoto" />

        <template v-if="fotos.length > 0">
          <div class="photo-grid">
            <div v-for="(f, i) in fotos" :key="f" class="photo-thumb captured" style="position:relative"
                 role="button" :aria-label="`Foto ${i + 1} verwijderen`" @click="verwijderFoto(i)">
              <i class="ti ti-circle-x" style="position:absolute;top:4px;right:4px;font-size:20px;color:var(--p-red-600);background:var(--p-surface-0);border-radius:50%" />
              <i class="ti ti-photo" style="font-size:22px" />
              <span class="photo-thumb-label">Foto {{ i + 1 }}</span>
            </div>
          </div>
          <div style="font-size:var(--text-xs);color:var(--muted);margin:6px 0 10px;text-align:center">{{ heeftMuis ? 'Klik' : 'Tik' }} op een foto om te verwijderen</div>
        </template>

        <button type="button" @click="maakFoto"
                style="width:100%;background:var(--p-surface-100);border:2px dashed var(--border);border-radius:8px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-family:inherit">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center">
            <i class="ti ti-camera" style="font-size:20px;color:var(--p-surface-0)" />
          </div>
          <div style="font-size:var(--text-base);font-weight:700;color:var(--text)">{{ fotos.length === 0 ? (heeftMuis ? 'Foto toevoegen' : 'Foto maken') : 'Nog een foto' }}</div>
          <div style="font-size:var(--text-xs);color:var(--muted)">{{ fotos.length === 0 ? 'Meerdere foto\'s mogelijk' : `${fotos.length} gemaakt, ${heeftMuis ? 'klik' : 'tik'} voor meer` }}</div>
        </button>
      </div>

      <!-- Mobiel onder elkaar; vanaf tablet naast elkaar met de hoofdactie rechts -->
      <div class="actie-rij">
        <PButton label="Afwijking melden" icon="ti ti-flag" outlined
                 @click="router.push('/order/' + route.params.id + '/meerwerk')" />
        <PButton label="Controle afronden" icon="ti ti-circle-check"
                 :disabled="hasUnchecked" @click="startProductie" />
        <div v-if="hasUnchecked" class="balk-hint">
          {{ !alleKleurenBekend ? 'Leg eerst de kleur vast' : 'Vink kleur en aantallen af' }} om te starten.
        </div>
      </div>

    </main>
  </div>

  <div v-else-if="done">
    <!-- Bevestiging in de stijl van Ontvangst: kruimelpad op de brede container, de
         inhoud gecentreerd in een smalle kolom (Stripe-bevestigingspatroon). -->
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: String(route.params.id), to: '/order/' + String(route.params.id) }, { label: 'Controle' }]" />
    </header>
    <main class="page-content ont">
      <div class="ont-kolom">
        <section class="ont-kop">
          <span class="ont-vink" aria-hidden="true"><i class="ti ti-check" /></span>
          <h1>Controle afgerond</h1>
          <p class="ont-sub">{{ klantPlaats(order) }} &middot; <span class="tnum">{{ order?.id }}</span></p>
        </section>
        <section v-if="order?.verwacht_gereed_datum" class="od-stap" role="status">
          <div class="od-stap-feit">
            <div class="od-stap-label">Opleveren vóór</div>
            <div class="od-stap-datum"><span class="tnum">{{ order.verwacht_gereed_datum }}</span></div>
          </div>
          <div class="od-stap-actie">
            <div class="od-stap-tekst">Succes met spuiten! Klaar? Meld de order dan gereed met een foto van het resultaat.</div>
          </div>
        </section>
        <section v-if="order && !order.beforeFotoGemaakt" class="ont-stap card">
          <span class="ont-stap-icoon" aria-hidden="true"><i class="ti ti-camera" /></span>
          <span class="ont-stap-tekst">
            <span class="ont-stap-titel">Foto's van de binnenkomst</span>
            <span class="ont-stap-uitleg">Dat helpt bij schadevragen.</span>
          </span>
          <PButton label="Foto's maken" icon="ti ti-camera" class="ont-stap-knop"
                   @click="router.push('/order/' + route.params.id + '/foto/before')" />
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
import { useOrders, klantPlaats, regelNaam, regelMaat, GLANSGRAAD_LABELS, KLEUR_METHODE_LABELS, type Dienst, type KleurMethode } from '@/composables/useOrders'
import { dienstImage } from '@/lib/dienstImage'
import { useMuis } from '@/composables/useMuis'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus, updateKleur, markBeforeFoto } = useOrders()
const order  = computed(() => getOrder(route.params.id as string))
const done   = ref(false)
const { heeftMuis } = useMuis()

// Foto's bij start — inline vastleggen (geen navigatie weg, controle-voortgang blijft).
// Alleen tonen als er bij de ontvangst nog geen foto's zijn gemaakt.
const cameraInput = ref<HTMLInputElement | null>(null)
const startZonderFoto = ref(!order.value?.beforeFotoGemaakt)
const fotos = ref<number[]>([])
const nextFotoId = ref(0)
function maakFoto() { cameraInput.value?.click() }
function onFoto() {
  if (cameraInput.value?.files?.length) {
    fotos.value.push(nextFotoId.value++)
    markBeforeFoto(route.params.id as string)
    cameraInput.value.value = ''
  }
}
function verwijderFoto(i: number) {
  fotos.value.splice(i, 1)
}

// ── Kleur per dienst — getypte invoer (code, merk, mengverhouding of staal) ──
const kleurMethodes: { id: KleurMethode; label: string; icon: string }[] = [
  { id: 'ral_ncs',        label: 'RAL / NCS',          icon: 'ti ti-palette' },
  { id: 'ander_merk',     label: 'Ander merk',         icon: 'ti ti-tag' },
  { id: 'mengverhouding', label: 'Mengverhouding',     icon: 'ti ti-adjustments-horizontal' },
  { id: 'kleurvoorbeeld', label: 'Volgens kleurstaal', icon: 'ti ti-photo' },
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


// ── Aantallen ────────────────────────────────────────────────────────────
const matenBevestigd = ref(false)
const totalStuks = computed(() =>
  order.value?.diensten.reduce((sum, d) => sum + d.panelen.reduce((s, p) => s + p.aantal, 0), 0) ?? 0
)

// ── Validatie ────────────────────────────────────────────────────────
const hasUnchecked = computed(() => !kleurStapOk.value || !matenBevestigd.value)

// ── Stijlen ──────────────────────────────────────────────────────────
const cardDoneStyle = { background: 'var(--p-green-50)', borderColor: 'var(--p-green-300)' }
const stepDotDone   = {
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:'26px', height:'26px', borderRadius:'50%', flexShrink:'0',
  fontSize:'12px', fontWeight:'700', background:'var(--primary)', color:'var(--p-surface-0)'
}
const stepDotPending = {
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:'26px', height:'26px', borderRadius:'50%', flexShrink:'0',
  fontSize:'12px', fontWeight:'700', background:'var(--p-surface-100)', color:'var(--p-surface-400)', border:'2px solid var(--border)'
}


function startProductie() {
  const id = route.params.id as string
  updateStatus(id, 'in_productie')   // opleverdatum is al bij ontvangst gezet
  done.value = true
}
</script>
