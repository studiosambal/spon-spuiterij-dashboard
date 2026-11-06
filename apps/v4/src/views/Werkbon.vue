<template>
  <!-- Werkbon: één A4 bij de stapel, zodat de spullen altijd bij hun order horen.
       Op het scherm een voorbeeld op telefoonbreedte; bij printen alleen het papier. -->
  <div v-if="order" class="pagina-smal">
    <header class="app-header geen-print">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: order.id, to: '/order/' + order.id }, { label: 'Werkbon' }]" />
      <h1>Werkbon</h1>
      <div class="subtitle">Print hem en leg hem bij de spullen.</div>
    </header>

    <main class="page-content ruimte-balk">
      <article class="wb" aria-label="Voorbeeld van de werkbon">
        <header class="wb-kop">
          <div>
            <div class="wb-label">Order</div>
            <div class="wb-id tnum">{{ order.id }}</div>
            <div class="wb-klant">{{ klantPlaats(order) }}</div>
          </div>
          <img :src="logoImg" alt="SpuitwerkOnline" class="wb-logo" />
        </header>

        <dl class="wb-feiten">
          <div v-if="order.ontvangstdatum"><dt>Ontvangen</dt><dd>{{ order.ontvangstdatum }}</dd></div>
          <div v-if="order.verwacht_gereed_datum"><dt>Opleveren vóór</dt><dd>{{ order.verwacht_gereed_datum }}</dd></div>
          <div><dt>Afhalen</dt><dd>{{ order.ophaalmethode === 'klant' ? 'Door de klant' : 'Door een vervoerder' }}</dd></div>
        </dl>

        <section v-for="(d, di) in order.diensten" :key="di" class="wb-dienst">
          <div class="wb-dienst-naam">{{ d.naam }}</div>
          <div class="wb-label wb-kleur-label">Kleur</div>
          <div class="wb-kleur">{{ d.kleur }}</div>
          <div v-if="d.kleur_recept" class="wb-recept">Mengrecept: {{ d.kleur_recept }}</div>
          <dl class="wb-specs">
            <div v-for="e in dienstEigenschappen(d)" :key="e.label"><dt>{{ e.label }}</dt><dd>{{ e.waarde }}</dd></div>
          </dl>
          <div v-if="d.handgreepgaten" class="wb-let-op">Handgreepgaten herstellen op {{ d.handgreepgaten_aantal }} panelen</div>
          <table class="wb-tabel">
            <thead><tr><th>Onderdeel</th><th>Aantal</th></tr></thead>
            <tbody>
              <tr v-for="(p, i) in d.panelen" :key="i">
                <td>{{ regelNaam(p, i) }}<span v-if="regelMaat(p)" class="wb-maat tnum"> {{ regelMaat(p) }}</span></td>
                <td class="tnum">{{ p.aantal }}</td>
              </tr>
            </tbody>
            <tfoot><tr><td>Totaal</td><td class="tnum">{{ dienstHoeveelheid(d) }}</td></tr></tfoot>
          </table>
        </section>

        <div v-if="order.opmerkingen" class="wb-opmerking">
          <strong>Opmerking van de klant</strong>
          {{ order.opmerkingen }}
        </div>

        <footer class="wb-voet">Spuiterportaal &middot; {{ order.id }}</footer>
      </article>
    </main>

    <div class="bottom-bar geen-print">
      <PButton label="Printen" icon="ti ti-printer" @click="printen" />
    </div>
  </div>

  <div v-else class="page-content">
    <div class="card" style="color:var(--muted);font-size:var(--text-base)">Order niet gevonden.</div>
  </div>
</template>

<script setup lang="ts">
import Kruimelpad from '@/components/Kruimelpad.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOrders, klantPlaats, dienstEigenschappen, dienstHoeveelheid, regelNaam, regelMaat } from '@/composables/useOrders'
import logoImg from '@/images/logo-spuitwerkonline.svg'

const route = useRoute()
const { getOrder } = useOrders()
const order = computed(() => getOrder(route.params.id as string))

function printen() { window.print() }
</script>

<style scoped>
/* Het papier: wit vlak met rand, zelfde verhouding als de rest van het portaal */
.wb {
  background: #fff; color: #1f2733;
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 20px 16px;
  display: flex; flex-direction: column; gap: 16px;
}
.wb-kop { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 14px; border-bottom: 2px solid #1f2733; }
.wb-label { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
/* Het ordernummer is waar het om draait: groot genoeg om van een meter afstand te lezen */
.wb-id { font-size: 1.75rem; white-space: nowrap; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; }
.wb-klant { font-size: var(--text-base); margin-top: 4px; }
.wb-logo { height: 24px; flex-shrink: 0; margin-top: 2px; }

.wb-feiten { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin: 0; }
.wb-feiten dt, .wb-specs dt { font-size: var(--text-xs); color: var(--muted); }
.wb-feiten dd, .wb-specs dd { margin: 0; font-weight: 600; font-size: var(--text-sm); }

.wb-dienst { border-top: 1px solid var(--hairline); padding-top: 14px; }
.wb-dienst-naam { font-weight: 700; font-size: var(--text-base); }
.wb-kleur-label { margin-top: 10px; }
.wb-kleur { font-size: 1.25rem; font-weight: 700; }
.wb-recept { font-size: var(--text-sm); color: var(--muted); margin-top: 2px; }
.wb-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; margin: 12px 0 0; }
.wb-let-op { margin-top: 10px; font-size: var(--text-sm); font-weight: 600; padding: 8px 10px; border: 1.5px solid #1f2733; border-radius: 6px; }

.wb-tabel { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: var(--text-sm); }
.wb-tabel th { text-align: left; font-size: var(--text-xs); font-weight: 600; color: var(--muted); padding: 6px 0; border-bottom: 1px solid var(--border); }
.wb-tabel td { padding: 7px 0; border-bottom: 1px solid var(--hairline); }
.wb-tabel th:last-child, .wb-tabel td:last-child { text-align: right; }
.wb-tabel tfoot td { font-weight: 700; border-bottom: 0; }
.wb-maat { color: var(--muted); margin-left: 6px; white-space: nowrap; }
.wb-tabel td:last-child { white-space: nowrap; padding-left: 12px; }

.wb-opmerking { font-size: var(--text-sm); padding: 10px 12px; background: var(--p-surface-50); border-radius: 6px; }
.wb-opmerking strong { display: block; margin-bottom: 2px; }
.wb-voet { font-size: var(--text-xs); color: var(--muted); text-align: center; }

@media (min-width: 600px) {
  .wb { padding: 32px; }
  .wb-id { font-size: 2.75rem; }
  .wb-logo { height: 32px; }
}

/* Printen: alleen het papier, zonder kaartrand, zwart op wit */
@media print {
  .wb { border: 0; padding: 0; gap: 18px; }
  .wb-id { font-size: 48pt; }
  .wb-kleur { font-size: 18pt; }
  .wb-opmerking { background: none; border: 1px solid #1f2733; }
}
</style>

<style>
/* Buiten de werkbon mag er bij printen niks mee: top-bar, kruimelpad, knoppen */
@media print {
  .top-bar, .geen-print { display: none !important; }
  body, .page-content { background: #fff !important; padding: 0 !important; }
  @page { size: A4; margin: 15mm; }
}
</style>
