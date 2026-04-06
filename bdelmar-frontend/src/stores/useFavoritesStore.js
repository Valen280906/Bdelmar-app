import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  const getUk = () => `bdm_user_${localStorage.getItem('bdelmar_user') || 'guest'}_favorites`
  
  const favorites = ref(JSON.parse(localStorage.getItem(getUk()) || '[]'))

  const save = () => localStorage.setItem(getUk(), JSON.stringify(favorites.value))

  function reload() {
    favorites.value = JSON.parse(localStorage.getItem(getUk()) || '[]')
  }

  const isFavorite = (productId) => favorites.value.some(f => f.id === productId)

  function toggle(product) {
    const idx = favorites.value.findIndex(f => f.id === product.id)
    if (idx >= 0) {
      favorites.value.splice(idx, 1)
    } else {
      favorites.value.push(product)
    }
    save()
  }

  return { favorites, isFavorite, toggle, reload }
})
