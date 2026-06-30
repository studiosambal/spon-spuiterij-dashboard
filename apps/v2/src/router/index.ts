import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import OrderDetail from '@/views/OrderDetail.vue'
import Controle from '@/views/Controle.vue'
import Meerwerk from '@/views/Meerwerk.vue'
import ProductieFoto from '@/views/ProductieFoto.vue'
import Profiel from '@/views/Profiel.vue'
import Account from '@/views/Account.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0, behavior: 'instant' }),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/order/:id', name: 'order', component: OrderDetail },
    { path: '/order/:id/controle', name: 'controle', component: Controle },
    { path: '/order/:id/meerwerk', name: 'meerwerk', component: Meerwerk },
    { path: '/order/:id/foto/:type', name: 'foto', component: ProductieFoto },
    { path: '/profiel', name: 'profiel', component: Profiel },
    { path: '/account', name: 'account', component: Account },
  ]
})

export default router
