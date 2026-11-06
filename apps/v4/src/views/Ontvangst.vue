<template>
  <div>
    <!-- Kruimelpad op de brede container (zoals elke pagina); de bevestiging zelf staat
         gecentreerd in een smalle kolom: het is één moment, geen werkpagina. -->
    <header class="app-header">
      <!-- Zelfde kruimelpad als de orderpagina: je weet waar je bent en komt er altijd uit -->
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: String(route.params.id), to: '/order/' + String(route.params.id) }, { label: 'Ontvangst' }]" />
    </header>

    <main v-if="order" class="page-content ont">
      <div class="ont-kolom">
      <!-- Eén titel: wat er gebeurd is. Groen = klaar, zoals overal in de app. -->
      <section class="ont-kop">
        <span class="ont-vink" aria-hidden="true"><i class="ti ti-check" /></span>
        <h1>Ontvangst bevestigd</h1>
        <p class="ont-sub">{{ klantPlaats(order) }} &middot; <span class="tnum">{{ order.id }}</span></p>
      </section>

      <!-- De opleverdatum, in hetzelfde paneel als op de orderpagina. Bewust geen uitleg
           over 'de klok die nu loopt': de spuiter helpt ons, en zo'n zin zou uitstellen
           van de ontvangst belonen. -->
      <section v-if="order.verwacht_gereed_datum" class="od-stap" role="status">
        <div class="od-stap-feit">
          <div class="od-stap-label">Opleveren vóór</div>
          <div class="od-stap-datum">
            <span class="tnum">{{ order.verwacht_gereed_datum }}</span>
          </div>
        </div>
        <div class="od-stap-actie">
          <div class="od-stap-tekst">
            Bedankt! Fijn dat alles veilig bij je is.
          </div>
        </div>
      </section>

      <!-- Wat je nu kunt doen, als rijen in één kaart: uitleg en actie horen bij elkaar.
           Foto's eerst (zo leg je vast hoe het binnenkwam); wie meteen begint, gaat
           direct door naar de controle. Eén gevulde knop: de foto's zolang die er
           nog niet zijn, daarna de controle. Ongedaan maken staat helemaal onderaan:
           bereikbaar, maar geen gelijkwaardige keuze. -->
      <section class="ont-stappen card">
        <div v-if="!order.beforeFotoGemaakt" class="ont-stap">
          <span class="ont-stap-icoon" aria-hidden="true"><i class="ti ti-camera" /></span>
          <span class="ont-stap-tekst">
            <span class="ont-stap-titel">Foto's van de binnenkomst</span>
            <span class="ont-stap-uitleg">Dat helpt bij schadevragen.</span>
          </span>
          <PButton label="Foto's maken" icon="ti ti-camera" class="ont-stap-knop"
                   @click="router.push('/order/' + order.id + '/foto/before')" />
        </div>
        <div class="ont-stap">
          <span class="ont-stap-icoon" aria-hidden="true"><i class="ti ti-printer" /></span>
          <span class="ont-stap-tekst">
            <span class="ont-stap-titel">Werkbon bij de spullen</span>
            <span class="ont-stap-uitleg">Dan weet iedereen bij welke order ze horen.</span>
          </span>
          <PButton label="Werkbon printen" icon="ti ti-printer" outlined class="ont-stap-knop"
                   @click="router.push('/order/' + order.id + '/werkbon')" />
        </div>
        <div class="ont-stap">
          <span class="ont-stap-icoon" aria-hidden="true"><i class="ti ti-circle-check" /></span>
          <span class="ont-stap-tekst">
            <span class="ont-stap-titel">Begin je er meteen aan?</span>
            <span class="ont-stap-uitleg">Loop dan eerst even kleur en maten na.</span>
          </span>
          <PButton label="Controle starten" icon="ti ti-circle-check" class="ont-stap-knop"
                   :outlined="!order.beforeFotoGemaakt"
                   @click="router.push('/order/' + order.id + '/controle')" />
        </div>
      </section>

      <section class="ont-acties">
        <PButton label="Naar overzicht" icon="ti ti-home" outlined
                 @click="router.push('/')" />
        <button class="tekst-actie ont-ongedaan" @click="ongedaanMaken">
          Toch niet ontvangen? Ongedaan maken
        </button>
      </section>
      </div>
    </main>

    <div v-else class="page-content">
      <div class="card" style="color:var(--muted);font-size:var(--text-base)">Order niet gevonden.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Kruimelpad from '@/components/Kruimelpad.vue'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrders, klantPlaats } from '@/composables/useOrders'

const router = useRouter()
const route  = useRoute()
const { getOrder, maakOntvangstOngedaan } = useOrders()

const order = computed(() => getOrder(route.params.id as string))

// Dit scherm bevestigt alleen wat al gebeurd is; de aanname wordt geregistreerd
// door de knop op de orderpagina. Openen of terugnavigeren wijzigt dus niets.
function ongedaanMaken() {
  maakOntvangstOngedaan(route.params.id as string)
  router.replace('/order/' + route.params.id)
}
</script>
