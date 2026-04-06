<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/useOrdersStore'

const router = useRouter()
const ordersStore = useOrdersStore()

const orders = computed(() => ordersStore.orders)

// Metrics
const totalBilled = computed(() => orders.value.reduce((s, o) => s + o.total, 0))
const totalCollected = computed(() => orders.value.reduce((s, o) => s + o.totalPaid, 0))
const totalPending = computed(() => totalBilled.value - totalCollected.value)
const activeOrders = computed(() => orders.value.filter(o => o.status !== 'dispatched').length)

// Indicador de prioridad (semáforo)
function priorityLabel(order) {
  const pct = order.total > 0 ? (order.totalPaid / order.total) * 100 : 0
  if (pct >= 100) return { label: 'Listo para despacho', cls: 'priority-green' }
  if (pct >= 30) return { label: 'En proceso', cls: 'priority-yellow' }
  return { label: 'Anticipo insuficiente', cls: 'priority-red' }
}

function paymentPct(order) {
  if (!order.total) return 0
  return Math.min(100, Math.round((order.totalPaid / order.total) * 100))
}

// Add payment modal
const showPayModal = ref(false)
const selectedOrder = ref(null)
const payForm = ref({ amount: '', date: '', method: 'paypal', note: '' })
const payFormError = ref('')

function openPayModal(order) {
  selectedOrder.value = order
  const remaining = Math.max(0, order.total - order.totalPaid || 0)
  payForm.value = { 
    amount: remaining.toFixed(2), 
    date: new Date().toISOString().split('T')[0], 
    method: 'paypal', 
    note: '' 
  }
  payFormError.value = ''
  showPayModal.value = true
}

const orderToDelete = ref(null)

function confirmDelete(orderId) {
  orderToDelete.value = orderId
}

function processDelete() {
  if (orderToDelete.value) {
    ordersStore.deleteOrder(orderToDelete.value)
    orderToDelete.value = null
  }
}

function confirmPayment() {
  const amt = parseFloat(payForm.value.amount)
  if (!amt || amt <= 0) { payFormError.value = 'Ingresa un monto válido.'; return }
  ordersStore.addPayment(selectedOrder.value.id, {
    amount: amt,
    date: payForm.value.date,
    method: payForm.value.method,
    note: payForm.value.note,
  })
  showPayModal.value = false
}

const statusLabel = { pending: 'Pendiente', partial: 'Parcial', paid: 'Pagado', dispatched: 'Despachado' }
const statusCls = { pending: 'badge-pending', partial: 'badge-partial', paid: 'badge-paid', dispatched: 'badge-dispatched' }
</script>

<template>
  <div class="ap-view">
    <div class="ap-header">
      <div>
        <h1 class="ap-title">Panel de Pagos</h1>
        <p class="ap-subtitle">Control de ventas y pagos fraccionados</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary-small" @click="router.push('/admin/factura/0')">
          Ver Factura Demo
        </button>
      </div>
    </div>

    <!-- Métricas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon" style="background: rgba(25,118,210,0.1); color: #1976d2;">$</div>
        <div class="metric-body">
          <span class="metric-label">Total Facturado</span>
          <strong class="metric-val">${{ totalBilled.toFixed(2) }}</strong>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon" style="background: rgba(56,142,60,0.1); color: #388e3c;">✓</div>
        <div class="metric-body">
          <span class="metric-label">Total Cobrado</span>
          <strong class="metric-val" style="color:#388e3c;">${{ totalCollected.toFixed(2) }}</strong>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon" style="background: rgba(245,124,0,0.1); color: #f57c00;">⏳</div>
        <div class="metric-body">
          <span class="metric-label">Saldo Pendiente</span>
          <strong class="metric-val" style="color:#e65100;">${{ totalPending.toFixed(2) }}</strong>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon" style="background: rgba(103,58,183,0.1); color: #7b1fa2;">📦</div>
        <div class="metric-body">
          <span class="metric-label">Ventas Activas</span>
          <strong class="metric-val">{{ activeOrders }}</strong>
        </div>
      </div>
    </div>

    <!-- Lista de órdenes -->
    <div class="orders-panel">
      <h2 class="panel-title">Órdenes Registradas</h2>

      <div v-if="orders.length === 0" class="empty-orders">
        <p>No hay órdenes registradas aún. Las órdenes aparecen aquí cuando los usuarios realizan compras.</p>
      </div>

      <div v-else class="orders-table-wrapper">
        <table class="orders-table">
          <thead>
            <tr>
              <th>ID Orden</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Pagado</th>
              <th>Avance</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td><span class="order-id-mono">{{ order.id }}</span></td>
              <td>
                <div class="client-cell">
                  <strong>{{ order.clientInfo?.name || 'Anónimo' }}</strong>
                  <small>{{ order.clientInfo?.email }}</small>
                </div>
              </td>
              <td><span class="date-text">{{ new Date(order.date).toLocaleDateString('es-VE') }}</span></td>
              <td>
                <div class="payment-cell">
                  <strong class="text-success">${{ Number(order.totalPaid).toFixed(2) }}</strong>
                  <span class="of-total">de ${{ Number(order.total).toFixed(2) }}</span>
                </div>
              </td>
              <td>
                <div class="progress-wrap">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: paymentPct(order) + '%', background: paymentPct(order) >= 100 ? '#4caf50' : paymentPct(order) >= 30 ? '#ff9800' : '#e53935' }"/>
                  </div>
                  <span class="pct-label">{{ paymentPct(order) }}%</span>
                </div>
              </td>
              <td>
                <span class="priority-chip" :class="priorityLabel(order).cls">{{ priorityLabel(order).label }}</span>
              </td>
              <td>
                <span class="status-chip" :class="statusCls[order.status]">{{ statusLabel[order.status] }}</span>
              </td>
              <td>
                <div class="action-btns">
                  <button class="action-btn-sm" @click="router.push('/admin/pagos/' + order.id)" title="Ver detalle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <!-- Manual add-payment button removed by client request -> auto-distribution in place -->
                  <button class="action-btn-sm invoice-btn" @click="router.push('/admin/factura/' + order.id)" title="Ver factura">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </button>
                  <button class="action-btn-sm delete-btn" @click="confirmDelete(order.id)" title="Eliminar orden">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Agregar Abono -->
    <div class="modal-overlay" v-if="showPayModal" @click.self="showPayModal = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Registrar Abono</h3>
          <button class="modal-close" @click="showPayModal = false">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">Orden <strong>{{ selectedOrder?.id }}</strong> — Cliente: <strong>{{ selectedOrder?.clientInfo?.name }}</strong></p>
          <p class="payment-status-line">
            Pagado: <strong>${{ selectedOrder?.totalPaid?.toFixed(2) }}</strong> de <strong>${{ selectedOrder?.total?.toFixed(2) }}</strong>
          </p>
          <div class="pay-form">
            <div class="form-group">
              <label>Monto del Abono ($)</label>
              <input type="number" step="0.01" min="0" v-model="payForm.amount" placeholder="Ej. 25.00" />
            </div>
            <div class="form-group">
              <label>Fecha del Pago</label>
              <input type="date" v-model="payForm.date" />
            </div>
            <div class="form-group">
              <label>Método</label>
              <select v-model="payForm.method">
                <option value="paypal">PayPal</option>
                <option value="pagomovil">Pago Móvil</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Nota (opcional)</label>
              <input type="text" v-model="payForm.note" placeholder="Referencia, observación..." />
            </div>
          </div>
          <p v-if="payFormError" class="form-error">{{ payFormError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary-sm" @click="showPayModal = false">Cancelar</button>
          <button class="btn-primary-sm" @click="confirmPayment">Registrar Abono</button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Eliminación -->
    <div class="modal-overlay" v-if="orderToDelete !== null" @click.self="orderToDelete = null">
      <div class="modal-box delete-modal">
        <div class="modal-body text-center">
          <div class="delete-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </div>
          <h3 class="delete-title">¿Eliminar Orden?</h3>
          <p class="delete-msg">Esta acción removerá esta orden del sistema y no podrá deshacerse. ¿Deseas continuar?</p>
        </div>
        <div class="modal-footer delete-footer">
          <button class="btn-secondary-sm" @click="orderToDelete = null">Cancelar</button>
          <button class="btn-danger-sm" @click="processDelete">Sí, Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ap-view { padding: 2.5rem; min-height: 100vh; }
.ap-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
.ap-title { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.25rem; }
.ap-subtitle { color: var(--color-text-secondary); margin: 0; font-size: 0.9rem; }

.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
@media (max-width: 900px) { .metrics-grid { grid-template-columns: 1fr 1fr; } }
.metric-card { background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.1); border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
.metric-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 900; flex-shrink: 0; }
.metric-label { font-size: 0.78rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 0.2rem; }
.metric-val { font-size: 1.4rem; font-weight: 800; }

.orders-panel { background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.1); border-radius: 20px; padding: 1.5rem; }
.panel-title { font-size: 1.15rem; font-weight: 800; margin: 0 0 1.25rem; }
.orders-table-wrapper { overflow-x: auto; }
.orders-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.orders-table th { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary); padding: 0.75rem 0.75rem; background: rgba(128,128,128,0.04); text-align: left; white-space: nowrap; }
.orders-table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid rgba(128,128,128,0.07); vertical-align: middle; }
.orders-table tbody tr:hover { background: rgba(128,128,128,0.02); }

.order-id-mono { font-family: monospace; font-size: 0.78rem; font-weight: 700; color: var(--color-primary); }
.client-cell { display: flex; flex-direction: column; gap: 0.1rem; }
.client-cell strong { font-size: 0.88rem; }
.client-cell small { color: var(--color-text-secondary); font-size: 0.75rem; }
.date-text { font-size: 0.8rem; white-space: nowrap; }

.payment-cell { display: flex; flex-direction: column; gap: 0.15rem; }
.text-success { color: #2e7d32; font-weight: 700; font-size: 0.95rem; }
.of-total { color: var(--color-text-secondary); font-size: 0.7rem; font-weight: 500; }

.progress-wrap { display: flex; align-items: center; gap: 0.4rem; min-width: 80px; }
.progress-bar { flex: 1; height: 6px; background: rgba(128,128,128,0.15); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
.pct-label { font-size: 0.72rem; font-weight: 700; white-space: nowrap; }

.priority-chip { font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 6px; white-space: nowrap; }
.priority-green { background: rgba(76,175,80,0.12); color: #2e7d32; }
.priority-yellow { background: rgba(255,152,0,0.12); color: #e65100; }
.priority-red { background: rgba(229,57,53,0.12); color: #b71c1c; }

.status-chip { font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 6px; white-space: nowrap; }
.badge-pending { background: rgba(255,152,0,0.12); color: #e65100; }
.badge-partial { background: rgba(33,150,243,0.12); color: #0d47a1; }
.badge-paid { background: rgba(76,175,80,0.12); color: #2e7d32; }
.badge-dispatched { background: rgba(103,58,183,0.12); color: #4527a0; }

.action-btns { display: flex; gap: 0.35rem; }
.action-btn-sm { width: 30px; height: 30px; border-radius: 7px; border: 1px solid rgba(128,128,128,0.15); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); transition: all 0.15s; }
.action-btn-sm:hover { border-color: var(--color-primary); color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 8%, transparent); }
.add-pay:hover { border-color: #4caf50; color: #2e7d32 !important; }
.invoice-btn:hover { border-color: #7b1fa2; color: #7b1fa2 !important; }
.delete-btn:hover { border-color: #e53935; color: #c62828 !important; background: rgba(229,57,53,0.08); }

.btn-secondary-small { background: none; border: 1px solid rgba(128,128,128,0.25); border-radius: 8px; padding: 0.6rem 1rem; font-size: 0.85rem; cursor: pointer; color: var(--color-text-secondary); }
.btn-secondary-small:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; }
.modal-box { background: var(--color-bg-card); border-radius: 20px; width: 100%; max-width: 460px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(128,128,128,0.1); }
.modal-header h3 { font-size: 1.1rem; font-weight: 800; margin: 0; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-secondary); }
.modal-body { padding: 1.25rem 1.5rem; }
.modal-subtitle { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0 0 0.25rem; }
.payment-status-line { font-size: 0.9rem; margin: 0 0 1.25rem; }
.pay-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.78rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
.form-group input, .form-group select { border: 1.5px solid rgba(128,128,128,0.2); border-radius: 10px; padding: 0.6rem 0.9rem; font-size: 0.92rem; background: var(--color-bg-page); color: var(--color-text-primary); font-family: inherit; }
.form-group input:focus, .form-group select:focus { outline: none; border-color: var(--color-primary); }
.form-error { color: #e53935; font-size: 0.82rem; margin: 0.25rem 0 0; }
.modal-footer { display: flex; gap: 0.75rem; justify-content: flex-end; padding: 1rem 1.5rem; border-top: 1px solid rgba(128,128,128,0.1); }
.btn-secondary-sm { background: none; border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; padding: 0.6rem 1rem; cursor: pointer; color: var(--color-text-secondary); font-weight: 600; }
.btn-primary-sm { background: var(--color-primary); color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.25rem; font-weight: 700; cursor: pointer; }
.btn-danger-sm { background: #e53935; color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.25rem; font-weight: 700; cursor: pointer; }
.btn-danger-sm:hover { filter: brightness(1.1); }
.empty-orders { text-align: center; padding: 2rem; color: var(--color-text-secondary); font-size: 0.9rem; }

/* Delete Modal Styles */
.delete-modal { max-width: 380px; }
.text-center { text-align: center; }
.delete-icon-wrap { background: rgba(229,57,53,0.1); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.delete-title { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.5rem; }
.delete-msg { color: var(--color-text-secondary); font-size: 0.9rem; line-height: 1.5; margin: 0; }
.delete-footer { justify-content: center; gap: 1rem; }
</style>
