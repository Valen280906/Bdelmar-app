<script setup>
import { onMounted, onUnmounted, shallowRef } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'
import { useThemeStore } from '@/stores/useThemeStore'

const emit = defineEmits(['done'])
const canvasRef = shallowRef(null)
const themeStore = useThemeStore()

// Shape geometries (Centered rigid bodies)
const shapesData = {
  c1: [-169.3,-84.7, 84.7,169.3, 84.7,-84.7], // Blue Large
  c2: [-179.7,59.7, 179.3,59.7, 0.3,-119.3], // Magenta Large
  c3: [-42.7,-127.0, -41.7,127.0, 84.3,0.0], // Purple Medium
  c4: [84.7,-42.3, -42.3,-42.3, -42.3,84.7], // Teal Small
  c5: [-63.5,-127.0, -63.5,0.0, 63.5,127.0, 63.5,0.0], // Orange Parallelogram
  c6: [42.3,-84.0, -84.7,42.0, 42.3,42.0], // Red Small
  c7: [-63.5,-63.5, -63.5,63.5, 63.5,63.5, 63.5,-63.5] // Green Square
}

// Exact transformations to build the 3 figures
const transformations = [
  // Figure 0: Cisne / Figura de pie
  {
    c1: { x: 470.3, y: 417.7, rot: 0 },
    c2: { x: 422.7, y: 594.3, rot: 0 },
    c3: { x: 327.7, y: 462.0, rot: 0 },
    c4: { x: 612.3, y: 500.3, rot: 0 },
    c5: { x: 204.5, y: 458.0, rot: 0 },
    c6: { x: 652.7, y: 400.0, rot: 0 },
    c7: { x: 420.5, y: 256.5, rot: 0 }
  },
  // Figure 1: Escalera
  {
    c1: { x: 505.7, y: 220.7, rot: -90 }, // Movido a la derecha y arriba
    c2: { x: 84.3, y: 633.7, rot: -45 },  // Base
    c3: { x: 695.0, y: 45.0, rot: 90 },   // Punta superior movida y volteada hacia abajo
    c4: { x: 588.0, y: 87.0, rot: -90 },  // Debajo de la punta superior, movido ligeramente izquierda y abajo
    c5: { x: 345.0, y: 395.0, rot: 45 },  // Paralelogramo movido a la derecha y arriba
    c6: { x: 290.0, y: 290.0, rot: 180 }, // Triangulo arriba del cuadrado, movido izquierda y arriba
    c7: { x: 175.5, y: 470.5, rot: 0 }    // Cuadrado movido a la izquierda
  },
  // Figure 2: Barco
  {
    c1: { x: 330.7, y: 230.0, rot: -180 }, // Movido hacia arriba
    c2: { x: 445.0, y: 145.0, rot: 45 },   // Movido derecha y arriba
    c3: { x: 590.0, y: 350.0, rot: 0 },    // Movido derecha
    c4: { x: 185.0, y: 285.0, rot: -180 }, // Separado del azul hacia la izquierda
    c5: { x: 195.0, y: 430.0, rot: -45 },  // Paralelogramo movido ligeramente más abajo e izquierda
    c6: { x: 327.7, y: 399.3, rot: -90 },  // Base centro
    c7: { x: 460.0, y: 420.8, rot: -180 }  // Base derecha movida derecha
  }
]

let scene, camera, renderer, animationFrameId
let pieces = {}
let timeline
const piecesOrder = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']
const group = new THREE.Group()

// Obtiene el color directamente del ThemeStore (fuente de verdad de la paleta activa)
// Esto garantiza que los colores del tangram siempre coincidan con el tema configurado
// (claro, oscuro o daltónico) sin depender del timing del CSS computado.
const getThemeColor = (key, fallback) => {
  const colors = themeStore.state.currentColors
  const colorMap = {
    '--tangram-c1': colors.primary,
    '--tangram-c2': colors.accent,
    '--tangram-c3': colors.secondary,
    '--tangram-c4': colors.primary,   // mezcla primary + textPrimary
    '--tangram-c5': colors.accent,    // mezcla accent + textPrimary
    '--tangram-c6': colors.secondary, // mezcla secondary + textPrimary
    '--tangram-c7': colors.primary,   // mezcla primary + accent
  }
  return colorMap[key] || fallback
}

// Crea un material Three.js a partir del color de la paleta activa
const createMaterial = (varName, fallback) => {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(getThemeColor(varName, fallback)),
    metalness: 0.1,
    roughness: 0.15,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    reflectivity: 1,
    flatShading: false
  })
}

onMounted(() => {
  if (!canvasRef.value) return

  const width = window.innerWidth
  const height = window.innerHeight
  
  // 1. ESCENA Y CÁMARA
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000)
  camera.position.set(0, 0, 1300)

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, alpha: true, antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // 2. ILUMINACIÓN PREMIUM
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
  directionalLight.position.set(300, 600, 1000)
  scene.add(directionalLight)
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.6)
  fillLight.position.set(-500, -200, -300)
  scene.add(fillLight)

  // 3. EXTRUSIÓN GRUESA DE LAS PIEZAS
  const extrudeSettings = { 
    depth: 50, // Ligeramente menos profundo para balancear
    bevelEnabled: true, 
    bevelSegments: 3, 
    steps: 1, 
    bevelSize: 1.5, // Bisel más pequeño para evitar que la geometría se infle y choque
    bevelThickness: 2 
  }

  const materials = {
    c1: createMaterial('--tangram-c1', '#2196F3'),
    c2: createMaterial('--tangram-c2', '#D81B60'),
    c3: createMaterial('--tangram-c3', '#7B1FA2'),
    c4: createMaterial('--tangram-c4', '#00BCD4'),
    c5: createMaterial('--tangram-c5', '#FF9800'),
    c6: createMaterial('--tangram-c6', '#F44336'),
    c7: createMaterial('--tangram-c7', '#4CAF50')
  }

  // Centro de las imágenes originales para alinear el origen (0,0) de la figura 3D
  const X_OFFSET = 400
  const Y_OFFSET = 400

  piecesOrder.forEach((key) => {
    const pts = shapesData[key]
    const shape = new THREE.Shape()
    for (let i = 0; i < pts.length; i += 2) {
      // Invertir Y porque Three.js Y crece hacia arriba, y el canvas Y crece hacia abajo
      if (i === 0) shape.moveTo(pts[i], -pts[i+1]) 
      else shape.lineTo(pts[i], -pts[i+1])
    }
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    // Centrar la geometría en Z para que rote perfectamente sobre su propio eje
    geometry.translate(0, 0, -30)
    
    const mesh = new THREE.Mesh(geometry, materials[key])
    
    // Estado inicial: Piezas flotando y escaladas (explotadas)
    mesh.position.set(
      (Math.random() - 0.5) * 2000, 
      (Math.random() - 0.5) * 2000, 
      (Math.random() - 0.5) * 2000 + 500
    )
    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    )
    mesh.scale.setScalar(0.01)

    pieces[key] = mesh
    group.add(mesh)
  })

  // Inclinación suave para ver el grosor y perspectiva
  group.rotation.x = 0.15
  group.rotation.y = -0.15
  scene.add(group)

  // 4. BUCLE DE RENDERIZADO
  const tick = () => {
    // Movimiento sutil de flotación para que siempre se vea de frente
    const time = Date.now() * 0.001
    group.rotation.y = -0.15 + Math.sin(time * 0.5) * 0.05
    group.rotation.x = 0.15 + Math.cos(time * 0.5) * 0.05
    
    renderer.render(scene, camera)
    animationFrameId = requestAnimationFrame(tick)
  }
  tick()

  // 5. MANEJO DE REDIMENSIÓN
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)

  // 6. COREOGRAFÍA GSAP
  timeline = gsap.timeline()
  
  const getTransform = (figIdx, key) => {
    const t = transformations[figIdx][key]
    return {
      x: t.x - X_OFFSET,
      y: -(t.y - Y_OFFSET),
      z: 0,
      // Convertir rotación 2D a rotación Z en Three.js
      rotationZ: -t.rot * (Math.PI / 180) 
    }
  }

  const animateToFigure = (figIdx, delayOffset = 0) => {
    piecesOrder.forEach((key, index) => {
      const target = getTransform(figIdx, key)
      const startDelay = delayOffset + (index * 0.05)
      
      timeline.to(pieces[key].position, {
        x: target.x, y: target.y, z: target.z,
        duration: 0.8, ease: "back.out(1.2)"
      }, startDelay)
      
      timeline.to(pieces[key].rotation, {
        x: 0, y: 0, z: target.rotationZ,
        duration: 0.8, ease: "back.out(1.2)"
      }, startDelay)
      
      timeline.to(pieces[key].scale, {
        x: 0.96, y: 0.96, z: 0.96, // Escalar al 96% crea un hermoso espacio/separación entre piezas evitando que choquen
        duration: 0.8, ease: "back.out(1.2)"
      }, startDelay)
    })
  }

  const explodePieces = (delayOffset) => {
    piecesOrder.forEach((key, index) => {
      const startDelay = delayOffset + (index * 0.02)
      
      timeline.to(pieces[key].position, {
        x: (Math.random() - 0.5) * 1500,
        y: (Math.random() - 0.5) * 1500,
        z: (Math.random() - 0.5) * 1500 + 400,
        duration: 0.6, ease: "power2.in"
      }, startDelay)
      
      timeline.to(pieces[key].rotation, {
        x: Math.random() * Math.PI * 4,
        y: Math.random() * Math.PI * 4,
        z: Math.random() * Math.PI * 4,
        duration: 0.6, ease: "power2.in"
      }, startDelay)
      
      timeline.to(pieces[key].scale, {
        x: 0.2, y: 0.2, z: 0.2,
        duration: 0.6, ease: "power2.in"
      }, startDelay)
    })
  }

  // Secuencia de tiempo (7.0 segundos en total)
  animateToFigure(2, 0.2)
  explodePieces(2.2)
  animateToFigure(1, 2.8)
  explodePieces(4.8)
  animateToFigure(0, 5.4)

  // Cerrar el loader a los 7 segundos
  gsap.delayedCall(7.0, () => {
    emit('done')
  })
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (timeline) timeline.kill()
  gsap.killTweensOf(emit)
  
  if (scene) {
    scene.traverse((object) => {
      if (object.isMesh) {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose())
          } else {
            object.material.dispose()
          }
        }
      }
    })
  }
  
  if (renderer) renderer.dispose()
  window.removeEventListener('resize', () => {})
})
</script>

<template>
  <div class="loader-overlay scene-container">
    <canvas ref="canvasRef" class="webgl-canvas"></canvas>

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
  
  /* Mapeo de colores dinámicos según el tema activo para que el script los lea */
  --tangram-c1: var(--color-primary, #2196F3);
  --tangram-c2: var(--color-accent, #D81B60);
  --tangram-c3: var(--color-secondary, #7B1FA2);
  --tangram-c4: color-mix(in srgb, var(--color-primary) 60%, var(--color-text-primary) 40%);
  --tangram-c5: color-mix(in srgb, var(--color-accent) 80%, var(--color-text-primary) 20%);
  --tangram-c6: color-mix(in srgb, var(--color-secondary) 80%, var(--color-text-primary) 20%);
  --tangram-c7: color-mix(in srgb, var(--color-primary) 40%, var(--color-accent) 60%);
}

.webgl-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  outline: none;
}

/* Loader Text */
.loader-text {
  position: relative;
  z-index: 10;
  font-family: var(--font-family-heading, 'Merriweather', serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary, #ffffff);
  margin-top: 2.5rem;
  letter-spacing: 0.05em;
  
  /* Ajustar texto por debajo de la animación gigante central */
  transform: translateY(200px);
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
