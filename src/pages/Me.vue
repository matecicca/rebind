<template>
  <HeaderLayout>
    <div class="container my-5 page-profile">
      <!-- ====== Card cabecera de perfil ====== -->
      <section class="card p-4 mb-4 profile-card position-relative">
        <RouterLink
          to="/edit-profile"
          class="settings-icon"
          aria-label="Editar perfil"
          title="Editar perfil"
        >
          <i class="bi bi-gear"></i>
        </RouterLink>

        <div class="d-flex flex-column align-items-center text-center  profile-header">
          <div class="avatar-ring mb-3">
            <img v-if="avatarPublicUrl" :src="avatarPublicUrl" alt="Avatar" class="avatar-img" />
            <div v-else class="avatar-placeholder">{{ initials }}</div>
          </div>

          <h2 class="h4 mb-1 text-capitalize">{{ displayName }}</h2>
          <div class="text-muted">@{{ profile?.username || 'usuario' }}</div>
          <div v-if="profile?.level" class="text-secondary small mt-1">NVL {{ profile.level }}</div>

          <div class="d-flex gap-4 mt-3 small text-muted">
            <div class="text-center">
              <div class="fw-semibold">Seguidores</div>
              <div>{{ followers ?? '—' }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ====== MOBILE: barra de tabs ====== -->
      <div class="segmented-mobile d-md-none mb-3">
        <button
          :class="['seg-btn', { active: mobileTab === 'datos' }]"
          @click="mobileTab = 'datos'"
        >
          Datos
        </button>
        <button
          :class="['seg-btn', { active: mobileTab === 'publicadas' }]"
          @click="mobileTab = 'publicadas'"
        >
          Mi vestidor
        </button>
        <button
          :class="['seg-btn', { active: mobileTab === 'guardadas' }]"
          @click="mobileTab = 'guardadas'"
        >
          Guardadas
        </button>
        <button
          :class="['seg-btn', { active: mobileTab === 'seguidos' }]"
          @click="mobileTab = 'seguidos'"
        >
          Seguidos
        </button>
      </div>

      <!-- ====== Información ====== -->
      <section
        class="card p-4 shadow-sm mb-4"
        :class="{ 'd-none d-md-block': mobileTab !== 'datos' }"
      >
        <h3 class="h6 mb-3">Información</h3>

        <div class="row g-3 mb-3">
          <div class="col-12 col-md-6">
            <div class="small text-muted">Ciudad</div>
            <div class="fw-semibold fs-6">{{ profile?.city || '—' }}</div>
          </div>
          <div class="col-12 col-md-6">
            <div class="small text-muted">Barrio</div>
            <div class="fw-semibold fs-6">{{ profile?.neighborhood || '—' }}</div>
          </div>
        </div>

        <!-- Preferencias -->
        <div class="row row-cols-1 row-cols-md-2 g-3">
          <div>
            <div class="small text-muted">Género</div>
            <div class="fw-semibold">
              {{ prefs.genres?.length ? prefs.genres.join(', ') : '—' }}
            </div>
          </div>
          <div>
            <div class="small text-muted">Talle</div>
            <div class="fw-semibold">{{ prefs.sizes?.length ? prefs.sizes.join(', ') : '—' }}</div>
          </div>
          <div>
            <div class="small text-muted">Estilos</div>
            <div class="fw-semibold">
              {{ prefs.styles?.length ? prefs.styles.join(', ') : '—' }}
            </div>
          </div>
          <div>
            <div class="small text-muted">Estados preferibles</div>
            <div class="fw-semibold">
              {{ prefs.conditions?.length ? prefs.conditions.join(', ') : '—' }}
            </div>
          </div>
        </div>
      </section>

      <!-- ====== Mi vestidor ====== -->
    <section
      class="card p-3 shadow-sm mb-4"
      :class="{ 'd-none d-md-block': mobileTab !== 'publicadas' }"
    >
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h3 class="h6 m-0">Mi vestidor</h3>
      </div>
    
      <div v-if="loading" class="text-center py-5 text-muted">Cargando tu vestidor…</div>
      <div v-else-if="items.length === 0" class="text-center py-5 text-muted">
        Aún no agregaste prendas a tu vestidor.
      </div>
    
      <div v-else class="horizontal-scroller">
        <div class="card-inline compact" v-for="it in items" :key="it.id">
          <!-- 👇 Muestra el badge de estado SOLO en Me.vue -->
          <ItemCard :item="it" :show-status="true" @open="onOpen(it)" />
        </div>
      </div>
    </section>

<!-- ====== Guardadas ====== -->
<section
  class="card p-3 shadow-sm mb-4"
  :class="{ 'd-none d-md-block': mobileTab !== 'guardadas' }"
>
  <div class="d-flex align-items-center justify-content-between mb-2">
    <h3 class="h6 m-0">Prendas guardadas</h3>
  </div>

  <div v-if="savedLoading" class="text-center py-5 text-muted">Cargando guardados…</div>

  <div v-else-if="!savedItems.length" class="horizontal-scroller">
    <div class="card-inline placeholder-tile">Aún no guardaste prendas</div>
  </div>

  <div v-else class="horizontal-scroller">
    <RouterLink
      v-for="it in savedItems"
      :key="it.id"
      :to="`/item/${it.id}`"
      class="text-decoration-none text-reset"
    >
      <div class="card-inline compact">
        <!-- 👇 Sin show-status en guardadas -->
        <ItemCard :item="it" />
      </div>
    </RouterLink>
  </div>
</section>

      <!-- ====== Seguidos ====== -->
      <section
        class="card p-3 shadow-sm mb-4"
        :class="{ 'd-none d-md-block': mobileTab !== 'seguidos' }"
      >
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h3 class="h6 m-0">Usuarios seguidos</h3>
        </div>
        <div v-if="followingLoading" class="text-center py-5 text-muted">Próximamente…</div>
        <div v-else class="horizontal-scroller">
          <div class="user-chip placeholder-tile">Sin contenido aún</div>
        </div>
      </section>
    </div>
  </HeaderLayout>
</template>

<script setup>
import HeaderLayout from '@/layouts/AppLayout.vue'
import ItemCard from '@/components/ItemCard.vue'
import { onMounted, ref, computed, watch } from 'vue'
import { favoritesService } from '@/services/favoritesService'
import { useRouter } from 'vue-router'
import { profileService } from '@/services/profileService.js'
import { itemService } from '@/services/itemService'
import { storageService } from '@/services/storageService'
import { socialService } from '@/services/socialService'
import { preferencesService } from '@/services/preferencesService'
import { supabase } from '@/services/supabaseClient'
import { useRoute } from 'vue-router'


const route = useRoute()
const router = useRouter()
const savedItems = ref([])
const savedLoading = ref(false)
const profile = ref({})
const items = ref([])
const followers = ref(0)
const prefs = ref({ sizes: [], conditions: [], styles: [], genres: [] })
const followingLoading = ref(false)
const loading = ref(true)
const mobileTab = ref('datos')

function normalizeTab(v) {
  const allowed = ['datos', 'publicadas', 'guardadas', 'seguidos']
  if (!v) return 'datos'
  return allowed.includes(v) ? v : 'datos'
}

// set inicial desde query
mobileTab.value = normalizeTab(route.query.tab)

// reaccionar a cambios de ruta
watch(() => route.query.tab, (v) => {
  mobileTab.value = normalizeTab(v)
})

const avatarPublicUrl = computed(() => {
  if (!profile.value?.avatar_url) return null
  return storageService.getPublicUrl('avatars', profile.value.avatar_url)
})

const displayName = computed(() => {
  const p = profile.value || {}
  const full = [p.first_name, p.last_name].filter(Boolean).join(' ')
  return full || p.username || 'Mi perfil'
})

const initials = computed(() => {
  const p = profile.value || {}
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username || ''
  return name.trim().slice(0, 2).toUpperCase()
})

onMounted(async () => {
  try {
    profile.value = await profileService.getMyProfile()
    prefs.value = await preferencesService.getMyPreferences()
    const profileId = profile.value?.id

    followers.value = await socialService.followersCount(profileId)
    items.value = await itemService.listByOwner(profileId, 1, 24)
  } catch (err) {
    console.error('Error cargando perfil:', err)
  } finally {
    loading.value = false
  }

  try {
    savedLoading.value = true
    const me = (await supabase.auth.getUser()).data?.user?.id
    if (me) {
      savedItems.value = await favoritesService.listByUser(me, { page: 1, pageSize: 20 })
    } else {
      savedItems.value = []
    }
  } catch (err) {
    console.error('Error cargando guardados:', err)
    savedItems.value = []
  } finally {
    savedLoading.value = false
  }
})

/** Decide navegación según status del item */
function onOpen (it) {
  if (!it || !it.status) return
  if (it.status === 'draft') return router.push(`/preupload/${it.id}`)
  if (it.status === 'pending_review') return // sin navegación mientras se revisa
  // approved u otros estados visibles
  router.push(`/item/${it.id}`)
}
</script>

<style scoped>
.page-profile {
  background-color: #f7f9fb;
  min-height: 100vh;
  padding-bottom: 4rem;
}

.profile-card {
  border-radius: 0.75rem;
  background-image: url('@/assets/images/patron-perfil.png');
  background-size: cover;
  background-position: center;
  position: relative;
}
.profile-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  border-radius: inherit;
}
.profile-card > * {
  position: relative;
  z-index: 1;
}

.profile-header {
  text-align: center;
  padding: 2rem 1.2rem;
}
.profile-header img {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid #fff;
}
.profile-header h2 { font-size: 1.4rem; font-weight: 600; margin-top: 0.75rem; }
.profile-header .text-muted { color: #627085 !important; font-size: 0.9rem; }

.profile-info {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border: none;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Icono ajustes */
.settings-icon {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  color: #929292;
  font-size: 1.8rem;
  line-height: 1;
  transition: color 0.2s;
}
.settings-icon:hover { color: #ddd; }

/* Avatar */
.avatar-ring {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #fff;
  overflow: hidden;
  background: #f3f3f3;
  display: grid;
  place-items: center;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.avatar-placeholder { font-weight: 700; color: #999; font-size: 1.25rem; }

/* Carruseles */
.horizontal-scroller {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  padding-bottom: 6px;
}
/* Limitar el ancho real de las cards dentro del perfil */
.horizontal-scroller .item-card { max-width: 180px; margin: 0 auto; }
@media (min-width: 768px) {
  .horizontal-scroller .item-card { max-width: 200px; }
}
.card-inline { min-width: 240px; scroll-snap-align: start; }
.card-inline.compact { min-width: 180px !important; }

.user-chip, .placeholder-tile {
  min-width: 180px;
  height: 100px;
  border: 1px dashed #ddd;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #888;
}

/* Tabs mobile */
.segmented-mobile {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  background: #f4f5f7;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 6px;
}
.seg-btn {
  border: 0;
  background: transparent;
  padding: 8px 10px;
  font-size: 0.9rem;
  border-radius: 999px;
  color: #6b7280;
}
.seg-btn.active {
  background: #fff;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

@media (min-width: 768px) {
  .segmented-mobile { display: none; }
  .card-inline { min-width: 280px; }
}
@media (min-width: 768px) {
  .card-inline.compact { min-width: 200px !important; }
}
</style>
