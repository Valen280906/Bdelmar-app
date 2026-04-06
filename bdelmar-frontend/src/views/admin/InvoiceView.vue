<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useOrdersStore } from '@/stores/useOrdersStore'

const route = useRoute()
const ordersStore = useOrdersStore()

const orderId = route.params.saleId
const today = new Date()

const pad = (n, d = 2) => String(n).padStart(d, '0')
const emissionDate = `${pad(today.getDate())}${pad(today.getMonth()+1)}${today.getFullYear()}`
const hours = today.getHours()
const ampm = hours >= 12 ? 'p.m.' : 'a.m.'
const hours12 = hours % 12 || 12
const emissionTime = `${pad(hours12)}.${pad(today.getMinutes())}.${pad(today.getSeconds())} ${ampm}`

const idx           = ordersStore.orders.findIndex(o => o.id === orderId)
const consecutiveNo = ref(String(idx >= 0 ? idx + 1 : 1).padStart(8, '0'))
const controlNo     = ref('00-' + String(today.getFullYear()).slice(2) + '-' + (idx >= 0 ? idx + 1 : 1).toString().padStart(4, '0'))
const controlFrom   = ref('00000001')
const controlTo     = ref(String(ordersStore.orders.length).padStart(8, '0'))

// Demo data if no real order
const demoOrder = {
  id: 'DEMO-001',
  date: new Date().toISOString(),
  clientInfo: {
    name: 'Cliente Demostrativo C.A',
    email: 'cliente@ejemplo.com',
    phone: '0412-1234567',
    address: 'Av. Principal, Caracas, Venezuela',
    rif: 'J-12345678-9',
  },
  items: [
    { name: 'Pargo Rojo', category: 'Pescados', barcode: 'BDM-001', quantity: 2, unitPrice: 12.00, lineTotal: 24.00, selectedCombo: null },
    { name: 'Carite', category: 'Pescados', barcode: 'BDM-002', quantity: 1, unitPrice: 9.00, lineTotal: 9.00, selectedCombo: { name: 'Combo Familiar', unit: '10', price: '58.00' } },
  ],
  total: 33.00,
  totalPaid: 33.00,
  paymentMethod: 'pagomovil',
  shippingCost: 5.00,
}

const order = computed(() => {
  const found = ordersStore.orders.find(o => o.id === orderId)
  return found || demoOrder
})

const subtotalItems = computed(() => order.value.items.reduce((s, i) => s + i.lineTotal, 0))
const ivaRate = 0.16
const baseImponible = computed(() => subtotalItems.value / (1 + ivaRate))
const iva = computed(() => subtotalItems.value - baseImponible.value)
const totalFacturado = computed(() => order.value.total)

function printInvoice() { window.print() }

function sendEmail() {
  const subject = encodeURIComponent(`Factura ${controlNo.value} — ${BDMNombre}`)
  const body = encodeURIComponent(
    `Estimado/a ${order.value.clientInfo?.name || 'Cliente'},\n\n` +
    `Adjuntamos su factura N° ${controlNo.value} emitida el ${emissionDate} a las ${emissionTime}.\n\n` +
    `Total Facturado: $${totalFacturado.value.toFixed(2)} USD\n` +
    `Total Pagado: $${order.value.totalPaid.toFixed(2)} USD\n` +
    `Saldo Pendiente: $${(totalFacturado.value - order.value.totalPaid).toFixed(2)} USD\n\n` +
    `Para imprimir o descargar su factura, por favor use el sistema en línea.\n\n` +
    `Atentamente,\n${BDMNombre}\nTel: ${BDMTel}\n${BDMEmail}`
  )
  window.open(`mailto:${order.value.clientInfo?.email || ''}?subject=${subject}&body=${body}`)
}

const BDMRIF = 'J-000000000'
const BDMNombre = 'DISTRIBUIDORA Y COMERCIO B-DEL MAR 3011 C.A'
const BDMDireccion = 'Caracas, Venezuela'
const BDMTel = '0424-4293765 / 0412-7550945'
const BDMEmail = 'bdelmar69@gmail.com'
const BDMImprentaRIF = 'J-000000001'
const BDMImprentaNombre = 'Imprenta Digital B-DEL MAR'
const BDMNroADO = 'ADO-000001'
const BDMFechaADO = '01012025'
</script>

<template>
  <div class="invoice-wrapper">

    <!-- Floating action bar (hidden on print) -->
    <div class="action-bar no-print">
      <button class="action-btn print-btn" @click="printInvoice">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Imprimir / Descargar PDF
      </button>
      <button class="action-btn email-btn" @click="sendEmail">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Enviar por Correo
      </button>
      <router-link to="/admin/pagos" class="action-btn back-link">← Volver</router-link>
    </div>

    <!-- FACTURA -->
    <div class="invoice-doc">

      <!-- ENCABEZADO LEGAL -->
      <header class="invoice-header">
        <div class="company-side">
          <img src="@/assets/bdelmar_logo.png" alt="B DEL MAR" class="company-logo" />
          <div>
            <h1 class="company-name">{{ BDMNombre }}</h1>
            <p>RIF: <strong>{{ BDMRIF }}</strong></p>
            <p>{{ BDMDireccion }}</p>
            <p>Tel: {{ BDMTel }}</p>
            <p>Email: {{ BDMEmail }}</p>
          </div>
        </div>
        <div class="invoice-meta-side">
          <div class="invoice-title-box">
            <span class="invoice-type">FACTURA</span>
          </div>
          <table class="meta-table">
            <tr>
              <td class="meta-key">N° de Control</td>
              <td class="meta-val">{{ controlNo }}</td>
            </tr>
            <tr>
              <td class="meta-key">Rango de Control</td>
              <td class="meta-val">Desde N° {{ controlFrom }} hasta N° {{ controlTo }}</td>
            </tr>
            <tr>
              <td class="meta-key">N° Consecutivo</td>
              <td class="meta-val">{{ consecutiveNo }}</td>
            </tr>
            <tr>
              <td class="meta-key">Fecha de Emisión</td>
              <td class="meta-val">{{ emissionDate }}</td>
            </tr>
            <tr>
              <td class="meta-key">Hora de Emisión</td>
              <td class="meta-val">{{ emissionTime }}</td>
            </tr>
            <tr>
              <td class="meta-key">Tipo</td>
              <td class="meta-val">Venta</td>
            </tr>
          </table>
        </div>
      </header>

      <hr class="divider" />

      <!-- CLIENTE -->
      <section class="client-section">
        <h3 class="section-label">Datos del Comprador</h3>
        <div class="client-grid">
          <div><span class="field-label">Razón Social / Nombre:</span> <strong>{{ order.clientInfo?.name }}</strong></div>
          <div><span class="field-label">RIF / Cédula:</span> <strong>{{ order.clientInfo?.rif || 'N/A' }}</strong></div>
          <div><span class="field-label">Teléfono:</span> {{ order.clientInfo?.phone || '—' }}</div>
          <div><span class="field-label">Correo:</span> {{ order.clientInfo?.email || '—' }}</div>
          <div class="full-span"><span class="field-label">Dirección Fiscal:</span> {{ order.clientInfo?.address || 'No especificada' }}</div>
        </div>
      </section>

      <hr class="divider" />

      <!-- LÍNEAS DE DETALLE -->
      <section class="items-section">
        <h3 class="section-label">Detalle de la Factura</h3>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Descripción</th>
              <th>Código / SKU</th>
              <th>Precio Unit.</th>
              <th>Combo Aplicado</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.items" :key="item.name">
              <td class="text-center">{{ item.quantity }}</td>
              <td><strong>{{ item.name }}</strong><br/><small>{{ item.category }}</small></td>
              <td class="text-mono">{{ item.barcode || '—' }}</td>
              <td class="text-right">${{ Number(item.unitPrice).toFixed(2) }}</td>
              <td>
                <span v-if="item.selectedCombo" class="combo-label">{{ item.selectedCombo.name }} ({{ item.selectedCombo.unit }} uds/${{ item.selectedCombo.price }})</span>
                <span v-else>—</span>
              </td>
              <td class="text-right"><strong>${{ Number(item.lineTotal).toFixed(2) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- TOTALES IVA -->
      <section class="totals-section">
        <div class="spacer" />
        <div class="totals-box">
          <div class="total-row">
            <span>Base Imponible</span>
            <span>${{ baseImponible.toFixed(2) }}</span>
          </div>
          <div class="total-row">
            <span>Alícuota IVA (16%)</span>
            <span>${{ iva.toFixed(2) }}</span>
          </div>
          <div class="total-row" v-if="order.shippingCost > 0">
            <span>Costo de Envío</span>
            <span>${{ Number(order.shippingCost).toFixed(2) }}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total a Pagar</span>
            <strong>${{ totalFacturado.toFixed(2) }}</strong>
          </div>
          <div class="total-row">
            <span>Total Pagado</span>
            <span class="paid-color">${{ Number(order.totalPaid).toFixed(2) }}</span>
          </div>
          <div class="total-row" v-if="totalFacturado - order.totalPaid > 0">
            <span>Saldo Pendiente</span>
            <span class="pending-color">${{ (totalFacturado - order.totalPaid).toFixed(2) }}</span>
          </div>
        </div>
      </section>

      <hr class="divider" />

      <!-- PIE LEGAL -->
      <footer class="invoice-footer">
        <div class="legal-note">
          <p><strong>Nota Legal:</strong> Esta factura es emitida de conformidad con la Providencia Administrativa N° 0071 del SENIAT, Artículo 7, sobre las normas generales de emisión de facturas y otros documentos.</p>
          <p>Método de Pago: <strong>{{ order.paymentMethod === 'paypal' ? 'PayPal' : 'Pago Móvil / Transferencia' }}</strong></p>
          <p v-if="order.referenceNumber">N° de Referencia: <strong>{{ order.referenceNumber }}</strong></p>
        </div>
        <div class="imprenta-box">
          <p class="imprenta-title">DATOS DE LA IMPRENTA DIGITAL</p>
          <p>Denominación: <strong>{{ BDMImprentaNombre }}</strong></p>
          <p>RIF: <strong>{{ BDMImprentaRIF }}</strong></p>
          <p>N° de Autorización (ADO): <strong>{{ BDMNroADO }}</strong></p>
          <p>Fecha Autorización: <strong>{{ BDMFechaADO }}</strong></p>
          <p>Fecha de Asignación del N° Control: <strong>{{ emissionDate }}</strong></p>
        </div>
      </footer>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.invoice-wrapper {
  font-family: 'Inter', sans-serif;
  background: var(--color-bg-page);
  min-height: 100vh;
  padding: 0;
}

/* ACTION BAR */
.action-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: var(--color-bg-card);
  border-bottom: 1px solid rgba(128,128,128,0.1);
  position: sticky;
  top: 0;
  z-index: 50;
  flex-wrap: wrap;
}
.action-btn {
  display: flex; align-items: center; gap: 0.4rem;
  border: 1px solid rgba(128,128,128,0.2); border-radius: 8px;
  padding: 0.55rem 1rem; cursor: pointer;
  font-size: 0.85rem; font-weight: 600;
  background: none; color: var(--color-text-secondary); transition: all 0.2s;
  text-decoration: none;
}
.action-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.print-btn:hover { border-color: #1565c0; color: #1565c0; }
.pdf-btn:hover { border-color: #c62828; color: #c62828; }
.email-btn:hover { border-color: #2e7d32; color: #2e7d32; }
.back-link { color: var(--color-text-secondary); }

/* INVOICE DOC */
.invoice-doc {
  max-width: 820px;
  margin: 2rem auto;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2.5rem;
  color: #111;
  box-shadow: 0 4px 30px rgba(0,0,0,0.08);
}

/* HEADER */
.invoice-header {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.company-side { display: flex; gap: 1rem; align-items: flex-start; }
.company-logo { width: 60px; height: 60px; object-fit: contain; }
.company-name { font-size: 0.9rem; font-weight: 800; margin: 0 0 0.25rem; text-transform: uppercase; }
.company-side p { margin: 0.1rem 0; font-size: 0.78rem; }

.invoice-meta-side { text-align: right; }
.invoice-title-box { margin-bottom: 0.75rem; }
.invoice-type {
  font-size: 1.75rem; font-weight: 900; color: #000;
  border: 3px solid #000; padding: 0.15rem 1rem; letter-spacing: 0.1em;
}
.meta-table { margin-left: auto; border-collapse: collapse; font-size: 0.8rem; }
.meta-key { color: #555; padding: 0.2rem 1rem 0.2rem 0; font-weight: 500; }
.meta-val { font-weight: 700; text-align: right; }

.divider { border: none; border-top: 1px solid #ccc; margin: 1rem 0; }

/* CLIENT */
.section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin: 0 0 0.6rem; border-left: 3px solid #000; padding-left: 0.5rem; }
.client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem 2rem; font-size: 0.82rem; }
.full-span { grid-column: 1 / -1; }
.field-label { color: #555; font-size: 0.75rem; }
.client-section { margin-bottom: 1rem; }

/* ITEMS TABLE */
.items-section { margin-bottom: 1rem; }
.invoice-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.invoice-table th {
  background: #f0f0f0; font-weight: 700; font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.04em;
  padding: 0.5rem 0.6rem; border: 1px solid #ddd; text-align: left;
}
.invoice-table td { padding: 0.5rem 0.6rem; border: 1px solid #eee; vertical-align: top; }
.invoice-table td strong { display: block; }
.invoice-table td small { color: #666; }
.invoice-table tbody tr:nth-child(even) { background: #fafafa; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-mono { font-family: monospace; font-size: 0.75rem; }
.combo-label { font-size: 0.72rem; color: #7b5800; }

/* TOTALS */
.totals-section { display: flex; margin-bottom: 1rem; }
.spacer { flex: 1; }
.totals-box { width: 300px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
.total-row { display: flex; justify-content: space-between; padding: 0.45rem 0.75rem; font-size: 0.85rem; border-bottom: 1px solid #eee; }
.total-row:last-child { border-bottom: none; }
.grand-total { background: #f0f0f0; font-weight: 700; font-size: 0.95rem; }
.paid-color { color: #2e7d32; font-weight: 700; }
.pending-color { color: #c62828; font-weight: 700; }

/* FOOTER */
.invoice-footer { display: flex; justify-content: space-between; gap: 2rem; flex-wrap: wrap; font-size: 0.75rem; color: #555; margin-top: 0.5rem; }
.legal-note { flex: 1; max-width: 420px; }
.legal-note p { margin: 0.2rem 0; line-height: 1.5; }
.imprenta-box { border: 1px solid #ccc; border-radius: 4px; padding: 0.75rem 1rem; font-size: 0.72rem; }
.imprenta-title { font-weight: 800; text-transform: uppercase; font-size: 0.68rem; letter-spacing: 0.06em; margin: 0 0 0.4rem; }
.imprenta-box p { margin: 0.15rem 0; }

/* PRINT STYLES */
@media print {
  .no-print { display: none !important; }
  .invoice-wrapper { background: white; }
  .invoice-doc { box-shadow: none; border: none; margin: 0; border-radius: 0; }
  body { margin: 0; }
}
</style>
