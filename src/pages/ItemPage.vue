<template>
  <AppLayout>
    <div class="container my-4 my-lg-5">

      <!-- ✅ TÍTULO SOLO MOBILE (arriba de todo) -->
      <h1 class="item-title-mobile d-lg-none text-center fw-semibold mt-0 mb-3">
        {{ item.title }}
      </h1>

      <div class="row g-4">
        <!-- IZQUIERDA: Carrusel -->
        <!-- En mobile va primero; en desktop queda a la izquierda -->
        <div class="col-12 col-lg-7 order-1">
          <div class="carousel card p-2">
            <div class="carousel-frame">
              <img v-if="images.length" :src="publicUrl(images[active])" class="carousel-img" />
              <div v-else class="carousel-placeholder">Sin imagen</div>
            </div>

            <div class="thumbs mt-2" v-if="images.length > 1">
              <button
                v-for="(p, i) in images" :key="i"
                :class="['thumb', { active: active===i }]"
                @click="active=i"
                aria-label="Miniatura"
              >
                <img :src="publicUrl(p)" alt="" />
              </button>
            </div>
          </div>

          <!-- Tarjeta/ banda de perfil SOLO MOBILE (va después del carrusel) -->
          <section class="card p-3 p-md-4 mt-3 d-lg-none">
            <header class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="avatar overflow-hidden">
                  <img
                    v-if="ownerAvatarUrl"
                    :src="ownerAvatarUrl"
                    alt="Avatar"
                    class="w-100 h-100 object-fit-cover"
                  />
                </div>
                <div>
                  <div class="fw-semibold">{{ item.owner?.username || 'Usuario' }}</div>
                  <div class="text-muted small">Nvl. {{ item.owner?.level ?? '—' }}</div>
                </div>
              </div>
              <button class="btn btn-outline-dark btn-sm" @click="toggleFav">
                <span v-if="fav">★ Guardado</span><span v-else>☆ Guardar</span>
              </button>
            </header>
          </section>
        </div>

        <!-- DERECHA: Información -->
        <!-- En mobile va después del carrusel; en desktop a la derecha -->
        <div class="col-12 col-lg-5 order-2">
          <article class="card p-3 p-md-4">

            <!-- TÍTULO SOLO DESKTOP (adentro del recuadro derecho) -->
            <h1 class="item-title-desktop d-none d-lg-block display-6 mb-3">
              {{ item.title }}
            </h1>

            <!-- Header del autor y acciones (solo desktop) -->
            <header class="d-none d-lg-flex align-items-center justify-content-between mb-2">
              <div class="d-flex align-items-center gap-2">
                <div class="avatar overflow-hidden">
                  <img
                    v-if="ownerAvatarUrl"
                    :src="ownerAvatarUrl"
                    alt="Avatar"
                    class="w-100 h-100 object-fit-cover"
                  />
                </div>
                <div>
                  <div class="fw-semibold">{{ item.owner?.username || 'Usuario' }}</div>
                  <div class="text-muted small">Nvl. {{ item.owner?.level ?? '—' }}</div>
                </div>
              </div>
              <button
                :class="['btn', 'btn-sm', fav ? 'btn-dark' : 'btn-outline-dark']"
                @click="toggleFav"
                aria-pressed="fav"
                :aria-label="fav ? 'Quitar de guardadas' : 'Guardar prenda'"
              >
              <span v-if="fav">★ Guardado</span><span v-else>☆ Guardar</span>
              </button>
            </header>

            <!-- Marca / Talle -->
            <div class="text-muted mb-2 d-flex align-items-center gap-2 flex-wrap">
              <span v-if="item.brands?.name">{{ item.brands?.name }}</span>
              <span class="badge bg-light text-dark" v-if="item.sizes?.name">{{ item.sizes?.name }}</span>
            </div>

            <p class="mb-3" v-if="item.description">{{ item.description }}</p>

            <div class="d-flex align-items-center justify-content-between mb-3">
              <div class="price h5 mb-0">
                <span class="bind-price d-inline-flex align-items-center gap-2">
                  <strong class="mb-0 bind-number">{{ item.ask_price_bind ?? '—' }}</strong>
                  <img class="bind-logo" src="@/assets/images/bind_logo_card.svg" alt="Binds" />
                </span>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-dark">Comprar</button>
                <button class="btn btn-outline-dark">Ofertar</button>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2 mb-4">
              <button class="btn btn-outline-secondary btn-sm">Compartir</button>
              <RouterLink to="/home" class="btn btn-link btn-sm">Volver al feed</RouterLink>
            </div>

            <!-- TABLA DE DETALLES -->
            <div class="details">
              <h2 class="h6 mb-2">Detalles</h2>
              <div class="rb-kv">
                <div v-for="row in details" :key="row.key" class="rb-kv-row">
                  <div class="rb-kv-k">{{ row.label }}</div>
                  <div class="rb-kv-v">{{ row.value ?? '—' }}</div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { itemService } from '@/services/itemService'
import { storageService } from '@/services/storageService'
import { favoritesService } from '@/services/favoritesService'
import AppLayout from '@/layouts/AppLayout.vue'

const route = useRoute()
const item = ref({})
const images = ref([])  // array de paths (bucket: item-images)
const active = ref(0)
const fav = ref(false)

function publicUrl(p){ return storageService.getPublicUrl('item-images', p) }
function avatarUrl(path){ return path ? storageService.getPublicUrl('avatars', path) : '' }


const ownerAvatarUrl = computed(() => avatarUrl(item.value?.owner?.avatar_url || ''))

// Tabla de detalles
const details = computed(() => ([
  { key: 'brand', label: 'Marca',         value: item.value?.brands?.name },
  { key: 'size',  label: 'Talle',         value: item.value?.sizes?.name },
  { key: 'color', label: 'Color',         value: item.value?.colors?.name },
  { key: 'style', label: 'Estilo',        value: item.value?.styles?.name },
  { key: 'mat',   label: 'Material',      value: item.value?.materials?.name },
  { key: 'cond',  label: 'Condición',     value: item.value?.conditions?.name },
  { key: 'gt',    label: 'Tipo de prenda',value: item.value?.garment_types?.name },
  { key: 'genre', label: 'Género',        value: item.value?.genres?.name },
]))

// Orden preferido para galería
function sortByRole(list){
  const roleRank = { front: 1, back: 2, tag: 3, other: 9 }
  return [...list].sort((a,b) =>
    (Number(!a.is_primary) - Number(!b.is_primary)) ||
    (roleRank[a.role] ?? 8) - (roleRank[b.role] ?? 8)
  )
}

async function loadFavState() {
  try {
    if (item.value?.id) {
      fav.value = await favoritesService.isFavorite(item.value.id)
    }
  } catch (err) {
    console.error('No se pudo comprobar favorito:', err)
  }
}

async function toggleFav() {
  // Optimista
  const prev = fav.value
  fav.value = !prev
  try {
    const now = await favoritesService.toggle(item.value.id)
    fav.value = now
  } catch (err) {
    console.error('Error al alternar favorito:', err)
    fav.value = prev // revertir si falla
  }
}

onMounted(async () => {
  const id = route.params.id

  // Detalle con joins y owner
  const data = await itemService.getById(id, { withOwner: true })
  item.value = data || {}

  await loadFavState()

  // Galería: main_image_path + item_images
  const imgs = []
  if (data?.main_image_path) imgs.push({ path: data.main_image_path, is_primary: true, role: 'front' })
  const gallery = await itemService.listImages(id)  // [{ path, role, is_primary, ... }]
  const ordered = sortByRole(gallery || [])

  // Merge sin duplicados
  const seen = new Set()
  images.value = []
  for (const it of [...imgs, ...ordered]) {
    if (!it?.path || seen.has(it.path)) continue
    seen.add(it.path)
    images.value.push(it.path)
  }
})

onBeforeUnmount(() => {
  
})
</script>

<style scoped>
/* ---------- Carrusel ---------- */
.carousel-frame{ width:100%; aspect-ratio:5/6; background:#f7f7f7; overflow:hidden; border-radius:.5rem }
.carousel-img{ width:100%; height:100%; object-fit:cover; display:block }
.carousel-placeholder{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#999 }

.thumbs{ display:flex; gap:.5rem; overflow:auto }
.thumb{ border:1px solid #ddd; border-radius:.375rem; padding:2px; background:#fff }
.thumb img{ height:56px; width:auto; display:block }
.thumb.active{ outline:2px solid #000 }

/* ---------- Perfil ---------- */
.avatar{ width:40px; height:40px; border-radius:50%; background:#e9ecef }

/* ---------- Precio ---------- */
.price{ font-weight:700 }

/* ---------- Tabla de detalles ---------- */
.rb-kv { display:grid; grid-template-columns: 1fr; gap:.5rem }
.rb-kv-row { display:grid; grid-template-columns: 40% 60%; gap:.75rem; padding:.5rem 0; border-bottom:1px solid #f0f0f0 }
.rb-kv-k { color:#6c757d }
.rb-kv-v { color:#212529 }

/* ---------- Títulos ---------- */
.item-title-mobile { margin-top: 0 }

/* ---------- Precio con logo de Binds ---------- */
.bind-price{
  background: transparent;   /* sin fondo */
  color: inherit;            /* hereda color */
  padding: 0;                /* sin padding */
  border-radius: 0;          /* sin pastilla */
  line-height: 1;
}
.bind-number{ color:#111; font-weight:700; }
.bind-logo{ width:20px; height:20px; opacity:.95; }

/* Responsive tweaks */
@media (min-width: 768px){
  .rb-kv{ gap:.25rem }
}
</style>
