import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primevue/themes'
import Lara from '@primevue/themes/lara'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
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
  // Oranje = het merkoranje van SpuitwerkOnline (#ff6600 op 500), in plaats van
  // Lara's bruinige oranje. Tekst gebruikt 800 (7,6:1 op de 50-tint), gevulde
  // vlakken 700 (wit erop 5,4:1); 500 zelf is te licht voor tekst.
  primitive: {
    orange: {
      50: '#fff4ec', 100: '#ffe4d1', 200: '#ffc8a3', 300: '#ffa366', 400: '#ff8533',
      500: '#ff6600', 600: '#e05500', 700: '#b84400', 800: '#923600', 900: '#6e2a00', 950: '#431900'
    }
  },
  semantic: {
    // Eigen blauwschaal rond het accent van de configurator (#4ea9ea op 400), zodat
    // dashboard en website één familie zijn. 50 = de tint van een gekozen tegel daar.
    primary: {
      50:  '#f2f9ff',
      100: '#e1f0fc',
      200: '#c0e0f8',
      300: '#8fc8f2',
      400: '#4ea9ea',
      500: '#2b8fd6',
      600: '#1d76b8',
      700: '#19639a',   // knoppen en links: wit erop 6,4:1
      800: '#17527e',
      900: '#164568',
      950: '#0e2c45'
    },
    // Kaarten en meldingen 8px: strak en precies (Stripe-houding), niet bol.
    content: { borderRadius: '{border.radius.lg}' },
    colorScheme: {
      light: {
        // Neutrale schaal in Stripe-stijl: koel off-white canvas, koel-blauwe randen,
        // diepe navy tekst in plaats van zwart. Eén schaal voor de hele app, zodat
        // PrimeVue-componenten en de handgebouwde delen dezelfde grijzen gebruiken.
        surface: {
          0:   '#ffffff',
          50:  '#f9fcff',   // canvas, gelijk aan de configurator
          100: '#eef2f7',   // rustvlak (grijs 'wat nu'-label, thumbnails)
          200: '#e3eaf2',   // haarlijn binnen een paneel
          300: '#d3dde8',   // rand om een paneel
          400: '#a9b6c6',
          500: '#8796ab',
          600: '#5f6f86',   // secundaire tekst: 5,0:1 op wit
          700: '#50617a',
          800: '#465166',   // labels
          900: '#364053',   // koppen en tekst: leisteen, zoals de configurator
          950: '#1f2733'
        },
        // Bewuste afwijking van Lara: donkerder tekst dan de default (surface.700 /
        // surface.500). De spuiter leest op een telefoon in de werkplaats, bij fel
        // of juist slecht licht. Geldt nu ook voor PrimeVue-componenten zelf.
        text: { color: '{surface.900}', mutedColor: '{surface.600}' },
        // Wit op primary-400 haalt 2,6:1 — te weinig voor knoptekst. Op 700 is het
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
          info:    { background: '{primary.700}',    color: '{surface.0}' },
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
app.component('PRadioButton', RadioButton)
app.component('PInputText', InputText)
app.component('PTextarea', Textarea)
app.component('PAvatar', Avatar)
app.component('PIconField', IconField)
app.component('PInputIcon', InputIcon)

app.mount('#app')
