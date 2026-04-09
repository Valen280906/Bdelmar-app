<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/useOrdersStore'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()

const orderId = route.params.orderId
const order = computed(() => ordersStore.orders.find(o => o.id === orderId) || null)

const emailStatus = ref('sending') // sending, success, error

// ─── IMPRENTA CONFIG ───
const CFG_EMISOR_KEY   = 'bdm_factura_emisor'
const CFG_IMPRENTA_KEY = 'bdm_factura_imprenta'
const defaultEmisor = { nombre: 'DISTRIBUIDORA Y COMERCIO B-DEL MAR 3011 C.A', rif: 'J-000000000', domicilio: 'Caracas, Venezuela', telefono: '0424-4293765', email: 'bdelmar69@gmail.com' }
const defaultImprenta = { nombre: '', rif: '', nomenclatura: '', fechaProvidencia: '', controlDesde: '00000001', controlHasta: '00099999', tasaBCV: '1' }
const emisor = { ...defaultEmisor, ...(JSON.parse(localStorage.getItem(CFG_EMISOR_KEY) || '{}')) }
const imprenta = { ...defaultImprenta, ...(JSON.parse(localStorage.getItem(CFG_IMPRENTA_KEY) || '{}')) }

const tasaBCV = parseFloat(imprenta.tasaBCV) || 1
function toBS(usd) { return (parseFloat(usd) * tasaBCV).toFixed(2) }

const pad = (n, d = 2) => String(n).padStart(d, '0')
const emissionDate = computed(() => {
  if(!order.value) return ''
  const d = new Date(order.value.date)
  return `${pad(d.getDate())}${pad(d.getMonth()+1)}${d.getFullYear()}`
})
const emissionDateDisplay = computed(() => {
  if(!order.value) return ''
  const d = new Date(order.value.date)
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`
})
const emissionTime = computed(() => {
  if(!order.value) return ''
  const d = new Date(order.value.date)
  const h = d.getHours()
  const ampm = h >= 12 ? 'p.m.' : 'a.m.'
  const h12  = h % 12 || 12
  return `${pad(h12)}.${pad(d.getMinutes())}.${pad(d.getSeconds())} ${ampm}`
})

function invoiceSequential(ord) {
  const idx = ordersStore.orders.findIndex(o => o.id === ord.id)
  const start = parseInt(imprenta.controlDesde || '1', 10)
  const num = start + (idx >= 0 ? idx : 0)
  return String(num).padStart(8, '0')
}

// ─── CÁLCULOS ───
const subtotalItems = computed(() => order.value?.items.reduce((s, i) => s + (i.lineTotal || 0), 0) || 0)
const baseImponible = computed(() => subtotalItems.value / 1.16)
const montoIVA      = computed(() => subtotalItems.value - baseImponible.value)
const totalOperacion = computed(() => (!order.value ? 0 : order.value.total))
const totalPagado    = computed(() => (!order.value ? 0 : order.value.totalPaid))
const saldoPendiente = computed(() => Math.max(0, totalOperacion.value - totalPagado.value))

function printInvoice() { window.print() }

onMounted(async () => {
  if (!order.value) {
    router.push('/catalogo')
    return
  }

  // --- Registrar compra y uso de cupón ---
  const registeredFlag = `purchase_registered_${orderId}`
  if (!sessionStorage.getItem(registeredFlag)) {
    const userId = localStorage.getItem('bdelmar_user_id')
    if (userId) {
      try {
        await fetch(`http://localhost:3001/api/user/${userId}/register-purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_ref: String(orderId), amount: Number(totalOperacion.value) })
        })
      } catch (e) {
        console.error('Error registrando compra:', e)
      }

      const checkoutRaw = sessionStorage.getItem('bdm_checkout')
      if (checkoutRaw) {
        try {
          const cData = JSON.parse(checkoutRaw)
          if (cData.couponCode) {
            await fetch('http://localhost:3001/api/coupons/use', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ code: cData.couponCode, user_id: userId })
            })
          }
        } catch(e) { console.error('Error enviando uso de cupón:', e) }
      }
    }
    sessionStorage.setItem(registeredFlag, 'true')
  }
  // --- Fin Registro ---

  // Prevenir envío múltiple si el user recarga página (podemos usar un flag sessionStorage)
  const sentFlag = `email_sent_${orderId}`
  if (sessionStorage.getItem(sentFlag)) {
    emailStatus.value = 'success'
    return
  }

  try {
    // Construir HTML completo de la factura con estilos inline para el PDF del backend
    const inv = invoiceSequential(order.value)
    const itemsRows = order.value.items.map(item => `
      <tr>
        <td style="padding:4px 6px;border:1px solid #ddd;font-family:monospace;font-size:0.72rem">${item.barcode || 'BDM-' + (item.name?.substring(0,3).toUpperCase() || '000')}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;font-size:0.78rem"><strong>${item.name}</strong><br/><small style="color:#888">${item.category || ''}</small></td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:right">$${Number(item.unitPrice || (item.lineTotal / item.quantity)).toFixed(2)}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:right"><strong>$${Number(item.lineTotal).toFixed(2)}</strong></td>
      </tr>
    `).join('')

    const invoiceHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>body{font-family:Arial,sans-serif;font-size:13px;color:#111;margin:0;padding:20px} table{border-collapse:collapse;width:100%}</style>
    </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-size:13px;font-weight:900;text-transform:uppercase;color:#003366;margin-bottom:4px">${emisor.nombre}</div>
          <div style="font-size:11px"><strong>RIF:</strong> ${emisor.rif}</div>
          <div style="font-size:11px">${emisor.domicilio}</div>
          <div style="font-size:11px">Tel: ${emisor.telefono} | ${emisor.email}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:28px;font-weight:900;color:#cc0000;letter-spacing:4px;margin-bottom:6px">FACTURA</div>
          <table style="margin-left:auto;width:auto;font-size:11px">
            <tr><td style="color:#555;padding:1px 8px 1px 0;text-align:right">N° de Factura</td><td style="font-weight:700">${inv}</td></tr>
            <tr><td style="color:#555;padding:1px 8px 1px 0;text-align:right">N° de Control</td><td style="font-weight:700">00-${inv}</td></tr>
            <tr><td style="color:#555;padding:1px 8px 1px 0;text-align:right">Fecha de Emisión</td><td style="font-weight:700">${emissionDate.value} (DDMMAAAA)</td></tr>
            <tr><td style="color:#555;padding:1px 8px 1px 0;text-align:right">Hora de Emisión</td><td style="font-weight:700">${emissionTime.value}</td></tr>
            <tr><td style="color:#555;padding:1px 8px 1px 0;text-align:right">Tipo</td><td>Venta</td></tr>
          </table>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #ccc;margin:8px 0"/>
      <div style="margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#0066aa;border-left:3px solid #0066aa;padding-left:6px;margin-bottom:5px">Datos del Adquirente</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px 30px;font-size:11px">
          <div><span style="color:#777">Razón Social:</span> <strong>${order.value.clientInfo?.name || '—'}</strong></div>
          <div><span style="color:#777">RIF / C.I.:</span> <strong>${order.value.clientInfo?.rif || 'N/A'}</strong></div>
          <div><span style="color:#777">Teléfono:</span> ${order.value.clientInfo?.phone || '—'}</div>
          <div><span style="color:#777">Correo:</span> ${order.value.clientInfo?.email || '—'}</div>
          <div style="width:100%"><span style="color:#777">Domicilio Fiscal:</span> ${order.value.clientInfo?.address || 'No especificado'}</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #ccc;margin:8px 0"/>
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#0066aa;border-left:3px solid #0066aa;padding-left:6px;margin-bottom:5px">Descripción de la Operación</div>
      <table style="font-size:11px;margin-bottom:8px">
        <thead><tr style="background:#e8f0f8">
          <th style="padding:4px 6px;border:1px solid #bbb;text-align:left;color:#003366">Código</th>
          <th style="padding:4px 6px;border:1px solid #bbb;text-align:left;color:#003366">Descripción</th>
          <th style="padding:4px 6px;border:1px solid #bbb;color:#003366">Cant.</th>
          <th style="padding:4px 6px;border:1px solid #bbb;color:#003366">Precio Unit.</th>
          <th style="padding:4px 6px;border:1px solid #bbb;color:#003366">Total USD</th>
        </tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
        <div style="width:320px;border:1px solid #ddd;font-size:11px">
          <div style="display:flex;justify-content:space-between;padding:4px 8px;border-bottom:1px solid #eee"><span>Base Imponible (16%):</span><span>$${baseImponible.value.toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;border-bottom:1px solid #eee"><span>IVA (16%):</span><span>$${montoIVA.value.toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:5px 8px;background:#003366;color:#fff;font-weight:800"><span>TOTAL OPERACIÓN:</span><span>$${totalOperacion.value.toFixed(2)} USD</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;color:#c00;font-weight:700"><span>ABONO:</span><span>-$${totalPagado.value.toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;color:#2e7d32;font-weight:700"><span>PENDIENTE:</span><span>$${saldoPendiente.value.toFixed(2)}</span></div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #ccc;margin:8px 0"/>
      <div style="font-size:10px;color:#555">
        <em>Documento emitido según Providencia Administrativa N° 0071 del SENIAT.</em>
        ${imprenta.nombre ? `<br/>Imprenta: ${imprenta.nombre} | RIF: ${imprenta.rif}` : ''}
      </div>
    </body></html>`

    const htmlBody = `
      <div style="font-family:sans-serif; color:#333; max-width:600px; margin:auto;">
        <h2 style="color:#003366;">¡Gracias por tu compra en B DEL MAR!</h2>
        <p>Estimado/a <strong>${order.value.clientInfo?.name || 'Cliente'}</strong>,</p>
        <p>Tu orden <strong>#${order.value.id}</strong> ha sido verificada y registrada correctamente.</p>
        <div style="background:#f8f9fc; padding:15px; border-radius:8px; margin:20px 0;">
          <p><strong>Total Operación:</strong> $${totalOperacion.value.toFixed(2)} USD</p>
          <p><strong>Total Pagado:</strong> $${totalPagado.value.toFixed(2)} USD</p>
          <p><strong>Saldo Pendiente:</strong> $${saldoPendiente.value.toFixed(2)} USD</p>
        </div>
        <p>En el archivo adjunto encontrarás tu <strong>factura digital en PDF</strong>.</p>
        <br/>
        <p>Atentamente,<br/><strong>${emisor.nombre}</strong><br/>Tel: ${emisor.telefono}<br/>Email: ${emisor.email}</p>
      </div>
    `

    const res = await fetch('http://localhost:3001/api/send-invoice-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: order.value.clientInfo?.email || emisor.email,
        subject: `Factura ${inv} — ${emisor.nombre}`,
        htmlBody,
        invoiceHtml,
        pdfName: `Factura_${inv}.pdf`
      })
    })
    
    if (res.ok) {
      emailStatus.value = 'success'
      sessionStorage.setItem(sentFlag, 'true')
    } else {
      emailStatus.value = 'error'
    }
  } catch(e) {
    console.error('Error auto-emailing invoice:', e)
    emailStatus.value = 'error'
  }
})

</script>

<template>
  <div class="checkout-success-page" v-if="order">
    <!-- Success Banner -->
    <div class="success-banner no-print">
      <div class="success-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2>¡Pago Exitoso! Orden Confirmada</h2>
      <p>La factura de tu compra ha sido generada automáticamente.</p>
      
      <div class="email-status" :class="emailStatus">
        <svg v-if="emailStatus === 'sending'" class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <svg v-else-if="emailStatus === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/></svg>
        
        <span v-if="emailStatus === 'sending'">Enviando copia al correo electrónico...</span>
        <span v-if="emailStatus === 'success'">Copia enviada exitosamente a tu correo electrónico.</span>
        <span v-if="emailStatus === 'error'">No se pudo enviar la copia automáticamente a tu correo.</span>
      </div>

      <div class="actions mt-3">
        <button class="btn btn-outline" @click="router.push('/perfil')">Ver Mis Pedidos</button>
        <button class="btn btn-outline" @click="router.push('/catalogo')">Seguir Comprando</button>
        <button class="btn btn-primary" @click="printInvoice">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir / Descargar PDF
        </button>
      </div>
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
            <tbody>
              <tr><td>N° de Factura</td><td><strong>{{ invoiceSequential(order) }}</strong></td></tr>
              <tr><td>N° de Control</td><td><strong>00-{{ invoiceSequential(order) }}</strong></td></tr>
              <tr><td>Rango de Control</td><td>desde N° {{ imprenta.controlDesde || '00000001' }} hasta N° {{ imprenta.controlHasta || '00099999' }}</td></tr>
              <tr><td>Fecha de Emisión</td><td><strong>{{ emissionDate }} (DDMMAAAA)</strong></td></tr>
              <tr><td>Hora de Emisión</td><td><strong>{{ emissionTime }}</strong></td></tr>
              <tr><td>Tipo</td><td>Venta</td></tr>
            </tbody>
          </table>
        </div>
      </header>

      <hr class="inv-hr" />

      <!-- DATOS DEL ADQUIRENTE -->
      <section class="inv-client">
        <h3 class="inv-section-label">Datos del Adquirente</h3>
        <div class="inv-client-grid">
          <div><span class="lbl">Razón Social:</span> <strong>{{ order.clientInfo?.name || '—' }}</strong></div>
          <div><span class="lbl">RIF / C.I.:</span> <strong>{{ order.clientInfo?.rif || 'N/A' }}</strong></div>
          <div><span class="lbl">Teléfono:</span> {{ order.clientInfo?.phone || '—' }}</div>
          <div><span class="lbl">Correo:</span> {{ order.clientInfo?.email || '—' }}</div>
          <div class="full-col"><span class="lbl">Domicilio Fiscal:</span> {{ order.clientInfo?.address || 'No especificado' }}</div>
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
            <tr v-for="item in order.items" :key="item.name">
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
            <tr v-for="pay in (order.payments || [])" :key="pay.date + pay.amount" class="abono-row">
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
        <div class="inv-payments-summary">
          <p v-for="pay in (order.payments || [])" :key="pay.date + pay.amount">
            <strong>{{ pay.method === 'pagomovil' ? 'Pago Móvil' : 'PayPal' }} Registrado:</strong><br />
            <span v-if="pay.reference">Referencia: {{ pay.reference }}<br /></span>
            <span v-if="pay.note">{{ pay.note }}</span>
          </p>
        </div>
        <div class="inv-totals-box">
          <div class="tot-row">
            <span>Total Exento o Exonerado (E):</span><span>$0.00</span>
          </div>
          <div class="tot-row">
            <span>Base Imponible Alícuota Gral. (16%):</span>
            <span>${{ baseImponible.toFixed(2) }}<span v-if="tasaBCV > 1"> / Bs. {{ toBS(baseImponible) }}</span></span>
          </div>
          <div class="tot-row">
            <span>IVA Alícuota Gral. (16%):</span>
            <span>${{ montoIVA.toFixed(2) }}<span v-if="tasaBCV > 1"> / Bs. {{ toBS(montoIVA) }}</span></span>
          </div>
          <div v-if="order.shippingCost > 0" class="tot-row">
            <span>Costo de Envío:</span><span>${{ Number(order.shippingCost).toFixed(2) }}</span>
          </div>
          <div class="tot-row grand">
            <span>VALOR TOTAL OPERACIÓN:</span>
            <span>${{ totalOperacion.toFixed(2) }} USD<span v-if="tasaBCV > 1"> / Bs. {{ toBS(totalOperacion) }}</span></span>
          </div>
          <div class="tot-row abono">
            <span>ABONO (Pago recibido):</span><span>-${{ totalPagado.toFixed(2) }}</span>
          </div>
          <div class="tot-row pendiente">
            <span>PENDIENTE:</span><span>${{ saldoPendiente.toFixed(2) }}</span>
          </div>
        </div>
      </section>

      <hr class="inv-hr" />

      <footer class="inv-footer">
        <div class="inv-legal-note">
          <em>Documento emitido según los requerimientos de la Providencia Administrativa N° 0071 del SENIAT.</em>
        </div>
        <div class="inv-imprenta-box">
          <p><strong>Imprenta Autorizada:</strong> {{ imprenta.nombre || '—' }} | <strong>RIF:</strong> {{ imprenta.rif || '—' }}</p>
          <p><strong>Providencia N°:</strong> {{ imprenta.nomenclatura || '—' }} de fecha {{ imprenta.fechaProvidencia || '—' }}</p>
          <p><strong>Control asignado:</strong> desde el N° {{ imprenta.controlDesde || '—' }} hasta el N° {{ imprenta.controlHasta || '—' }}</p>
          <p><strong>Fecha de asignación:</strong> {{ emissionDateDisplay }}</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.checkout-success-page {
  font-family: 'Inter', sans-serif;
  background: #eef1f5;
  min-height: 100vh;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success-banner {
  background: #fff;
  border-radius: 16px;
  padding: 2.5rem;
  text-align: center;
  max-width: 840px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
}

.success-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 8px 25px rgba(16,185,129,0.3);
}

.success-banner h2 { font-size: 1.8rem; font-weight: 900; margin: 0 0 0.5rem; color: #111; }
.success-banner p { color: #555; margin: 0 0 1.5rem; }

.email-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}
.email-status.sending { background: rgba(59,130,246,0.1); color: #2563eb; }
.email-status.success { background: rgba(16,185,129,0.1); color: #059669; }
.email-status.error   { background: rgba(239,68,68,0.1); color: #dc2626; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.btn {
  display: flex; align-items: center; gap: 0.4rem; padding: 0.75rem 1.25rem;
  font-size: 0.9rem; font-weight: 700; border-radius: 10px; cursor: pointer;
  transition: all 0.2s; border: none;
}
.btn-primary { background: #003366; color: #fff; }
.btn-primary:hover { background: #002244; }
.btn-outline { background: transparent; border: 1.5px solid #ccc; color: #333; }
.btn-outline:hover { border-color: #003366; color: #003366; }

/* INVOICE DOC */
.invoice-doc {
  max-width: 840px; margin: 0 auto;
  background: #fff; color: #111;
  border: 1px solid #ddd; border-radius: 6px;
  padding: 1.5rem 2rem; box-shadow: 0 4px 30px rgba(0,0,0,0.08);
  font-family: 'Inter', sans-serif;
  width: 100%;
}
.inv-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: nowrap; margin-bottom: 0.6rem; }
.inv-company { display: flex; gap: 0.75rem; align-items: flex-start; flex: 1; min-width: 0; }
.inv-logo { width: 52px; height: 52px; object-fit: contain; flex-shrink: 0; }
.inv-company-name { font-size: 0.88rem; font-weight: 900; margin: 0 0 0.2rem; text-transform: uppercase; color: #003366; }
.inv-company p { margin: 0.05rem 0; font-size: 0.72rem; }
.inv-meta { text-align: right; flex-shrink: 0; }
.inv-title-box { font-size: 1.7rem; font-weight: 900; color: #c00; letter-spacing: 0.1em; margin-bottom: 0.4rem; }
.inv-meta-table { margin-left: auto; border-collapse: collapse; font-size: 0.72rem; }
.inv-meta-table td { padding: 0.1rem 0.4rem; }
.inv-meta-table td:first-child { color: #555; font-weight: 500; text-align: right; padding-right: 0.6rem; }
.inv-meta-table td:last-child { font-weight: 700; text-align: left; }
.inv-hr { border: none; border-top: 1px solid #ccc; margin: 0.6rem 0; }
.inv-section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0066aa; border-left: 4px solid #0066aa; padding-left: 0.6rem; margin: 0 0 0.7rem; }
.inv-client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.2rem 1.5rem; font-size: 0.8rem; }
.full-col { grid-column: 1 / -1; }
.lbl { color: #555; font-size: 0.73rem; margin-right: 0.25rem; }
.inv-client { margin-bottom: 0.6rem; }
.inv-items { margin-bottom: 0.6rem; }
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

@media print {
  @page { margin: 0.5cm; size: auto; }
  body { background: white; -webkit-print-color-adjust: exact; color-adjust: exact; }
  .no-print { display: none !important; }
  .checkout-success-page { padding: 0; background: white; min-height: auto; display: block; }
  .invoice-doc { box-shadow: none; border: none; margin: 0; padding: 0; max-width: 100%; border-radius: 0; page-break-inside: avoid; }
}
</style>
