<template>
  <div class="slot">
    <div class="slot-inner" @click="$refs.in.click()">
      <input
        ref="in"
        type="file"
        accept="image/*"
        :multiple="multiple"
        hidden
        @change="onPick"
      />

      <div v-if="!multiple && !file" class="placeholder">
        <span class="plus">+</span><span>{{ label }}</span>
      </div>

      <div v-else-if="!multiple && file" class="thumb">
        <img :src="filePreview" />
      </div>

      <div v-else class="thumbs">
        <div v-for="(f,i) in list" :key="i" class="thumb">
          <img :src="listPreview(i)" />
          <button type="button" class="mini" @click.stop="remove(i)">×</button>
        </div>
        <div class="placeholder mini-add">+</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  label: String,
  role: String,
  multiple: Boolean,
  file: [Object, File],
  list: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:file', 'update:list', 'crop'])

const inputRef = ref(null)

function onPick(e) {
  const arr = Array.from(e.target.files || [])
  if (!arr.length) return
  if (props.multiple) {
    arr.forEach((f) => emit('crop', f))
  } else {
    emit('crop', arr[0])
  }
  e.target.value = ''
}

function remove(i) {
  const out = [...(props.list || [])]
  out.splice(i, 1)
  emit('update:list', out)
}

const filePreview = computed(() => {
  const f = props.file
  if (!f) return null
  // si viene desde BBDD como {__url}, úsalo; si es File, URL local
  return f.__url ? f.__url : URL.createObjectURL(f)
})

function listPreview(i) {
  const f = props.list[i]
  return f?.__url ? f.__url : URL.createObjectURL(f)
}
</script>

<style scoped>
.slot { aspect-ratio: 1/1; }
.slot-inner {
  background: #f4f4f4;
  border: 1px dashed #ccc;
  border-radius: 14px;
  width: 100%;
  height: 100%;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; position:relative; overflow:hidden;
}
.placeholder { color:#777; display:flex; flex-direction:column; align-items:center; gap:4px; user-select:none; }
.placeholder .plus { font-size:28px; line-height:1; }
.thumb img { width:100%; height:100%; object-fit:cover; }
.thumbs { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px; width:100%; height:100%; }
.thumbs .thumb { position:relative; border-radius:10px; overflow:hidden; }
.mini { position:absolute; top:6px; right:6px; width:22px; height:22px; border:none; border-radius:50%; background:#111; color:#fff; cursor:pointer; }
.mini-add { display:grid; place-items:center; background:#eaeaea; border-radius:10px; font-weight:bold; }
</style>
