<template>
  <HeaderLayout>
    <div class="container my-5">
      <div class="mb-3">
        <RouterLink to="/me" class="text-decoration-none">← Volver al perfil</RouterLink>
      </div>

      <h1 class="mb-4 text-center">Editar perfil</h1>

      <section class="card p-4 shadow-sm mb-4">
        <!-- Avatar editable (igual que ya tenías) -->
        <div class="d-flex flex-column align-items-center text-center mb-4">
          <div class="avatar-ring mb-3" @click="triggerFile">
            <img
              v-if="avatarPreviewUrl"
              :src="avatarPreviewUrl"
              alt="Avatar preview"
              class="avatar-img"
            />
            <img
              v-else-if="avatarPublicUrl"
              :src="avatarPublicUrl"
              alt="Avatar actual"
              class="avatar-img"
            />
            <div v-else class="avatar-placeholder">{{ initials }}</div>
          </div>
          <button class="btn btn-outline-secondary btn-sm" @click="triggerFile">
            Cambiar foto
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="d-none"
            @change="onFileChange"
          />
        </div>

        <!-- Formulario -->
        <form @submit.prevent="saveAll" class="row g-3">
          <!-- Datos básicos -->
          <div class="col-12 col-md-6">
            <label class="form-label">Nombre</label>
            <input v-model="profile.first_name" class="form-control" />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Apellido</label>
            <input v-model="profile.last_name" class="form-control" />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Nombre de usuario</label>
            <input v-model="profile.username" class="form-control" required />
          </div>

          <div class="col-12 col-md-6">
            <label class="form-label">Ciudad</label>
            <input v-model="profile.city" class="form-control" />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Barrio</label>
            <input v-model="profile.neighborhood" class="form-control" />
          </div>

          <!-- Preferencias -->
          <div class="col-12">
            <h5 class="mt-3">Preferencias</h5>
            <div class="row">
              <div class="col-12 col-md-6">
                <label class="form-label">Género</label>
                <div class="pref-box">
                  <label v-for="opt in options.genres" :key="opt.id" class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :value="opt.id"
                      v-model="formPrefs.genres"
                    />
                    <span class="form-check-label">{{ opt.name }}</span>
                  </label>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Talle</label>
                <div class="pref-box">
                  <label v-for="opt in options.sizes" :key="opt.id" class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :value="opt.id"
                      v-model="formPrefs.sizes"
                    />
                    <span class="form-check-label">{{ opt.name }}</span>
                  </label>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Estilo</label>
                <div class="pref-box">
                  <label v-for="opt in options.styles" :key="opt.id" class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :value="opt.id"
                      v-model="formPrefs.styles"
                    />
                    <span class="form-check-label">{{ opt.name }}</span>
                  </label>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Estado</label>
                <div class="pref-box">
                  <label v-for="opt in options.conditions" :key="opt.id" class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :value="opt.id"
                      v-model="formPrefs.conditions"
                    />
                    <span class="form-check-label">{{ opt.name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12">
            <button type="submit" class="btn btn-dark w-100" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Cropper circular -->
      <ImageCropper
        v-if="cropImageUrl"
        :image-url="cropImageUrl"
        :aspect-ratio="1"
        :circle="true"
        @cropped="onCropped"
        @cancel="closeCropper"
      />
    </div>
  </HeaderLayout>
</template>

<script setup>
import HeaderLayout from '@/layouts/AppLayout.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import { useRouter } from 'vue-router'
import { onMounted, ref, computed } from 'vue'
import { storageService } from '@/services/storageService'
import { profileService } from '@/services/profileService'
import { preferencesService } from '@/services/preferencesService'
import { supabase } from '@/services/supabaseClient'
import { onBeforeRouteLeave } from 'vue-router'

const profile = ref({})
const saving = ref(false)
const router = useRouter()

// avatar
const fileInput = ref(null)
const cropImageUrl = ref(null)
const avatarPreviewUrl = ref(null)
const croppedFile = ref(null)

const options = ref({ sizes: [], conditions: [], styles: [], genres: [] })
const formPrefs = ref({ sizes: [], conditions: [], styles: [], genres: [] })


const avatarPublicUrl = computed(() => {
  if (!profile.value?.avatar_url) return null
  return storageService.getPublicUrl('avatars', profile.value.avatar_url)
})
const initials = computed(() => {
  const p = profile.value || {}
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username || ''
  return name.trim().slice(0, 2).toUpperCase()
})

onMounted(async () => {
  profile.value = await profileService.getMyProfile()
  options.value = await preferencesService.getOptions()

  // Mapear nombres->ids seleccionados actuales
  // Traigo ids actuales directamente:
  const currentIds = await preferencesService._getCurrentIds(profile.value.id)
  formPrefs.value = currentIds

  // (si querés default de ejemplo cuando no hay nada marcado, lo podés setear acá)
})

// avatar
function triggerFile() {
  fileInput.value?.click()
}
function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  cropImageUrl.value = URL.createObjectURL(file)
}
function closeCropper() {
  cropImageUrl.value = null
}
function onCropped(file) {
  croppedFile.value = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
  closeCropper()
}

// guardar todo
async function saveAll() {
  try {
    saving.value = true
    const me = (await supabase.auth.getUser()).data.user.id
    let avatarPath = profile.value.avatar_url

    if (croppedFile.value) {
      avatarPath = await storageService.uploadAvatar(me, croppedFile.value)
    }

    // 1) perfil básico
    await profileService.updateMyProfile({
      username: profile.value.username,
      first_name: profile.value.first_name,
      last_name: profile.value.last_name,
      city: profile.value.city,
      neighborhood: profile.value.neighborhood,
      avatar_url: avatarPath,
    })

    // 2) preferencias (bulk set)
    await preferencesService.setPreferences(formPrefs.value)

    alert('Perfil actualizado correctamente')
    croppedFile.value = null
    router.push('/me') // ✅ redirige al perfil
  } catch (err) {
    console.error(err)
    alert('Error al guardar perfil')
  } finally {
    saving.value = false
  }
}

onBeforeRouteLeave(() => {
  if (cropImageUrl.value) {
    URL.revokeObjectURL(cropImageUrl.value)
    cropImageUrl.value = null
  }
})
</script>

<style scoped>
.avatar-ring {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: #f3f3f3;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #999;
  font-size: 1.25rem;
}

.pref-box {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.25rem 0.75rem;
}
.form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}
</style>
