<script setup>
import { ref, computed, reactive } from 'vue'
import { useOrdersStore } from '@/stores/useOrdersStore'

const ordersStore = useOrdersStore()

// ─── PESTAÑAS ─────────────────────────────────────────────────────────────────
const activeTab = ref('orders')   // 'orders' | 'config' | 'invoice'

// ─── FILTROS DE LA LISTA ──────────────────────────────────────────────────────
const searchQuery  = ref('')
const dateFilter   = ref('')

const filteredOrders = computed(() => {
  let list = [...ordersStore.orders]
  if (dateFilter.value) {
    list = list.filter(o => new Date(o.date).toISOString().split('T')[0] === dateFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(o =>
      (o.clientInfo?.name || '').toLowerCase().includes(q) ||
      (o.clientInfo?.email || '').toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    )
  }
  return list
})

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const CFG_EMISOR_KEY   = 'bdm_factura_emisor'
const CFG_IMPRENTA_KEY = 'bdm_factura_imprenta'

const defaultEmisor = {
  nombre: 'DISTRIBUIDORA Y COMERCIO B-DEL MAR 3011 C.A',
  rif: 'J-000000000',
  domicilio: 'Caracas, Venezuela',
  telefono: '0424-4293765',
  email: 'bdelmar69@gmail.com',
}

const defaultImprenta = {
  nombre: '',
  rif: '',
  nomenclatura: '',
  fechaProvidencia: '',
  controlDesde: '00000001',
  controlHasta: '00099999',
  tasaBCV: '',
}

const emisor   = reactive({ ...defaultEmisor,   ...(JSON.parse(localStorage.getItem(CFG_EMISOR_KEY)   || '{}')) })
const imprenta = reactive({ ...defaultImprenta, ...(JSON.parse(localStorage.getItem(CFG_IMPRENTA_KEY) || '{}')) })

const savedEmisor    = ref(false)
const savedImprenta  = ref(false)

function saveEmisor() {
  localStorage.setItem(CFG_EMISOR_KEY, JSON.stringify({ ...emisor }))
  savedEmisor.value = true
  setTimeout(() => savedEmisor.value = false, 2500)
}

function saveImprenta() {
  localStorage.setItem(CFG_IMPRENTA_KEY, JSON.stringify({ ...imprenta }))
  savedImprenta.value = true
  setTimeout(() => savedImprenta.value = false, 2500)
}

// ─── GENERACIÓN DE FACTURA ────────────────────────────────────────────────────
const selectedOrder  = ref(null)
const draftOrder     = ref(null)
const isEditingInvoice = ref(false)

// Fecha/hora al momento de generar
const now = ref(new Date())
const pad = (n, d = 2) => String(n).padStart(d, '0')

function refreshNow() { now.value = new Date() }

const emissionDate = computed(() => {
  const d = now.value
  return `${pad(d.getDate())}${pad(d.getMonth()+1)}${d.getFullYear()}`
})
const emissionDateDisplay = computed(() => {
  const d = now.value
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`
})
const emissionTime = computed(() => {
  const d = now.value
  const h = d.getHours()
  const ampm = h >= 12 ? 'p.m.' : 'a.m.'
  const h12  = h % 12 || 12
  return `${pad(h12)}.${pad(d.getMinutes())}.${pad(d.getSeconds())} ${ampm}`
})

// Número de factura consecutivo: controlDesde + índice de la orden en el store
function invoiceSequential(order) {
  const idx   = ordersStore.orders.findIndex(o => o.id === order.id)
  const start = parseInt(imprenta.controlDesde || '1', 10)
  const num   = start + (idx >= 0 ? idx : 0)
  return String(num).padStart(8, '0')
}
function controlNo(order) {
  return '00-' + invoiceSequential(order)
}

// Tasa BCV (default 1 si no está configurada)
const tasaBCV = computed(() => parseFloat(imprenta.tasaBCV) || 1)

function toBS(usd) { return (parseFloat(usd) * tasaBCV.value).toFixed(2) }

function openInvoice(order) {
  selectedOrder.value = order
  // Create a deep copy for drafting
  draftOrder.value = JSON.parse(JSON.stringify(order))
  // Initialize custom fields for the invoice
  if(!draftOrder.value.clientInfo) draftOrder.value.clientInfo = {}
  draftOrder.value.customInvoiceNo = invoiceSequential(order)
  draftOrder.value.customDate = emissionDate.value
  
  refreshNow()
  isEditingInvoice.value = true
  activeTab.value = 'invoice'
}

function confirmDraft() {
  isEditingInvoice.value = false
}

function backToOrders() {
  activeTab.value = 'orders'
  selectedOrder.value = null
  draftOrder.value = null
}

// ─── CÁLCULOS IVA ─────────────────────────────────────────────────────────────
const IVA_RATE = 0.16

const subtotalItems = computed(() => {
  if (!draftOrder.value) return 0
  return draftOrder.value.items.reduce((s, i) => s + (i.lineTotal || 0), 0)
})

const baseImponible = computed(() => subtotalItems.value / (1 + IVA_RATE))
const montoIVA      = computed(() => subtotalItems.value - baseImponible.value)
const totalOperacion = computed(() => draftOrder.value ? draftOrder.value.total : 0)
const totalPagado    = computed(() => draftOrder.value ? draftOrder.value.totalPaid : 0)
const saldoPendiente = computed(() => Math.max(0, totalOperacion.value - totalPagado.value))

// ─── ACCIONES ─────────────────────────────────────────────────────────────────
function printInvoice()  { window.print() }

function sendEmail() {
  const o   = draftOrder.value
  if (!o) return
  const sub = encodeURIComponent(`Factura ${controlNo(o)} — ${emisor.nombre}`)
  const bod = encodeURIComponent(
    `Estimado/a ${o.clientInfo?.name || 'Cliente'},\n\n` +
    `Le enviamos su factura N° ${controlNo(o)} emitida el ${emissionDateDisplay.value}.\n\n` +
    `Total Operación: $${totalOperacion.value.toFixed(2)} USD\n` +
    `Total Pagado:    $${totalPagado.value.toFixed(2)} USD\n` +
    `Saldo Pendiente: $${saldoPendiente.value.toFixed(2)} USD\n\n` +
    `Atentamente,\n${emisor.nombre}\nTel: ${emisor.telefono}\n${emisor.email}`
  )
  window.open(`mailto:${o.clientInfo?.email || ''}?subject=${sub}&body=${bod}`)
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const statusLabel = { pending: 'Pendiente', partial: 'Parcial', paid: 'Pagado', dispatched: 'Despachado' }
const statusCls   = { pending: 'badge-pending', partial: 'badge-partial', paid: 'badge-paid', dispatched: 'badge-dispatched' }
function paymentPct(o) {
  if (!o.total) return 0
  return Math.min(100, Math.round((o.totalPaid / o.total) * 100))
}
</script>

<template>
  <div class="facturas-view">

    <!-- ENCABEZADO  -->
    <div class="fv-header">
      <div>
        <h1 class="fv-title">Módulo de Facturación</h1>
        <p class="fv-subtitle">Gestión de facturas legales — Providencia Administrativa N° 0071 SENIAT</p>
      </div>
    </div>

    <!-- PESTAÑAS  -->
    <div class="fv-tabs">
      <button class="fv-tab" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'; selectedOrder = null">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Pedidos
      </button>
<!-- Pestaña config eliminada porque ahora sale de paso previo -->
      <button class="fv-tab" :class="{ active: activeTab === 'invoice' }" @click="activeTab = 'invoice'" :disabled="!selectedOrder">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Vista de Factura {{ selectedOrder ? `(${selectedOrder.id})` : '' }}
      </button>
    </div>

    <!-- ══════════════ PESTAÑA: PEDIDOS ══════════════ -->
    <section v-if="activeTab === 'orders'" class="fv-section">
      <div class="orders-toolbar">
        <div class="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" placeholder="Buscar por cliente, email o ID..." class="search-input" />
        </div>
        <div class="date-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <input type="date" v-model="dateFilter" class="date-input" />
          <button v-if="dateFilter" class="clear-date" @click="dateFilter = ''">×</button>
        </div>
      </div>

      <div v-if="filteredOrders.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No hay pedidos que coincidan con el filtro.</p>
      </div>

      <div v-else class="orders-table-wrap">
        <table class="orders-table">
          <thead>
            <tr>
              <th>ID Orden</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total USD</th>
              <th>Avance</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td><span class="order-id">{{ order.id }}</span></td>
              <td>
                <div class="client-cell">
                  <strong>{{ order.clientInfo?.name || 'Anónimo' }}</strong>
                  <small>{{ order.clientInfo?.email }}</small>
                </div>
              </td>
              <td><span class="date-txt">{{ new Date(order.date).toLocaleDateString('es-VE') }}</span></td>
              <td>
                <div class="amt-cell">
                  <strong class="usd">${{ Number(order.total).toFixed(2) }}</strong>
                  <small v-if="tasaBCV > 1" class="bs">Bs. {{ toBS(order.total) }}</small>
                </div>
              </td>
              <td>
                <div class="prog-wrap">
                  <div class="prog-bar">
                    <div class="prog-fill" :style="{ width: paymentPct(order) + '%', background: paymentPct(order) >= 100 ? '#4caf50' : '#ff9800' }"></div>
                  </div>
                  <span class="prog-pct">{{ paymentPct(order) }}%</span>
                </div>
              </td>
              <td><span class="status-chip" :class="statusCls[order.status]">{{ statusLabel[order.status] }}</span></td>
              <td>
                <button class="btn-gen-invoice" @click="openInvoice(order)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Generar Factura
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Ocultamos la pestaña estática de configuración para no redundar, ya que ahora sale antes de facturar -->
    <!-- (La mantenemos comentada o la eliminamos lógicamente en versiones futuras si deseas solo tener el tab "Facturas") --> 
    <!-- PESTAÑA: CONFIGURACIÓN Mantenemos como fallback pero el flujo principal usa isEditingInvoice -->

    <!-- ══════════════ PESTAÑA: FACTURA ══════════════ -->
    <section v-if="activeTab === 'invoice' && draftOrder" class="fv-section invoice-section">

      <!-- MODO EDICIÓN DE BORRADOR (Configuración de Factura Mismo Formulario) -->
      <div v-if="isEditingInvoice" class="draft-editor">
        <div class="fv-header" style="margin-bottom:1.5rem;">
          <h2 style="margin:0; font-size:1.5rem; color:#003366;">Configuración de Factura</h2>
          <p style="margin:0; color:var(--color-text-secondary); font-size:0.9rem;">
            Ingresa o modifica los datos de tu empresa y la imprenta antes de generar esta factura específica.
          </p>
        </div>
        
        <div class="config-grid">
          <!-- Emisor -->
          <div class="config-card" style="border-top: 3px solid #0d7fc9;">
            <h3 style="margin-top:0; color:#003366;">Datos del Emisor</h3>
            <div class="config-form" style="grid-template-columns: 1fr;">
              <div class="form-group">
                <label>Nombre y Apellido o Razón Social</label>
                <input v-model="emisor.nombre" placeholder="B-DEL-MAR C.A" />
              </div>
              <div class="form-group">
                <label>RIF del Emisor</label>
                <input v-model="emisor.rif" placeholder="J-12345678" />
              </div>
              <div class="form-group">
                <label>Domicilio Fiscal</label>
                <input v-model="emisor.domicilio" placeholder="La Esmeralda" />
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input v-model="emisor.telefono" />
              </div>
              <div class="form-group">
                <label>Correo Electrónico</label>
                <input v-model="emisor.email" />
              </div>
            </div>
            <button class="btn-save-config" style="background:#00a65a; margin-top:1rem;" @click="saveEmisor">Guardar Datos de Empresa</button>
          </div>
          
          <!-- Imprenta -->
          <div class="config-card" style="border-top: 3px solid #0d7fc9;">
            <h3 style="margin-top:0; color:#003366;">Datos de la Imprenta</h3>
            <div class="config-form" style="grid-template-columns: 1fr;">
              <div class="form-group">
                <label>Razón Social o Nombre</label>
                <input v-model="imprenta.nombre" placeholder="Soluciones..." />
              </div>
              <div class="form-group">
                <label>RIF de la Imprenta</label>
                <input v-model="imprenta.rif" />
              </div>
              <div class="form-group">
                <label>Nomenclatura Providencia Adm.</label>
                <input v-model="imprenta.nomenclatura" placeholder="SNAT/2010/XXXX" />
              </div>
              <div class="form-group">
                <label>Fecha Providencia Adm.</label>
                <input v-model="imprenta.fechaProvidencia" placeholder="05/15/2026" />
              </div>
              <div class="form-group" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div>
                  <label>N° Control Desde</label>
                  <input v-model="imprenta.controlDesde" />
                </div>
                <div>
                  <label>N° Control Hasta</label>
                  <input v-model="imprenta.controlHasta" />
                </div>
              </div>
            </div>
            <button class="btn-save-config" style="background:#00a65a; margin-top:1rem;" @click="saveImprenta">Guardar Datos de Imprenta</button>
          </div>
        </div>

        <div style="margin-top:2.5rem; display:flex; gap:1rem; align-items:center; justify-content:center; flex-wrap:wrap;">
          <button class="btn-save-config" style="background:#0d7fc9; width:auto; padding:0.8rem 2.5rem; font-size:1.1rem;" @click="confirmDraft">
            Generar Factura Ahora
          </button>
          <button class="inv-btn" @click="backToOrders" style="padding:0.8rem 2rem; font-size:1rem;">Cancelar</button>
        </div>
      </div>

      <!-- MODO VISTA FINAL DE FACTURA -->
      <div v-else>
        <!-- Barra de acciones -->
        <div class="invoice-actions no-print">
          <button class="inv-btn print-btn" @click="printInvoice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir / Descargar PDF
          </button>
          <button class="inv-btn email-btn" @click="sendEmail">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Enviar por Correo
          </button>
          <button class="inv-btn edit-btn" @click="isEditingInvoice = true" style="margin-left:auto;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Modificar Datos
          </button>
          <button class="inv-btn back-btn" @click="backToOrders">
            ← Volver a Pedidos
          </button>
        </div>

        <!-- DOCUMENTO DE FACTURA -->
        <div class="invoice-doc">

        <!-- ENCABEZADO -->
        <header class="inv-header">
          <div class="inv-company">
            <img src="@/assets/bdelmar_logo.png" alt="Logo" class="inv-logo" />
            <div>
              <h1 class="inv-company-name">{{ emisor.nombre }}</h1>
              <p><strong>RIF:</strong> {{ emisor.rif }}</p>
              <p>{{ emisor.domicilio }}</p>
              <p>Tel: {{ emisor.telefono }} | {{ emisor.email }}</p>
            </div>
          </div>
          <div class="inv-meta">
            <div class="inv-title-box">FACTURA</div>
            <table class="inv-meta-table">
              <tr><td>N° de Factura</td><td><strong>{{ invoiceSequential(selectedOrder) }}</strong></td></tr>
              <tr><td>N° de Control</td><td><strong>00-{{ invoiceSequential(selectedOrder) }}</strong></td></tr>
              <tr><td>Rango de Control</td><td>desde N° {{ imprenta.controlDesde || '00000001' }} hasta N° {{ imprenta.controlHasta || '00099999' }}</td></tr>
              <tr><td>Fecha de Emisión</td><td><strong>{{ emissionDate }} (DDMMAAAA)</strong></td></tr>
              <tr><td>Hora de Emisión</td><td><strong>{{ emissionTime }}</strong></td></tr>
              <tr><td>Tipo</td><td>Venta</td></tr>
            </table>
          </div>
        </header>

        <hr class="inv-hr" />

        <!-- DATOS DEL ADQUIRENTE -->
        <section class="inv-client">
          <h3 class="inv-section-label">Datos del Adquirente</h3>
          <div class="inv-client-grid">
            <div><span class="lbl">Razón Social:</span> <strong>{{ draftOrder.clientInfo?.name || '—' }}</strong></div>
            <div><span class="lbl">RIF / C.I.:</span> <strong>{{ draftOrder.clientInfo?.rif || 'N/A' }}</strong></div>
            <div><span class="lbl">Teléfono:</span> {{ draftOrder.clientInfo?.phone || '—' }}</div>
            <div><span class="lbl">Correo:</span> {{ draftOrder.clientInfo?.email || '—' }}</div>
            <div class="full-col"><span class="lbl">Domicilio Fiscal:</span> {{ draftOrder.clientInfo?.address || 'No especificado' }}</div>
          </div>
        </section>

        <hr class="inv-hr" />

        <!-- TABLA DE ÍTEMS -->
        <section class="inv-items">
          <h3 class="inv-section-label">Descripción de la Operación</h3>
          <table class="inv-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción de la Operación</th>
                <th>Cant.</th>
                <th>Precio Unit. (USD)</th>
                <th v-if="tasaBCV > 1">Precio Unit. (Bs.)</th>
                <th>Total (USD)</th>
                <th v-if="tasaBCV > 1">Total (Bs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in draftOrder.items" :key="item.name">
                <td class="mono">{{ item.barcode || 'BDM-' + (item.name?.substring(0,3).toUpperCase() || '000') }}</td>
                <td>
                  <strong>{{ item.name }}</strong>
                  <br /><small>{{ item.category }}</small>
                  <span v-if="item.selectedCombo" class="combo-tag"> (Combo: {{ item.selectedCombo.name }})</span>
                </td>
                <td class="center">{{ item.quantity }}</td>
                <td class="right">${{ Number(item.unitPrice || (item.lineTotal / item.quantity)).toFixed(2) }}</td>
                <td v-if="tasaBCV > 1" class="right">Bs. {{ toBS(item.unitPrice || (item.lineTotal / item.quantity)) }}</td>
                <td class="right"><strong>${{ Number(item.lineTotal).toFixed(2) }}</strong></td>
                <td v-if="tasaBCV > 1" class="right"><strong>Bs. {{ toBS(item.lineTotal) }}</strong></td>
              </tr>
              <!-- Abonos registrados -->
              <tr v-for="pay in (draftOrder.payments || [])" :key="pay.date + pay.amount" class="abono-row">
                <td class="mono">SRV-ABO</td>
                <td>Abono en cuenta ({{ pay.method === 'pagomovil' ? 'Pago Móvil' : 'PayPal' }}<span v-if="pay.reference"> Ref: {{ pay.reference }}</span>)</td>
                <td class="center">1</td>
                <td class="right red">-${{ Number(pay.amount).toFixed(2) }}</td>
                <td v-if="tasaBCV > 1" class="right red">-Bs. {{ toBS(pay.amount) }}</td>
                <td class="right red"><strong>-${{ Number(pay.amount).toFixed(2) }}</strong></td>
                <td v-if="tasaBCV > 1" class="right red"><strong>-Bs. {{ toBS(pay.amount) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </section>

        <hr class="inv-hr" />

        <!-- TOTALES -->
        <section class="inv-totals-section">
          <!-- Métodos de pago registrados (izquierda) -->
          <div class="inv-payments-summary">
            <p v-for="pay in (draftOrder.payments || [])" :key="pay.date">
              <strong>{{ pay.method === 'pagomovil' ? 'Pago Móvil' : 'PayPal' }} Registrado:</strong><br />
              <span v-if="pay.reference">Referencia: {{ pay.reference }}<br /></span>
              <span v-if="pay.note">{{ pay.note }}</span>
            </p>
          </div>
          <!-- Cálculos (derecha) -->
          <div class="inv-totals-box">
            <div class="tot-row">
              <span>Total Exento o Exonerado (E):</span>
              <span>$0.00</span>
            </div>
            <div class="tot-row">
              <span>Base Imponible Alícuota Gral. (16%):</span>
              <span>${{ baseImponible.toFixed(2) }}<span v-if="tasaBCV > 1"> / Bs. {{ toBS(baseImponible) }}</span></span>
            </div>
            <div class="tot-row">
              <span>IVA Alícuota Gral. (16%):</span>
              <span>${{ montoIVA.toFixed(2) }}<span v-if="tasaBCV > 1"> / Bs. {{ toBS(montoIVA) }}</span></span>
            </div>
            <div v-if="draftOrder.shippingCost > 0" class="tot-row">
              <span>Costo de Envío:</span>
              <span>${{ Number(draftOrder.shippingCost).toFixed(2) }}</span>
            </div>
            <div class="tot-row grand">
              <span>VALOR TOTAL OPERACIÓN:</span>
              <span>${{ totalOperacion.toFixed(2) }} USD<span v-if="tasaBCV > 1"> / Bs. {{ toBS(totalOperacion) }}</span></span>
            </div>
            <div class="tot-row abono">
              <span>ABONO (Pago recibido):</span>
              <span>-${{ totalPagado.toFixed(2) }}</span>
            </div>
            <div class="tot-row pendiente">
              <span>PENDIENTE:</span>
              <span>${{ saldoPendiente.toFixed(2) }}</span>
            </div>
          </div>
        </section>

        <hr class="inv-hr" />

        <!-- PIE LEGAL - IMPRENTA -->
        <footer class="inv-footer">
          <div class="inv-legal-note">
            <em>Documento emitido según los requerimientos de la Providencia Administrativa N° 0071 del SENIAT.</em>
          </div>
          <div class="inv-imprenta-box">
            <p><strong>Imprenta Autorizada:</strong> {{ imprenta.nombre || '—' }} | <strong>RIF:</strong> {{ imprenta.rif || '—' }}</p>
            <p><strong>Providencia N°:</strong> {{ imprenta.nomenclatura || '—' }} de fecha {{ imprenta.fechaProvidencia || '—' }}</p>
            <p><strong>Control asignado:</strong> desde el N° {{ imprenta.controlDesde || '—' }} hasta el N° {{ imprenta.controlHasta || '—' }}</p>
            <p><strong>Fecha de asignación:</strong> {{ emissionDate }}</p>
          </div>
        </footer>

      </div>
      <!-- FIN MODO VISTA -->
      </div>
    </section>

    <section v-if="activeTab === 'invoice' && !selectedOrder" class="fv-section">
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <p>Selecciona un pedido desde la pestaña "Pedidos" para generar su factura.</p>
        <button class="btn-go-orders" @click="activeTab = 'orders'">Ir a Pedidos</button>
      </div>
    </section>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.facturas-view {
  font-family: 'Inter', sans-serif;
  padding: 2.5rem;
  min-height: 100vh;
}

/* HEADER */
.fv-header { margin-bottom: 2rem; }
.fv-title { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.25rem; }
.fv-subtitle { color: var(--color-text-secondary); margin: 0; font-size: 0.9rem; }

/* TABS */
.fv-tabs {
  display: flex; gap: 0.5rem; margin-bottom: 2rem;
  border-bottom: 2px solid rgba(128,128,128,0.12);
  padding-bottom: 0;
}
.fv-tab {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.25rem; border: none; background: none;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
  color: var(--color-text-secondary); border-bottom: 3px solid transparent;
  margin-bottom: -2px; transition: all 0.2s; border-radius: 8px 8px 0 0;
}
.fv-tab:hover { color: var(--color-primary); background: rgba(25,118,210,0.04); }
.fv-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); background: rgba(25,118,210,0.06); }
.fv-tab:disabled { opacity: 0.4; cursor: not-allowed; }

/* SECTION */
.fv-section { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ORDERS TAB */
.orders-toolbar {
  display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
}
.search-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 0.5rem 0.75rem; flex: 1; min-width: 200px; }
.search-input { border: none; background: none; outline: none; font-size: 0.9rem; color: var(--color-text-primary); width: 100%; }
.date-wrap { display: flex; align-items: center; gap: 0.4rem; background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.15); border-radius: 10px; padding: 0.5rem 0.75rem; }
.date-input { border: none; background: none; outline: none; font-size: 0.85rem; color: var(--color-text-primary); }
.clear-date { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--color-text-secondary); }

.orders-table-wrap { background: var(--color-bg-card); border-radius: 16px; overflow: hidden; border: 1px solid rgba(128,128,128,0.1); }
.orders-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.orders-table thead { position: sticky; top: 0; }
.orders-table th { background: rgba(128,128,128,0.04); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary); padding: 0.75rem 1rem; text-align: left; }
.orders-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(128,128,128,0.06); vertical-align: middle; }
.orders-table tbody tr:hover { background: rgba(128,128,128,0.02); }

.order-id { font-family: monospace; font-size: 0.78rem; font-weight: 700; color: var(--color-primary); }
.client-cell { display: flex; flex-direction: column; gap: 0.1rem; }
.client-cell strong { font-size: 0.88rem; }
.client-cell small { color: var(--color-text-secondary); font-size: 0.75rem; }
.date-txt { font-size: 0.8rem; white-space: nowrap; }
.amt-cell { display: flex; flex-direction: column; }
.usd { color: #2e7d32; font-size: 0.9rem; }
.bs { color: var(--color-text-secondary); font-size: 0.72rem; }
.prog-wrap { display: flex; align-items: center; gap: 0.4rem; min-width: 80px; }
.prog-bar { flex: 1; height: 6px; background: rgba(128,128,128,0.15); border-radius: 4px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
.prog-pct { font-size: 0.72rem; font-weight: 700; }

.status-chip { font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; white-space: nowrap; }
.badge-paid { background: rgba(76,175,80,0.12); color: #2e7d32; }
.badge-partial { background: rgba(255,152,0,0.12); color: #e65100; }
.badge-pending { background: rgba(229,57,53,0.12); color: #b71c1c; }
.badge-dispatched { background: rgba(103,58,183,0.12); color: #4527a0; }

.btn-gen-invoice {
  display: flex; align-items: center; gap: 0.4rem;
  background: var(--color-primary, #0d7fc9); color: #fff;
  border: none; border-radius: 8px; padding: 0.45rem 0.9rem;
  font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: 0.2s;
}
.btn-gen-invoice:hover { filter: brightness(1.1); transform: translateY(-1px); }

/* CONFIG TAB */
.config-section { }
.config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
@media (max-width: 900px) { .config-grid { grid-template-columns: 1fr; } }

.config-card {
  background: var(--color-bg-card); border: 1px solid rgba(128,128,128,0.1);
  border-radius: 20px; padding: 1.75rem;
}
.config-card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.config-card-header svg { color: var(--color-primary); }
.config-card-header h2 { font-size: 1.05rem; font-weight: 800; margin: 0; }
.config-card-desc { color: var(--color-text-secondary); font-size: 0.82rem; margin: 0 0 1.25rem; }
.config-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group.full-span { grid-column: 1 / -1; }
.form-group label { font-size: 0.78rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.03em; }
.form-group input, .form-group select {
  border: 1px solid rgba(128,128,128,0.2); border-radius: 8px;
  padding: 0.6rem 0.8rem; font-size: 0.9rem;
  background: var(--color-bg-input, #fff); color: var(--color-text-primary);
  outline: none; transition: 0.2s;
}
.form-group input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(25,118,210,0.1); }
.rate-group small { color: var(--color-text-secondary); font-size: 0.75rem; }
.rate-input-wrap { display: flex; align-items: center; border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; overflow: hidden; background: var(--color-bg-input, #fff); }
.rate-prefix { padding: 0 0.6rem; color: var(--color-text-secondary); font-weight: 700; font-size: 0.9rem; border-right: 1px solid rgba(128,128,128,0.15); }
.rate-input-wrap input { border: none; border-radius: 0; box-shadow: none; }
.btn-save-config {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--color-primary, #0d7fc9); color: #fff; border: none;
  border-radius: 10px; padding: 0.7rem 1.25rem; font-size: 0.9rem;
  font-weight: 700; cursor: pointer; transition: all 0.2s; width: 100%;
  justify-content: center;
}
.btn-save-config:hover { filter: brightness(1.07); }

/* INVOICE SECTION */
.invoice-section { }
.invoice-actions {
  display: flex; gap: 0.75rem; margin-bottom: 1.5rem;
  flex-wrap: wrap; align-items: center;
}
.inv-btn {
  display: flex; align-items: center; gap: 0.4rem;
  border: 1px solid rgba(128,128,128,0.2); border-radius: 9px;
  padding: 0.55rem 1rem; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; background: var(--color-bg-card); color: var(--color-text-secondary);
  transition: all 0.2s;
}
.print-btn:hover { border-color: #1565c0; color: #1565c0; background: rgba(21,101,192,0.05); }
.email-btn:hover { border-color: #2e7d32; color: #2e7d32; background: rgba(46,125,50,0.05); }
.back-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* INVOICE DOC */
.invoice-doc {
  max-width: 840px; margin: 0 auto;
  background: #fff; color: #111;
  border: 1px solid #ddd; border-radius: 6px;
  padding: 2.5rem; box-shadow: 0 4px 30px rgba(0,0,0,0.08);
  font-family: 'Inter', sans-serif;
}
.inv-header { display: flex; justify-content: space-between; gap: 2rem; flex-wrap: wrap; margin-bottom: 1rem; }
.inv-company { display: flex; gap: 1rem; align-items: flex-start; }
.inv-logo { width: 64px; height: 64px; object-fit: contain; }
.inv-company-name { font-size: 1rem; font-weight: 900; margin: 0 0 0.3rem; text-transform: uppercase; color: #003366; }
.inv-company p { margin: 0.1rem 0; font-size: 0.78rem; }
.inv-meta { text-align: right; }
.inv-title-box { font-size: 2rem; font-weight: 900; color: #c00; letter-spacing: 0.1em; margin-bottom: 0.6rem; }
.inv-meta-table { margin-left: auto; border-collapse: collapse; font-size: 0.78rem; }
.inv-meta-table td { padding: 0.15rem 0.5rem; }
.inv-meta-table td:first-child { color: #555; font-weight: 500; text-align: right; padding-right: 0.75rem; }
.inv-meta-table td:last-child { font-weight: 700; text-align: left; }
.inv-hr { border: none; border-top: 1px solid #ccc; margin: 1rem 0; }
.inv-section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0066aa; border-left: 4px solid #0066aa; padding-left: 0.6rem; margin: 0 0 0.7rem; }
.inv-client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem 2rem; font-size: 0.82rem; }
.full-col { grid-column: 1 / -1; }
.lbl { color: #555; font-size: 0.75rem; margin-right: 0.25rem; }
.inv-client { margin-bottom: 1rem; }
.inv-items { margin-bottom: 1rem; }
.inv-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.inv-table th { background: #e8f0f8; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.5rem 0.6rem; border: 1px solid #ccc; text-align: left; color: #003366; }
.inv-table td { padding: 0.5rem 0.6rem; border: 1px solid #e0e0e0; vertical-align: top; }
.inv-table tbody tr:nth-child(even) { background: #fafafa; }
.abono-row td { background: #fff8f8; }
.mono { font-family: monospace; font-size: 0.75rem; }
.center { text-align: center; }
.right { text-align: right; }
.red { color: #c00; }
.combo-tag { font-size: 0.7rem; color: #7b5800; }
.inv-totals-section { display: flex; gap: 2rem; margin-bottom: 1rem; flex-wrap: wrap; }
.inv-payments-summary { flex: 1; font-size: 0.8rem; color: #333; }
.inv-payments-summary p { margin: 0 0 0.4rem; }
.inv-totals-box { width: 360px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
.tot-row { display: flex; justify-content: space-between; padding: 0.45rem 0.75rem; font-size: 0.82rem; border-bottom: 1px solid #eee; }
.tot-row:last-child { border-bottom: none; }
.tot-row.grand { background: #003366; color: #fff; font-weight: 800; font-size: 0.9rem; }
.tot-row.abono { color: #c00; font-weight: 700; }
.tot-row.pendiente { color: #2e7d32; font-weight: 700; font-size: 0.9rem; }
.inv-footer { display: flex; justify-content: space-between; gap: 2rem; flex-wrap: wrap; font-size: 0.73rem; color: #555; margin-top: 0.5rem; }
.inv-legal-note { flex: 1; max-width: 380px; font-style: italic; line-height: 1.5; }
.inv-imprenta-box { border: 1px solid #bbb; border-radius: 4px; padding: 0.7rem 1rem; font-size: 0.72rem; }
.inv-imprenta-box p { margin: 0.15rem 0; }

/* EMPTY STATE */
.empty-state { text-align: center; padding: 4rem 2rem; color: var(--color-text-secondary); }
.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.btn-go-orders { margin-top: 1rem; background: var(--color-primary); color: #fff; border: none; border-radius: 10px; padding: 0.6rem 1.5rem; font-weight: 700; cursor: pointer; }

/* PRINT */
@media print {
  .no-print, .fv-header, .fv-tabs { display: none !important; }
  .facturas-view { padding: 0; }
  .invoice-doc { box-shadow: none; border: none; margin: 0; max-width: 100%; border-radius: 0; }
}
</style>
