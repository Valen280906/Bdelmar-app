<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrdersStore } from '@/stores/useOrdersStore'

const router = useRouter()
const route = useRoute()
const ordersStore = useOrdersStore()
const orderId = route.params.clientId

const order = computed(() => ordersStore.orders.find(o => o.id === orderId))

function payPct(o) {
  if (!o || !o.total) return 0
  return Math.min(100, Math.round((o.totalPaid / o.total) * 100))
}

function markDispatched() {
  ordersStore.updateStatus(orderId, 'dispatched')
}

const methodLabel = { paypal: 'PayPal', pagomovil: 'Pago Móvil', efectivo: 'Efectivo' }
</script>

<template>
  <div class="detail-view">
    <div class="detail-header">
      <button class="back-btn" @click="router.push('/admin/pagos')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Panel de Pagos
      </button>
      <div class="header-right" v-if="order">
        <button class="btn-invoice" @click="router.push('/admin/factura/' + orderId)">
          📄 Ver Factura
        </button>
        <button class="btn-dispatch" v-if="order.status === 'paid'" @click="markDispatched">
          ✅ Marcar como Despachado
        </button>
      </div>
    </div>

    <div v-if="!order" class="not-found">
      <p>Orden no encontrada. <router-link to="/admin/pagos">Volver al panel</router-link></p>
    </div>

    <div v-else class="detail-layout">
      <!-- Info del cliente -->
      <div class="client-card">
        <div class="client-avatar">{{ order.clientInfo?.name?.charAt(0) || '?' }}</div>
        <div class="client-details">
          <h2 class="client-name">{{ order.clientInfo?.name || 'Anónimo' }}</h2>
          <p>📧 {{ order.clientInfo?.email || '—' }}</p>
          <p>📱 {{ order.clientInfo?.phone || '—' }}</p>
          <p v-if="order.clientInfo?.address">📍 {{ order.clientInfo.address }}</p>
          <p v-if="order.clientInfo?.rif">🪪 {{ order.clientInfo.rif }}</p>
          <div class="pay-method-tag">
            Método:
            <strong>{{ order.paymentMethod === 'paypal' ? '💳 PayPal' : '📱 Pago Móvil' }}</strong>
            <template v-if="order.paymentMethod === 'paypal' && order.clientInfo?.paypalEmail">
              — {{ order.clientInfo.paypalEmail }}
            </template>
            <template v-if="order.paymentMethod === 'pagomovil' && order.clientInfo?.pagoMovilPhone">
              — {{ order.clientInfo.pagoMovilPhone }} ({{ order.clientInfo.pagoMovilBank }})
            </template>
          </div>
        </div>
        <div class="order-meta">
          <span class="order-id-tag"># {{ order.id }}</span>
          <span class="order-date">{{ new Date(order.date).toLocaleDateString('es-VE', { year:'numeric', month:'long', day:'numeric' }) }}</span>
        </div>
      </div>

      <div class="detail-main">
        <!-- Progreso de Pago -->
        <div class="payment-progress-card">
          <div class="prog-header">
            <h3>Progreso del Pago</h3>
            <span class="prog-pct" :style="{ color: payPct(order) >= 100 ? '#2e7d32' : payPct(order) >= 30 ? '#e65100' : '#c62828' }">
              {{ payPct(order) }}%
            </span>
          </div>
          <div class="big-progress-bar">
            <div class="big-progress-fill"
              :style="{
                width: payPct(order) + '%',
                background: payPct(order) >= 100 ? 'linear-gradient(90deg, #43a047, #2e7d32)' : payPct(order) >= 30 ? 'linear-gradient(90deg, #ff9800, #f57c00)' : 'linear-gradient(90deg, #ef5350, #c62828)'
              }"
            />
          </div>
          <div class="prog-amounts">
            <span>Pagado: <strong>${{ order.totalPaid.toFixed(2) }}</strong></span>
            <span>Total: <strong>${{ order.total.toFixed(2) }}</strong></span>
            <span>Saldo: <strong style="color:#c62828">${{ (order.total - order.totalPaid).toFixed(2) }}</strong></span>
          </div>

          <div class="fully-paid-alert" v-if="payPct(order) >= 100">
            🎉 Esta orden está completamente pagada. Puede ser despachada.
          </div>
        </div>

        <!-- Items de la orden -->
        <div class="order-items-card">
          <h3>Productos de la Orden</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Precio Unit.</th>
                <th>Combo</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.name">
                <td><strong>{{ item.name }}</strong><small>{{ item.category }}</small></td>
                <td><span class="sku-mono">{{ item.barcode || '—' }}</span></td>
                <td>{{ item.quantity }}</td>
                <td>${{ Number(item.unitPrice).toFixed(2) }}</td>
                <td>
                  <span v-if="item.selectedCombo" class="combo-tag">{{ item.selectedCombo.name }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td><strong>${{ Number(item.lineTotal).toFixed(2) }}</strong></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="text-align:right; font-weight:700;">Total:</td>
                <td><strong style="font-size:1.05rem;">${{ order.total.toFixed(2) }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Historial de pagos -->
        <div class="payments-history-card">
          <h3>Historial de Abonos</h3>
          <div v-if="order.payments.length === 0" class="no-payments">Aún no se han registrado pagos para esta orden.</div>
          <div v-else class="timeline">
            <div class="timeline-item" v-for="(pay, idx) in order.payments" :key="idx">
              <div class="timeline-dot" :style="{ background: pay.method === 'paypal' ? '#003087' : pay.method === 'pagomovil' ? '#e59524' : '#4caf50' }"/>
              <div class="timeline-content">
                <div class="timeline-header">
                  <strong class="pay-amount">${{ Number(pay.amount).toFixed(2) }}</strong>
                  <span class="pay-method-chip">{{ methodLabel[pay.method] || pay.method }}</span>
                  <span class="pay-date">{{ new Date(pay.date).toLocaleDateString('es-VE') }}</span>
                </div>
                <p v-if="pay.note" class="pay-note">{{ pay.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-view { padding: 2rem; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem; }
.back-btn { display: flex; align-items: center; gap: 0.4rem; background: none; border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; color: var(--color-text-secondary); font-size: 0.9rem; }
.back-btn:hover { color: var(--color-primary); border-color: var(--color-primary); }
.header-right { display: flex; gap: 0.75rem; }
.btn-invoice { background: rgba(103,58,183,0.1); color: #7b1fa2; border: 1px solid rgba(103,58,183,0.25); border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-size: 0.88rem; font-weight: 600; }
.btn-dispatch { background: rgba(56,142,60,0.1); color: #2e7d32; border: 1px solid rgba(56,142,60,0.25); border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-size: 0.88rem; font-weight: 600; }

.not-found { text-align: center; padding: 3rem; color: var(--color-text-secondary); }

/* LAYOUT */
.detail-layout { display: flex; flex-direction: column; gap: 1.25rem; }

.client-card {
  background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.1);
  border-radius: 16px; padding: 1.5rem;
  display: flex; align-items: flex-start; gap: 1.25rem; flex-wrap: wrap;
}
.client-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent, #e59524));
  color: #fff; font-size: 1.5rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.client-details { flex: 1; }
.client-name { font-size: 1.25rem; font-weight: 800; margin: 0 0 0.5rem; }
.client-details p { margin: 0.15rem 0; font-size: 0.88rem; color: var(--color-text-secondary); }
.pay-method-tag { margin-top: 0.5rem; font-size: 0.85rem; color: var(--color-text-secondary); }
.order-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
.order-id-tag { font-family: monospace; font-weight: 700; color: var(--color-primary); font-size: 0.9rem; }
.order-date { font-size: 0.78rem; color: var(--color-text-secondary); }

.detail-main { display: flex; flex-direction: column; gap: 1.25rem; }

/* Progress */
.payment-progress-card { background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.1); border-radius: 16px; padding: 1.5rem; }
.payment-progress-card h3, .order-items-card h3, .payments-history-card h3 { font-size: 1.05rem; font-weight: 800; margin: 0 0 1rem; }
.prog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.prog-pct { font-size: 1.5rem; font-weight: 800; }
.big-progress-bar { height: 14px; background: rgba(128,128,128,0.12); border-radius: 8px; overflow: hidden; margin-bottom: 0.75rem; }
.big-progress-fill { height: 100%; border-radius: 8px; transition: width 0.5s; }
.prog-amounts { display: flex; gap: 1.5rem; font-size: 0.88rem; color: var(--color-text-secondary); margin-bottom: 1rem; flex-wrap: wrap; }
.fully-paid-alert { background: rgba(76,175,80,0.1); border: 1px solid rgba(76,175,80,0.3); border-radius: 10px; padding: 0.75rem 1rem; color: #2e7d32; font-weight: 600; font-size: 0.9rem; margin-bottom: 1rem; }

/* Items table */
.order-items-card { background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.1); border-radius: 16px; padding: 1.5rem; overflow-x: auto; }
.items-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.items-table th { font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; padding: 0.5rem 0.75rem; text-align: left; }
.items-table td { padding: 0.75rem 0.75rem; border-bottom: 1px solid rgba(128,128,128,0.07); vertical-align: middle; }
.items-table td strong { display: block; }
.items-table td small { color: var(--color-text-secondary); font-size: 0.75rem; }
.items-table tfoot td { padding-top: 0.75rem; font-size: 0.9rem; border-bottom: none; }
.sku-mono { font-family: monospace; font-size: 0.78rem; color: var(--color-text-secondary); }
.combo-tag { background: rgba(229,149,36,0.12); color: #b36800; font-size: 0.72rem; font-weight: 600; border-radius: 5px; padding: 0.15rem 0.4rem; }
.text-muted { color: var(--color-text-secondary); }

/* Timeline */
.payments-history-card { background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.1); border-radius: 16px; padding: 1.5rem; }
.no-payments { color: var(--color-text-secondary); font-size: 0.9rem; }
.timeline { display: flex; flex-direction: column; gap: 0; }
.timeline-item { display: flex; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(128,128,128,0.07); align-items: flex-start; }
.timeline-item:last-child { border-bottom: none; }
.timeline-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 0.3rem; }
.timeline-content { flex: 1; }
.timeline-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.pay-amount { font-size: 1rem; font-weight: 800; }
.pay-method-chip { font-size: 0.72rem; font-weight: 700; background: rgba(128,128,128,0.1); border-radius: 5px; padding: 0.15rem 0.4rem; }
.pay-date { font-size: 0.78rem; color: var(--color-text-secondary); margin-left: auto; }
.pay-note { font-size: 0.8rem; color: var(--color-text-secondary); margin: 0.2rem 0 0; }
</style>
