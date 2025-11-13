<template>
  <div class="layout-wrapper">
    <!-- HEADER -->
    <header
  class="rb-header custom-header text-white py-3 shadow-sm"
  :class="{
    'fixed-top': isDesktop || isMobile,
    'header-hidden': isMobile && !showHeader,
    'header-visible': isMobile && showHeader
  }"
>
  <div class="container d-flex justify-content-between align-items-center">
    <!-- Logo -->
    <RouterLink
      to="/home"
      class="d-flex align-items-center text-decoration-none text-white"
    >
      <img src="@/assets/images/rebind_logo.svg" alt="Rebind" class="logo-img" />
      <h1 class="visually-hidden">Rebind</h1>
    </RouterLink>

    <!-- 🔹 Navegación Desktop -->
    <nav class="d-none d-md-flex align-items-center gap-3">
      <RouterLink to="/home" class="text-white text-decoration-none">Inicio</RouterLink>
      <RouterLink to="/upload" class="text-white text-decoration-none">Publicar</RouterLink>

      <!-- Ícono de notificaciones -->
      <button
        class="notif-btn position-relative"
        type="button"
        aria-label="Notificaciones"
        @click.prevent
      >
        <i class="bi bi-bell"></i>
        <span v-if="unreadCount > 0" class="notif-dot"></span>
      </button>

      <!-- Wallet + Sesión -->
      <template v-if="isLogged">
        <WalletBadge :balance="bindBalance" />
              <div class="position-relative">
      <button
        class="profile-btn"
        @click="toggleProfileMenuDesktop"
        aria-label="Perfil"
      >
        <i class="bi bi-person"></i>
      </button>
      
        <div
          v-if="showProfileMenuDesktop"
          class="dropdown-menu show profile-menu"
          style="right:0; left:auto; min-width: 200px;"
        >
          <button class="dropdown-item" @click="goToMeTab('publicadas')">
            Mi vestidor
          </button>
          <button class="dropdown-item" @click="goToMeTab('datos')">
            Mis datos
          </button>
          <button class="dropdown-item" @click="goToMeTab('guardadas')">
            Prendas guardadas
          </button>
          <button class="dropdown-item" @click="goToMeTab('seguidos')">
            Seguidos
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="goEditProfile">
            Editar perfil
          </button>
          <button class="dropdown-item text-danger" @click="logout">
            Cerrar sesión
          </button>
        </div>
      </div>
        <button class="btn btn-outline-light btn-sm" @click="logout">Salir</button>
      </template>

      <template v-else>
        <RouterLink to="/auth" class="btn btn-login-yellow btn-sm">Ingresar</RouterLink>
      </template>
    </nav>

    <!-- 🔹 Header Mobile -->
    <div class="d-flex d-md-none align-items-center gap-3">
      <button
        class="notif-btn position-relative"
        type="button"
        aria-label="Notificaciones"
        @click.prevent
      >
        <i class="bi bi-bell"></i>
        <span v-if="unreadCount > 0" class="notif-dot"></span>
      </button>

      <!-- Si está logueado, mostrar Wallet -->
      <WalletBadge v-if="isLogged" :balance="bindBalance" />

      <!-- Si no está logueado, botón de Ingresar -->
      <RouterLink v-else to="/auth" class="btn btn-login-yellow">
        Ingresar
      </RouterLink>
    </div>
  </div>
</header>

<!-- CONTENIDO -->
<main :class="['flex-fill', 'pt-5', { 'home-main-bg': isHome }]">
  <slot />
</main>

<!-- 🔹 Footer Desktop -->
<footer class="rb-footer d-none d-md-block text-white py-3">
  <div
    class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2"
  >
    <p class="mb-0 small">© {{ currentYear }} Rebind. Todos los derechos reservados.</p>
    <nav class="d-flex gap-3 small">
      <RouterLink to="/about" class="text-white text-decoration-none">Sobre nosotros</RouterLink>
      <RouterLink to="/terms" class="text-white text-decoration-none">Términos y condiciones</RouterLink>
      <RouterLink to="/privacy" class="text-white text-decoration-none">Privacidad</RouterLink>
    </nav>
  </div>
</footer>

<!-- 🔹 Bottom Nav SOLO MOBILE -->
<nav v-if="isLogged" class="rb-bottom-nav d-md-none">
  <RouterLink to="/home" class="rb-bottom-link" active-class="active" aria-label="Inicio">
    <i class="bi bi-house"></i>
  </RouterLink>

  <RouterLink to="/" class="rb-bottom-link" aria-label="Mensajes">
    <i class="bi bi-chat-dots"></i>
  </RouterLink>

  <RouterLink to="/upload" class="rb-bottom-link rb-bottom-cta" aria-label="Publicar">
    <i class="bi bi-hanger"></i>
  </RouterLink>

  <!-- Menú Perfil (MOBILE, en bottom nav) -->
<div class="rb-bottom-link position-relative" aria-label="Perfil">
    <button class="profile-btn profile-btn--mobile" @click="toggleProfileMenuMobile">
    <i class="bi bi-person"></i>
  </button>

  <div
    v-if="showProfileMenuMobile"
    class="dropdown-menu show profile-menu"
    style="position:absolute; bottom:56px; right:8px; min-width:200px;"
  >
    <button class="dropdown-item" @click="goToMeTab('publicadas')">
      Mi vestidor
    </button>
    <button class="dropdown-item" @click="goToMeTab('datos')">
      Mis datos
    </button>
    <button class="dropdown-item" @click="goToMeTab('guardadas')">
      Prendas guardadas
    </button>
    <button class="dropdown-item" @click="goToMeTab('seguidos')">
      Seguidos
    </button>
    <div class="dropdown-divider"></div>
    <button class="dropdown-item" @click="goEditProfile">
      Editar perfil
    </button>
    <button class="dropdown-item text-danger" @click="logout">
      Cerrar sesión
    </button>
  </div>
</div>

  <div class="rb-bottom-link position-relative" aria-label="Más">
    <button class="btn text-white p-0" @click="toggleMoreMenu">
      <i class="bi bi-list"></i>
    </button>
    <div
      v-if="showMoreMenu"
      class="dropdown-menu show"
      style="position: absolute; bottom: 56px; right: 8px"
    >
      <RouterLink class="dropdown-item" to="/about">Sobre nosotros</RouterLink>
      <RouterLink class="dropdown-item" to="/terms">Términos y condiciones</RouterLink>
      <RouterLink class="dropdown-item" to="/privacy">Privacidad</RouterLink>
    </div>
  </div>
</nav>

<!-- 🔹 Si NO está logueado, Bottom Nav simplificado -->
<nav v-else class="rb-bottom-nav d-md-none">
  <RouterLink to="/home" class="rb-bottom-link" active-class="active">Home</RouterLink>
  <RouterLink to="/auth" class="rb-bottom-link">Ingresar</RouterLink>
</nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter, RouterLink, useRoute } from 'vue-router'
import { notificationsService } from '@/services/notificationsService'
import { authService } from '@/services/authService'
import { walletService } from '@/services/walletService'
import WalletBadge from '@/components/WalletBadge.vue'

const route = useRoute()
const router = useRouter()
const unreadCount = ref(0)
const isLogged = ref(false)
const bindBalance = ref(0)
let unsub = null

const currentYear = computed(() => new Date().getFullYear())

// True si la ruta es /home o la nombrada 'home'
const isHome = computed(() => {
  const n = route.name?.toString().toLowerCase()
  const p = route.path?.toString().toLowerCase()
  return n === 'home' || p === '/home' || p?.startsWith('/home')
})

const showMoreMenu = ref(false)
function toggleMoreMenu() {
  showMoreMenu.value = !showMoreMenu.value
}

// Animación scroll + detección vista
const showHeader = ref(true)
const lastScrollY = ref(0)
const isMobile = ref(false)
const isDesktop = ref(false)

const handleScroll = () => {
  const currentY = window.scrollY
  showHeader.value = currentY < lastScrollY.value || currentY < 10
  lastScrollY.value = currentY
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  isDesktop.value = !isMobile.value
}

const showProfileMenuDesktop = ref(false)
const showProfileMenuMobile  = ref(false)

function closeAllProfileMenus() {
  showProfileMenuDesktop.value = false
  showProfileMenuMobile.value = false
}

function toggleProfileMenuDesktop() {
  showProfileMenuDesktop.value = !showProfileMenuDesktop.value
  if (showProfileMenuDesktop.value) showProfileMenuMobile.value = false
}

function toggleProfileMenuMobile() {
  showProfileMenuMobile.value = !showProfileMenuMobile.value
  if (showProfileMenuMobile.value) showProfileMenuDesktop.value = false
}

function goToMeTab(tab) {
  closeAllProfileMenus()
  router.push({ path: '/me', query: { tab } })
}

function goEditProfile() {
  closeAllProfileMenus()
  router.push('/edit-profile')
}

// Cerrar menús al clickear fuera o cambiar ruta
function onDocumentClick(e) {
  const menus = document.querySelectorAll('.profile-menu, .bi-person')
  let clickInside = false
  menus.forEach(el => { if (el && el.contains(e.target)) clickInside = true })
  if (!clickInside) closeAllProfileMenus()
}
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
watch(() => router.currentRoute.value.fullPath, () => closeAllProfileMenus())

onMounted(async () => {
  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll)

  try {
    unreadCount.value = await notificationsService.unreadCount()
  } catch (e) {
    console.error('Error cargando notificaciones:', e)
  }

  // --- Carga inicial de sesión + wallet ---
  try {
    const { data } = await authService.getSession()
    isLogged.value = !!data?.session?.user

    if (isLogged.value) {
      const wallet = await walletService.getOrCreateMyWallet()
      bindBalance.value = wallet?.balance_bind ?? 0
    }
  } catch (err) {
    console.error('Error cargando sesión inicial:', err)
  }

  // --- Suscripción sin llamadas a Supabase ---
  const sub = authService.onAuthStateChange((_event, session) => {
    isLogged.value = !!session?.user
    if (!isLogged.value) {
      bindBalance.value = 0
    }
  })

  unsub = sub?.data?.subscription?.unsubscribe
})

watch(isLogged, async (logged) => {
  if (!logged) return
  try {
    const wallet = await walletService.getOrCreateMyWallet()
    bindBalance.value = wallet?.balance_bind ?? 0
  } catch (err) {
    console.error('Error recargando wallet tras cambio de sesión:', err)
  }
})

onBeforeUnmount(() => {
  try { unsub?.() } catch (_) {}
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll)
})

async function logout() {
  try {
    await authService.signOut()
    router.push('/auth')
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
/* ======== LAYOUT GLOBAL ======== */

/* Fondo exclusivo para <main> cuando estás en Home */
.home-main-bg {
  background-image: url('@/assets/images/fondo-home.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* background-attachment: fixed; */
  min-height: 100%;
}

.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.flex-fill {
  flex: 1 0 auto;
}

.rb-footer {
  flex-shrink: 0;
  margin-top: auto;
}

/* ======== HEADER ======== */
.custom-header {
  background-color: #05426A !important;
}

.btn-login-yellow {
  background-color: #ffd66b;
  padding: 8px 22px;
  border-radius: 40px;
  font-weight: 600;
  color: #000;
  border: 1px solid #d1b15a;
  text-decoration: none;
  display: inline-block;
}

/* Header fijo */
.fixed-top {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1030;
}

/* Animaciones scroll mobile */
.header-hidden {
  opacity: 0;
  transform: translateY(-100%);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.header-visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.logo-img {
  height: 28px;
  width: auto;
  display: block;
}

/* Ícono de notificaciones */
.notif-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.25rem;
  position: relative;
}
.notif-btn:hover {
  opacity: 0.8;
}
.notif-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: #ffc107;
  border-radius: 50%;
}

/* Botones */
.btn-outline-light {
  border-color: #ffffffcc;
  color: #fff;
}
.btn-outline-light:hover {
  background-color: #ffffff22;
  border-color: #fff;
}

/* ======== FOOTER DESKTOP ======== */
.rb-footer {
  background-color: #05426A;
  border-top: 1px solid #0a2c47;
  font-size: 0.875rem;
}

/* ======== FOOTER MOBILE (BOTTOM NAV) ======== */
.rb-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 56px;
  background: #05426A;
  color: #fff;
  z-index: 1030;
  border-top: 1px solid #0a2c47;
}

.rb-bottom-link {
  text-decoration: none;
  color: #fff;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
}

.rb-bottom-link.active {
  font-weight: 600;
  text-decoration: underline;
}

.rb-bottom-cta {
  font-weight: 600;
  border: 1px solid #fff3;
  border-radius: 999px;
  margin: 0 0.25rem;
  padding: 0.25rem 0.75rem;
  align-self: center;
  height: auto;
}

.rb-header .btn,
.rb-header a {
  border-radius: 999px;
}

p{
  color: #fff !important;
}

/* En el menú "Más", mantiene estilo actual; no tocar */

.more-menu {
  bottom: 56px; /* justo arriba del bottom nav */
  right: 0;
  min-width: 140px;
  z-index: 1050;
}

.more-menu .dropdown-item {
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
}

.more-menu .dropdown-item:hover {
  background-color: #f8f9fa;
}

.profile-menu {
  box-shadow: 0 6px 18px rgba(0,0,0,.18);
  border: 1px solid #ffffff33;
  background: #fff;
  padding: .25rem 0;
  border-radius: .5rem;
}
.profile-menu .dropdown-item {
  font-size: .95rem;
}
.profile-menu .dropdown-item.text-danger { color: #dc3545; }
.profile-menu .dropdown-item.text-danger:hover { background: #fff1f1; }

.profile-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid #ffffff55;
  border-radius: 9999px;
  background: transparent;
  color: #fff;
  display: grid;
  place-items: center;
  transition: background-color .15s ease, border-color .15s ease, opacity .15s ease;
}

.profile-btn:hover {
  background-color: #ffffff22;
  border-color: #ffffff88;
  opacity: 0.95;
}

/* Ícono más grande */
.profile-btn i {
  font-size: 1.25rem; /* sube tamaño del ícono */
  line-height: 1;
}

/* En bottom nav puede ser un toque más grande si querés */
.profile-btn--mobile {
  width: 44px;
  height: 44px;
}

/* Evitar que el contenido quede tapado por el footer en mobile */
@media (max-width: 767.98px) {
  main {
    padding-bottom: 64px;
  }
}


</style>
