<template>
  <HeaderLayout>
    <div class="container my-5 upload-page">
      <h1 class="text-center mb-4">Subir prenda</h1>

      <!-- Indicador de pasos -->
      <div class="step-indicator mb-4">
        <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
          <div class="step-number">1</div>
          <div class="step-label">Básico</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 1 }"></div>
        <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
          <div class="step-number">2</div>
          <div class="step-label">Detalles</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 2 }"></div>
        <div class="step" :class="{ active: currentStep === 3 }">
          <div class="step-number">3</div>
          <div class="step-label">Imágenes</div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="card upload-card p-4 shadow-sm">
        <!-- PASO 1: Nombre y Descripción -->
        <div v-if="currentStep === 1" class="step-content">
          <h3 class="mb-4">Información básica</h3>

          <div class="mb-3">
            <label class="form-label">Título</label>
            <input v-model="form.title" class="form-control" maxlength="30" required />
          </div>

          <div class="mb-3">
            <label class="form-label">Descripción</label>
            <textarea v-model="form.description" class="form-control" rows="5"></textarea>
          </div>
        </div>

        <!-- PASO 2: Resto de campos -->
        <div v-if="currentStep === 2" class="step-content">
          <h3 class="mb-4">Detalles de la prenda</h3>

          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label">Tipo de prenda</label>
              <AutoCompleteSelect
                table="garment_types"
                v-model="form.garment_type_id"
                placeholder="Buscar tipo..."
              />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Género</label>
              <AutoCompleteSelect
                table="genres"
                v-model="form.genre_id"
                placeholder="Buscar género..."
              />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Marca</label>
              <AutoCompleteSelect
                table="brands"
                v-model="form.brand_id"
                placeholder="Buscar marca..."
              />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Material</label>
              <AutoCompleteSelect
                table="materials"
                v-model="form.material_id"
                placeholder="Buscar material..."
              />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Condición</label>
              <AutoCompleteSelect
                table="conditions"
                v-model="form.condition_id"
                placeholder="Buscar condición..."
              />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Color</label>
              <AutoCompleteSelect
                table="colors"
                v-model="form.color_id"
                placeholder="Buscar color..."
              />
            </div>

            <div class="col-12">
              <label class="form-label">Estilos</label>
              <div v-for="(styleId, index) in form.style_ids" :key="index" class="mb-2 d-flex gap-2">
                <AutoCompleteSelect
                  table="styles"
                  v-model="form.style_ids[index]"
                  placeholder="Buscar estilo..."
                  class="flex-grow-1"
                />
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  @click="removeStyle(index)"
                  v-if="form.style_ids.length > 1"
                >
                  ✕
                </button>
              </div>
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm mt-2"
                @click="addStyle"
              >
                + Agregar estilo
              </button>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Talle</label>
              <AutoCompleteSelect
                table="sizes"
                v-model="form.size_id"
                placeholder="Buscar talle..."
              />
            </div>
          </div>
        </div>

        <!-- PASO 3: Imágenes -->
        <div v-if="currentStep === 3" class="step-content">
          <h3 class="mb-4">Imágenes de la prenda</h3>

          <div class="u-grid mb-2">
            <UploadSlot
              label="Portada"
              role="front"
              v-model:file="files.front"
              @crop="onCrop('front', $event)"
            />
            <UploadSlot
              label="Atrás"
              role="back"
              v-model:file="files.back"
              @crop="onCrop('back', $event)"
            />
            <UploadSlot
              label="Etiqueta"
              role="tag"
              v-model:file="files.tag"
              @crop="onCrop('tag', $event)"
            />
            <UploadSlot
              label="Otra"
              role="other"
              multiple
              v-model:list="files.others"
              @crop="onCrop('other', $event)"
            />
          </div>
          <div class="text-muted small">
            * Recortá cada imagen antes de subir. El recorte de fondo se hará al publicar.
          </div>
        </div>

        <!-- Botones de navegación -->
        <div class="d-flex gap-2 mt-4">
          <button
            v-if="currentStep > 1"
            type="button"
            class="btn btn-outline-secondary"
            @click="prevStep"
            :disabled="submitting"
          >
            ← Volver atrás
          </button>

          <button
            type="button"
            class="btn btn-outline-secondary ms-auto"
            @click="resetAll"
            :disabled="submitting"
          >
            Limpiar
          </button>

          <button
            v-if="currentStep < 3"
            type="button"
            class="btn btn-dark"
            @click="nextStep"
            :disabled="submitting"
          >
            Avanzar →
          </button>

          <button
            v-if="currentStep === 3"
            type="submit"
            class="btn btn-dark"
            :disabled="submitting"
          >
            Ir a vista previa
          </button>
        </div>
      </form>
    </div>

    <!-- Modal/Overlay del cropper -->
    <ImageCropper
      v-if="crop.url"
      :image-url="crop.url"
      :aspect-ratio="1"
      @cropped="confirmCrop"
      @cancel="crop = { role: null, url: null, cb: null }"
    />
  </HeaderLayout>
</template>

<script setup>
import { ref } from 'vue'
import AutoCompleteSelect from '@/components/AutoCompleteSelect.vue'
import UploadSlot from '@/components/UploadSlot.vue'
import { itemFormService } from '@/services/itemFormService'
import { useRouter } from 'vue-router'
import HeaderLayout from '@/layouts/AppLayout.vue'
import ImageCropper from '@/components/ImageCropper.vue'

const router = useRouter()

const currentStep = ref(1)

const form = ref({
  title: '',
  description: '',
  garment_type_id: '',
  genre_id: '',
  brand_id: '',
  material_id: '',
  condition_id: '',
  color_id: '',
  style_ids: [''],
  size_id: '',
})

const files = ref({
  front: null,
  back: null,
  tag: null,
  others: [],
})

const crop = ref({ role: null, url: null, cb: null })
const submitting = ref(false)

/** Navegación entre pasos */
function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

/** Abrir cropper para un archivo seleccionado */
function onCrop(role, file) {
  const url = URL.createObjectURL(file)
  crop.value = {
    role,
    url,
    cb: (blob) => onCropped(role, blob),
  }
}

/** Confirmar recorte y reemplazar el file en memoria */
function confirmCrop(blob) {
  crop.value?.cb?.(blob)
  crop.value = { role: null, url: null, cb: null }
}

function onCropped(role, blob) {
  const file = new File([blob], `${role}-${Date.now()}.jpg`, { type: 'image/jpeg' })
  if (role === 'other') {
    files.value.others.push(file)
  } else {
    files.value[role] = file
  }
}

function addStyle() {
  form.value.style_ids.push('')
}

function removeStyle(index) {
  form.value.style_ids.splice(index, 1)
}

function resetAll() {
  form.value = {
    title: '',
    description: '',
    garment_type_id: '',
    genre_id: '',
    brand_id: '',
    material_id: '',
    condition_id: '',
    color_id: '',
    style_ids: [''],
    size_id: '',
  }
  files.value = { front: null, back: null, tag: null, others: [] }
  currentStep.value = 1
}

/** Flujo: crea draft → sube imágenes → calcula recomendado → navega a PreUpload */
const handleSubmit = async () => {
  if (!form.value.title || !form.value.garment_type_id || !form.value.genre_id) {
    alert('Completá al menos título, tipo de prenda y género.')
    return
  }

  // Validar que al menos la imagen de portada esté presente
  if (!files.value.front) {
    alert('Debés subir al menos la imagen de portada de la prenda.')
    return
  }

  submitting.value = true
  try {
    // Filtrar style_ids vacíos
    const formData = {
      ...form.value,
      style_ids: form.value.style_ids.filter(id => id && id.trim() !== '')
    }

    // 1) Crear el borrador en BBDD
    const item = await itemFormService.saveFormDraft(formData)

    // 2) Subir imágenes recortadas localmente
    await itemFormService.uploadImages(item.id, {
      front: files.value.front,
      back: files.value.back,
      tag: files.value.tag,
      others: files.value.others,
    })

    // 3) Calcular precio recomendado (opcional pero útil para PreUpload)
    await itemFormService.calculateRecommendedPrice(item.id)

    // 4) Ir a PreUpload
    router.push(`/preupload/${item.id}`)
  } catch (err) {
    console.error('Error en el flujo de subida:', err)
    alert('No se pudo crear el borrador. Revisá los datos e intentá de nuevo.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* Layout general */
.upload-page {
  background: linear-gradient(180deg, #f7f9fb 0%, #f3f6f9 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 5rem;
  padding-bottom: 5rem;
  position: relative;
}

.upload-card {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: none;
  max-width: 800px;
  width: 100%;
  padding: 2rem 2rem 2.5rem;
  margin-top: 0;
}

/* Indicador de pasos */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 500px;
  margin: 0 auto;
  gap: 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e9ecef;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: #212529;
  color: #fff;
}

.step.completed .step-number {
  background: #28a745;
  color: #fff;
}

.step-label {
  font-size: 13px;
  color: #6c757d;
  font-weight: 500;
  transition: color 0.3s ease;
}

.step.active .step-label {
  color: #212529;
  font-weight: 600;
}

.step-line {
  width: 80px;
  height: 2px;
  background: #e9ecef;
  margin: 0 8px;
  margin-bottom: 24px;
  transition: background 0.3s ease;
}

.step-line.active {
  background: #28a745;
}

/* Contenido de cada paso */
.step-content {
  min-height: 350px;
}

.step-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
}

/* Uploader */
.u-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

/* Botones */
.btn-dark {
  border-radius: 999px;
  padding: 0.6rem 1.4rem;
}

.btn-outline-secondary {
  border-radius: 999px;
  padding: 0.6rem 1.4rem;
}

/* Responsive */
@media (max-width: 768px) {
  .upload-card {
    padding: 1.5rem;
  }

  .step-indicator {
    max-width: 100%;
  }

  .step-line {
    width: 50px;
    margin: 0 4px;
  }

  .step-number {
    width: 35px;
    height: 35px;
    font-size: 14px;
  }

  .step-label {
    font-size: 11px;
  }

  .step-content {
    min-height: 300px;
  }

  .step-content h3 {
    font-size: 1.25rem;
  }

  .u-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .upload-page {
    padding-top: 3rem;
    padding-bottom: 3rem;
  }

  .step-line {
    width: 30px;
  }

  .step-label {
    display: none;
  }
}
</style>
