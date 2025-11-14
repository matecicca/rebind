<template>
  <div
    class="card h-100 shadow-sm item-card"
    :class="{ disabled }"
    @click="!disabled && emit('open')"
  >
    <div class="media-frame">
      <img
        v-if="item.main_image_path"
        :src="publicUrl(item.main_image_path)"
        alt="Imagen de la prenda"
        class="media-img"
        loading="lazy"
      />
      <div v-else class="media-placeholder">Sin imagen</div>

      <!-- sólo si showStatus === true -->
      <span v-if="showStatus && badge" class="status-badge">{{ badge }}</span>
    </div>

    <div class="card-body">
      <h6 class="card-title mb-1">{{ item.title }}</h6>
      <div class="text-muted small mb-1">@{{ item.owner?.username || 'usuario' }}</div>
      <div class="text-muted small mb-1">
        {{ item.brands?.name || 'Marca desconocida' }}
      </div>
      <div v-if="styleNames" class="text-muted small mb-2">
        {{ styleNames }}
      </div>

      <div class="d-flex align-items-center justify-content-between">
        <span class="badge bg-light text-dark">
          {{ item.sizes?.name || 'Talle' }}
        </span>

        <span
          v-if="item.ask_price_bind != null"
          class="bind-price d-inline-flex align-items-center gap-2"
        >
          <strong class="mb-0 bind-number">{{ item.ask_price_bind }}</strong>
          <!-- 👇 nuevo SVG -->
          <img src="@/assets/images/bind_logo_card.svg" alt="Binds" class="bind-logo" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storageService } from '@/services/storageService'

const props = defineProps({
  item: { type: Object, required: true },
  showStatus: { type: Boolean, default: false }
})

const emit = defineEmits(['open'])

function publicUrl(path) {
  return storageService.getPublicUrl('item-images', path)
}

const badge = computed(() => {
  const s = props.item?.status
  if (s === 'draft') return 'Borrador'
  if (s === 'review') return 'En revisión'
  if (s === 'approved') return 'Publicado'
  if (s === 'rejected') return 'Rechazado'
  return ''
})

const disabled = computed(() => props.item?.status !== 'approved')

const styleNames = computed(() => {
  return props.item?.item_styles
    ?.map(is => is.styles?.name)
    .filter(Boolean)
    .join(', ') || ''
})
</script>

<style scoped>
.item-card { cursor: pointer; border-radius: 12px; overflow: hidden; }
.item-card.disabled { opacity: 0.9; cursor: default; }

.media-frame { position: relative; padding-top: 100%; background: #f8f9fa; }
.media-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.media-placeholder {
  position: absolute; inset: 0; display:flex; align-items:center; justify-content:center;
  color:#999; font-size:0.9rem;
}

.card-body { padding: 0.75rem 0.75rem 1rem; }
.card-title { font-size: 1rem; }

/* Precio con logo de Binds — SIN fondo */
.bind-price { background: transparent; color: inherit; padding: 0; border-radius: 0; line-height: 1; }
.bind-number { color: #111; font-weight: 700; }
.bind-logo { width: 18px; height: 18px; opacity: .95; }

/* Badge de estado (sólo si showStatus=true) */
.status-badge {
  position: absolute; top: 10px; left: 10px;
  background: #111; color: #fff; font-size: 12px;
  padding: 4px 10px; border-radius: 999px; opacity: 0.92;
}
</style>