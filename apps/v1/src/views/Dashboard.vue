<template>
  <main class="page-content">

    <!-- ── TE ONTVANGEN ─────────────────────────────────────── -->
    <template v-if="teOntvangenOrders.length > 0">
      <button class="section-label"
              style="display:flex;justify-content:space-between;align-items:center;width:100%;background:none;border:none;cursor:pointer;padding:4px 0"
              @click="toonTeOntvangen = !toonTeOntvangen">
        <span style="display:flex;align-items:center;gap:6px">
          <i class="pi pi-inbox" style="color:var(--primary)" />
          Te ontvangen ({{ teOntvangenOrders.length }})
        </span>
        <i :class="toonTeOntvangen ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="color:var(--muted)" />
      </button>

      <div v-if="toonTeOntvangen" v-for="order in teOntvangenOrders" :key="order.id"
           class="order-item"
           @click="router.push('/order/' + order.id)">
        <div :style="{ position:'absolute', left:0, top:0, bottom:0, width:'5px', background: kleurOnbekend(order) ? '#e2e8f0' : kleurToHex(order.kleur) }" />
        <div style="width:52px;height:52px;border-radius:10px;background:#e8edf2;border:1px solid var(--border);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <img :src="productImage(order.product)" :alt="order.product" style="width:38px;height:38px;object-fit:contain" />
        </div>
        <div class="order-item-body">
          <div class="name">{{ order.klant }}</div>
          <div class="meta">{{ order.product }}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
            <template v-if="kleurOnbekend(order)">
              <span class="meta" style="margin-top:0;font-style:italic">Kleur nog te bepalen</span>
            </template>
            <template v-else>
              <span :style="{
                display:'inline-block', width:'13px', height:'13px', borderRadius:'3px', flexShrink:0,
                background: kleurToHex(order.kleur), border:'1px solid rgba(0,0,0,0.12)'
              }" />
              <span class="meta" style="margin-top:0">{{ order.kleur }}</span>
            </template>
          </div>
          <div v-if="order.verwacht_levering"
               style="margin-top:5px;display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--primary)">
            <i class="pi pi-calendar" style="font-size:12px" />
            Verwacht {{ order.verwacht_levering }}
          </div>
          <div v-else style="margin-top:5px;font-size:13px;color:var(--muted);font-style:italic">
            Datum nog onbekend
          </div>
        </div>
        <i class="pi pi-chevron-right order-item-arrow" />
      </div>
    </template>

    <!-- ── ACTIEVE ORDERS ───────────────────────────────────── -->
    <div class="section-label" style="margin-top:4px">Actieve orders ({{ actieveOrders.length }})</div>

    <div v-if="actieveOrders.length === 0" class="card" style="text-align:center;color:var(--muted);padding:24px">
      <i class="pi pi-check-circle" style="font-size:28px;display:block;margin-bottom:8px;color:var(--primary);opacity:.5" />
      Geen actieve orders
    </div>

    <div v-for="order in actieveOrders" :key="order.id"
         class="order-item"
         @click="router.push('/order/' + order.id)">
      <div :style="{ position:'absolute', left:0, top:0, bottom:0, width:'5px', background: kleurToHex(order.kleur) }" />
      <div style="width:52px;height:52px;border-radius:10px;background:#e8edf2;border:1px solid var(--border);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <img :src="productImage(order.product)" :alt="order.product" style="width:38px;height:38px;object-fit:contain" />
      </div>
      <div class="order-item-body">
        <div class="name">{{ order.klant }}</div>
        <div class="meta">{{ order.product }}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
          <span :style="{
            display:'inline-block', width:'13px', height:'13px', borderRadius:'3px', flexShrink:0,
            background: kleurToHex(order.kleur),
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.4) inset'
          }" />
          <span class="meta" style="margin-top:0">{{ order.kleur }}</span>
        </div>
        <div class="badge-wrap" style="margin-top:6px">
          <span :class="['badge', 'badge-' + order.status]">{{ STATUS_LABELS[order.status] }}</span>
        </div>
      </div>
      <i class="pi pi-chevron-right order-item-arrow" />
    </div>

    <!-- ── AFGERONDE ORDERS ─────────────────────────────────── -->
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">
      <button class="section-label"
              style="display:flex;justify-content:space-between;align-items:center;width:100%;background:none;border:none;cursor:pointer;padding:4px 0"
              @click="toonAfgerond = !toonAfgerond">
        <span>Afgerond ({{ afgerondOrders.length }})</span>
        <span style="display:flex;align-items:center;gap:6px">
          <span v-if="uitbetalingAusstehend > 0" style="color:#854d0e;font-weight:700;font-size:12px">
            {{ uitbetalingAusstehend }} wacht op uitbetaling
          </span>
          <i :class="toonAfgerond ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="color:var(--muted)" />
        </span>
      </button>

      <template v-if="toonAfgerond">
        <div v-if="afgerondOrders.length === 0" class="card" style="text-align:center;color:var(--muted);padding:20px">
          Nog geen afgeronde orders
        </div>

        <div v-for="order in afgerondOrders" :key="order.id"
             class="order-item"
             style="opacity:0.85"
             @click="router.push('/order/' + order.id)">
          <div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:#e2e8f0" />
          <div style="width:48px;height:48px;border-radius:10px;background:#e8edf2;border:1px solid var(--border);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <img :src="productImage(order.product)" :alt="order.product" style="width:34px;height:34px;object-fit:contain;opacity:.7" />
          </div>
          <div class="order-item-body">
            <div class="name">{{ order.klant }}</div>
            <div class="meta">{{ order.product }}</div>
            <div style="margin-top:5px;display:flex;flex-direction:column;gap:3px">
              <span v-if="order.uitbetaald"
                    style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;padding:2px 8px;white-space:nowrap;align-self:flex-start">
                <i class="pi pi-check" style="font-size:12px" /> Uitbetaald
              </span>
              <span v-else
                    style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#854d0e;background:#fef9c3;border:1px solid #fde68a;border-radius:4px;padding:2px 8px;white-space:nowrap;align-self:flex-start">
                <i class="pi pi-clock" style="font-size:12px" /> Wacht op uitbetaling
              </span>
              <span style="font-size:12px;color:var(--muted)">{{ order.datum }}</span>
            </div>
          </div>
          <i class="pi pi-chevron-right order-item-arrow" />
        </div>
      </template>
    </div>

  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrders, STATUS_LABELS, STATUS_ORDER } from '@/composables/useOrders'

import keukenImg        from '@/images/Keuken.svg'
import binnendeurImg    from '@/images/binnendeur.svg'
import buffetkastImg    from '@/images/buffetkast.svg'
import trapleuningImg   from '@/images/trapleuning.svg'
import radiatorImg      from '@/images/badkamerradiator.svg'
import lampImg          from '@/images/lamp.webp'

const router = useRouter()
const { orders } = useOrders()
const toonTeOntvangen = ref(true)
const toonAfgerond = ref(false)

const teOntvangenOrders = computed(() =>
  [...orders.value]
    .filter(o => o.status === 'bevestigd')
    .sort((a, b) => (a.verwacht_levering ?? '').localeCompare(b.verwacht_levering ?? ''))
)

const actieveOrders = computed(() =>
  [...orders.value]
    .filter(o => o.status !== 'afgerond' && o.status !== 'bevestigd')
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
)

const afgerondOrders = computed(() =>
  [...orders.value]
    .filter(o => o.status === 'afgerond')
    .sort((a, b) => b.id.localeCompare(a.id))  // nieuwste eerst
)

const uitbetalingAusstehend = computed(() =>
  afgerondOrders.value.filter(o => !o.uitbetaald).length
)

function productImage(product: string): string {
  const p = product.toLowerCase()
  if (p.includes('trapleuning') || p.includes('trap') || p.includes('spijl')) return trapleuningImg
  if (p.includes('buffetkast'))  return buffetkastImg
  if (p.includes('keuken') || p.includes('ladefronten')) return keukenImg
  if (p.includes('binnendeur') || p.includes('deur'))    return binnendeurImg
  if (p.includes('kast'))        return buffetkastImg
  if (p.includes('radiator'))    return radiatorImg
  if (p.includes('lamp'))        return lampImg
  return buffetkastImg
}

function kleurOnbekend(order: { kleur_methode: string }): boolean {
  return order.kleur_methode === 'later' || order.kleur_methode === 'kleurvoorbeeld'
}

function kleurToHex(k: string): string {
  const l = k.toLowerCase()
  if (l.includes('zwart') || l.includes('9005') || l.includes('piano')) return '#18181b'
  if (l.includes('gebroken wit') || l.includes('9001')) return '#f5f0e8'
  if (l.includes('wit') || l.includes('9003') || l.includes('9016')) return '#f0f0f0'
  if (l.includes('rood') || l.includes('3020')) return '#dc2626'
  if (l.includes('blauw') || l.includes('5011')) return '#1d4ed8'
  if (l.includes('saliegreen') || l.includes('salige') || l.includes('6021')) return '#7aab78'
  if (l.includes('groen')) return '#15803d'
  if (l.includes('antraciet') || l.includes('7016')) return '#374151'
  if (l.includes('grijs') || l.includes('7035')) return '#9ca3af'
  if (l.includes('taupe') || l.includes('beige')) return '#a89880'
  if (l.includes('oranje')) return '#ea580c'
  if (l.includes('petrol') || l.includes('5021')) return '#0e7490'
  if (l.includes('bn.00.86') || l.includes('sikkens')) return '#c8bfb0'
  return '#e2e8f0'
}

</script>
