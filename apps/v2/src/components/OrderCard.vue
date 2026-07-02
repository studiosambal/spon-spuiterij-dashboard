<template>
  <div class="ordercard" @click="router.push('/order/' + order.id)">

    <!-- Kop: ordernummer + status, klant op eigen regel -->
    <div style="padding:12px 14px 10px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-family:monospace;font-weight:700;font-size:15px;color:var(--text)">{{ order.id }}</span>
        <!-- Badge = altijd de fase van de order; de onderbalk zegt nooit hetzelfde -->
        <span :class="['badge', 'badge-' + order.status]" style="flex-shrink:0">{{ STATUS_LABELS[order.status] }}</span>
      </div>
      <div style="font-size:13px;color:#334155;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ klantPlaats(order) }}</div>
    </div>

    <div style="height:0.5px;background:var(--border)" />

    <!-- Body: één rij per dienst -->
    <div v-for="(dienst, di) in order.diensten" :key="di"
         :style="di > 0 ? { borderTop: '1px solid var(--border)' } : {}"
         style="display:flex;align-items:center;gap:12px;padding:12px 14px">
      <div class="oc-thumb">
        <img :src="dienstImage(dienst.naam)" :alt="dienst.naam" />
      </div>
      <div style="min-width:0;flex:1">
        <div class="oc-naam">{{ dienst.naam }}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:1px">{{ dienstHoeveelheid(dienst) }}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
          <span :style="{ display:'inline-block', width:'14px', height:'14px', borderRadius:'4px', flexShrink:0, border:'1px solid rgba(0,0,0,0.18)', background: kleurOnbekend(dienst) ? '#e2e8f0' : kleurToHex(dienst.kleur) }" />
          <span class="oc-kleur" :style="kleurOnbekend(dienst) ? { fontStyle:'italic' } : {}">{{ dienst.kleur }}</span>
        </div>
      </div>
    </div>

    <!-- Footer: 'wat nu' — bold werkwoord vooraan, daarna het detail; deadline rechts -->
    <div :style="footerStyle" style="display:flex;align-items:center;gap:8px;padding:9px 14px;font-size:13px;font-weight:500">
      <i :class="footer.icon" style="font-size:14px;flex-shrink:0" />
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><template v-if="footer.label"><strong style="font-weight:700">{{ footer.label }}:</strong>{{ ' ' }}</template>{{ footer.text }}</span>
      <span v-if="footer.deadline" style="display:inline-flex;align-items:center;gap:5px;flex-shrink:0;font-weight:600">
        <i class="ti ti-flag" style="font-size:13px" />{{ footer.deadline }}
      </span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { STATUS_LABELS, dienstHoeveelheid, klantPlaats, type Order, type Dienst } from '@/composables/useOrders'
import { dienstImage } from '@/lib/dienstImage'

const props = defineProps<{ order: Order }>()
const router = useRouter()

function kleurOnbekend(d: Dienst): boolean {
  return d.kleur_methode === 'later' || d.kleur_methode === 'kleurvoorbeeld'
}

// ── Status-footer: icoon + tekst + tint per status (te laat = rode variant) ──
type FooterKind = 'neutral' | 'accent' | 'warning' | 'success' | 'danger'
const FOOTER_TINT: Record<FooterKind, string> = {
  neutral: 'background:#f1f5f9;color:#475569',
  accent:  'background:var(--primary-light);color:#075985',
  warning: 'background:#fff7ed;color:#9a3412',
  success: 'background:#f0fdf4;color:#15803d',
  danger:  'background:#fef2f2;color:#b91c1c',
}

// Onderbalk = 'wat moet ik nu weten': bold werkwoord vooraan + detail. Nooit de badge herhalen.
const footer = computed<{ icon: string; label?: string; text: string; kind: FooterKind; deadline?: string }>(() => {
  const o = props.order
  if (o.te_laat) {
    return { icon: 'ti ti-alert-circle', text: o.gereed_relatief ?? 'Opleverdatum overschreden', kind: 'danger' }
  }
  switch (o.status) {
    case 'bevestigd': {
      const wie = o.aanlevering === 'klant' ? ' via de klant' : o.aanlevering === 'koerier' ? ' via koerier' : ''
      const text = o.verwacht_levering ? `${o.verwacht_levering}${wie}` : 'datum nog onbekend'
      return { icon: 'ti ti-package', label: 'Verwacht', text, kind: 'accent' }
    }
    case 'ontvangen':
      return { icon: 'ti ti-circle-check', label: 'Controleren', text: 'kleur en maten', kind: 'accent', deadline: o.verwacht_gereed_datum }
    case 'meerwerk_wacht':
      return { icon: 'ti ti-player-pause', label: 'Wachten', text: 'Nog geen akkoord klant', kind: 'warning' }
    case 'in_productie':
      return { icon: 'ti ti-calendar', label: 'Verwacht gereed', text: o.gereed_relatief ?? o.verwacht_gereed_datum ?? 'nog te plannen', kind: 'neutral' }
    case 'productie_gereed':
      return { icon: 'ti ti-ban', label: 'Niet meegeven', text: 'betaling ontbreekt', kind: 'warning' }
    case 'klaar':
      return { icon: 'ti ti-bell', label: 'Gereed', text: 'wacht op ophalen', kind: 'success' }
    case 'afgerond':
      return o.uitbetaald
        ? { icon: 'ti ti-check', label: 'Uitbetaald', text: o.datum, kind: 'success' }
        : { icon: 'ti ti-coin-euro', label: 'Wacht op', text: 'uitbetaling', kind: 'warning' }
    default:
      return { icon: 'ti ti-circle', text: STATUS_LABELS[o.status], kind: 'neutral' }
  }
})

const footerStyle = computed(() => FOOTER_TINT[footer.value.kind])

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
</script>
