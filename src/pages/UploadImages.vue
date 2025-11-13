<template>
  <HeaderLayout>
    <div class="container my-5">
      <h1 class="mb-4 text-center">Imágenes de la prenda</h1>

      <div class="card p-4 shadow-sm">
        <!-- 🔹 Grid principal -->
        <div v-if="!cropMode" class="upload-grid mb-4">
          <!-- Portada -->
          <div class="upload-slot" @click="triggerFile('front')">
            <input
              ref="frontInput"
              type="file"
              accept="image/*"
              hidden
              @change="(e) => onFile(e, 'front')"
            />
            <img v-if="previews.front" :src="previews.front" class="preview" />
            <div v-else class="placeholder">
              <span class="plus">+</span>
              <span>Portada</span>
            </div>
          </div>

          <!-- Atrás -->
          <div class="upload-slot" @click="triggerFile('back')">
            <input
              ref="backInput"
              type="file"
              accept="image/*"
              hidden
              @change="(e) => onFile(e, 'back')"
            />
            <img v-if="previews.back" :src="previews.back" class="preview" />
            <div v-else class="placeholder">
              <span class="plus">+</span>
              <span>Atrás</span>
            </div>
          </div>

          <!-- Etiqueta -->
          <div class="upload-slot" @click="triggerFile('tag')">
            <input
              ref="tagInput"
              type="file"
              accept="image/*"
              hidden
              @change="(e) => onFile(e, 'tag')"
            />
            <img v-if="previews.tag" :src="previews.tag" class="preview" />
            <div v-else class="placeholder">
              <span class="plus">+</span>
              <span>Etiqueta</span>
            </div>
          </div>
        </div>

        <!-- 🔹 Adicionales -->
        <div v-if="!cropMode" class="mb-4">
          <label class="form-label fw-semibold">Adicionales (opcionales)</label>
          <div class="upload-additional" @click="triggerFile('extras')">
            <input
              ref="extrasInput"
              type="file"
              multiple
              accept="image/*"
              hidden
              @change="onExtras"
            />
            <div v-if="extraPreviews.length" class="extras-list">
              <img v-for="(src, i) in extraPreviews" :key="i" :src="src" class="extra-thumb" />
            </div>
            <div v-else class="placeholder small">
              <span class="plus small">+</span>
              <span>Añadir imágenes adicionales</span>
            </div>
          </div>
        </div>

        <!-- 🔹 Botón de envío -->
        <div v-if="!cropMode" class="text-end">
          <button
            class="btn btn-dark px-4 py-2"
            :disabled="!canSubmit || loading"
            @click="handleUpload"
          >
            {{ loading ? 'Subiendo...' : 'Finalizar y enviar a revisión' }}
          </button>
        </div>

        <!-- 🔹 Cropper -->
        <ImageCropper
          v-if="cropMode"
          :image-url="cropperPreviewUrl"
          @cropped="handleCropped"
          @cancel="cancelCrop"
        />
      </div>
    </div>
  </HeaderLayout>
</template>

<script setup>
import HeaderLayout from '@/layouts/AppLayout.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import { ref, computed, onBeforeUnmount } from 'vue'
import { itemFormService } from '@/services/itemFormService'
import { itemService } from '@/services/itemService'
import { storageService } from '@/services/storageService'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/services/supabaseClient'
import { onBeforeRouteLeave } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Inputs
const frontInput = ref(null)
const backInput = ref(null)
const tagInput = ref(null)
const extrasInput = ref(null)

// Archivos
const files = ref({ front: null, back: null, tag: null })
const previews = ref({ front: '', back: '', tag: '' })
const extras = ref([])
const extraPreviews = ref([])

const loading = ref(false)
const cropMode = ref(false)
const cropperPreviewUrl = ref(null)
const selectedRole = ref(null)

// --- UTILIDADES PARA OBJECT URL ---
function setPreview(role, file) {
  if (previews.value[role]) URL.revokeObjectURL(previews.value[role])
  previews.value[role] = URL.createObjectURL(file)
}
function clearAllPreviews() {
  for (const key of Object.keys(previews.value)) {
    if (previews.value[key]) URL.revokeObjectURL(previews.value[key])
  }
  previews.value = { front: '', back: '', tag: '' }
}
function setCropperPreview(file) {
  if (cropperPreviewUrl.value) URL.revokeObjectURL(cropperPreviewUrl.value)
  cropperPreviewUrl.value = URL.createObjectURL(file)
}
function clearCropperPreview() {
  if (cropperPreviewUrl.value) URL.revokeObjectURL(cropperPreviewUrl.value)
  cropperPreviewUrl.value = null
}
function setExtras(filesArr) {
  for (const url of extraPreviews.value) URL.revokeObjectURL(url)
  extraPreviews.value = filesArr.map((f) => URL.createObjectURL(f))
}

// --- EVENTOS ---
function triggerFile(role) {
  if (role === 'front') frontInput.value?.click()
  else if (role === 'back') backInput.value?.click()
  else if (role === 'tag') tagInput.value?.click()
  else if (role === 'extras') extrasInput.value?.click()
}

// Al seleccionar archivo → abrir cropper
function onFile(e, role) {
  const file = e.target.files?.[0]
  if (!file) return
  selectedRole.value = role
  setCropperPreview(file)
  cropMode.value = true
}

// Extras sin crop
function onExtras(e) {
  const arr = Array.from(e.target.files || [])
  extras.value = arr
  setExtras(arr)
}

// Cancelar recorte
function cancelCrop() {
  clearCropperPreview()
  cropMode.value = false
  selectedRole.value = null
}

function handleCropped(file) {
  if (!selectedRole.value) return
  files.value[selectedRole.value] = file
  setPreview(selectedRole.value, file)
  cancelCrop()
}

const canSubmit = computed(() => files.value.front && files.value.back && files.value.tag)

// Limpieza al desmontar
onBeforeUnmount(() => {
  clearAllPreviews()
  clearCropperPreview()
  for (const url of extraPreviews.value) URL.revokeObjectURL(url)
})

// --- Subida ---
async function handleUpload() {
  try {
    loading.value = true
    const itemId = route.params.id

    // Subir imágenes obligatorias
    const ordered = [files.value.front, files.value.back, files.value.tag]
    await itemFormService.uploadImages(itemId, ordered)

    // Obtener imagen principal
    const imgs = await itemService.listImages(itemId)
    const primary = imgs.find((i) => i.is_primary) || imgs[0]
    if (!primary) throw new Error('No se encontró imagen principal')

    // Procesar fondo (ClipDrop)
    await itemFormService.processMainImage(itemId, primary.path)

    // Subir imágenes adicionales
    const { data: session } = await supabase.auth.getSession()
    const userId = session?.session?.user?.id
    if (!userId) throw new Error('No hay sesión activa')

    for (const f of extras.value) {
      const fileName = `extra-${Date.now()}-${f.name}`
      const uploadedPath = await storageService.uploadItemImage(userId, itemId, f, fileName)
      await itemService.addImageRecord(itemId, uploadedPath, 'other', false)
    }

    // Enviar a revisión
    await itemFormService.submitForReview(itemId)
    alert('Imágenes cargadas. Tu prenda está en revisión.')
    router.push('/profile')
  } catch (e) {
    console.error(e)
    alert('Error al subir imágenes.')
  } finally {
    loading.value = false
  }
}

onBeforeRouteLeave(() => {
  cropMode.value = false
  clearCropperPreview()
  selectedRole.value = null
})
</script>

<style scoped>
.card {
  border-radius: 1rem;
  border: none;
}

/* GRID */
.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  justify-items: center;
}

/* SLOT */
.upload-slot {
  width: 100%;
  aspect-ratio: 4 / 5;
  background: #f8f8f8;
  border: 2px dashed #ccc;
  border-radius: 1rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-slot:hover {
  border-color: #333;
  background: #f3f3f3;
}
.preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* PLACEHOLDER */
.placeholder {
  color: #777;
  font-size: 0.95rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  user-select: none;
}
.placeholder .plus {
  font-weight: 700;
  font-size: 1.6rem;
  line-height: 1;
}
.placeholder .plus.small {
  font-size: 1.2rem;
}

/* ADICIONALES */
.upload-additional {
  width: 100%;
  min-height: 120px;
  background: #f8f8f8;
  border: 2px dashed #ccc;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  padding: 0.5rem;
}
.upload-additional:hover {
  border-color: #333;
  background: #f3f3f3;
}
.extras-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
.extra-thumb {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
}
</style>
