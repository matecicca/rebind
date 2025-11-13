<template>
  <div class="position-relative">
    <input
      :placeholder="placeholder"
      class="form-control"
      v-model="query"
      @focus="onFocus"
      @input="onInput"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="selectIndex(activeIndex)"
    />
    <ul v-if="opened && results.length" class="list-group position-absolute w-100 mt-1" style="z-index:1000; max-height:240px; overflow:auto; border-radius:14px;">
      <li
        v-for="(r, i) in results"
        :key="r.id"
        class="list-group-item list-group-item-action"
        :class="{ active: i === activeIndex }"
        @mousedown.prevent="selectIndex(i)"
      >
        {{ r.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { lookupService } from '@/services/lookupService'

const props = defineProps({
  table: { type: String, required: true },
  modelValue: { type: [String, Number, null], default: null },
  placeholder: { type: String, default: 'Buscar...' },
  labelField: { type: String, default: 'name' },
  valueField: { type: String, default: 'id' },
})

const emit = defineEmits(['update:modelValue'])

const query = ref('')
const results = ref([])
const opened = ref(false)
const activeIndex = ref(-1)

async function fetchResults(q) {
  results.value = await lookupService.search(props.table, q, {
    labelField: props.labelField,
    valueField: props.valueField,
    limit: 20,
  })
  activeIndex.value = results.value.length ? 0 : -1
}

function onFocus() {
  opened.value = true
  if (!query.value.trim()) {
    fetchAll()
  }
}

async function fetchAll() {
  results.value = await lookupService.search(props.table, '', {
    labelField: props.labelField,
    valueField: props.valueField,
    limit: 50, // podés ajustar el límite si querés
    orderBy: props.labelField, // opcional: para asegurar orden alfabético
  })
  activeIndex.value = results.value.length ? 0 : -1
}

let t = null
function onInput() {
  clearTimeout(t)
  const q = query.value?.trim() ?? ''
  if (!q) {
    fetchAll()
    return
  }
  t = setTimeout(() => fetchResults(q), 180)
}

function move(delta) {
  if (!results.value.length) return
  const len = results.value.length
  activeIndex.value = (activeIndex.value + delta + len) % len
}
function selectIndex(i) {
  const r = results.value[i]
  if (!r) return
  query.value = r.label
  emit('update:modelValue', r.id)
  opened.value = false
}

watch(() => props.modelValue, async (id) => {
  if (id) {
    const item = await lookupService.getById(props.table, id, {
      labelField: props.labelField,
      valueField: props.valueField,
    })
    if (item?.label) query.value = item.label
  } else {
    query.value = ''
  }
})

onMounted(async () => {
  if (props.modelValue) {
    const item = await lookupService.getById(props.table, props.modelValue, {
      labelField: props.labelField,
      valueField: props.valueField,
    })
    if (item?.label) query.value = item.label
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.position-relative')) opened.value = false
  })
})
</script>