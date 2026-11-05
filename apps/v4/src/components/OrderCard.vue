<template>
  <!-- Eén order = één regel in de fase-lijst. Mobiel een compact blok (wat → klant →
       wat nu), vanaf desktop één rij met vaste kolommen, zodat je de lijst van boven
       naar beneden scant zoals een werkbon. Zelfde markup; alleen het grid verandert. -->
  <article class="order-rij" role="button" tabindex="0"
           :aria-label="`${order.id}, ${order.klant}: ${footer.label ? footer.label + ' ' : ''}${footer.text}`"
           @click="router.push('/order/' + order.id)"
           @keydown.enter.prevent="router.push('/order/' + order.id)"
           @keydown.space.prevent="router.push('/order/' + order.id)">

    <!-- Wat: één regel per dienst. De dienstnaam is de enige vette kop. -->
    <div class="or-wat">
      <div v-for="(dienst, di) in order.diensten" :key="di" class="or-dienst">
        <div class="oc-thumb">
          <img :src="dienstImage(dienst.naam)" :alt="dienst.naam" />
        </div>
        <div style="min-width:0">
          <div class="oc-naam">{{ dienst.naam }}</div>
          <!-- Geen kleurstaal op het dashboard: de hex is een benadering op trefwoord,
               en meestal is de kleur nog niet bepaald. De exacte kleur staat op het
               detail- en controlescherm, waar de spuiter hem nodig heeft. -->
          <div class="or-meta">
            {{ dienstHoeveelheid(dienst) }}<template v-if="!kleurOnbekend(dienst)"> &middot; <span class="or-kleur">{{ dienst.kleur }}</span></template>
          </div>
        </div>
      </div>
    </div>

    <!-- Voor wie: klant en plaats, ordernummer als referentie eronder -->
    <div class="or-klant">
      <span class="or-klantnaam">{{ klantPlaats(order) }}</span>
      <span class="or-id">{{ order.id }}</span>
    </div>

    <!-- Wat nu: één label met werkwoord vooraan. Kleur alleen bij een signaal. -->
    <div class="or-status">
      <span class="or-chip" :class="'is-' + footer.kind">
        <i :class="footer.icon" aria-hidden="true" />
        <span class="or-chip-tekst"><template v-if="footer.label"><strong>{{ footer.label }}:</strong>{{ ' ' }}</template>{{ footer.text }}</span>
        <span v-if="footer.deadline" class="or-deadline">
          <i class="ti ti-flag" aria-hidden="true" />{{ footer.deadline }}
        </span>
      </span>
    </div>

    <i class="ti ti-chevron-right or-pijl" aria-hidden="true" />
  </article>
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

// ── 'Wat nu'-label: icoon + tekst + soort ──
// Kleur is signaal, geen decoratie. Grijs = je wacht op een ander (klant, koerier,
// kantoor). Sky = jij bent aan zet — dezelfde kleur als de knoppen, dus 'sky' leest
// overal als 'hier moet ik iets doen'. Daarnaast alleen een tint bij een
// noemenswaardigheid rond deadline of afgeven — rood (te laat), oranje (niet
// meegeven), groen (mag mee). De kleuren staan in main.css (.or-chip.is-*) en komen
// uit hetzelfde PrimeVue-palet als Tag en Message.
type FooterKind = 'neutral' | 'accent' | 'warning' | 'success' | 'danger'

// Nooit de fase herhalen (die staat in de groepskop): bold werkwoord vooraan + detail.
const footer = computed<{ icon: string; label?: string; text: string; kind: FooterKind; deadline?: string }>(() => {
  const o = props.order
  if (o.te_laat) {
    return { icon: 'ti ti-alert-circle', label: 'Te laat', text: o.gereed_relatief?.replace(/ te laat$/, '') ?? 'opleverdatum overschreden', kind: 'danger' }
  }
  switch (o.status) {
    case 'bevestigd': {
      const wie = o.aanlevering === 'klant' ? ' via de klant' : o.aanlevering === 'koerier' ? ' via koerier' : ''
      const text = o.verwacht_levering ? `${o.verwacht_levering}${wie}` : 'datum nog onbekend'
      return { icon: 'ti ti-package', label: 'Verwacht', text, kind: 'neutral' }
    }
    case 'ontvangen':
      return { icon: 'ti ti-circle-check', label: 'Controleren', text: 'kleur en maten', kind: 'accent', deadline: o.verwacht_gereed_datum }
    case 'meerwerk_wacht':
      return { icon: 'ti ti-send', label: 'Gemeld', text: 'kantoor regelt akkoord met de klant', kind: 'neutral' }
    case 'in_productie':
      return { icon: 'ti ti-calendar', label: 'Gereed', text: (o.gereed_relatief ?? o.verwacht_gereed_datum ?? 'nog te plannen') + (o.betaald ? ', klant heeft betaald' : ''), kind: 'neutral' }
    case 'productie_gereed':
      return { icon: 'ti ti-ban', label: 'Nog niet meegeven', text: 'betaling ontbreekt', kind: 'danger' }
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
</script>
