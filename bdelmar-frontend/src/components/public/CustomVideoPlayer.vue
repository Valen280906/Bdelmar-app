<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const videoData = ref(null)
const isLoading = ref(true)

const videoRef = ref(null)
const audioRef = ref(null)   // Audio 1
const audioRef2 = ref(null)  // Audio 2

const isPlaying = ref(false)
const volume = ref(1)
const isMuted = ref(false)
const currentSubtitle = ref('off')
const currentAudioTrack = ref('original') // 'original' | 'audio1' | 'audio2'

// Progress / seek
const currentTime = ref(0)
const duration = ref(0)
const isSeeking = ref(false)

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function onVideoLoadedMetadata() {
  duration.value = videoRef.value?.duration || 0
}

function onProgressInput(e) {
  isSeeking.value = true
  const val = parseFloat(e.target.value)
  if (videoRef.value) {
    videoRef.value.currentTime = val
    currentTime.value = val
  }
  if (audioRef.value) {
    audioRef.value.currentTime = val
  }
}

function onProgressChange(e) {
  isSeeking.value = false
}

// Fetch active video
onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/videos/active')
    const json = await res.json()
    if (json.success && json.data) {
      videoData.value = json.data
      
      // Ajustar URLs si son relativas
      if (videoData.value.video_url && videoData.value.video_url.startsWith('/')) {
        videoData.value.video_url = `http://localhost:3001${videoData.value.video_url}`
      }
      if (videoData.value.subtitle_es_url && videoData.value.subtitle_es_url.startsWith('/')) {
        videoData.value.subtitle_es_url = `http://localhost:3001${videoData.value.subtitle_es_url}`
      }
      if (videoData.value.subtitle_en_url && videoData.value.subtitle_en_url.startsWith('/')) {
        videoData.value.subtitle_en_url = `http://localhost:3001${videoData.value.subtitle_en_url}`
      }
      if (videoData.value.audio_url && videoData.value.audio_url.startsWith('/')) {
        videoData.value.audio_url = `http://localhost:3001${videoData.value.audio_url}`
      }
      if (videoData.value.audio_url_2 && videoData.value.audio_url_2.startsWith('/')) {
        videoData.value.audio_url_2 = `http://localhost:3001${videoData.value.audio_url_2}`
      }
    }
  } catch(e) {
    console.error('Error fetching active video:', e)
  } finally {
    isLoading.value = false
  }
})

// === CONTROLES ===
function togglePlay() {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play()
    if (audioRef.value && currentAudioTrack.value === 'audio1') audioRef.value.play()
    if (audioRef2.value && currentAudioTrack.value === 'audio2') audioRef2.value.play()
    isPlaying.value = true
  } else {
    videoRef.value.pause()
    if (audioRef.value) audioRef.value.pause()
    if (audioRef2.value) audioRef2.value.pause()
    isPlaying.value = false
  }
}

function handleVolumeChange(e) {
  volume.value = parseFloat(e.target.value)
  if (volume.value === 0) {
    isMuted.value = true
  } else {
    isMuted.value = false
  }
  updateMediaVolume()
}

function toggleMute() {
  isMuted.value = !isMuted.value
  if (isMuted.value) {
    // Si se mutea, guarda el volumen actual pero no lo resetea a 0, solo aplica mute real
  } else {
    if (volume.value === 0) volume.value = 1
  }
  updateMediaVolume()
}

function updateMediaVolume() {
  const actualVolume = isMuted.value ? 0 : volume.value
  if (videoRef.value) {
    videoRef.value.volume = currentAudioTrack.value === 'original' ? actualVolume : 0
  }
  if (audioRef.value) {
    audioRef.value.volume = currentAudioTrack.value === 'audio1' ? actualVolume : 0
  }
  if (audioRef2.value) {
    audioRef2.value.volume = currentAudioTrack.value === 'audio2' ? actualVolume : 0
  }
}

watch(currentAudioTrack, (newTrack) => {
  // Pausar todos los audios alternativos
  if (audioRef.value) audioRef.value.pause()
  if (audioRef2.value) audioRef2.value.pause()

  updateMediaVolume()

  if (!videoRef.value || videoRef.value.paused) return

  if (newTrack === 'audio1' && audioRef.value) {
    audioRef.value.currentTime = videoRef.value.currentTime
    audioRef.value.play()
  } else if (newTrack === 'audio2' && audioRef2.value) {
    audioRef2.value.currentTime = videoRef.value.currentTime
    audioRef2.value.play()
  }
})

function onVideoPlay() {
  isPlaying.value = true
  if (currentAudioTrack.value === 'audio1' && audioRef.value) audioRef.value.play()
  if (currentAudioTrack.value === 'audio2' && audioRef2.value) audioRef2.value.play()
}

function onVideoPause() {
  isPlaying.value = false
  if (audioRef.value) audioRef.value.pause()
  if (audioRef2.value) audioRef2.value.pause()
}

function onVideoSeeked() {
  const t = videoRef.value?.currentTime || 0
  if (audioRef.value) audioRef.value.currentTime = t
  if (audioRef2.value) audioRef2.value.currentTime = t
}

function onVideoTimeUpdate() {
  if (!isSeeking.value && videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
  // Hard sync si la diferencia es mayor a 0.25 seg
  const t = videoRef.value?.currentTime || 0
  if (currentAudioTrack.value === 'audio1' && audioRef.value) {
    if (Math.abs(audioRef.value.currentTime - t) > 0.25) audioRef.value.currentTime = t
  }
  if (currentAudioTrack.value === 'audio2' && audioRef2.value) {
    if (Math.abs(audioRef2.value.currentTime - t) > 0.25) audioRef2.value.currentTime = t
  }
}

// === MANEJO DE SUBTITULOS ===
watch(currentSubtitle, (newSub) => {
  if (!videoRef.value) return
  const tracks = videoRef.value.textTracks
  for (let i = 0; i < tracks.length; i++) {
    tracks[i].mode = 'hidden' // Ocultar todos
  }
  if (newSub !== 'off') {
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].language === newSub) {
        tracks[i].mode = 'showing'
      }
    }
  }
})

// Asegurarse de ocultar todos al cargar y aplicar volumen
onMounted(() => {
  // Necesitamos esperar a que se asigne el ref, como dependemos de videoData, usamos un timeout simple o check interval
  const initInterval = setInterval(() => {
    if (videoRef.value) {
      updateMediaVolume()
      if (videoRef.value.textTracks) {
        for (let i = 0; i < videoRef.value.textTracks.length; i++) {
          videoRef.value.textTracks[i].mode = 'hidden'
        }
      }
      clearInterval(initInterval)
    }
  }, 100)
})

</script>

<template>
  <div v-if="!isLoading && videoData" class="video-section">
    <div class="video-container shadow-card">
      
      <!-- Titulo superior opcional -->
      <div class="video-header">
        <h3>{{ videoData.name }}</h3>
        <span class="badge-new">Nuevo Contenido</span>
      </div>

      <!-- Wrapper del Video -->
      <div class="video-wrapper">
        <video 
          ref="videoRef"
          class="custom-video"
          :src="videoData.video_url"
          preload="metadata"
          crossorigin="anonymous"
          @play="onVideoPlay"
          @pause="onVideoPause"
          @seeked="onVideoSeeked"
          @timeupdate="onVideoTimeUpdate"
          @loadedmetadata="onVideoLoadedMetadata"
          @click="togglePlay"
        >
          <track 
            v-if="videoData.subtitle_es_url" 
            kind="subtitles" 
            :src="videoData.subtitle_es_url" 
            srclang="es" 
            label="Español" 
            default 
          />
          <track 
            v-if="videoData.subtitle_en_url" 
            kind="subtitles" 
            :src="videoData.subtitle_en_url" 
            srclang="en" 
            label="English" 
          />
          Tu navegador no soporta el tag de video.
        </video>

        <!-- Elemento oculto para audio alternativo 1 -->
        <audio 
          v-if="videoData.audio_url"
          ref="audioRef"
          :src="videoData.audio_url"
          preload="auto"
        ></audio>

        <!-- Elemento oculto para audio alternativo 2 -->
        <audio 
          v-if="videoData.audio_url_2"
          ref="audioRef2"
          :src="videoData.audio_url_2"
          preload="auto"
        ></audio>

        <!-- Overlay de Play grande al estar en pausa -->
        <div class="play-overlay" v-show="!isPlaying" @click="togglePlay">
          <svg viewBox="0 0 24 24" class="play-icon-large"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>

      <!-- Barra de Progreso (Seek) -->
      <div class="progress-bar-row">
        <span class="time-label">{{ formatTime(currentTime) }}</span>
        <input
          type="range"
          class="progress-slider"
          :min="0"
          :max="duration || 100"
          step="0.1"
          :value="currentTime"
          @input="onProgressInput"
          @change="onProgressChange"
        />
        <span class="time-label">{{ formatTime(duration) }}</span>
      </div>

      <!-- Barra de Controles Personalizada -->
      <div class="video-controls">
        <button class="ctrl-btn play-btn" @click="togglePlay" aria-label="Play/Pause">
          <svg v-if="!isPlaying" viewBox="0 0 24 24" class="ctrl-icon"><path d="M8 5v14l11-7z"/></svg>
          <svg v-else viewBox="0 0 24 24" class="ctrl-icon"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>

        <div class="volume-group">
          <button class="ctrl-btn" @click="toggleMute" aria-label="Mute/Unmute">
            <svg v-if="isMuted || volume === 0" viewBox="0 0 24 24" class="ctrl-icon"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            <svg v-else viewBox="0 0 24 24" class="ctrl-icon"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
          <input type="range" min="0" max="1" step="0.05" :value="isMuted ? 0 : volume" @input="handleVolumeChange" class="volume-slider" />
        </div>

        <div class="spacer"></div>

        <div class="track-group">
          <label class="ctrl-label">Audio:</label>
          <select v-model="currentAudioTrack" class="ctrl-select">
            <option value="original">🎬 Original</option>
            <option v-if="videoData.audio_url" value="audio1">🎙️ Audio 1</option>
            <option v-if="videoData.audio_url_2" value="audio2">🎙️ Audio 2</option>
          </select>
        </div>

        <div class="track-group" v-if="videoData.subtitle_es_url || videoData.subtitle_en_url">
          <label class="ctrl-label">Subtítulos:</label>
          <select v-model="currentSubtitle" class="ctrl-select">
            <option value="off">Apagado</option>
            <option v-if="videoData.subtitle_es_url" value="es">Español</option>
            <option v-if="videoData.subtitle_en_url" value="en">English</option>
          </select>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.video-section {
  padding: 4rem 1.5rem;
  background: var(--color-bg-page);
  display: flex;
  justify-content: center;
}

.video-container {
  max-width: 1000px;
  width: 100%;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
}

.video-header {
  background: linear-gradient(135deg, var(--color-primary), #000);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.video-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
}

.badge-new {
  background: var(--color-accent);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.video-wrapper {
  position: relative;
  width: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.custom-video {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
}

/* Ocultar controles nativos siempre */
.custom-video::-webkit-media-controls {
  display: none !important;
}

/* Styling native subtitles if supported via CSS pseudo-elements */
.custom-video::cue {
  background: transparent;
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  text-shadow: 
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000,
    0 2px 4px rgba(0,0,0,0.8);
  padding: 0.5rem;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0,0,0,0.3);
  transition: background 0.2s;
}

.play-overlay:hover {
  background: rgba(0,0,0,0.4);
}

.play-icon-large {
  width: 80px;
  height: 80px;
  fill: #fff;
  opacity: 0.8;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
  transition: transform 0.2s, opacity 0.2s;
}

.play-overlay:hover .play-icon-large {
  transform: scale(1.1);
  opacity: 1;
}

.progress-bar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.5rem 0;
  background: #111;
}

.progress-slider {
  flex: 1;
  height: 4px;
  accent-color: var(--color-primary);
  cursor: pointer;
  border-radius: 2px;
}

.time-label {
  color: #aaa;
  font-size: 0.8rem;
  font-family: monospace;
  white-space: nowrap;
  min-width: 36px;
  text-align: center;
}

.video-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1.5rem 1rem;
  background: #111;
  flex-wrap: wrap;
}

.ctrl-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.ctrl-btn:hover {
  background: rgba(255,255,255,0.1);
}

.ctrl-icon {
  width: 24px;
  height: 24px;
  fill: #fff;
}

.play-btn {
  background: var(--color-primary);
}

.play-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 80%, white);
}

.volume-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.volume-slider {
  width: 80px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.spacer {
  flex: 1;
}

.track-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ctrl-label {
  color: #aaa;
  font-size: 0.85rem;
  font-weight: 600;
}

.ctrl-select {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.ctrl-select:focus {
  border-color: var(--color-primary);
}

.ctrl-select option {
  background: #222;
  color: #fff;
}

@media (max-width: 600px) {
  .video-controls {
    justify-content: center;
  }
  .spacer {
    display: none;
  }
}
</style>
