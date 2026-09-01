<template>
  <div id="app-shell">
    <header v-if="route.path === '/'" class="top-bar">
      <img :src="logoImg" alt="SpuitwerkOnline"
           style="height:36px;cursor:pointer;display:block"
           @click="router.push('/')" />
      <PAvatar :label="spuiter.initials" shape="circle" size="normal"
               style="background:var(--primary);color:#fff;font-weight:700;font-size:14px;width:44px;height:44px;cursor:pointer;flex-shrink:0"
               @click="router.push('/profiel')" />
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
