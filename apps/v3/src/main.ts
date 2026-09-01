import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Avatar from 'primevue/avatar'
import '@tabler/icons-webfont/dist/tabler-icons.min.css'
import router from './router'
import App from './App.vue'
import './assets/main.css'

const SkyPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50:  '{sky.50}',
      100: '{sky.100}',
      200: '{sky.200}',
      300: '{sky.300}',
      400: '{sky.400}',
      500: '{sky.500}',
      600: '{sky.600}',
      700: '{sky.700}',
      800: '{sky.800}',
      900: '{sky.900}',
      950: '{sky.950}'
    }
  }
})

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: SkyPreset,
    options: { prefix: 'p', darkModeSelector: '.dark', cssLayer: false }
  }
})

app.component('PButton', Button)
app.component('PTag', Tag)
app.component('PCheckbox', Checkbox)
app.component('PInputText', InputText)
app.component('PTextarea', Textarea)
app.component('PAvatar', Avatar)

app.mount('#app')
