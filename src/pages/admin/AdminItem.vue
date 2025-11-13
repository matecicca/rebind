<template>
  <HeaderLayout>
    <div class="container my-5">
      <h1 class="mb-3">Revisión de prenda</h1>

      <div v-if="item" class="card p-4 shadow-sm mb-4">
        <h5 class="mb-2">{{ item.title }}</h5>
        <p class="mb-1">{{ item.description }}</p>
        <p class="mb-1"><strong>Tipo:</strong> {{ item.garment_types?.name }}</p>
        <p class="mb-1"><strong>Género:</strong> {{ item.genres?.name }}</p>
        <p class="mb-1"><strong>Marca:</strong> {{ item.brands?.name }}</p>
        <p class="mb-1"><strong>Talle:</strong> {{ item.sizes?.name }}</p>
        <p class="mb-1"><strong>Color:</strong> {{ item.colors?.name }}</p>
        <p class="mb-1"><strong>Material:</strong> {{ item.materials?.name }}</p>
        <p class="mb-1"><strong>Condición:</strong> {{ item.conditions?.name }}</p>
        <p class="mb-1"><strong>Precio:</strong> {{ item.ask_price_bind }} Binds</p>
        <p class="mb-0"><strong>Estado:</strong> {{ item.status }}</p>
      </div>

      <div class="mb-4">
        <h6>Imágenes</h6>
        <div class="d-flex flex-wrap gap-3">
          <img
            v-for="img in images"
            :key="img.id"
            :src="publicUrl(img.path)"
            class="rounded border"
            style="width: 160px; height: 160px; object-fit: cover"
          />
        </div>
      </div>

      <button class="btn btn-success me-2" @click="approve">Aprobar</button>
      <button class="btn btn-outline-danger" @click="reject">Rechazar</button>
    </div>
  </HeaderLayout>
</template>

<script setup>
import HeaderLayout from '@/layouts/AppLayout.vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { itemService } from '@/services/itemService'
import { adminService } from '@/services/adminService'
import { storageService } from '@/services/storageService'
import { supabase } from '@/services/supabaseClient'

const route = useRoute()
const router = useRouter()
const item = ref(null)
const images = ref([])

onMounted(async () => {
  try {
    item.value = await itemService.getById(route.params.id)
    images.value = await itemService.listImages(route.params.id)
  } catch (err) {
    console.error('Error cargando el item o imágenes:', err)
  }
})

function publicUrl(path) {
  return storageService.getPublicUrl('item-images', path)
}

async function approve() {
  const reviewer = (await supabase.auth.getUser()).data.user.id
  await adminService.approveItem(route.params.id, reviewer)
  alert('Aprobado ✅')
  router.push('/admin')
}

async function reject() {
  const reviewer = (await supabase.auth.getUser()).data.user.id
  await adminService.rejectItem(route.params.id, reviewer, 'Sin motivo específico')
  alert('Rechazado ❌')
  router.push('/admin')
}
</script>
