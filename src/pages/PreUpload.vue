<template>
  <HeaderLayout>
    <div class="container my-5">
      <h1 class="mb-4">Revisión y precio</h1>

      <div v-if="loading" class="text-muted">Cargando…</div>
      <div v-else-if="!item" class="text-muted">No se encontró la publicación.</div>

      <div v-else class="card p-4 shadow-sm">
        <div class="row g-4">
          <!-- Columna A: Formulario editable -->
          <div class="col-12 col-lg-6">
            <div class="mb-3">
              <label class="form-label">Título</label>
              <input v-model="form.title" class="form-control" />
            </div>

            <div class="mb-3">
              <label class="form-label">Descripción</label>
              <textarea v-model="form.description" class="form-control" rows="3"></textarea>
            </div>

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

              <div class="col-12 col-md-6">
                <label class="form-label">Estilo</label>
                <AutoCompleteSelect
                  table="styles"
                  v-model="form.style_id"
                  placeholder="Buscar estilo..."
                />
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

            <hr />
            <div class="mb-3">
              <label class="form-label">Precio de publicación (Binds)</label>
              <input type="number" class="form-control" v-model.number="form.ask_price_bind" min="0" />
              <div class="form-text" v-if="item?.recommended_price_bind">
                Sugerido: {{ Math.round(item.recommended_price_bind * 0.9) }} – {{ Math.round(item.recommended_price_bind * 1.1) }} Binds
              </div>
            </div>

            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary" :disabled="saving" @click="saveChanges">Actualizar</button>
              <button class="btn btn-dark" :disabled="publishing" @click="publish">Publicar</button>
              <button class="btn btn-outline-danger ms-auto" :disabled="deleting" @click="del">Eliminar borrador</button>
            </div>
          </div>

          <!-- Columna B: Imágenes (reemplazo + crop local) -->
          <div class="col-12 col-lg-6">
            <div class="u-grid mb-2">
              <UploadSlot label="Portada" role="front" :file="images.front" @crop="onCrop('front', $event)" />
              <UploadSlot label="Atrás" role="back" :file="images.back" @crop="onCrop('back', $event)" />
              <UploadSlot label="Etiqueta" role="tag" :file="images.tag" @crop="onCrop('tag', $event)" />
              <UploadSlot label="Otra" role="other" multiple :list="images.others" @crop="onCrop('other', $event)" />
            </div>
            <div class="text-muted small">
              * Podés reemplazar y recortar imágenes antes de publicar. El recorte de fondo de la portada se hará al publicar.
            </div>
          </div>
        </div>
      </div>

      <!-- Cropper -->
      <ImageCropper
        v-if="crop.url"
        :image-url="crop.url"
        :aspect-ratio="1"
        @cropped="confirmCrop"
        @cancel="crop = { role: null, url: null, cb: null }"
      />
    </div>
  </HeaderLayout>
</template>

<script setup>
import HeaderLayout from '@/layouts/AppLayout.vue'
import AutoCompleteSelect from '@/components/AutoCompleteSelect.vue'
import UploadSlot from '@/components/UploadSlot.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import { ref, reactive, onMounted } from 'vue'
import { itemService } from '@/services/itemService'
import { supabase } from '@/services/supabaseClient'
import { itemFormService } from '@/services/itemFormService'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const itemId = route.params.id

const loading = ref(true)
const saving = ref(false)
const publishing = ref(false)
const deleting = ref(false)

const item = ref(null)
const form = reactive({
  title: '',
  description: '',
  garment_type_id: null,
  genre_id: null,
  brand_id: null,
  material_id: null,
  condition_id: null,
  color_id: null,
  style_id: null,
  size_id: null,
  ask_price_bind: null,
})

const images = reactive({
  // cuando vienen de BBDD, uso objetos {__url, __path} como preview;
  // si el usuario recorta, se reemplaza por File
  front: null,
  back: null,
  tag: null,
  others: [],
})
const crop = ref({ role: null, url: null, cb: null })

onMounted(loadAll)

async function loadAll () {
  try {
    loading.value = true

    // catálogos (para los selects)
    await Promise.all([
      supabase.from('garment_types').select('id,name'),
      supabase.from('brands').select('id,name'),
      supabase.from('materials').select('id,name'),
      supabase.from('conditions').select('id,name'),
      supabase.from('colors').select('id,name'),
      supabase.from('styles').select('id,name'),
      supabase.from('sizes').select('id,name'),
      supabase.from('genres').select('id,name'),
    ])

    // item + imágenes
    const it = await itemService.getById(itemId)
    item.value = it

    Object.assign(form, {
      title: it.title,
      description: it.description,
      garment_type_id: it.garment_type_id,
      genre_id: it.genre_id,
      brand_id: it.brand_id,
      material_id: it.material_id,
      condition_id: it.condition_id,
      color_id: it.color_id,
      style_id: it.style_id,
      size_id: it.size_id,
      ask_price_bind: it.ask_price_bind ?? it.recommended_price_bind ?? null,
    })

    const imgs = await itemService.listImages(itemId)
    images.front = toPreview(imgs.find(x => x.role === 'front')?.path)
    images.back  = toPreview(imgs.find(x => x.role === 'back')?.path)
    images.tag   = toPreview(imgs.find(x => x.role === 'tag')?.path)
    images.others = imgs.filter(x => x.role === 'other').map(x => toPreview(x.path))
  } catch (err) {
    console.error('Error cargando PreUpload:', err)
  } finally {
    loading.value = false
  }
}

function toPreview (path) {
  if (!path) return null
  const pub = supabase.storage.from('item-images').getPublicUrl(path).data.publicUrl
  return { __path: path, __url: pub }
}

function onCrop (role, file) {
  const url = URL.createObjectURL(file)
  crop.value = { role, url, cb: (blob) => onCropped(role, blob) }
}

function confirmCrop (blob) {
  crop.value?.cb?.(blob)
  crop.value = { role: null, url: null, cb: null }
}

function onCropped (role, blob) {
  const file = new File([blob], `${role}-${Date.now()}.jpg`, { type: 'image/jpeg' })
  if (role === 'other') {
    images.others.push(file)
  } else {
    images[role] = file
  }
}

async function saveChanges () {
  try {
    saving.value = true
    // 1) Actualizar campos del draft
    await itemFormService.updateDraft(itemId, { ...form })

    // 2) Reemplazar sólo roles cambiados (File)
    const changed = {
      front: images.front instanceof File ? images.front : null,
      back:  images.back  instanceof File ? images.back  : null,
      tag:   images.tag   instanceof File ? images.tag   : null,
      others: Array.isArray(images.others) ? images.others.filter(f => f instanceof File) : [],
    }
    if (changed.front || changed.back || changed.tag || (changed.others?.length)) {
      await itemFormService.replaceImages(itemId, changed)
    }

    alert('Borrador actualizado')
  } catch (err) {
    console.error('Error al actualizar borrador:', err)
    alert('No se pudo actualizar. Intentá de nuevo.')
  } finally {
    saving.value = false
  }
}

async function publish () {
  try {
    publishing.value = true
    // guardo última edición
    await itemFormService.updateDraft(itemId, { ...form })

    // intento recorte de fondo sobre la portada actual si existe
    if (item.value?.main_image_path) {
      try {
        await itemFormService.processMainImage(itemId, item.value.main_image_path)
      } catch (e) {
        console.warn('Fallo recorte de fondo, se continúa sin recorte.', e)
      }
    }
    // pasar a pending_review
    await itemFormService.submitForReview(itemId)

    router.push('/me')
  } catch (err) {
    console.error('Error al publicar:', err)
    alert('No se pudo publicar. Intentá nuevamente.')
  } finally {
    publishing.value = false
  }
}

async function del () {
  if (!confirm('¿Eliminar este borrador definitivamente?')) return
  try {
    deleting.value = true
    await itemFormService.deleteDraft(itemId)
    router.push('/home')
  } catch (err) {
    console.error('Error al eliminar borrador:', err)
    alert('No se pudo eliminar el borrador.')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.u-grid{ display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:12px; }
.slot { aspect-ratio: 1/1; }
.slot-inner{ background:#f4f4f4; border:1px dashed #ccc; border-radius:14px; width:100%; height:100%; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; overflow:hidden; }
.placeholder{ color:#777; display:flex; flex-direction:column; align-items:center; gap:4px; user-select:none; }
.placeholder .plus{ font-size:28px; }
.thumb img{ width:100%; height:100%; object-fit:cover; }
.thumbs{ display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:8px; width:100%; height:100%; }
.thumbs .thumb{ position:relative; border-radius:10px; overflow:hidden; }
.mini{ position:absolute; top:6px; right:6px; width:22px; height:22px; border:none; border-radius:50%; background:#111; color:#fff; cursor:pointer; }
.mini-add{ display:grid; place-items:center; background:#eaeaea; border-radius:10px; font-weight:bold; }
.btn-dark{ border-radius: 999px; }
</style>
