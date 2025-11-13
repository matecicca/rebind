import { createRouter, createWebHistory } from 'vue-router'
import Auth from '../pages/Auth.vue'
import UploadItem from '../pages/UploadItem.vue'
import PreUpload from '../pages/PreUpload.vue'
import Me from '../pages/Me.vue'
import Profile from '../pages/Profile.vue'
import ItemPage from '@/pages/ItemPage.vue'
import Home from '../pages/Home.vue'
import Admin from '../pages/admin/Admin.vue'
import AdminItem from '../pages/admin/AdminItem.vue'
import { authService } from '@/services/authService'
import { supabase } from '@/services/supabaseClient'
import EditProfile from '@/pages/EditProfile.vue'
import BindPurchase from '@/pages/BindPurchase.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/auth', component: Auth },
  { path: '/home', component: Home },
  { path: '/item/:id', component: ItemPage, props: true },
  { path: '/upload', component: UploadItem, meta: { requireAuth: true } },
  { path: '/preupload/:id', component: PreUpload, meta: { requireAuth: true } },
  { path: '/binds', name: 'binds', component: BindPurchase, meta: { requiresAuth: true } },
  { path: '/me', component: Me, meta: { requireAuth: true } },
  { path: '/edit-profile', component: EditProfile, meta: { requireAuth: true } },
  { path: '/profile', redirect: '/me' },
  { path: '/u/:id', component: Profile },
  // 🔹 Rutas de administración protegidas
  { path: '/admin', component: Admin, meta: { requireAuth: true, adminOnly: true } },
  { path: '/admin/item/:id', component: AdminItem, meta: { requireAuth: true, adminOnly: true } },
  {path: '/about', name: 'about', component: () => import('@/pages/static/About.vue')},
  { path: '/terms', name: 'terms', component: () => import('@/pages/static/Terms.vue')},
  { path: '/privacy', name: 'privacy', component: () => import('@/pages/static/Privacy.vue')}

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * Middleware global de navegación
 * Controla:
 * - Acceso autenticado
 * - Acceso de administradores (adminOnly)
 */
router.beforeEach(async (to, from, next) => {
  const { data } = await authService.getSession()
  const session = data?.session
  const user = session?.user

  // 🔸 Rutas que requieren autenticación
  if (to.meta.requireAuth && !user) {
    return next('/auth')
  }

  // 🔸 Verificación de admin
  if (to.meta.adminOnly) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('admin')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (!profile?.admin) {
        // Usuario no es admin → redirigir al home
        return next('/home')
      }
    } catch (err) {
      console.error('Error verificando permisos de admin:', err)
      return next('/home')
    }
  }

  // 🔸 Si ya está logueado e intenta ir al login, redirigir al home
  if (to.path === '/auth' && user) {
    return next('/home')
  }

  // 🔹 Permitir navegación normal
  next()
})

export { router }
