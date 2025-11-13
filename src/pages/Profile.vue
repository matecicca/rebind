<template>
  <HeaderLayout>
    <div class="container my-5">
      <h1 class="mb-4">Perfil</h1>

      <section class="card p-4 shadow-sm mb-4">
        <div class="row g-3 align-items-center">
          <div class="col">
            <h2 class="h5 mb-1">@{{ profile.username }}</h2>
            <div class="text-muted">
              {{ profile.first_name }} {{ profile.last_name }} · {{ profile.city }}
              {{ profile.neighborhood ? ' · ' + profile.neighborhood : '' }}
            </div>
            <div class="small mt-2">
              Nivel: {{ profile.level }} · Reputación: {{ profile.reputation }}
            </div>
          </div>
          <div class="col-auto text-center">
            <div class="fw-semibold">Seguidores</div>
            <div>{{ followers }}</div>
          </div>
        </div>
      </section>

      <h3 class="h6 mt-4 mb-3">Publicaciones</h3>
      <div v-if="items.length" class="row g-3">
        <div v-for="it in items" :key="it.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <RouterLink :to="`/item/${it.id}`" class="text-decoration-none text-reset">
            <ItemCard :item="it" />
          </RouterLink>
        </div>
      </div>
      <p v-else class="text-muted">Este usuario aún no tiene publicaciones visibles.</p>
    </div>
  </HeaderLayout>
</template>

<script setup>
import HeaderLayout from '@/layouts/AppLayout.vue'
import ItemCard from '@/components/ItemCard.vue'
import { useRoute } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { profileService } from '@/services/profileService'
import { socialService } from '@/services/socialService'
import { itemService } from '@/services/itemService'

const route = useRoute()
const profile = ref({})
const items = ref([])
const followers = ref(0)

async function loadPublicProfile() {
  const userId = route.params.id
  if (!userId) return
  try {
    profile.value = await profileService.getPublicProfile(userId)
    followers.value = await socialService.followersCount(userId)
    // Sólo aprobados para vista pública
    items.value = await itemService.listApprovedByOwner(userId, 1, 12)
    console.log('Perfil público:', userId, items.value)
  } catch (err) {
    console.error('Error cargando perfil público:', err)
  }
}

onMounted(loadPublicProfile)
watch(() => route.params.id, loadPublicProfile)
</script>

<style scoped>
.card {
  border-radius: 0.75rem;
}
</style>
