<template>
  <div class="pagina-smal">
    <header class="app-header">
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: 'Profiel', to: '/profiel' }, { label: 'Accountgegevens' }]" />
      <h1>Accountgegevens</h1>
      <div class="subtitle">{{ spuiter.bedrijf }}</div>
    </header>

    <main class="page-content">

      <!-- Persoonlijk -->
      <div class="section-label">Persoonlijk</div>
      <div class="card" style="padding:0;overflow:hidden">
        <div class="detail-row" style="padding:14px 16px;flex-direction:row;align-items:center;justify-content:space-between">
          <div>
            <div class="label">Naam</div>
            <div class="value">{{ spuiter.naam }}</div>
          </div>
        </div>
        <div class="detail-row" style="padding:14px 16px;flex-direction:row;align-items:center;justify-content:space-between">
          <div>
            <div class="label">Bedrijf</div>
            <div class="value">{{ spuiter.bedrijf }}</div>
          </div>
        </div>
        <div class="detail-row" style="padding:14px 16px;flex-direction:row;align-items:center;justify-content:space-between">
          <div>
            <div class="label">E-mailadres</div>
            <div class="value">thomas@spuiterijvandijk.nl</div>
          </div>
        </div>
      </div>

      <!-- Beveiliging -->
      <div class="section-label">Beveiliging</div>
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:14px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between"
             @click="toonWachtwoord = !toonWachtwoord">
          <div>
            <div class="label">Wachtwoord</div>
            <div class="value" style="font-size:var(--text-base)">••••••••</div>
          </div>
          <span style="display:flex;align-items:center;gap:6px;color:var(--primary);font-weight:600;font-size:var(--text-base)">
            Wijzigen
            <i :class="toonWachtwoord ? 'ti ti-chevron-up' : 'ti ti-chevron-down'" style="font-size:12px" />
          </span>
        </div>

        <div v-if="toonWachtwoord" style="padding:0 16px 16px;display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--hairline)">
          <div class="field" style="margin-top:14px">
            <div class="field-label">Huidig wachtwoord</div>
            <PInputText type="password" v-model="huidig" placeholder="••••••••"
                        style="width:100%;font-size:var(--text-base);height:48px" />
          </div>
          <div class="field">
            <div class="field-label">Nieuw wachtwoord</div>
            <PInputText type="password" v-model="nieuw" placeholder="Minimaal 8 tekens"
                        style="width:100%;font-size:var(--text-base);height:48px" />
          </div>
          <div class="field">
            <div class="field-label">Herhaal nieuw wachtwoord</div>
            <PInputText type="password" v-model="herhaal" placeholder="Zelfde wachtwoord"
                        style="width:100%;font-size:var(--text-base);height:48px" />
          </div>
          <PButton label="Wachtwoord opslaan" icon="ti ti-check"
                   :disabled="!huidig || !nieuw || nieuw !== herhaal" />
          <div v-if="nieuw && herhaal && nieuw !== herhaal"
               style="font-size:var(--text-sm);color:var(--p-red-600);text-align:center">
            Wachtwoorden komen niet overeen
          </div>
        </div>
      </div>

      <!-- Uitloggen -->
      <div class="section-label">Sessie</div>
      <div class="card" style="padding:0;overflow:hidden">
        <button style="width:100%;display:flex;align-items:center;gap:12px;padding:16px;background:none;border:none;cursor:pointer;font-family:inherit;text-align:left;color:var(--p-red-600)"
                @click="uitloggen">
          <i class="ti ti-logout" style="font-size:18px" />
          <span style="font-size:var(--text-base);font-weight:600">Uitloggen</span>
        </button>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import Kruimelpad from '@/components/Kruimelpad.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { spuiter } = useAuth()

const toonWachtwoord = ref(false)
const huidig  = ref('')
const nieuw   = ref('')
const herhaal = ref('')

function uitloggen() {
  router.push('/')
}
</script>
