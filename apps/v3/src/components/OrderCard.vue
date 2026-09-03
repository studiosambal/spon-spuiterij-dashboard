<template>
  <div class="ordercard" :style="kaartStyle" role="button" tabindex="0"
       @click="router.push('/order/' + order.id)"
       @keydown.enter.prevent="router.push('/order/' + order.id)"
       @keydown.space.prevent="router.push('/order/' + order.id)">

    <!-- Kop: één rustige regel. Het ordernummer is een referentie, geen titel —
         de dienstnaam hieronder is de enige vette kop van de kaart. -->
    <div style="display:flex;align-items:baseline;gap:10px;padding:14px 16px 0;font-size:var(--text-sm);color:var(--muted)">
      <span style="font-family:monospace;font-weight:600;flex-shrink:0">{{ order.id }}</span>
      <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ klantPlaats(order) }}</span>
    </div>

    <!-- Body: één rij per dienst -->
    <div v-for="(dienst, di) in order.diensten" :key="di"
         :style="di > 0 ? { marginTop: '2px' } : {}"
         style="display:flex;align-items:center;gap:14px;padding:12px 16px">
      <div class="oc-thumb">
        <img :src="dienstImage(dienst.naam)" :alt="dienst.naam" />
      </div>
      <div style="min-width:0;flex:1">
        <div class="oc-naam">{{ dienst.naam }}</div>
        <!-- Geen kleurstaal op het dashboard: de hex is een benadering op trefwoord,
             en meestal is de kleur nog niet bepaald. De exacte kleur staat op het
             detail- en controlescherm, waar de spuiter hem nodig heeft. -->
        <div style="font-size:var(--text-sm);color:var(--muted);margin-top:2px">
          {{ dienstHoeveelheid(dienst) }}<template v-if="!kleurOnbekend(dienst)"> &middot; {{ dienst.kleur }}</template>
        </div>
      </div>
    </div>

    <!-- Footer: 'wat nu' — bold werkwoord vooraan, daarna het detail; deadline rechts -->
    <div :style="footerStyle" style="display:flex;align-items:center;gap:8px;padding:11px 16px;font-size:var(--text-sm);font-weight:500">
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
// Kleur is signaal, geen decoratie: grijs voor routine-informatie, en alleen een tint
// bij een noemenswaardigheid rond deadline of afgeven — rood (te laat), oranje (niet
// meegeven), groen (mag mee). De waarden komen uit main.css en dus uit hetzelfde
// PrimeVue-palet als Tag en Message.
const FOOTER_TINT: Record<FooterKind, string> = {
  neutral: 'background:var(--card);color:var(--signaal-rust-fg)',
  accent:  'background:var(--card);color:var(--signaal-rust-fg)',   // routine-info: grijs, geen kleur
  warning: 'background:var(--signaal-wacht-bg);color:var(--signaal-wacht-fg)',
  success: 'background:var(--signaal-klaar-bg);color:var(--signaal-klaar-fg)',
  danger:  'background:var(--signaal-telaat-bg);color:var(--signaal-telaat-fg)',
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
      return { icon: 'ti ti-send', label: 'Gemeld', text: 'SpuitwerkOnline regelt akkoord met de klant', kind: 'neutral' }
    case 'in_productie':
      return { icon: 'ti ti-calendar', label: 'Verwacht gereed', text: o.gereed_relatief ?? o.verwacht_gereed_datum ?? 'nog te plannen', kind: 'neutral' }
    case 'productie_gereed':
      return { icon: 'ti ti-ban', label: 'Niet meegeven', text: 'betaling ontbreekt', kind: 'warning' }
    case 'klaar':
      return { icon: 'ti ti-circle-check', label: 'Betaald', text: 'mag mee met de klant', kind: 'success' }
    case 'afgerond':
      return o.uitbetaald
        ? { icon: 'ti ti-check', label: 'Uitbetaald', text: o.datum, kind: 'neutral' }
        : { icon: 'ti ti-coin-euro', label: 'Wacht op', text: 'uitbetaling', kind: 'neutral' }
    default:
      return { icon: 'ti ti-circle', text: STATUS_LABELS[o.status], kind: 'neutral' }
  }
})

// Bij een signaal kleurt de héle kaartrand mee: de begrenzing van de kaart is
// precies de plek om te zeggen dat er iets mis is. Routine-kaarten blijven grijs.
const SIGNAAL_RAND: Partial<Record<FooterKind, string>> = {
  warning: 'var(--p-orange-300)',
  success: 'var(--p-green-300)',
  danger:  'var(--p-red-300)',
}

const kaartStyle = computed(() => {
  const rand = SIGNAAL_RAND[footer.value.kind]
  return rand ? { borderColor: rand } : {}
})

const footerStyle = computed(() => {
  // De scheidingslijn volgt de kaartrand, anders loopt er een grijze lijn door een
  // gekleurde kaart. Volledig in de binding, niet half in het style-attribuut:
  // een border-shorthand daar overschrijft de kleur uit deze computed.
  const rand = SIGNAAL_RAND[footer.value.kind] ?? 'var(--hairline)'
  return `${FOOTER_TINT[footer.value.kind]};border-top:1px solid ${rand}`
})

</script>
