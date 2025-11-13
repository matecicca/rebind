<template>
  <div class="auth-shell">
    <div class="auth-card-wrapper">
      <!-- Encabezado visual -->
      <div class="brand-header">
        <img src="@/assets/images/rebind_logo.svg" alt="Rebind" class="brand-logo" />
        <h1 class="brand-title">¡Bienvenido!</h1>
        <p class="brand-subtitle">Ingresa a tu cuenta o crea una nueva para comenzar.</p>
      </div>

      <!-- Tarjeta con formularios -->
      <div class="auth-card">
        <!-- NAV de regreso en registro -->
        <button
          v-if="isSignUp"
          class="link-back"
          type="button"
          @click="toLogin"
          aria-label="Volver al inicio de sesión"
        >
          ← Volver al inicio de sesión
        </button>

        <!-- Contenedor animado -->
        <div class="view-viewport">
          <transition name="slide-vertical" mode="out-in" @enter="onEnter" @leave="onLeave">
            <!-- ============ LOGIN ============ -->
            <section v-if="!isSignUp" key="login" class="view">
              <h2 class="view-title">Iniciar sesión</h2>

              <form @submit.prevent="onSubmitLogin" novalidate>
                <div class="form-group">
                  <label class="form-label" for="login-email">Correo electrónico</label>
                  <div class="input-wrap">
                    <i class="bi bi-envelope"></i>
                    <input
                      id="login-email"
                      v-model.trim="login.email"
                      type="email"
                      inputmode="email"
                      autocomplete="email"
                      placeholder="tu@email.com"
                      class="form-input"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="login-password">Contraseña</label>
                  <div class="input-wrap">
                    <i class="bi bi-lock"></i>
                    <input
                      id="login-password"
                      v-model="login.password"
                      :type="showPassLogin ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="••••••••"
                      class="form-input"
                      required
                    />
                    <button
                      type="button"
                      class="eye-btn"
                      @click="showPassLogin = !showPassLogin"
                      :aria-label="showPassLogin ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    >
                      <i :class="showPassLogin ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <div class="form-aux">
                  <button type="button" class="link-aux" @click="onForgotPassword">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button type="submit" class="btn-primary" :disabled="loading">
                  <span v-if="!loading">Iniciar sesión</span>
                  <span v-else class="spinner"></span>
                </button>
              </form>

              <!-- Social -->
              <div class="divider"><span>o continua con</span></div>
              <div class="social-row">
                <button
                  class="btn-social"
                  type="button"
                  title="Continuar con Google"
                  @click="onLoginGoogle"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt=""
                  />
                </button>
                <button
                  class="btn-social"
                  type="button"
                  title="Continuar con Apple"
                  @click="onLoginApple"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
                    alt=""
                  />
                </button>
                <button
                  class="btn-social"
                  type="button"
                  title="Continuar con Facebook"
                  @click="onLoginFacebook"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Facebook_Logo.png"
                    alt=""
                  />
                </button>
              </div>

              <!-- CTA a registro -->
              <p class="switch-row">
                ¿No tienes una cuenta?
                <button class="link-aux" type="button" @click="toSignUp">Regístrate aquí</button>
              </p>
            </section>

            <!-- ============ SIGN UP ============ -->
            <section v-else key="signup" class="view">
              <h2 class="view-title">Crear cuenta</h2>

              <form @submit.prevent="onSubmitSignUp" novalidate>
                <div class="form-group">
                  <label class="form-label" for="signup-email">Correo electrónico</label>
                  <div class="input-wrap">
                    <i class="bi bi-envelope"></i>
                    <input
                      id="signup-email"
                      v-model.trim="signup.email"
                      type="email"
                      inputmode="email"
                      autocomplete="email"
                      placeholder="tu@email.com"
                      class="form-input"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="signup-username">Nombre de usuario</label>
                  <div class="input-wrap">
                    <i class="bi bi-person"></i>
                    <input
                      id="signup-username"
                      v-model.trim="signup.username"
                      type="text"
                      autocomplete="username"
                      placeholder="tu_usuario"
                      class="form-input"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="signup-password">Contraseña</label>
                  <div class="input-wrap">
                    <i class="bi bi-lock"></i>
                    <input
                      id="signup-password"
                      v-model="signup.password"
                      :type="showPassSignup ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      class="form-input"
                      minlength="8"
                      required
                    />
                    <button
                      type="button"
                      class="eye-btn"
                      @click="showPassSignup = !showPassSignup"
                      :aria-label="showPassSignup ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    >
                      <i :class="showPassSignup ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="signup-password2">Confirmar contraseña</label>
                  <div class="input-wrap">
                    <i class="bi bi-lock-fill"></i>
                    <input
                      id="signup-password2"
                      v-model="signup.password2"
                      :type="showPassSignup ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Repite la contraseña"
                      class="form-input"
                      minlength="8"
                      required
                    />
                  </div>
                </div>

                <button type="submit" class="btn-primary" :disabled="loading">
                  <span v-if="!loading">Crear cuenta</span>
                  <span v-else class="spinner"></span>
                </button>
              </form>

              <!-- Social (opcional, sin lógica) -->
              <div class="divider"><span>o continua con</span></div>
              <div class="social-row">
                <button
                  class="btn-social"
                  type="button"
                  title="Continuar con Google"
                  @click="onLoginGoogle"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt=""
                  />
                </button>
                <button
                  class="btn-social"
                  type="button"
                  title="Continuar con Apple"
                  @click="onLoginApple"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
                    alt=""
                  />
                </button>
                <button
                  class="btn-social"
                  type="button"
                  title="Continuar con Facebook"
                  @click="onLoginFacebook"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Facebook_Logo.png"
                    alt=""
                  />
                </button>
              </div>

              <p class="switch-row">
                ¿Ya tienes una cuenta?
                <button class="link-aux" type="button" @click="toLogin">
                  Volver al inicio de sesión
                </button>
              </p>
            </section>
          </transition>
        </div>

        <!-- Mensajes de error/ok -->
        <p v-if="feedback.message" :class="['feedback', feedback.type]">
          {{ feedback.message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabaseClient' // usa tu cliente existente

const router = useRouter()

/* --- Estado --- */
const isSignUp = ref(false)
const loading = ref(false)
const feedback = ref({ type: '', message: '' })

const showPassLogin = ref(false)
const showPassSignup = ref(false)

const login = ref({
  email: '',
  password: '',
})

const signup = ref({
  email: '',
  username: '',
  password: '',
  password2: '',
})

/* --- Animación (opcional: corrige altura durante transición) --- */
const onEnter = (el) => {
  el.style.height = 'auto'
}
const onLeave = (el) => {}

/* --- Helpers --- */
function ToastAuth(type, message) {
  feedback.value = { type, message }
  setTimeout(() => {
    feedback.value = { type: '', message: '' }
  }, 6000)
}

function toSignUp() {
  isSignUp.value = true
}
function toLogin() {
  isSignUp.value = false
}

/* --- Acciones --- */
async function onSubmitLogin() {
  feedback.value = { type: '', message: '' }
  loading.value = true
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: login.value.email,
      password: login.value.password,
    })
    if (error) throw error
    if (!data?.user) throw new Error('No se pudo iniciar sesión.')

    ToastAuth('ok', 'Inicio de sesión correcto.')
    router.push('/home')
  } catch (err) {
    console.error(err)
    ToastAuth('error', normalizaError(err))
  } finally {
    loading.value = false
  }
}

async function onSubmitSignUp() {
  feedback.value = { type: '', message: '' }

  if (signup.value.password !== signup.value.password2) {
    ToastAuth('error', 'Las contraseñas no coinciden.')
    return
  }
  if (signup.value.username.length < 3) {
    ToastAuth('error', 'El nombre de usuario debe tener al menos 3 caracteres.')
    return
  }

  loading.value = true
  try {
    // 1) Crear usuario en Auth
    const { data: signData, error: signErr } = await supabase.auth.signUp({
      email: signup.value.email,
      password: signup.value.password,
    })
    if (signErr) throw signErr
    const user = signData.user
    if (!user) throw new Error('No se pudo crear el usuario.')

    // 2) Escribir/actualizar fila en public.profiles (id === auth.users.id)
    const { error: upErr } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        username: signup.value.username,
        email: signup.value.email,
      },
      { onConflict: 'id' },
    )
    if (upErr) {
      // si falla por unique username, mostrar feedback claro
      if (
        String(upErr.message || '')
          .toLowerCase()
          .includes('unique')
      ) {
        throw new Error('El nombre de usuario ya está en uso.')
      }
      throw upErr
    }

    ToastAuth('ok', 'Cuenta creada correctamente.')
    router.push('/edit-profile')
  } catch (err) {
    console.error(err)
    ToastAuth('error', normalizaError(err))
  } finally {
    loading.value = false
  }
}

async function onForgotPassword() {
  feedback.value = { type: '', message: '' }
  if (!login.value.email) {
    ToastAuth('error', 'Ingresa tu correo electrónico para continuar.')
    return
  }
  loading.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(login.value.email, {
      redirectTo: `${window.location.origin}/auth`, // ajusta si usas otra ruta de recuperación
    })
    if (error) throw error
    ToastAuth('ok', 'Te enviamos un correo para restablecer la contraseña.')
  } catch (err) {
    console.error(err)
    ToastAuth('error', normalizaError(err))
  } finally {
    loading.value = false
  }
}

/* --- Social login (placeholders, sin lógica por ahora) --- */
function onLoginGoogle() {
  ToastAuth('info', 'Integración con Google pendiente.')
}
function onLoginApple() {
  ToastAuth('info', 'Integración con Apple pendiente.')
}
function onLoginFacebook() {
  ToastAuth('info', 'Integración con Facebook pendiente.')
}

/* --- Normalizador de mensajes --- */
function normalizaError(err) {
  const msg = err?.message || String(err) || 'Ocurrió un error.'
  if (/Invalid login credentials/i.test(msg)) return 'Credenciales inválidas.'
  if (/Email not confirmed/i.test(msg)) return 'Debes confirmar tu correo antes de iniciar sesión.'
  if (/User already registered/i.test(msg)) return 'El correo ya está registrado.'
  return msg
}
</script>

<style scoped>
/* ======== LAYOUT ======== */
.auth-shell {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url('@/assets/images/fondo-auth.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  padding: 24px;
}

.auth-card-wrapper {
  width: 100%;
  max-width: 420px;
}

/* Header visual */
.brand-header {
  display: grid;
  justify-items: center;
  gap: 6px;
  margin-bottom: 16px;
  color: #fff;
  text-align: center;
}
.brand-logo {
  width: 200px;
  height: auto;
  opacity: 0.95;
}
.brand-title {
  font-size: 28px;
  font-weight: 700;
  margin: 8px 0 0 0;
}
.brand-subtitle {
  opacity: 0.9;
  font-size: 14px;
  margin: 0;
  color: white;
}

/* Tarjeta */
.auth-card {
  background: #f1f3f5; /* gris claro */
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  padding: 22px 20px 16px;
  position: relative;
}

/* Link back en registro */
.link-back {
  background: transparent;
  border: 0;
  color: #0b5ed7;
  font-size: 14px;
  padding: 0;
  margin-bottom: 6px;
  cursor: pointer;
}

/* Viewport animado */
.view-viewport {
  position: relative;
  overflow: hidden;
  min-height: 360px; /* asegura alto estable durante transiciones */
}
.view {
  padding-top: 6px;
}

/* Títulos */
.view-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f3b55;
  margin: 4px 0 14px;
}

/* Formulario */
.form-group {
  margin-bottom: 12px;
}
.form-label {
  display: block;
  font-size: 13px;
  color: #334;
  margin-bottom: 6px;
}
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-wrap i {
  position: absolute;
  left: 12px;
  font-size: 16px;
  color: #8aa0af;
}
.form-input {
  width: 100%;
  height: 44px;
  border-radius: 999px;
  border: 1px solid #d7dee4;
  padding: 0 44px 0 38px;
  background: #fff;
  color: #1f2937;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.form-input:focus {
  outline: none;
  border-color: #a8c4d6;
  box-shadow: 0 0 0 4px rgba(8, 126, 164, 0.1);
}
.eye-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: #607885;
}

/* Aux */
.form-aux {
  display: flex;
  justify-content: flex-end;
  margin: 8px 0 12px;
}
.link-aux {
  background: transparent;
  border: 0;
  color: #0b5ed7;
  cursor: pointer;
  padding: 0;
}

/* CTA */
.btn-primary {
  width: 100%;
  height: 46px;
  border: 0;
  border-radius: 999px;
  background: #0b5ed7; /* botón azul */
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.06s ease,
    filter 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 6px 14px rgba(11, 94, 215, 0.3);
}
.btn-primary:active {
  transform: translateY(1px);
}
.btn-primary:disabled {
  filter: grayscale(0.3);
  opacity: 0.8;
  cursor: not-allowed;
}

/* Spinner simple */
.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top-color: #fff;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Social */
.divider {
  text-align: center;
  margin: 16px 0 12px;
  color: #6a7b86;
  font-size: 13px;
  position: relative;
}
.divider:before,
.divider:after {
  content: '';
  position: absolute;
  top: 50%;
  width: 36%;
  height: 1px;
  background: #dfe7ec;
}
.divider:before {
  left: 0;
}
.divider:after {
  right: 0;
}
.divider span {
  background: #f1f3f5;
  padding: 0 8px;
}

.social-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.btn-social {
  height: 44px;
  border-radius: 12px;
  border: 1px solid #d7dee4;
  background: #fff;
  display: grid;
  place-items: center;
  transition:
    transform 0.06s ease,
    box-shadow 0.2s ease;
}
.btn-social img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.btn-social:active {
  transform: translateY(1px);
}

/* Switch row */
.switch-row {
  margin: 16px 0 4px;
  font-size: 14px;
  color: #44525b;
  text-align: center;
}

/* Feedback */
.feedback {
  margin-top: 12px;
  font-size: 14px;
  text-align: center;
}
.feedback.ok {
  color: #0a7f3f;
}
.feedback.info {
  color: #0b5ed7;
}
.feedback.error {
  color: #b3261e;
}

/* ======== TRANSICIÓN (login <-> registro) ======== */
.slide-vertical-enter-from {
  transform: translateY(100%);
  opacity: 0.2;
}
.slide-vertical-enter-active {
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}
.slide-vertical-enter-to {
  transform: translateY(0);
  opacity: 1;
}
.slide-vertical-leave-from {
  transform: translateY(0);
  opacity: 1;
}
.slide-vertical-leave-active {
  transition:
    transform 0.28s ease,
    opacity 0.28s ease;
}
.slide-vertical-leave-to {
  transform: translateY(-15%);
  opacity: 0;
}

/* ======== RESPONSIVE ======== */
@media (min-width: 480px) {
  .auth-card {
    padding: 26px 24px 18px;
  }
  .brand-title {
    font-size: 30px;
  }
}
@media (min-width: 992px) {
  .auth-shell {
    padding: 40px;
  }
  .auth-card-wrapper {
    max-width: 460px;
  }
  .view-viewport {
    min-height: 380px;
  }
}
</style>
