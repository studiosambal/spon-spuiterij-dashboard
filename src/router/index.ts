import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import OrderDetail from '@/views/OrderDetail.vue'
import BevestigOntvangst from '@/views/BevestigOntvangst.vue'
import Meerwerk from '@/views/Meerwerk.vue'
import ProductieFoto from '@/views/ProductieFoto.vue'
import Profiel from '@/views/Profiel.vue'
import Account from '@/views/Account.vue'

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0, behavior: 'instant' }),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/order/:id', name: 'order', component: OrderDetail },
    { path: '/order/:id/bevestig', name: 'bevestig', component: BevestigOntvangst },
    { path: '/order/:id/meerwerk', name: 'meerwerk', component: Meerwerk },
    { path: '/order/:id/foto/:type', name: 'foto', component: ProductieFoto },
    { path: '/profiel', name: 'profiel', component: Profiel },
    { path: '/account', name: 'account', component: Account },
  ]
})

export default router
