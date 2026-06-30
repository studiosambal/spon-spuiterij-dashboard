<template>
  <div>
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="pi pi-arrow-left" /> Terug
      </button>
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
            <div class="label" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)">Wachtwoord</div>
            <div class="value" style="font-size:15px">••••••••</div>
          </div>
          <span style="display:flex;align-items:center;gap:6px;color:var(--primary);font-weight:600;font-size:14px">
            Wijzigen
            <i class="pi" :class="toonWachtwoord ? 'pi-chevron-up' : 'pi-chevron-down'" style="font-size:12px" />
          </span>
        </div>

        <div v-if="toonWachtwoord" style="padding:0 16px 16px;display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--border)">
          <div class="field" style="margin-top:14px">
            <div class="field-label">Huidig wachtwoord</div>
            <PInputText type="password" v-model="huidig" placeholder="••••••••"
                        style="width:100%;font-size:15px;height:48px" />
          </div>
          <div class="field">
            <div class="field-label">Nieuw wachtwoord</div>
            <PInputText type="password" v-model="nieuw" placeholder="Minimaal 8 tekens"
                        style="width:100%;font-size:15px;height:48px" />
          </div>
          <div class="field">
            <div class="field-label">Herhaal nieuw wachtwoord</div>
            <PInputText type="password" v-model="herhaal" placeholder="Minimaal 8 tekens"
                        style="width:100%;font-size:15px;height:48px" />
          </div>
          <PButton label="Wachtwoord opslaan" icon="pi pi-check"
                   :disabled="!huidig || !nieuw || nieuw !== herhaal" />
          <div v-if="nieuw && herhaal && nieuw !== herhaal"
               style="font-size:13px;color:#dc2626;text-align:center">
            Wachtwoorden komen niet overeen
          </div>
        </div>
      </div>

      <!-- Uitloggen -->
      <div class="section-label">Sessie</div>
      <div class="card" style="padding:0;overflow:hidden">
        <button style="width:100%;display:flex;align-items:center;gap:12px;padding:16px;background:none;border:none;cursor:pointer;font-family:inherit;text-align:left;color:#dc2626"
                @click="uitloggen">
          <i class="pi pi-sign-out" style="font-size:18px" />
          <span style="font-size:15px;font-weight:600">Uitloggen</span>
        </button>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
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
