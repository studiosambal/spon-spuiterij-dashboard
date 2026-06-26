<template>
  <div v-if="!done">
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="pi pi-arrow-left" /> Terug
      </button>
      <h1>Productinname</h1>
      <div class="subtitle">{{ order?.klant }} &middot; <span style="font-family:monospace">{{ order?.id }}</span></div>
    </header>

    <main class="page-content">

      <!-- Opmerking klant -->
      <PMessage v-if="order?.opmerkingen" severity="warn" :closable="false"
                style="border-radius:var(--radius);font-size:14px">
        <strong style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Opmerking klant</strong>
        {{ order.opmerkingen }}
      </PMessage>

      <!-- Stap 1: Kleur -->
      <div class="card" :style="checked[0] ? cardDoneStyle : {}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span :style="checked[0] ? stepDotDone : stepDotPending">1</span>
            <span style="font-weight:700;font-size:15px">Kleur bevestigen</span>
          </div>
          <PCheckbox v-if="!kleurOnbekend || kleurOpgeslagen"
                     :modelValue="checked[0]" :binary="true"
                     @change="checked[0] = !checked[0]" />
        </div>

        <!-- Kleur weergave + aanpassen optie — verbergen als kleur onbekend én nog niet opgeslagen -->
        <template v-if="!kleurBewerken && (!kleurOnbekend || kleurOpgeslagen)">
          <div style="display:flex;align-items:stretch;border-radius:8px;overflow:hidden;border:1px solid var(--border)">
            <div :style="{ width:'56px', flexShrink:0, background:kleurToHex(huidigKleur), boxShadow:'inset -1px 0 0 rgba(0,0,0,0.08)' }" />
            <div style="padding:10px 12px;flex:1">
              <div style="font-size:16px;font-weight:700;color:var(--text)">{{ huidigKleur }}</div>
              <div style="font-size:13px;color:var(--muted);margin-top:2px">
                {{ GLANSGRAAD_LABELS[order?.glansgraad ?? 'zijde'] }} &middot; {{ order?.oppervlaktestructuur === 'glad' ? 'Glad' : 'Huidige structuur' }} &middot; {{ order?.zijdig }}
              </div>
            </div>
          </div>
          <button style="background:none;border:none;color:var(--primary);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;padding:8px 0 0;display:flex;align-items:center;gap:4px"
                  @click="openKleurEdit">
            <i class="pi pi-pencil" style="font-size:11px" />
            {{ kleurOnbekend ? 'Kleurcode invoeren' : 'Kleur aanpassen' }}
          </button>
        </template>

        <!-- Kleur bewerken -->
        <template v-else>
          <div class="field">
            <div class="field-label">{{ kleurOnbekend ? 'Kleurcode' : 'Kleur aanpassen' }}</div>
            <PInputText v-model="kleurInput" placeholder="bijv. RAL 9005 of NCS S 9000-N"
                        style="width:100%;font-size:15px;height:48px" />
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <PButton label="Opslaan" icon="pi pi-check" :disabled="!kleurInput.trim()"
                     style="flex:1" @click="slaKleurOp" />
            <PButton v-if="!kleurOnbekend" label="Annuleren" outlined
                     style="flex:1" @click="kleurBewerken = false" />
          </div>
        </template>
      </div>

      <!-- Stap 2: Maten controleren -->
      <div class="card" :style="checked[1] ? cardDoneStyle : {}" style="padding:0;overflow:hidden">
        <div style="padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <span :style="checked[1] ? stepDotDone : stepDotPending">2</span>
            <span style="font-weight:700;font-size:15px">Maten controleren</span>
          </div>
          <PCheckbox :modelValue="checked[1]" :binary="true" @change="checked[1] = !checked[1]" />
        </div>
        <div style="padding:0 16px 8px;font-size:13px;color:var(--muted)">
          {{ totalPanelen }} stuks verwacht, tel na en vergelijk de afmetingen
        </div>
        <table class="panel-table">
          <thead>
            <tr>
              <th>Omschrijving</th>
              <th v-if="heeftAfmetingen">B x H (cm)</th>
              <th>Aantal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in order?.panelen" :key="i">
              <td>{{ p.omschrijving || `Paneel ${i + 1}` }}</td>
              <td v-if="heeftAfmetingen">{{ p.breedte > 0 ? `${p.breedte}x${p.hoogte}` : '' }}</td>
              <td><strong>{{ p.aantal }}</strong></td>
            </tr>
          </tbody>
        </table>
        <div style="height:14px" />
      </div>

      <!-- Stap 3: Verwachte opleverduur -->
      <div class="card" :style="werkdagen ? cardDoneStyle : {}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span :style="werkdagen ? stepDotDone : stepDotPending">3</span>
          <span style="font-weight:700;font-size:15px">Verwachte opleverduur</span>
        </div>
        <div style="font-size:14px;color:var(--muted);margin-bottom:14px;line-height:1.4">
          Klant ontvangt automatisch een bericht met de verwachte opleverduur.
        </div>
        <div style="display:flex;gap:10px">
          <button v-for="d in [5, 10, 15, 20]" :key="d"
                  :style="werkdagen === d
                    ? { flex:1, background:'var(--primary)', color:'#fff', border:'2px solid var(--primary)', borderRadius:'8px', padding:'12px 8px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }
                    : { flex:1, background:'#f1f5f9', color:'var(--text)', border:'2px solid var(--border)', borderRadius:'8px', padding:'12px 8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }"
                  @click="werkdagen = d">
            {{ d }}d
          </button>
        </div>
        <div v-if="werkdagen" style="text-align:center;font-size:13px;color:var(--muted);margin-top:8px">
          Klant ontvangt: "Klaar over {{ werkdagen }} werkdagen"
        </div>
      </div>

      <!-- Status -->
      <PMessage v-if="hasUnchecked" severity="warn" :closable="false"
                style="border-radius:var(--radius);font-size:14px">
        <strong style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Niet alles afgevinkt</strong>
        Meld afwijkingen via "Meerwerk & Schades" voordat je de inname bevestigt.
      </PMessage>
      <PMessage v-else severity="success" :closable="false"
                style="border-radius:var(--radius);font-size:14px">
        <strong style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Alles gecontroleerd</strong>
        Bevestig de inname om door te gaan naar de foto.
      </PMessage>

      <PButton label="Inname bevestigen" icon="pi pi-check-circle"
               :disabled="hasUnchecked" @click="bevestig" />
      <PButton label="Meerwerk & Schades" icon="pi pi-exclamation-triangle"
               class="btn-danger" outlined
               @click="router.push('/order/' + route.params.id + '/meerwerk')" />

    </main>
  </div>

  <div v-else style="min-height:100dvh;display:flex;flex-direction:column">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center;gap:0">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:20px">
        <i class="pi pi-check" style="font-size:36px;color:#fff" />
      </div>
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:8px">Inname bevestigd</div>
      <div style="font-size:15px;color:var(--muted);line-height:1.5;max-width:280px">
        {{ order?.klant }} &middot; <span style="font-family:monospace">{{ order?.id }}</span>
      </div>
      <div style="width:100%;margin-top:32px;padding:16px;background:#fff;border-radius:var(--radius);border:1px solid var(--border);text-align:left">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:4px">Volgende stap</div>
        <div style="font-size:15px;color:var(--text)">Maak een foto van het product in de huidige staat. Dit is je bewijs van de begintoestand.</div>
      </div>
    </div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
      <PButton label="Foto bij ontvangst maken" icon="pi pi-camera"
               @click="router.push('/order/' + route.params.id + '/foto/before')" />
      <PButton label="Deze stap overslaan" icon="pi pi-forward" outlined
               @click="router.push('/')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrders, GLANSGRAAD_LABELS } from '@/composables/useOrders'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus, updateKleur, updateVerwachtGereed } = useOrders()
const order  = computed(() => getOrder(route.params.id as string))
const done   = ref(false)

// Kleur
const kleurOnbekend = computed(() =>
  order.value?.kleur_methode === 'later' || order.value?.kleur_methode === 'kleurvoorbeeld'
)
const kleurBewerken  = ref(false)
const kleurInput     = ref('')
const kleurOpgeslagen = ref(false)
const huidigKleur    = computed(() => kleurOpgeslagen.value ? kleurInput.value : (order.value?.kleur ?? ''))

function openKleurEdit() {
  kleurInput.value = order.value?.kleur ?? ''
  kleurBewerken.value = true
}

function slaKleurOp() {
  if (!kleurInput.value.trim() || !order.value) return
  updateKleur(order.value.id, kleurInput.value.trim())
  kleurOpgeslagen.value = true
  kleurBewerken.value = false
  checked.value[0] = true
}

// Panelen
const totalPanelen = computed(() =>
  order.value?.panelen.reduce((sum, p) => sum + p.aantal, 0) ?? 0
)
const heeftAfmetingen = computed(() =>
  order.value?.panelen.some(p => p.breedte > 0) ?? false
)

// Controlelijst — alleen kleur en maten
const checked = ref([false, false])
const hasUnchecked = computed(() =>
  checked.value.some(c => !c) || (kleurOnbekend.value && !kleurOpgeslagen.value)
)

// Opleverduur — vaste opties
const werkdagen = ref<number | null>(null)

// Stijlen
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

function bevestig() {
  const id = route.params.id as string
  if (werkdagen.value) updateVerwachtGereed(id, werkdagen.value)
  updateStatus(id, 'ontvangen')
  done.value = true
}
</script>
