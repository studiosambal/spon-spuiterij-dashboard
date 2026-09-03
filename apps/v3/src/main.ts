import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Avatar from 'primevue/avatar'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import '@tabler/icons-webfont/dist/tabler-icons.min.css'
import router from './router'
import App from './App.vue'
import './assets/main.css'

// Eén bron van waarheid voor kleur, radius en tekst: dit preset. De app-CSS in
// assets/main.css leidt haar eigen variabelen hiervan af, dus een wijziging hier
// werkt overal door — ook in de handgebouwde onderdelen.
const SpuitwerkPreset = definePreset(Lara, {
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
    },
    // Kaarten en meldingen 12px i.p.v. Lara's 6px — past bij de rustige, ruime opzet.
    content: { borderRadius: '{border.radius.xl}' },
    colorScheme: {
      light: {
        // Bewuste afwijking van Lara: donkerder tekst dan de default (surface.700 /
        // surface.500). De spuiter leest op een telefoon in de werkplaats, bij fel
        // of juist slecht licht. Geldt nu ook voor PrimeVue-componenten zelf.
        text: { color: '{surface.900}', mutedColor: '{surface.600}' },
        // Wit op sky-500 haalt 2,8:1 — te weinig voor knoptekst. Op 700 is het
        // 5,9:1. Dit raakt alleen gevulde vlakken; iconen en links blijven 500.
        primary: { color: '{primary.700}', hoverColor: '{primary.800}', activeColor: '{primary.800}' }
      }
    }
  },
  components: {
    tag: {
      // Badges blijven strak i.p.v. de 12px die ze via content.borderRadius zouden erven.
      root: { fontSize: '0.8rem', borderRadius: '{border.radius.md}' },
      // Lara zet de badge-achtergrond op de 500-tint. Met witte tekst haalt dat de
      // WCAG-eis van 4.5:1 niet (sky 2.8, groen 2.3, oranje 2.8, rood 3.8). Eén stap
      // dieper — de 700-tint — brengt alles op 5.0 tot 6.5, en dat is wat deze app
      // nodig heeft: een spuiter leest dit op een telefoon in wisselend werkplaatslicht.
      colorScheme: {
        light: {
          info:    { background: '{sky.700}',    color: '{surface.0}' },
          success: { background: '{green.700}',  color: '{surface.0}' },
          warn:    { background: '{orange.700}', color: '{surface.0}' },
          danger:  { background: '{red.700}',    color: '{surface.0}' }
        }
      }
    },

    // Meldingen: twee bewuste correcties op Lara.
    // 1. 'info' gebruikt bij Lara {blue.*}, terwijl de app op sky draait — dat botst.
    // 2. De tekst blijft in de signaalkleur — dat leest rustiger dan zwart op een
    //    gekleurde tint — maar een stap dieper dan Lara. Op Lara's 600-niveau haalt
    //    de tekst de contrasteis niet (2,8-4,4:1); op 700/800 wel (4,8-7,1:1).
    message: {
      // Lara zet de body op 1rem/500. Dat is groter én zwaarder dan onze kop
      // (12px/700), waardoor de kop niet meer als kop leest. 14px/400 zet de
      // verhouding terug: kop = klein, vet, uppercase; body = groter, rustig.
      text: { fontSize: '0.875rem', fontWeight: '400' },
      colorScheme: {
        light: {
          info:    { background: '{primary.50}', borderColor: '{primary.200}', color: '{primary.800}' },
          warn:    { background: '{orange.50}',  borderColor: '{orange.200}',  color: '{orange.800}' },
          success: { background: '{green.50}',   borderColor: '{green.200}',   color: '{green.700}' },
          error:   { background: '{red.50}',     borderColor: '{red.200}',     color: '{red.700}' }
        }
      }
    }
  }
})

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: SpuitwerkPreset,
    options: { prefix: 'p', darkModeSelector: '.dark', cssLayer: false }
  }
})

app.component('PButton', Button)
app.component('PTag', Tag)
app.component('PMessage', Message)
app.component('PCheckbox', Checkbox)
app.component('PInputText', InputText)
app.component('PTextarea', Textarea)
app.component('PAvatar', Avatar)
app.component('PIconField', IconField)
app.component('PInputIcon', InputIcon)

app.mount('#app')
