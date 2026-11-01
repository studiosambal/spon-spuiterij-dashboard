<template>
  <div id="app-shell">
    <!-- Mobiel: alleen op het dashboard (subpagina's hebben een eigen kop met
         terugknop). Vanaf tablet altijd zichtbaar als vaste navigatie. -->
    <header class="top-bar" :class="{ 'top-bar-sub': route.path !== '/' }">
      <div class="top-bar-inner">
        <!-- 'Spuiterportaal' naast het logo: dit is de eigen omgeving van de spuiter,
             niet de website. Klein en rustig, het logo blijft de hoofdzaak. -->
        <div class="top-bar-merk">
          <img :src="logoImg" alt="SpuitwerkOnline" class="top-bar-logo"
               @click="router.push('/')" />
          <span class="top-bar-portaal">Spuiterportaal</span>
        </div>
        <button class="top-bar-user" aria-label="Naar je profiel" @click="router.push('/profiel')">
          <span class="user-meta">
            <span class="user-name">{{ spuiter.naam }}</span>
            <span class="user-company">{{ spuiter.bedrijf }}</span>
          </span>
          <PAvatar :label="spuiter.initials" shape="circle" size="normal"
                   style="background:var(--p-primary-700);color:#fff;font-weight:700;font-size:14px;width:44px;height:44px;flex-shrink:0" />
        </button>
      </div>
    </header>
    <div class="app-body">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import logoImg from '@/images/logo-spuitwerkonline.svg'

const router = useRouter()
const route = useRoute()
const { spuiter } = useAuth()
</script>
