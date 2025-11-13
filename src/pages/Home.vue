<template>
  <AppLayout>
    <div class="container my-4 my-lg-5">
      <div class="row g-4">
        <!-- ====== LATERAL (desktop) / TABS (mobile) ====== -->
        <aside class="col-12 col-lg-3">
          <!-- TABS MOBILE -->
          <div class="home-tabs d-lg-none">
            <button
              :class="['tab-btn', { active: mode==='explore' }]"
              @click="switchMode('explore')"
            >Explorar</button>
            <button
              :class="['tab-btn', { active: mode==='recommended' }]"
              @click="switchMode('recommended')"
            >Recomendado</button>
            <button
              :class="['tab-btn', { active: mode==='following' }]"
              @click="switchMode('following')"
            >Siguiendo</button>
          </div>

          <!-- LATERAL DESKTOP -->
          <div class="home-sidebar d-none d-lg-block card p-3 sticky-top">
            <button
              :class="['side-link', { active: mode==='explore' }]"
              @click="switchMode('explore')"
            >Explorar</button>
            <button
              :class="['side-link', { active: mode==='recommended' }]"
              @click="switchMode('recommended')"
            >Recomendado</button>
            <button
              :class="['side-link', { active: mode==='following' }]"
              @click="switchMode('following')"
            >Siguiendo</button>

            <hr />
            <button class="btn btn-outline-dark w-100" @click="openFilters">Abrir filtros</button>
          </div>
        </aside>

        <!-- ====== FEED ====== -->
        <section class="col-12 col-lg-9">
          <!-- Barra de búsqueda -->
          <div class="card p-3 mb-3">
            <form @submit.prevent="onSearch" class="d-flex gap-2 align-items-center">
            <input
              v-model.trim="q"
              type="search"
              class="form-control"
              placeholder="Buscar por título o descripción…"
              aria-label="Buscar prendas"
            />

            <!-- Desktop: botones con texto -->
            <button class="btn btn-dark d-none d-md-inline-flex" type="submit">Buscar</button>
            <button
              type="button"
              class="btn btn-outline-secondary d-none d-md-inline-flex"
              :disabled="!q"
              @click="clearSearch"
            >
              Limpiar
            </button>
          
            <!-- Mobile: iconos -->
            <button class="btn btn-dark d-inline-flex d-md-none" type="submit" aria-label="Buscar">
              <i class="bi bi-search"></i>
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary d-inline-flex d-md-none"
              :disabled="!q"
              @click="clearSearch"
              aria-label="Limpiar búsqueda"
            >
              <i class="bi bi-x-circle"></i>
            </button>
          
            <!-- Mobile: botón de filtros al lado del buscador -->
            <button
              type="button"
              class="btn btn-outline-secondary d-inline-flex d-lg-none"
              @click="openFilters"
              aria-label="Abrir filtros"
            >
              <i class="bi bi-funnel"></i>
            </button>
          </form>

            <small v-if="q" class="text-muted mt-1 d-block">
              Mostrando resultados para: “{{ q }}”
            </small>
          </div>

          <!-- Panel de filtros inline (usa apply/clear) -->
          <transition name="fade">
            <div v-if="filtersOpen" class="card p-3 mb-3 home-filters-panel">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <h6 class="m-0">Filtros</h6>
                <button class="btn btn-sm btn-link text-muted" @click="filtersOpen=false">Cerrar</button>
              </div>

              <!-- Controles reales -->
            <div class="row g-3 mb-3">
              <div class="col-12 col-md-6 col-lg-4">
                <label class="form-label small">Categoría</label>
                <AutoCompleteSelect
                  table="garment_types"
                  placeholder="Seleccionar categoría"
                  v-model="filters.garment_type_id"
                />
              </div>
            
              <div class="col-12 col-md-6 col-lg-4">
                <label class="form-label small">Talle</label>
                <AutoCompleteSelect
                  table="sizes"
                  placeholder="Seleccionar talle"
                  v-model="filters.size_id"
                />
              </div>
            
              <div class="col-12 col-md-6 col-lg-4">
                <label class="form-label small">Marca</label>
                <AutoCompleteSelect
                  table="brands"
                  placeholder="Seleccionar marca"
                  v-model="filters.brand_id"
                />
              </div>
            
              <div class="col-12 col-md-6 col-lg-4">
                <label class="form-label small">Color</label>
                <AutoCompleteSelect
                  table="colors"
                  placeholder="Seleccionar color"
                  v-model="filters.color_id"
                />
              </div>
            
              <div class="col-12 col-md-6 col-lg-4">
                <label class="form-label small">Estilo</label>
                <AutoCompleteSelect
                  table="styles"
                  placeholder="Seleccionar estilo"
                  v-model="filters.style_id"
                />
              </div>
            
              <div class="col-12 col-md-6 col-lg-4">
                <label class="form-label small">Estado</label>
                <AutoCompleteSelect
                  table="conditions"
                  placeholder="Seleccionar estado"
                  v-model="filters.condition_id"
                />
              </div>
            
              <div class="col-12 col-md-6 col-lg-4">
                <label class="form-label small">Material</label>
                <AutoCompleteSelect
                  table="materials"
                  placeholder="Seleccionar material"
                  v-model="filters.material_id"
                />
              </div>
            
              <div class="col-12 col-md-6 col-lg-4">
                <label class="form-label small">Género</label>
                <AutoCompleteSelect
                  table="genres"
                  placeholder="Seleccionar género"
                  v-model="filters.genre_id"
                />
              </div>
            </div>


              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-secondary" @click="clearFilters">
                  Limpiar filtros
                </button>
                <button type="button" class="btn btn-dark" @click="applyFilters">
                  Aplicar filtros
                </button>
              </div>
            </div>
          </transition>

          <!-- Estado -->
          <div v-if="loading" class="text-center py-5 text-muted">Cargando publicaciones…</div>
          <div v-else-if="items.length === 0" class="text-center py-5 text-muted">
            <template v-if="mode==='following'">
              Todavía no sigues ningún usuario.
            </template>
            <template v-else-if="q">
              No se encontró ninguna prenda.
            </template>
            <template v-else>
              No hay publicaciones para mostrar.
            </template>
          </div>

          <!-- Grid -->
          <div v-else class="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3">
            <div v-for="it in items" :key="it.id" class="col">
              <RouterLink
              :to="`/item/${it.id}`"
              class="text-decoration-none d-block h-100"
            >
              <ItemCard :item="it" @open="openItem(it)" />
            </RouterLink>
            </div>
          </div>

          <!-- Paginación simple -->
          <div class="d-flex justify-content-center gap-2 mt-4" v-if="!loading && canPaginate">
            <button class="btn btn-outline-dark" :disabled="page===1" @click="prevPage">Anterior</button>
            <button class="btn btn-outline-dark" @click="nextPage">Siguiente</button>
          </div>
        </section>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import ItemCard from '@/components/ItemCard.vue'
import { itemService } from '@/services/itemService'
import { recommendationService } from '@/services/recommendationService'
import AutoCompleteSelect from '@/components/AutoCompleteSelect.vue'

const router = useRouter()

// === Estado UI
const mode = ref('explore') // 'explore' | 'recommended' | 'following'
const q = ref('')           // búsqueda
const loading = ref(false)
const items = ref([])
const page = ref(1)
const pageSize = ref(24)
const canPaginate = ref(true)

// === Filtros
const filtersOpen = ref(false)
const filters = ref({
  size_id: null,
  color_id: null,
  brand_id: null,
  condition_id: null,
  style_id: null,
  material_id: null,
  genre_id: null,
})

function switchMode(m) {
  if (mode.value === m) return
  mode.value = m
  page.value = 1
  load()
}

function openFilters() { filtersOpen.value = true }

function applyFilters() {
  filtersOpen.value = false
  page.value = 1
  load()
}

function clearFilters() {
  Object.keys(filters.value).forEach(k => { filters.value[k] = null })
  page.value = 1
  load()
}

function openItem(it) {
  router.push(`/item/${it.id}`)
}

function clearSearch() {
  q.value = ''
  page.value = 1
  load()
}

async function onSearch() {
  page.value = 1
  await load()
}

async function load() {
  loading.value = true
  try {
    let data = []
    if (mode.value === 'explore') {
      if (q.value) {
        data = await itemService.searchPublicFeed(q.value, page.value, pageSize.value, filters.value, { includeMine: false })
      } else {
        data = await itemService.getPublicFeed(page.value, pageSize.value, filters.value, { includeMine: false })
      }
    } else if (mode.value === 'recommended') {
      data = await recommendationService.getRecommended(page.value, pageSize.value, q.value || null)
    } else if (mode.value === 'following') {
      data = []
    }
    items.value = data || []
    canPaginate.value = (items.value.length === pageSize.value)
  } catch (e) {
    console.error(e)
    items.value = []
    canPaginate.value = false
  } finally {
    loading.value = false
  }
}

function nextPage(){ page.value++; load() }
function prevPage(){ if (page.value>1){ page.value--; load() } }

watch(mode, () => {})
onMounted(load)
</script>

<style scoped>

/* Tabs móviles centradas */
.home-tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.25rem;
  padding: .5rem .25rem;
  text-align: center;
}
.tab-btn {
  background: transparent;
  border: 0;
  color: #9aa0a6;
  font-weight: 600;
  padding: .5rem .25rem;
  position: relative;
}
.tab-btn.active { color: #111; }
.tab-btn.active::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -2px;
  width: 32px; height: 3px;
  background: #111; border-radius: 2px;
}

/* Lateral desktop */
.home-sidebar .side-link {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  padding: .5rem .25rem;
  color: #6c757d;
  font-weight: 600;
}
.home-sidebar .side-link.active { color: #111; }

/* Panel filtros */
.home-filters-panel {
  border-radius: 12px;
  border: 1px solid #e6ebf0;
  background: #fdfdfd;
}

/* Animación */
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
