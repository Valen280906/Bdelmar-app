<script setup>
import { ref, onMounted } from 'vue'

const videos = ref([])
const isLoading = ref(true)

const showModal = ref(false)
const modalTitle = ref('Subir Video')
const form = ref({
  id: null,
  name: '',
  video_url: '',
  subtitle_es_url: '',
  subtitle_en_url: '',
  audio_url: '',
  audio_url_2: '',
  is_active: false
})

const fileInputs = ref({
  video: null,
  subEs: null,
  subEn: null,
  audio: null,
  audio2: null
})

const uploadLoading = ref(false)

// Editor de subtítulos
const showSubModal = ref(false)
const subEditorCues = ref([])
const subEditorLang = ref('')
const subEditorVideo = ref(null)
const subEditorLoading = ref(false)

const fetchVideos = async () => {
  isLoading.value = true
  try {
    const res = await fetch('http://localhost:3001/api/videos')
    const json = await res.json()
    if (json.success) videos.value = json.data
  } catch (error) {
    console.error('Error fetching videos:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchVideos()
})

function openAddModal() {
  form.value = {
    id: null, name: '', video_url: '', subtitle_es_url: '', subtitle_en_url: '', audio_url: '', audio_url_2: '', is_active: false
  }
  fileInputs.value = { video: null, subEs: null, subEn: null, audio: null, audio2: null }
  modalTitle.value = 'Subir Nuevo Video'
  showModal.value = true
}

function openEditModal(video) {
  form.value = { ...video, is_active: !!video.is_active }
  fileInputs.value = { video: null, subEs: null, subEn: null, audio: null, audio2: null }
  modalTitle.value = 'Editar Video'
  showModal.value = true
}

async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('http://localhost:3001/api/upload-media', {
    method: 'POST',
    body: formData
  })
  const json = await res.json()
  if (json.success) return json.fileUrl
  throw new Error(json.error || 'Error subiendo archivo')
}

async function saveVideo() {
  uploadLoading.value = true
  try {
    if (fileInputs.value.video) form.value.video_url = await uploadFile(fileInputs.value.video)
    if (fileInputs.value.subEs) form.value.subtitle_es_url = await uploadFile(fileInputs.value.subEs)
    if (fileInputs.value.subEn) form.value.subtitle_en_url = await uploadFile(fileInputs.value.subEn)
    if (fileInputs.value.audio) form.value.audio_url = await uploadFile(fileInputs.value.audio)
    if (fileInputs.value.audio2) form.value.audio_url_2 = await uploadFile(fileInputs.value.audio2)

    const url = form.value.id 
      ? `http://localhost:3001/api/videos/${form.value.id}` 
      : 'http://localhost:3001/api/videos'
    const method = form.value.id ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const json = await res.json()
    if (json.success) {
      showModal.value = false
      fetchVideos()
    } else {
      alert(json.error)
    }
  } catch(e) {
    console.error(e)
    alert('Error guardando video: ' + e.message)
  } finally {
    uploadLoading.value = false
  }
}

async function deleteVideo(id) {
  if (!confirm('¿Seguro que deseas eliminar este video?')) return
  try {
    await fetch(`http://localhost:3001/api/videos/${id}`, { method: 'DELETE' })
    fetchVideos()
  } catch(e) {
    console.error(e)
  }
}

function handleFileChange(field, e) {
  fileInputs.value[field] = e.target.files[0]
}

// === Editor de Subtítulos ===
async function openSubEditor(video, lang) {
  subEditorVideo.value = video
  subEditorLang.value = lang
  subEditorLoading.value = true
  showSubModal.value = true

  const urlField = lang === 'es' ? 'subtitle_es_url' : 'subtitle_en_url'
  const fileUrl = video[urlField]
  
  if (!fileUrl) {
    alert('No hay archivo de subtítulos subido para este idioma.')
    showSubModal.value = false
    return
  }

  const filename = fileUrl.split('/').pop()
  try {
    const res = await fetch(`http://localhost:3001/api/vtt/${filename}`)
    const json = await res.json()
    if (json.success) {
      subEditorCues.value = json.data
    } else {
      alert(json.error)
      showSubModal.value = false
    }
  } catch(e) {
    console.error(e)
    alert('Error cargando subtítulos')
    showSubModal.value = false
  } finally {
    subEditorLoading.value = false
  }
}

async function saveSubtitles() {
  const urlField = subEditorLang.value === 'es' ? 'subtitle_es_url' : 'subtitle_en_url'
  const filename = subEditorVideo.value[urlField].split('/').pop()
  
  subEditorLoading.value = true
  try {
    const res = await fetch(`http://localhost:3001/api/vtt/${filename}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cues: subEditorCues.value })
    })
    const json = await res.json()
    if (json.success) {
      alert('Subtítulos guardados correctamente')
      showSubModal.value = false
    } else {
      alert(json.error)
    }
  } catch(e) {
    console.error(e)
    alert('Error guardando subtítulos')
  } finally {
    subEditorLoading.value = false
  }
}

function addCue() {
  subEditorCues.value.push({
    start: '00:00:00.000',
    end: '00:00:00.000',
    text: ''
  })
}

function removeCue(index) {
  subEditorCues.value.splice(index, 1)
}

function getFilename(url) {
  if (!url) return 'Ninguno'
  return url.split('/').pop()
}

</script>

<template>
  <div class="admin-video-view">
    <header class="view-header">
      <div>
        <h1 class="view-title">Gestión de Video</h1>
        <p class="view-subtitle">Administra los videos principales, subtítulos y pistas de audio para el inicio</p>
      </div>
      <button class="btn-primary" @click="openAddModal">Añadir Video</button>
    </header>

    <div class="table-container shadow-card">
      <div v-if="isLoading" class="loading-state">Cargando videos...</div>
      <table v-else class="videos-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Video</th>
            <th>Subtítulos / Editor</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="videos.length === 0">
            <td colspan="5" class="empty-state">No hay videos registrados.</td>
          </tr>
          <tr v-for="v in videos" :key="v.id">
            <td><strong>{{ v.name }}</strong></td>
            <td>
              <span v-if="v.is_active" class="badge-active">Activo en Home</span>
              <span v-else class="text-muted">Inactivo</span>
            </td>
            <td>
              <a :href="v.video_url" target="_blank" class="text-link">Ver MP4</a><br/>
              <span v-if="v.audio_url" class="text-muted small">🎵 Tiene audio alt.</span>
            </td>
            <td>
              <div class="sub-actions">
                <button v-if="v.subtitle_es_url" class="btn-secondary small-btn" @click="openSubEditor(v, 'es')">Edit ES</button>
                <button v-if="v.subtitle_en_url" class="btn-secondary small-btn" @click="openSubEditor(v, 'en')">Edit EN</button>
                <span v-if="!v.subtitle_es_url && !v.subtitle_en_url" class="text-muted small">Sin subs</span>
              </div>
            </td>
            <td>
              <div class="actions-row">
                <button class="btn-secondary small-btn" @click="openEditModal(v)">Editar</button>
                <button class="btn-secondary small-btn text-danger" @click="deleteVideo(v.id)">Borrar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Formulario -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal-content shadow-card">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <form @submit.prevent="saveVideo" class="modal-body">
          <div class="form-group">
            <label>Nombre del Video</label>
            <input type="text" v-model="form.name" required />
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.is_active" /> Mostrar en el Home (Reemplazará al actual activo)
            </label>
          </div>
          
          <div class="form-section-title">Video Principal</div>
          <div class="form-group">
            <label>Archivo de Video (.mp4)</label>
            <input type="file" accept="video/mp4" @change="e => handleFileChange('video', e)" :required="!form.video_url" class="file-input" />
            <small class="text-muted" v-if="form.video_url">Actual: {{ getFilename(form.video_url) }}</small>
          </div>

          <div class="form-grid">
            <div class="grid-column">
              <div class="form-section-title">Subtítulos</div>
              <div class="form-group">
                <label>Español (.vtt)</label>
                <input type="file" accept=".vtt" @change="e => handleFileChange('subEs', e)" class="file-input" />
                <small class="text-muted" v-if="form.subtitle_es_url">Actual: {{ getFilename(form.subtitle_es_url) }}</small>
              </div>
              <div class="form-group">
                <label>Inglés (.vtt)</label>
                <input type="file" accept=".vtt" @change="e => handleFileChange('subEn', e)" class="file-input" />
                <small class="text-muted" v-if="form.subtitle_en_url">Actual: {{ getFilename(form.subtitle_en_url) }}</small>
              </div>
            </div>

            <div class="grid-column">
              <div class="form-section-title">Pistas de Audio Alternativas</div>
              <div class="form-group">
                <label>Pista de Audio 1 (.mp3)</label>
                <input type="file" accept="audio/*" @change="e => handleFileChange('audio', e)" class="file-input" />
                <small class="text-muted" v-if="form.audio_url">Actual: {{ getFilename(form.audio_url) }}</small>
              </div>
              <div class="form-group">
                <label>Pista de Audio 2 (.mp3)</label>
                <input type="file" accept="audio/*" @change="e => handleFileChange('audio2', e)" class="file-input" />
                <small class="text-muted" v-if="form.audio_url_2">Actual: {{ getFilename(form.audio_url_2) }}</small>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="uploadLoading">
              {{ uploadLoading ? 'Subiendo y Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Editor Subtítulos -->
    <div class="modal-overlay" v-if="showSubModal" @click.self="showSubModal = false">
      <div class="modal-content shadow-card modal-lg">
        <div class="modal-header">
          <h3>Editor de Subtítulos ({{ subEditorLang === 'es' ? 'Español' : 'Inglés' }})</h3>
          <button class="modal-close" @click="showSubModal = false">×</button>
        </div>
        <div class="modal-body sub-editor">
          <div v-if="subEditorLoading" class="text-center">Cargando subtítulos...</div>
          <div v-else>
            <p class="text-muted small">Asegúrate de que los rangos de tiempo (00:00:00.000) no se traslapen entre líneas.</p>
            
            <!-- Vista Previa rápida de HTML5 de video? -->
            <div class="preview-area" v-if="subEditorVideo.video_url">
              <video :src="subEditorVideo.video_url" controls class="preview-video"></video>
            </div>

            <div class="cues-list">
              <div v-for="(cue, idx) in subEditorCues" :key="idx" class="cue-item">
                <div class="cue-times">
                  <input type="text" v-model="cue.start" placeholder="00:00:00.000" class="time-input" />
                  <span> --> </span>
                  <input type="text" v-model="cue.end" placeholder="00:00:00.000" class="time-input" />
                  <button type="button" class="btn-remove" @click="removeCue(idx)">×</button>
                </div>
                <textarea v-model="cue.text" rows="2" class="cue-text"></textarea>
              </div>
            </div>
            <button type="button" class="btn-secondary" @click="addCue" style="margin-top: 1rem;">+ Añadir Línea</button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="showSubModal = false">Cerrar</button>
          <button type="button" class="btn-primary" @click="saveSubtitles" :disabled="subEditorLoading">Guardar Subtítulos</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.admin-video-view {
  padding: 2.5rem;
  max-width: 1000px;
  margin: 0 auto;
}
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.view-title { font-size: 1.8rem; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.view-subtitle { color: var(--color-text-secondary); margin: 0.25rem 0 0 0; font-size: 0.95rem; }

.shadow-card {
  background: var(--color-bg-card, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid rgba(128,128,128,0.1);
}

.table-container { overflow-x: auto; }
.videos-table { width: 100%; border-collapse: collapse; }
.videos-table th, .videos-table td {
  padding: 1rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid rgba(128,128,128,0.08);
}
.videos-table th { background: rgba(128,128,128,0.02); color: var(--color-text-secondary); font-size: 0.8rem; text-transform: uppercase; }

.badge-active {
  background: color-mix(in srgb, var(--color-primary) 15%, transparent); color: var(--color-primary);
  padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;
}

.actions-row, .sub-actions {
  display: flex; gap: 0.5rem;
}
.small-btn { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
.text-danger { color: #dc3232; border-color: #dc3232; }
.text-link { color: var(--color-primary); text-decoration: underline; font-size: 0.9rem; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; justify-content: center; align-items: center; padding: 1rem;
}
.modal-content {
  background: var(--color-bg-card); border-radius: 12px; width: 100%; max-width: 750px;
  max-height: 90vh; display: flex; flex-direction: column;
}
.modal-lg { max-width: 850px; }
.modal-header {
  padding: 1.2rem 1.5rem; border-bottom: 1px solid rgba(128,128,128,0.1);
  display: flex; justify-content: space-between; align-items: center;
}
.modal-header h3 { margin: 0; font-size: 1.2rem; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-secondary); }
.modal-body { padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.9rem; font-weight: 600; color: var(--color-text-primary); }
.form-group input[type="text"] {
  padding: 0.6rem; border: 1px solid rgba(128,128,128,0.3); border-radius: 6px; background: var(--color-bg-page); color: var(--color-text-primary);
}
.file-input {
  padding: 0.5rem; border: 1px dashed rgba(128,128,128,0.5); border-radius: 6px; background: rgba(128,128,128,0.02); cursor: pointer; color: var(--color-text-primary);
}
.checkbox-group { margin-bottom: 0.5rem; }
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: normal; }

.form-section-title {
  font-size: 1rem; font-weight: 700; color: var(--color-primary); margin-top: 0.5rem; margin-bottom: 0.5rem;
  border-bottom: 2px solid rgba(128,128,128,0.1); padding-bottom: 0.3rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.grid-column {
  display: flex; flex-direction: column; gap: 1rem;
}

.modal-footer { padding: 1.2rem 1.5rem; border-top: 1px solid rgba(128,128,128,0.1); display: flex; justify-content: flex-end; gap: 1rem; }

.btn-primary { background: var(--color-primary); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-secondary { background: transparent; color: var(--color-text-primary); border: 1px solid rgba(128,128,128,0.3); padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 600; }

.sub-editor { max-height: 70vh; }
.preview-area { margin-bottom: 1rem; text-align: center; }
.preview-video { width: 100%; max-width: 400px; max-height: 250px; background: #000; border-radius: 8px; }
.cues-list { display: flex; flex-direction: column; gap: 1rem; }
.cue-item { border: 1px solid rgba(128,128,128,0.2); padding: 1rem; border-radius: 8px; background: var(--color-bg-page); }
.cue-times { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.time-input { padding: 0.4rem; font-family: monospace; border: 1px solid rgba(128,128,128,0.3); border-radius: 4px; background: var(--color-bg-card); color: var(--color-text-primary); width: 110px; }
.cue-text { width: 100%; padding: 0.5rem; font-family: sans-serif; border: 1px solid rgba(128,128,128,0.3); border-radius: 4px; background: var(--color-bg-card); color: var(--color-text-primary); resize: vertical; }
.btn-remove { margin-left: auto; background: none; border: none; color: #dc3232; font-size: 1.2rem; cursor: pointer; }
</style>
