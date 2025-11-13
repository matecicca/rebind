<template>
  <HeaderLayout>
    <div class="container my-5">
      <h1 class="mb-4">Panel Admin — Pendientes</h1>

      <div v-if="items.length" class="list-group">
        <RouterLink
          v-for="it in items"
          :key="it.id"
          class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          :to="`/admin/item/${it.id}`"
        >
          <span>
            <strong>{{ it.title }}</strong>
            <span class="text-muted"> — {{ it.brands?.name }} / {{ it.garment_types?.name }}</span>
          </span>
          <span class="badge bg-warning text-dark text-uppercase">{{ it.status }}</span>
        </RouterLink>
      </div>

      <p v-else class="text-muted">No hay publicaciones pendientes.</p>
    </div>
  </HeaderLayout>
</template>

<script setup>
import HeaderLayout from '@/layouts/AppLayout.vue'
import { ref, onMounted } from 'vue'
import { adminService } from '@/services/adminService'

const items = ref([])

onMounted(async () => {
  try {
    items.value = await adminService.listPendingItems()
  } catch (err) {
    console.error('Error cargando pendientes:', err)
  }
})
</script>
