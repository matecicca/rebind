<template>
  <div v-if="imageUrl" class="cropper-overlay">
    <div class="cropper-modal shadow-lg">
      <div class="cropper-header">
        <h5>Recortar imagen</h5>
        <button class="btn-close-white" @click="$emit('cancel')">&times;</button>
      </div>

      <div class="cropper-body">
        <img ref="image" :src="imageUrl" alt="Crop preview" class="cropper-img" />
      </div>

      <div class="cropper-footer">
        <button class="btn btn-outline-light" @click="$emit('cancel')">Cancelar</button>
        <button class="btn btn-primary" @click="crop">Confirmar recorte</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const props = defineProps({
  imageUrl: String,
  aspectRatio: { type: Number, default: 1 }, // por defecto cuadrado (avatar)
  circle: { type: Boolean, default: false }, // true = salida circular PNG
})
const emit = defineEmits(['cropped', 'cancel'])
const image = ref(null)
let cropper = null

onMounted(() => {
  if (image.value) {
    cropper = new Cropper(image.value, {
      aspectRatio: props.aspectRatio,
      viewMode: 1,
      autoCropArea: 1,
      background: false,
      movable: true,
      zoomable: true,
      dragMode: 'move',
      minCropBoxWidth: 200,
      minCropBoxHeight: 200,
    })
  }
})

onBeforeUnmount(() => {
  if (cropper) cropper.destroy()
})

watch(
   () => props.imageUrl,
  (val) => {
    if (!val && cropper) {
      cropper.destroy()
      cropper = null
      emit('cancel')
    } else if (val && cropper) {
      cropper.replace(val)
    }
  }

)

function crop() {
  if (!cropper) return

  const baseCanvas = cropper.getCroppedCanvas({
    width: 800,
    height: 800 / props.aspectRatio,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  })

  // Si se pide salida circular → aplicar máscara circular en PNG transparente
  let outCanvas = baseCanvas
  if (props.circle) {
    const w = Math.min(baseCanvas.width, baseCanvas.height)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = w
    const ctx = canvas.getContext('2d')

    // máscara circular
    ctx.beginPath()
    ctx.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    const dx = (w - baseCanvas.width) / 2
    const dy = (w - baseCanvas.height) / 2
    ctx.drawImage(baseCanvas, dx, dy)

    outCanvas = canvas
  }

  // Exportar: PNG si circular, JPG si rectangular
  const format = props.circle ? 'image/png' : 'image/jpeg'
  const ext = props.circle ? 'png' : 'jpg'

  outCanvas.toBlob(
    (blob) => {
      if (blob) {
        const file = new File([blob], `cropped-image.${ext}`, { type: format })
        emit('cropped', file)
      }
    },
    format,
    props.circle ? undefined : 0.9
  )
}
</script>

<style>
/* Modal */
.cropper-modal {
  background: #222;
  color: #fff;
  border-radius: 1rem;
  overflow: hidden;
  width: 90%;
  max-width: 550px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.6);
}

.cropper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #111;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cropper-header h5 {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}

.btn-close-white {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.cropper-body {
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
}

.cropper-img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 0.5rem;
}

.cropper-footer {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #111;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cropper-footer .btn {
  font-size: 0.9rem;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
}
</style>

<!-- Overlay sin scoped para dominar el viewport -->
<style>
.cropper-overlay {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: rgba(0, 0, 0, 0.75) !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  z-index: 9999 !important;
  backdrop-filter: blur(4px);
}
</style>
