import { ref } from 'vue'

export type OrderStatus =
  | 'bevestigd'
  | 'meerwerk_wacht'    // meerwerk verstuurd, wachten op klant akkoord
  | 'ontvangen'         // product ingenomen, before-foto nog nodig of al genomen
  | 'in_productie'      // spuiter is gestart met de opdracht
  | 'productie_gereed'  // klaar, wachten op betaling SpuitwerkOnline
  | 'klaar'             // betaling ontvangen, klant kan ophalen
  | 'afgerond'

export type TypeService = 'alleen_spuitwerk' | 'montage_transport' | 'full_service'
export type Zijdig = '1-zijdig' | '2-zijdig'
export type Oppervlaktemateriaal = 'verf_lak' | 'kunststof' | 'hout_onbehandeld' | 'metaal'
export type Oppervlaktestructuur = 'glad' | 'huidige_structuur'
export type Glansgraad = 'zijde' | 'hoogglans' | 'mat'
export type KleurMethode = 'ral_ncs' | 'ander_merk' | 'kleurvoorbeeld' | 'zelfde_kleur' | 'later'
export type Ophaalmethode = 'klant' | 'vervoerder'

export interface PaneelMaat {
  breedte: number; hoogte: number; aantal: number; omschrijving: string
}

export interface Order {
  id: string
  klant: string
  datum: string
  adres: string
  status: OrderStatus
  betaald: boolean             // klant heeft betaald aan SpuitwerkOnline
  uitbetaald: boolean          // SpuitwerkOnline heeft spuiter uitbetaald

  // Logistiek
  verwacht_levering?: string          // verwachte leverdatum bij de spuiter
  verwacht_gereed_werkdagen?: number  // aantal werkdagen na inname

  // Financieel
  bedrag: number               // orderwaarde voor de spuiter in euros

  // Productie tracking
  beforeFotoGemaakt: boolean   // before-foto genomen?

  // Wat wordt gespoten
  product: string
  type_service: TypeService
  spuiten_wat: string
  panelen: PaneelMaat[]
  zijdig: Zijdig
  oppervlaktemateriaal: Oppervlaktemateriaal
  oppervlaktestructuur: Oppervlaktestructuur
  handgreepgaten: boolean
  handgreepgaten_aantal: number

  kleur: string
  kleur_methode: KleurMethode
  glansgraad: Glansgraad
  ophaalmethode: Ophaalmethode
  opmerkingen: string
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  bevestigd:         'Bevestigd',
  meerwerk_wacht:    'Wacht op akkoord',
  ontvangen:         'Ontvangen',
  in_productie:      'In productie',
  productie_gereed:  'Productie gereed',
  klaar:             'Klaar voor ophalen',
  afgerond:          'Afgerond'
}

export const STATUS_ORDER: Record<OrderStatus, number> = {
  bevestigd: 0, ontvangen: 1, meerwerk_wacht: 2,
  in_productie: 3, productie_gereed: 4, klaar: 5, afgerond: 6
}

export const TYPE_SERVICE_LABELS: Record<TypeService, string> = {
  alleen_spuitwerk:  'Alleen spuitwerk',
  montage_transport: 'Spuitwerk, montage & transport',
  full_service:      'Full service spuitwerk'
}

export const GLANSGRAAD_LABELS: Record<Glansgraad, string> = {
  zijde: 'Zijdeglans', hoogglans: 'Hoogglans', mat: 'Mat'
}

export const OPPERVLAK_LABELS: Record<Oppervlaktemateriaal, string> = {
  verf_lak: 'Verf/lak', kunststof: 'Kunststof', hout_onbehandeld: 'Hout onbehandeld', metaal: 'Metaal'
}

const orders = ref<Order[]>([
  {
    id: 'SOL-2025-010',
    klant: 'Fabian Wolters', datum: 'Vandaag', adres: 'Nieuwstraat 3, Utrecht',
    status: 'bevestigd', betaald: false, uitbetaald: false, bedrag: 180, beforeFotoGemaakt: false,
    verwacht_levering: 'do 23 mei',
    product: 'Kastdeuren (6 stuks)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Kastdeuren MDF',
    panelen: [
      { breedte: 40, hoogte: 80, aantal: 4, omschrijving: 'Kastdeuren groot' },
      { breedte: 40, hoogte: 40, aantal: 2, omschrijving: 'Kastdeuren klein' },
    ],
    zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'Nog te bepalen', kleur_methode: 'later', glansgraad: 'mat',
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-011',
    klant: 'Nina Brouwer', datum: 'Vandaag', adres: 'Dorpsweg 18, Haarlem',
    status: 'bevestigd', betaald: false, uitbetaald: false, bedrag: 95, beforeFotoGemaakt: false,
    verwacht_levering: 'vr 24 mei',
    product: 'Radiator (1 stuk)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Paneelradiator',
    panelen: [
      { breedte: 80, hoogte: 60, aantal: 1, omschrijving: 'Paneelradiator' },
    ],
    zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'Kleurstaal meenemen', kleur_methode: 'kleurvoorbeeld', glansgraad: 'zijde',
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-001',
    klant: 'Jan de Vries', datum: 'Vandaag', adres: 'Amsterdamseweg 12, Amstelveen',
    status: 'bevestigd', betaald: false, uitbetaald: false, bedrag: 580, beforeFotoGemaakt: false,
    verwacht_levering: 'vr 24 mei',
    product: 'Keukendeuren & ladefronten (20 stuks)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Keukendeuren & ladefronten',
    panelen: [
      { breedte: 40, hoogte: 70, aantal: 8,  omschrijving: 'Bovenkastdeuren' },
      { breedte: 60, hoogte: 70, aantal: 6,  omschrijving: 'Onderkastdeuren' },
      { breedte: 40, hoogte: 20, aantal: 6,  omschrijving: 'Ladefronten' },
    ],
    zijdig: '2-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'RAL 9001 - Gebroken Wit', kleur_methode: 'ral_ncs', glansgraad: 'zijde',
    ophaalmethode: 'klant',
    opmerkingen: 'Deuren en lades zijn al gedemonteerd en schoongemaakt aangeleverd'
  },
  {
    id: 'SOL-2025-002',
    klant: 'Sophie Bakker', datum: 'Gisteren', adres: 'Keizersgracht 45, Amsterdam',
    status: 'meerwerk_wacht', betaald: false, uitbetaald: false, bedrag: 420, beforeFotoGemaakt: false,
    verwacht_levering: 'ma 26 mei',
    product: 'Binnendeuren (5 stuks)',
    type_service: 'montage_transport', spuiten_wat: 'Deuren & kozijnwerk',
    panelen: [{ breedte: 83, hoogte: 201, aantal: 5, omschrijving: 'Binnendeuren opdek' }],
    zijdig: '2-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'RAL 7016 - Antraciet', kleur_methode: 'ral_ncs', glansgraad: 'mat',
    ophaalmethode: 'vervoerder',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-003',
    klant: 'Marco Pietersen', datum: '2 dagen geleden', adres: 'Binnenhof 8, Den Haag',
    status: 'in_productie', betaald: false, uitbetaald: false, bedrag: 340, beforeFotoGemaakt: true,
    product: 'Trapleuning + spijlen (volledig)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Trapleuning, aanzet & spijlen',
    panelen: [
      { breedte: 0, hoogte: 0, aantal: 1,  omschrijving: 'Trapleuning (ca. 6m)' },
      { breedte: 0, hoogte: 0, aantal: 28, omschrijving: 'Spijlen (los meegeleverd)' },
    ],
    zijdig: '1-zijdig', oppervlaktemateriaal: 'metaal', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'RAL 9005 - Zwart Mat', kleur_methode: 'ral_ncs', glansgraad: 'mat',
    ophaalmethode: 'klant',
    opmerkingen: 'Leuning nog gemonteerd - overleg bij inlevering of demonteren nodig is'
  },
  {
    id: 'SOL-2025-004',
    klant: 'Lisa van den Berg', datum: '3 dagen geleden', adres: 'Lijnbaan 22, Rotterdam',
    status: 'in_productie', betaald: false, uitbetaald: false, bedrag: 260, beforeFotoGemaakt: true,
    product: 'Buffetkast - deuren & zijwanden (8 stuks)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Kastdeuren & zijwanden',
    panelen: [
      { breedte: 45, hoogte: 90,  aantal: 4, omschrijving: 'Kastdeuren (MDF)' },
      { breedte: 45, hoogte: 180, aantal: 2, omschrijving: 'Zijwanden' },
      { breedte: 45, hoogte: 20,  aantal: 2, omschrijving: 'Tussenplanken (zichtbaar)' },
    ],
    zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'RAL 6021 - Saliegroen', kleur_methode: 'ral_ncs', glansgraad: 'zijde',
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-005',
    klant: 'Peter Smit', datum: 'Vandaag', adres: 'Kalverstraat 88, Amsterdam',
    status: 'productie_gereed', betaald: false, uitbetaald: false, bedrag: 720, beforeFotoGemaakt: true,
    product: 'Keukendeuren & ladefronten incl. handgreepgaten (24 stuks)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Keukendeuren, ladefronten & plinten',
    panelen: [
      { breedte: 60, hoogte: 72, aantal: 10, omschrijving: 'Onderkastdeuren' },
      { breedte: 30, hoogte: 72, aantal: 4,  omschrijving: 'Smalle onderkastdeuren' },
      { breedte: 60, hoogte: 35, aantal: 6,  omschrijving: 'Ladefronten' },
      { breedte: 60, hoogte: 15, aantal: 4,  omschrijving: 'Plinten' },
    ],
    zijdig: '1-zijdig', oppervlaktemateriaal: 'kunststof', oppervlaktestructuur: 'huidige_structuur',
    handgreepgaten: true, handgreepgaten_aantal: 14,
    kleur: 'BN.00.86 - Sikkens', kleur_methode: 'ral_ncs', glansgraad: 'hoogglans',
    ophaalmethode: 'vervoerder',
    opmerkingen: 'Kunststof deuren, huidige structuur behouden. Handgreepgaten herstellen op 14 panelen.'
  },
  {
    id: 'SOL-2025-006',
    klant: 'Roos Hendriks', datum: '4 dagen geleden', adres: 'Haagse Bluf 3, Utrecht',
    status: 'klaar', betaald: true, uitbetaald: false, bedrag: 140, beforeFotoGemaakt: true,
    product: 'Radiatoren (2 stuks)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Radiatoren',
    panelen: [{ breedte: 60, hoogte: 90, aantal: 2, omschrijving: 'Paneelradiatoren (Stelrad Compact)' }],
    zijdig: '1-zijdig', oppervlaktemateriaal: 'metaal', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'RAL 9002 - Grijswit', kleur_methode: 'ral_ncs', glansgraad: 'zijde',
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  // ── Afgeronde orders ──────────────────────────────────────────────
  {
    id: 'SOL-2025-007',
    klant: 'Dirk Jansen', datum: '1 week geleden', adres: 'Molenstraat 7, Haarlem',
    status: 'afgerond', betaald: true, uitbetaald: true, bedrag: 380, beforeFotoGemaakt: true,
    product: 'Keukendeuren (12 stuks)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Keukendeuren',
    panelen: [{ breedte: 50, hoogte: 70, aantal: 12, omschrijving: 'Keukendeuren' }],
    zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'RAL 9005 - Zwart Mat', kleur_methode: 'ral_ncs', glansgraad: 'mat',
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-008',
    klant: 'Anouk Visser', datum: '10 dagen geleden', adres: 'Prins Hendrikstraat 19, Utrecht',
    status: 'afgerond', betaald: true, uitbetaald: false, bedrag: 195, beforeFotoGemaakt: true,
    product: 'Binnendeuren (3 stuks)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Binnendeuren',
    panelen: [{ breedte: 83, hoogte: 201, aantal: 3, omschrijving: 'Binnendeuren' }],
    zijdig: '2-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'RAL 9003 - Wit Glans', kleur_methode: 'ral_ncs', glansgraad: 'hoogglans',
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-009',
    klant: 'Tom de Boer', datum: '2 weken geleden', adres: 'Velperweg 44, Arnhem',
    status: 'afgerond', betaald: true, uitbetaald: false, bedrag: 310, beforeFotoGemaakt: true,
    product: 'Trapleuning (volledig)',
    type_service: 'alleen_spuitwerk', spuiten_wat: 'Trapleuning & spijlen',
    panelen: [{ breedte: 0, hoogte: 0, aantal: 1, omschrijving: 'Trapleuning + 22 spijlen' }],
    zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
    handgreepgaten: false, handgreepgaten_aantal: 0,
    kleur: 'RAL 7016 - Antraciet', kleur_methode: 'ral_ncs', glansgraad: 'zijde',
    ophaalmethode: 'vervoerder',
    opmerkingen: ''
  }
])

export function useOrders() {
  function getOrder(id: string) {
    return orders.value.find(o => o.id === id)
  }
  function updateStatus(id: string, status: OrderStatus) {
    const o = orders.value.find(o => o.id === id)
    if (o) o.status = status
  }
  function markBeforeFoto(id: string) {
    const o = orders.value.find(o => o.id === id)
    if (o) {
      o.beforeFotoGemaakt = true
      if (o.status === 'ontvangen') {
        o.status = 'in_productie'
      }
    }
  }
  function updateVerwachtGereed(id: string, dagen: number) {
    const o = orders.value.find(o => o.id === id)
    if (o) o.verwacht_gereed_werkdagen = dagen
  }
  function updateKleur(id: string, kleur: string) {
    const o = orders.value.find(o => o.id === id)
    if (o) { o.kleur = kleur; o.kleur_methode = 'ral_ncs' }
  }
  return { orders, getOrder, updateStatus, markBeforeFoto, updateKleur, updateVerwachtGereed }
}
