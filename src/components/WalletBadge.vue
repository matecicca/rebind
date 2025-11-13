<template>
  <RouterLink to="/binds" class="rb-pill text-decoration-none">
    <img src="@/assets/images/bind_logo.svg" alt="Rebind" style="width:20px;height:20px;opacity:.9" />
    <strong>{{ balance }}</strong>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ balance: { type: Number, default: 0 } })
const balance = computed(() => props.balance ?? 0)
</script>

<style scoped>

/* Pastilla / pill reutilizable */
.rb-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid var(--rb-blue);
  color: var(--rb-white);
  background: var(--rb-ink);
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  line-height: 1;
}

</style>
