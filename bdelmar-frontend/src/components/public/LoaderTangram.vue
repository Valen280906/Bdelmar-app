<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['done'])

// 0 = fish, 1 = stairs, 2 = boat
const currentFigure = ref(-1)   // -1 = explotado/invisible al inicio
let timeouts = []

onMounted(() => {
  timeouts.push(setTimeout(() => { currentFigure.value = 0 }, 200))          // Pez
  timeouts.push(setTimeout(() => { currentFigure.value = -1 }, 1700))        // Explode
  timeouts.push(setTimeout(() => { currentFigure.value = 1 }, 2200))         // Escalera
  timeouts.push(setTimeout(() => { currentFigure.value = -1 }, 3500))        // Explode
  timeouts.push(setTimeout(() => { currentFigure.value = 2 }, 4000))         // Barco
  timeouts.push(setTimeout(() => { emit('done') }, 5500))
})

onUnmounted(() => {
  timeouts.forEach(clearTimeout)
})
</script>

<template>
  <div class="loader-overlay">
    <div class="scene">
      <!-- SVG Canvas donde viven los tres tangram -->
      <svg
        class="tangram-svg"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- =========================================================
             FIGURA 0 – TANGRAM 188.png (Cisne / Figura)
        ========================================================= -->
        <polygon :class="['piece', currentFigure === 0 ? 'vis' : 'hid']" points="301,333 555,587 555,333" fill="var(--tangram-c1)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0s" />
        <polygon :class="['piece', currentFigure === 0 ? 'vis' : 'hid']" points="243,654 602,654 423,475" fill="var(--tangram-c2)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.05s" />
        <polygon :class="['piece', currentFigure === 0 ? 'vis' : 'hid']" points="697,458 570,458 570,585" fill="var(--tangram-c4)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.1s" />
        <polygon :class="['piece', currentFigure === 0 ? 'vis' : 'hid']" points="141,331 141,458 268,585 268,458" fill="var(--tangram-c5)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.15s" />
        <polygon :class="['piece', currentFigure === 0 ? 'vis' : 'hid']" points="695,316 568,442 695,442" fill="var(--tangram-c6)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.2s" />
        <polygon :class="['piece', currentFigure === 0 ? 'vis' : 'hid']" points="357,193 357,320 484,320 484,193" fill="var(--tangram-c7)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.25s" />
        <polygon :class="['piece', currentFigure === 0 ? 'vis' : 'hid']" points="285,335 286,589 412,462" fill="var(--tangram-c3)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.3s" />

        <!-- =========================================================
             FIGURA 1 – TANGRAM 93.png (Escalera)
        ========================================================= -->
        <polygon :class="['piece', currentFigure === 1 ? 'vis' : 'hid']" points="0,799 253,551 0,551" fill="var(--tangram-c2)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0s" />
        <polygon :class="['piece', currentFigure === 1 ? 'vis' : 'hid']" points="126,407 126,534 253,534 253,407" fill="var(--tangram-c7)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.05s" />
        <polygon :class="['piece', currentFigure === 1 ? 'vis' : 'hid']" points="395,285 268,412 268,539 395,412" fill="var(--tangram-c5)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.1s" />
        <polygon :class="['piece', currentFigure === 1 ? 'vis' : 'hid']" points="391,270 264,270 264,397" fill="var(--tangram-c6)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.15s" />
        <polygon :class="['piece', currentFigure === 1 ? 'vis' : 'hid']" points="662,149 408,149 408,403" fill="var(--tangram-c1)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.2s" />
        <polygon :class="['piece', currentFigure === 1 ? 'vis' : 'hid']" points="545,12 545,138 671,138" fill="var(--tangram-c4)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.25s" />
        <polygon :class="['piece', currentFigure === 1 ? 'vis' : 'hid']" points="545,12 799,12 671,138" fill="var(--tangram-c3)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.3s" />

        <!-- =========================================================
             FIGURA 2 – TANGRAM 39.png (Barco)
        ========================================================= -->
        <polygon :class="['piece', currentFigure === 2 ? 'vis' : 'hid']" points="385,357 385,484 512,484 512,358" fill="var(--tangram-c7)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0s" />
        <polygon :class="['piece', currentFigure === 2 ? 'vis' : 'hid']" points="246,78 246,332 500,332" fill="var(--tangram-c1)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.05s" />
        <polygon :class="['piece', currentFigure === 2 ? 'vis' : 'hid']" points="532,231 532,484 658,358" fill="var(--tangram-c3)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.1s" />
        <polygon :class="['piece', currentFigure === 2 ? 'vis' : 'hid']" points="274,78 512,316 512,78" fill="var(--tangram-c2)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.15s" />
        <polygon :class="['piece', currentFigure === 2 ? 'vis' : 'hid']" points="96,353 222,479 350,479 224,353" fill="var(--tangram-c5)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.2s" />
        <polygon :class="['piece', currentFigure === 2 ? 'vis' : 'hid']" points="243,357 370,484 370,357" fill="var(--tangram-c6)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.25s" />
        <polygon :class="['piece', currentFigure === 2 ? 'vis' : 'hid']" points="226,209 99,336 226,336" fill="var(--tangram-c4)" style="--tx:0px;--ty:0px;--r:0deg;--delay:0.3s" />
      </svg>
    </div>

    <div class="loader-text">
      Cargando<span>.</span><span>.</span><span>.</span>
    </div>
  </div>
</template>

<style scoped>
.loader-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: var(--color-bg-page, #1a1a2e);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 999999;
  overflow: hidden;
}

.scene {
  width: 320px;
  height: 320px;
  position: relative;
}

.tangram-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 8px 32px rgba(0,0,0,0.4));
  
  /* Mapeo de colores dinámicos según el tema activo */
  --tangram-c1: var(--color-primary, #2196F3);
  --tangram-c2: var(--color-accent, #D81B60);
  --tangram-c3: var(--color-secondary, #7B1FA2);
  --tangram-c4: color-mix(in srgb, var(--color-primary) 60%, var(--color-text-primary) 40%);
  --tangram-c5: color-mix(in srgb, var(--color-accent) 80%, var(--color-text-primary) 20%);
  --tangram-c6: color-mix(in srgb, var(--color-secondary) 80%, var(--color-text-primary) 20%);
  --tangram-c7: color-mix(in srgb, var(--color-primary) 40%, var(--color-accent) 60%);
}

/* ── Piezas SVG: animación de entrada/salida ── */
.piece {
  transition:
    opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1) var(--delay, 0s),
    transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) var(--delay, 0s);
  transform-origin: center center;
  transform-box: fill-box;
}

/* Visible */
.piece.vis {
  opacity: 1;
  transform: translate(var(--tx, 0), var(--ty, 0)) rotate(0deg) scale(1);
}

/* Oculto/explode */
.piece.hid {
  opacity: 0;
  transform: translate(var(--tx, 0), var(--ty, 0)) rotate(90deg) scale(0.2);
}

/* El ojo no escala raro */
.piece.eye.hid {
  transform: scale(0);
}
.piece.eye.vis {
  transform: scale(1);
}

/* Loader Text */
.loader-text {
  font-family: var(--font-family-heading, 'Merriweather', serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary, #ffffff);
  margin-top: 2.5rem;
  letter-spacing: 0.05em;
  animation: pulse 2s infinite ease-in-out;
}

.loader-text span { animation: dots 1.5s infinite both; }
.loader-text span:nth-child(2) { animation-delay: 0.2s; }
.loader-text span:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

@keyframes dots {
  0%, 20% { opacity: 0; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-4px); }
  80%, 100% { opacity: 0; transform: translateY(0); }
}
</style>
