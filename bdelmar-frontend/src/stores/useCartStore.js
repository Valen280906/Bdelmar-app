import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const getUk = () => `bdm_user_${localStorage.getItem('bdelmar_user') || 'guest'}_cart`
  const items = ref(JSON.parse(localStorage.getItem(getUk()) || '[]'))

  const saveToStorage = () => {
    localStorage.setItem(getUk(), JSON.stringify(items.value))
  }

  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))

  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => {
      const lineTotal = getLineTotal(item)
      return sum + lineTotal
    }, 0)
  })

  // Calculates price by automatically applying the best combo(s) based on quantity
  function getLineTotal(item) {
    const basePrice = parseFloat(item.product?.basePrice || 0)
    let remainingQty = item.quantity
    let total = 0

    const combos = item.product?.combos || []
    if (combos.length > 0) {
      // Sort combos from largest unit to smallest
      const sortedCombos = [...combos].sort((a, b) => parseInt(b.unit) - parseInt(a.unit))
      
      for (const combo of sortedCombos) {
        const cUnit = parseInt(combo.unit)
        const cPrice = parseFloat(combo.price)
        if (cUnit > 0 && remainingQty >= cUnit) {
          const blocks = Math.floor(remainingQty / cUnit)
          total += blocks * cPrice
          remainingQty %= cUnit
        }
      }
    }
    
    // Add remaining items at base price
    total += remainingQty * basePrice
    return total
  }

  function addItem(product, quantity = 1) {
    const existing = items.value.find(i => i.product.id === product.id)
    if (existing) {
      let newQty = existing.quantity + quantity
      const stock = Number(product.stock) || 0
      if (stock > 0 && newQty > stock) {
        newQty = stock
      }
      existing.quantity = newQty
    } else {
      let limitQty = quantity
      const stock = Number(product.stock) || 0
      if (stock > 0 && limitQty > stock) {
        limitQty = stock
      }
      items.value.push({ product, quantity: limitQty })
    }
    saveToStorage()
  }

  function removeItem(index) {
    items.value.splice(index, 1)
    saveToStorage()
  }

  function updateQuantity(index, quantity) {
    if (quantity < 1) return removeItem(index)
    let newQty = quantity
    const item = items.value[index]
    const stock = Number(item.product.stock) || 0
    if (stock > 0 && newQty > stock) {
      newQty = stock
    }
    item.quantity = newQty
    saveToStorage()
  }

  function clearCart() {
    items.value = []
    saveToStorage()
  }

  function reload() {
    items.value = JSON.parse(localStorage.getItem(getUk()) || '[]')
  }

  return { items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, getLineTotal, reload }
})
