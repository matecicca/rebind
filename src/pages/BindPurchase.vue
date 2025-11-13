<template>
  <AppLayout>
    <div class="container my-5">
      <h1 class="h3 text-center mb-4">Comprar Binds</h1>

      <div class="row g-4">
        <div v-for="pack in packs" :key="pack.id" class="col-12 col-sm-6 col-lg-3">
          <div class="card h-100 shadow-sm text-center p-3">
            <div class="d-flex justify-content-center my-3">
              <div class="bind-token d-flex align-items-center justify-content-center">
                <img src="@/assets/images/bind_logo.svg" alt="Binds" />
              </div>
            </div>

            <div class="h5 mb-1">{{ pack.binds_amount }} Binds</div>
            <div class="text-muted mb-3">AR$ {{ formatPrice(pack.price_amount) }}</div>

            <button class="btn btn-dark w-100" @click="buy(pack)" :disabled="loadingId===pack.id">
              {{ loadingId===pack.id ? 'Asignando...' : 'Comprar' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="toast" class="alert alert-success mt-4">{{ toast }}</div>
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { packService } from '@/services/packService'
import { walletService } from '@/services/walletService'

const packs = ref([])
const loadingId = ref(null)
const toast = ref('')

onMounted(async () => {
  packs.value = await packService.listActive()
})

function formatPrice(n) {
  try {
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0 }).format(Number(n))
  } catch { return n }
}

async function buy(pack){
  loadingId.value = pack.id
  try {
    await packService.purchasePack(pack.id)
    const w = await walletService.getOrCreateMyWallet()
    toast.value = `¡Se acreditaron ${pack.binds_amount} Binds a tu wallet! Saldo: ${w.balance_bind}`
  } catch (e){
    console.error(e)
    alert('No se pudo completar la compra.')
  } finally {
    loadingId.value = null
  }
}
</script>

<style scoped>
.bind-token{
  width:72px; height:72px; border-radius:999px; background:#111;
}
.bind-token img{ width:36px; height:36px; opacity:.95 }
</style>
