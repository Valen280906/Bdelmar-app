<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '@/stores/useCartStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'

const cartStore = useCartStore()
const favStore = useFavoritesStore()

/**
 * Propiedades del componente listas para la integracion
 * del catalogo de productos de la base de datos.
 */
const props = defineProps({
  product: {
    type: Object,
    default: () => ({
      id: 1,
      name: 'Camarón Jumbo',
      category: 'Mariscos Frescos',
      badge: 'Fresco',
      description: 'Producto de alta calidad extraído bajo estrictos estándares... ',
      image: '/placeholder-seafood.png',
      basePrice: 0,
      combos: []
    })
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
})

// Control del selector numerico de cantidad
const quantity = ref(1)

// Estado del menu desplegable de compartir
const showShareMenu = ref(false)

// Estado del modal de la tarjeta completa
const showCardModal = ref(false)

// Selected combo for cart (no longer needed, cart store auto-calculates)
// Toast de carrito
const cartAdded = ref(false)

function addToCart() {
  if (props.product.badge === 'Agotado') return
  cartStore.addItem(props.product, quantity.value)
  cartAdded.value = true
  setTimeout(() => { cartAdded.value = false }, 1800)
}

/**
 * Incrementa la cantidad de productos seleccionada
 */
const incrementQuantity = () => {
  quantity.value++
}

/**
 * Disminuye la cantidad asegurando un minimo de 1
 */
const decrementQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

/**
 * Calcula el precio total reactivamente usando la lógica compartida del carrito (aplica combos auto)
 */
const totalPrice = computed(() => {
  return cartStore.getLineTotal({ product: props.product, quantity: quantity.value }).toFixed(2)
})

/**
 * Alterna la visibilidad del menu de compartir
 */
const toggleShareMenu = () => {
  showShareMenu.value = !showShareMenu.value
}

// Variables para enlaces genericos de compartir
const currentUrl = computed(() => {
  const url = new URL(window.location.href)
  // Manejo de queries tanto para modo History como modo Hash en Vue
  if (url.hash && url.hash.includes('?')) {
    const [path, query] = url.hash.split('?')
    const params = new URLSearchParams(query)
    params.set('product', props.product.id)
    url.hash = `${path}?${params.toString()}`
  } else if (url.hash) {
    url.hash = `${url.hash}?product=${props.product.id}`
  } else {
    url.searchParams.set('product', props.product.id)
  }
  return url.toString()
})
const shareMessage = computed(() => `Echa un vistazo a este producto: ${props.product.name}`)

/**
 * Abre la url de compartir en WhatsApp
 */
const shareWhatsApp = () => {
  const url = `https://wa.me/?text=${encodeURIComponent(shareMessage.value + ' - ' + currentUrl.value)}`
  window.open(url, '_blank', 'noopener,noreferrer')
  showShareMenu.value = false
}

/**
 * Abre la url de compartir en Telegram
 */
const shareTelegram = () => {
  const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl.value)}&text=${encodeURIComponent(shareMessage.value)}`
  window.open(url, '_blank', 'noopener,noreferrer')
  showShareMenu.value = false
}

onMounted(() => {
  if (!props.isExpanded) {
    let params = null
    if (window.location.hash.includes('?')) {
      // Si el router de Vue está en modo Hash (ej. #/productos?product=12)
      params = new URLSearchParams(window.location.hash.split('?')[1])
    } else {
      // Si está en modo History (ej. /productos?product=12)
      params = new URLSearchParams(window.location.search)
    }
    
    if (params.get('product') === String(props.product.id)) {
      // Retardo para asegurar de que el DOM está listo antes de lanzar el modal
      setTimeout(() => {
        showCardModal.value = true
      }, 150)
    }
  }
})
</script>

<template>
  <article 
    class="product-card" 
    :class="{ 'is-modal-view': isExpanded }"
    @click="!isExpanded && (showCardModal = true)"
  >
    <!-- Seccion Visual (Imagen y Fondo Degradado) -->
    <div class="product-visual">
      <!-- Fondo degradado dinamico basado en el color primario del tema -->
      <div class="visual-gradient"></div>
      
      <!-- Controles superpuestos -->
      <div class="visual-controls">
        <!-- Espacio vacio para mantener balance o colocar un logo -->
        <div class="brand-placeholder">
          <!-- Opcional SVG de marca / logo -->
        </div>

        <!-- Boton Compartir -->
        <div class="share-wrapper">
          <button 
            @click.stop="toggleShareMenu" 
            class="action-btn share-btn"
            aria-label="Ocultar o mostrar opciones de compartir"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
          
          <!-- Menu contextual de redes -->
          <Transition name="fade-slide">
            <div v-show="showShareMenu" class="share-dropdown">
              <button @click.stop="shareWhatsApp" class="network-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                WhatsApp
              </button>
              <button @click.stop="shareTelegram" class="network-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Telegram
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Imagen principal (Simulada o conectada) -->
      <img 
        :src="product.image" 
        :alt="product.name" 
        class="product-image" 
        @error="$event.target.src='https://via.placeholder.com/600x400/1a91db/ffffff?text=Imagen+No+Disponible'"
      />
    </div>

    <!-- Seccion de Informacion (Textos, Cantidad, Precio) -->
    <div class="product-details">
      <!-- Cabecera -->
      <header class="details-header">
        <div class="title-row">
          <h2 class="title">{{ product.name }}</h2>
          <span v-if="product.badge" class="status-badge">{{ product.badge }}</span>
        </div>
        <div style="margin-top: 0.1rem;">
           <p class="subtitle">{{ product.category }}</p>
        </div>
      </header>

      <hr class="separator" />

      <!-- Descripcion Tecnica -->
      <section class="info-section">
        <h3 class="section-title">PRODUCT INFO</h3>
        <p class="section-text">{{ product.description }}</p>
        <div v-if="product.barcode" style="margin-top: 1.5rem; text-align: center;">
          <p class="product-barcode">*{{ product.barcode }}*</p>
        </div>
      </section>

      <hr class="separator" />

      <!-- Selector de Cantidad y Combo -->
      <div class="quantity-combo-row">
        <section class="quantity-section" @click.stop>
          <h3 class="section-title">CANTIDAD</h3>
          <div class="quantity-controls">
            <button @click.stop="decrementQuantity" class="qty-btn" :disabled="quantity <= 1 || product.badge === 'Agotado'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <span class="qty-display" :style="{ opacity: product.badge === 'Agotado' ? 0.5 : 1 }">{{ quantity }}</span>
            <button @click.stop="incrementQuantity" class="qty-btn" :disabled="product.badge === 'Agotado'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </section>

        <!-- Combos vinculados -->
        <section v-if="product.combos && product.combos.length > 0" class="combo-section" @click.stop>
          <h3 class="combo-title">OFERTAS EN COMBO</h3>
          <div class="combos-list">
            <div v-for="c in product.combos" :key="c.id" class="combo-pill" title="Aplica a este producto">
              <span class="combo-name">{{ c.name }}</span>
              <span class="combo-desc">{{ c.unit }} x <strong>${{ Number(c.price).toFixed(2) }}</strong></span>
            </div>
          </div>
        </section>
      </div>

      <hr class="separator" />

      <!-- Accion Final y Precio -->
      <footer class="details-footer" @click.stop>
        <button class="add-to-cart-btn" :disabled="product.badge === 'Agotado'" :class="{ 'is-agotado': product.badge === 'Agotado', 'is-added': cartAdded }" @click.stop="addToCart">
          <svg v-if="!cartAdded && product.badge !== 'Agotado'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <svg v-else-if="cartAdded" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
          <span class="btn-text">{{ product.badge === 'Agotado' ? 'AGOTADO' : cartAdded ? '¡Agregado!' : 'AGREGAR' }}</span>
        </button>
        <button class="fav-heart-btn" :class="{ active: favStore.isFavorite(product.id) }" @click.stop="favStore.toggle(product)" :title="favStore.isFavorite(product.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'">
          <svg width="18" height="18" viewBox="0 0 24 24" :fill="favStore.isFavorite(product.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <div class="price-display">
          <span class="currency">$</span>{{ totalPrice }}
        </div>
      </footer>
    </div>

    <!-- Modal para ver la Tarjeta Expandida -->
    <Teleport to="body" v-if="!isExpanded">
      <Transition name="fade">
        <div v-if="showCardModal" class="card-modal-overlay" @click.self="showCardModal = false">
          <div class="card-modal-wrapper">
            <button class="modal-close-btn" @click="showCardModal = false" aria-label="Cerrar vista expandida">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <ProductCard :product="product" :isExpanded="true" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </article>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');

/*
  Variables globales asumidas de la arquitectura CSS de la aplicacion.
  En caso de estar definidos globalmente, se integraran naturalmente.
  Se dejan throwbacks por seguridad.
*/
.product-card {
  --pc-primary: var(--color-primary, #1a91db);
  --pc-primary-hover: color-mix(in srgb, var(--pc-primary) 85%, black);
  --pc-text: var(--color-text-primary, #333333);
  --pc-text-light: #777777;
  --pc-bg: var(--color-bg-card, #ffffff);
  --pc-border: rgba(0, 0, 0, 0.08);
  --pc-gradient-start: color-mix(in srgb, var(--color-accent, #ffb74d) 20%, white);
  --pc-gradient-end: color-mix(in srgb, var(--color-accent, #f57c00) 60%, white);

  display: flex;
  flex-direction: column;
  background-color: var(--pc-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  font-family: var(--font-primary, system-ui, -apple-system, sans-serif);
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s;
}
.product-card:not(.is-modal-view):hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}
.product-card.is-modal-view {
  cursor: default;
  transform: none !important;
  box-shadow: none;
}

/* --- SECCION VISUAL --- */
.product-visual {
  position: relative;
  width: 100%;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
}

.visual-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--pc-gradient-start) 0%, var(--pc-gradient-end) 100%);
  z-index: 0;
}

.visual-controls {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  right: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 2;
}

/* Boton de compartir */
.share-wrapper {
  position: relative;
}

.action-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pc-primary);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.05);
  background: #ffffff;
}

/* Dropdown Redes Sociales */
.share-dropdown {
  position: absolute;
  top: 48px;
  right: 0;
  background: var(--pc-bg);
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 140px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.network-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--pc-text);
  cursor: pointer;
  transition: background 0.2s;
}

.network-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--pc-primary);
}

/* Elemento de Transicion */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.product-image {
  position: relative;
  z-index: 1;
  max-width: 80%;
  max-height: 140px;
  object-fit: contain;
  filter: drop-shadow(0 15px 10px rgba(0, 0, 0, 0.2));
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.product-visual:hover .product-image {
  transform: scale(1.05) rotate(-2deg);
}

/* --- DETALLES DE PRODUCTO --- */
.product-details {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Cabecera */
.details-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--pc-text);
  margin: 0;
  letter-spacing: -0.02em;
}

.status-badge {
  background: var(--pc-primary);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--pc-text-light);
  margin: 0;
  font-weight: 500;
}

.product-barcode {
  font-family: 'Libre Barcode 39', cursive;
  font-size: 3.5rem;
  line-height: 0.5;
  margin: 0;
  color: var(--pc-text);
  opacity: 0.9;
}

/* Componentes comunes info */
.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--pc-text);
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.05em;
}

.separator {
  border: none;
  border-top: 1px dashed rgba(0,0,0,0.15);
  height: 1px;
  background-color: transparent;
  margin: 0.5rem 0;
}

/* Descripcion */
.section-text {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--pc-text-light);
  margin: 0;
}

/* Selector Cantidad y Combo */
.quantity-combo-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--pc-border);
  background: transparent;
  border-radius: 6px;
  color: var(--pc-text);
  cursor: pointer;
  transition: all 0.2s;
}

.qty-btn:not(:disabled):hover {
  border-color: var(--pc-primary);
  color: var(--pc-primary);
  background: rgba(0, 0, 0, 0.02);
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-display {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--pc-text);
  min-width: 30px;
  text-align: center;
}

/* Combo Section Layout */
.combo-section {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.combos-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: stretch;
  gap: 0.5rem;
  max-width: 100%;
}

.combo-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-accent, #e59524);
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.combo-pill {
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--color-accent, #e59524) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent, #e59524) 25%, transparent);
  border-radius: 8px;
  padding: 0.4rem 0.5rem;
  font-size: 0.70rem;
  text-align: center;
  flex: 1 1 calc(50% - 0.5rem);
  min-width: 110px;
  transition: background 0.2s;
}
.combo-pill:hover {
  background: color-mix(in srgb, var(--color-accent, #e59524) 15%, transparent);
}

.combo-name {
  font-weight: 800;
  color: var(--pc-text);
  font-size: 0.75rem;
}

.combo-desc {
  color: var(--pc-primary);
  font-weight: 600;
  margin-top: 1px;
}

/* Footer (Boton de compra y precio) */
.details-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.add-to-cart-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--pc-primary);
  color: #ffffff;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
  flex: 1;
  justify-content: center;
  min-width: 120px;
}

.add-to-cart-btn:hover {
  background: var(--pc-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.add-to-cart-btn.is-agotado {
  background: rgba(128,128,128,0.4);
  color: rgba(255,255,255,0.8);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.add-to-cart-btn.is-added {
  background: #2e7d32;
}

.fav-heart-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1.5px solid rgba(128,128,128,0.2);
  background: transparent;
  cursor: pointer;
  color: var(--pc-text-light);
  transition: all 0.2s;
  flex-shrink: 0;
}
.fav-heart-btn:hover { border-color: #e53935; color: #e53935; background: rgba(229,57,53,0.06); }
.fav-heart-btn.active { color: #e53935; border-color: rgba(229,57,53,0.3); background: rgba(229,57,53,0.08); }

.price-display {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--pc-text);
  font-variant-numeric: tabular-nums;
}

.currency {
  font-size: 1rem;
  margin-right: 0.1rem;
  font-weight: 600;
}

/* --- RESPONSIVE DESIGN --- */
/* --- START DE DISEÑO HORIZONTAL (DESKTOP) --- */
@media (min-width: 768px) {
  .product-card.is-modal-view {
    flex-direction: row;
    max-width: 900px;
    height: 100%;
  }

  .product-card.is-modal-view .product-visual {
    flex: 1;
    min-height: auto;
    width: 45%;
  }

  .product-card.is-modal-view .product-details {
    flex: 1;
    width: 55%;
    padding: 2.5rem;
    justify-content: center;
  }
  
  .product-card.is-modal-view .product-image {
    max-height: 320px;
    max-width: 90%;
  }

  .product-card.is-modal-view .title { font-size: 1.6rem; }
  .product-card.is-modal-view .section-title { font-size: 0.85rem; }
  .product-card.is-modal-view .section-text { font-size: 0.95rem; line-height: 1.6; }
  .product-card.is-modal-view .price-display { font-size: 1.8rem; }
}

/* --- ESTILOS DEL MODAL FULL CARD --- */
.card-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.card-modal-wrapper {
  position: relative;
  width: 100%;
  max-width: 900px;
  min-height: 250px;
  display: flex;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  border-radius: 16px;
  animation: modalFloatIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.modal-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(128,128,128,0.15);
  border: none;
  color: var(--pc-text, #111);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1000;
}
.modal-close-btn:hover { background: #e53935; color: white; transform: rotate(90deg); }

@keyframes modalFloatIn {
  0% { opacity: 0; transform: scale(0.9) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
