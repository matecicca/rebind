<template>
  <HeaderLayout>
    <div class="container my-5 upload-page">
      <h1 class="text-center mb-4">Subir prenda</h1>

      <form @submit.prevent="handleSubmit" class="card upload-card p-4 shadow-sm">
        <div class="form-grid">
          <!-- Columna A: Formulario -->
          <div class="col-a">
            <!-- Título -->
            <div class="mb-3">
              <label class="form-label">Título</label>
              <input v-model="form.title" class="form-control" maxlength="30" required />
            </div>

            <!-- Descripción -->
            <div class="mb-3">
              <label class="form-label">Descripción</label>
              <textarea v-model="form.description" class="form-control" rows="3"></textarea>
            </div>

            <!-- Resto de campos a 2 columnas -->
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

          <!-- Columna B: Uploader con crop -->
          <div class="col-b">
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
        </div>

        <div class="d-flex gap-2 mt-3">
          <button type="button" class="btn btn-outline-secondary ms-auto" @click="resetAll" :disabled="submitting">
            Limpiar
          </button>
          <button type="submit" class="btn btn-dark" :disabled="submitting">
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
}

/** Flujo: crea draft → sube imágenes → calcula recomendado → navega a PreUpload */
const handleSubmit = async () => {
  if (!form.value.title || !form.value.garment_type_id || !form.value.genre_id) {
    alert('Completá al menos título, tipo de prenda y género.')
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
  max-width: 1100px;
  width: 100%;
  padding: 2rem 2rem 2.5rem;
  margin-top: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 24px;
}
@media (max-width: 992px) {
  .form-grid { grid-template-columns: 1fr; }
}

/* Uploader */
.u-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.slot {
  aspect-ratio: 1/1;
}
.slot-inner {
  background: #f4f4f4;
  border: 1px dashed #ccc;
  border-radius: 14px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.placeholder {
  color: #777;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  user-select: none;
}
.placeholder .plus {
  font-size: 28px;
  line-height: 1;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumbs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  height: 100%;
}
.thumbs .thumb {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
}
.mini {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #111;
  color: #fff;
  cursor: pointer;
}
.mini-add {
  display: grid;
  place-items: center;
  background: #eaeaea;
  border-radius: 10px;
  font-weight: bold;
}

/* Botones */
.btn-dark {
  border-radius: 999px;
  padding: 0.6rem 1.4rem;
}
</style>
