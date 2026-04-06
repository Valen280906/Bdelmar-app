import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useOrdersStore = defineStore('orders', () => {

  // ── Global storage key ──────────────────────────────────────────────
  // The system uses a single global key so the Admin can see all orders.
  // We use the `username` property on each order to filter for normal users.
  function currentUsername() {
    return localStorage.getItem('bdelmar_user') || 'guest'
  }
  
  const ordersKey = 'bdm_orders'

  // Initialise orders from the global bucket
  const orders = ref(JSON.parse(localStorage.getItem(ordersKey) || '[]'))

  const save = () => localStorage.setItem(ordersKey, JSON.stringify(orders.value))

  // Call this whenever the active user changes
  function reloadForUser() {
    orders.value = JSON.parse(localStorage.getItem(ordersKey) || '[]')
  }

  // ── Auto-distribute excess payment to oldest pending orders ───────────
  function autoDistributeExcess(email, excess, username) {
    const pendingOrders = orders.value
      .filter(o => o.clientInfo?.email === email && o.username === username && (o.status === 'pending' || o.status === 'partial'))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    let remaining = excess
    for (const order of pendingOrders) {
      if (remaining <= 0.001) break
      const needed = order.total - order.totalPaid
      if (needed <= 0) continue
      const toApply = Math.min(remaining, needed)
      order.payments.push({
        amount: parseFloat(toApply.toFixed(2)),
        date: new Date().toISOString().split('T')[0],
        method: 'auto_excess',
        note: 'Excedente aplicado automáticamente',
        reference: null,
        confirmed: false,
      })
      order.totalPaid = parseFloat((order.totalPaid + toApply).toFixed(2))
      order.status = order.totalPaid >= order.total ? 'paid' : 'partial'
      remaining = parseFloat((remaining - toApply).toFixed(2))
    }
    save()
  }

  // ── Place order ───────────────────────────────────────────────────────
  function placeOrder({ clientInfo, items, paymentMethod, total, comboDetails, initialPayment, referenceNumber, concept, shippingCost }) {
    const rawPaid = parseFloat((initialPayment || 0).toFixed(2))
    const toCurrentOrder = Math.min(rawPaid, total)
    const excess = rawPaid > total ? parseFloat((rawPaid - total).toFixed(2)) : 0
    const isPartial = toCurrentOrder > 0 && toCurrentOrder < total
    const isPaid   = toCurrentOrder >= total

    const order = {
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      date: new Date().toISOString(),
      username: currentUsername(), // Attach the user identity here
      status: isPaid ? 'paid' : (isPartial ? 'partial' : 'pending'),
      clientInfo,
      items,
      paymentMethod,
      total,
      shippingCost: shippingCost || 0,
      comboDetails: comboDetails || [],
      referenceNumber: referenceNumber || null,
      concept: concept || null,
      payments: toCurrentOrder > 0 ? [{
        amount: toCurrentOrder,
        date: new Date().toISOString().split('T')[0],
        method: paymentMethod,
        note: referenceNumber
          ? `Ref: ${referenceNumber}${concept ? ' · ' + concept : ''}`
          : 'Pago inicial',
        reference: referenceNumber || null,
        confirmed: false,
      }] : [],
      totalPaid: toCurrentOrder,
    }

    orders.value.unshift(order)
    save()

    // Redistribute excess to older debts
    if (excess > 0) {
      autoDistributeExcess(clientInfo.email, excess, currentUsername())
    }

    return order
  }

  // ── Add manual payment (admin) ────────────────────────────────────────
  function addPayment(orderId, { amount, date, method, note, reference }) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return
    order.payments.push({
      amount: parseFloat(amount),
      date,
      method,
      note: note || '',
      reference: reference || null,
      confirmed: true,
    })
    order.totalPaid = parseFloat(order.payments.reduce((s, p) => s + p.amount, 0).toFixed(2))
    order.status = order.totalPaid >= order.total ? 'paid' : 'partial'
    save()
  }

  function confirmPayment(orderId, paymentIndex) {
    const order = orders.value.find(o => o.id === orderId)
    if (order && order.payments[paymentIndex]) {
      order.payments[paymentIndex].confirmed = true
      save()
    }
  }

  function updateStatus(orderId, status) {
    const order = orders.value.find(o => o.id === orderId)
    if (order) { order.status = status; save() }
  }

  function deleteOrder(orderId) {
    orders.value = orders.value.filter(o => o.id !== orderId)
    save()
  }

  // ── User-specific computed properties ───────────────────────────────
  // Because orders is now a global array, we filter by 'username' for client views.
  const currentUserOrders = computed(() =>
    orders.value.filter(o => o.username === currentUsername())
  )

  const hasPendingDebt = computed(() =>
    currentUserOrders.value.some(o => o.status === 'pending' || o.status === 'partial')
  )

  const pendingDebtAmount = computed(() =>
    currentUserOrders.value
      .filter(o => o.status === 'pending' || o.status === 'partial')
      .reduce((sum, o) => sum + Math.max(0, o.total - o.totalPaid), 0)
  )

  return {
    orders,
    currentUserOrders,
    placeOrder,
    addPayment,
    confirmPayment,
    updateStatus,
    deleteOrder,
    reloadForUser,
    hasPendingDebt,
    pendingDebtAmount,
  }
})
