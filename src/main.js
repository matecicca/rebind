import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@/assets/styles/rebind.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"


import AppLayout from '@/layouts/AppLayout.vue'
import ItemCard from '@/components/ItemCard.vue'

const app = createApp(App)
app.component('AppLayout', AppLayout)
app.component('ItemCard', ItemCard)

app.use(router).mount('#app')
