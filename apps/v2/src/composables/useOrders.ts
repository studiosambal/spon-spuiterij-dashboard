import { ref } from 'vue'

export type OrderStatus =
  | 'bevestigd'
  | 'meerwerk_wacht'    // afwijking gemeld bij SpuitwerkOnline, wacht op akkoord via kantoor
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
export type KleurMethode = 'ral_ncs' | 'ander_merk' | 'mengverhouding' | 'kleurvoorbeeld' | 'zelfde_kleur' | 'later'
export type Ophaalmethode = 'klant' | 'vervoerder'

export interface PaneelMaat {
  // breedte/hoogte in cm. Beide > 0 = vlak (m²), één > 0 = strekkend (m), beide 0 = per stuk
  breedte: number; hoogte: number; aantal: number; omschrijving: string
}

// Een order kan meerdere diensten bevatten (bijv. binnendeuren én trapleuning).
// Kleur, glansgraad, materiaal en panelen horen bij de dienst, niet bij de order.
export interface Dienst {
  naam: string
  panelen: PaneelMaat[]
  zijdig: Zijdig
  oppervlaktemateriaal: Oppervlaktemateriaal
  oppervlaktestructuur: Oppervlaktestructuur
  kleur: string                // korte, leesbare weergave (code, merk+code, of label)
  kleur_methode: KleurMethode
  kleur_recept?: string        // vrij mengrecept, alleen bij methode 'mengverhouding'
  glansgraad: Glansgraad
  handgreepgaten: boolean
  handgreepgaten_aantal: number
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
  verwacht_gereed_werkdagen?: number  // aantal werkdagen na inname (standaard 15)
  verwacht_gereed_datum?: string      // verwachte opleverdatum (weergave), bv. 'do 19 jun'
  te_laat?: boolean                   // verwachte opleverdatum overschreden zonder actie

  // Financieel
  bedrag: number               // orderwaarde voor de spuiter in euros

  // Productie tracking
  beforeFotoGemaakt: boolean   // before-foto genomen?

  // Wat wordt gespoten — één of meer diensten
  product: string              // korte samenvatting voor de lijst
  type_service: TypeService
  diensten: Dienst[]

  ophaalmethode: Ophaalmethode
  opmerkingen: string
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  bevestigd:         'Bevestigd',
  meerwerk_wacht:    'Wacht op akkoord',
  ontvangen:         'Ontvangen',
  in_productie:      'In productie',
  productie_gereed:  'Wacht op betaling',
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

export const KLEUR_METHODE_LABELS: Record<KleurMethode, string> = {
  ral_ncs:        'RAL / NCS',
  ander_merk:     'Ander merk',
  mengverhouding: 'Mengverhouding',
  kleurvoorbeeld: 'Volgens kleurstaal',
  zelfde_kleur:   'Zelfde kleur',
  later:          'Nog te bepalen'
}

export const OPPERVLAK_LABELS: Record<Oppervlaktemateriaal, string> = {
  verf_lak: 'Verf/lak', kunststof: 'Kunststof', hout_onbehandeld: 'Hout onbehandeld', metaal: 'Metaal'
}

// ── Geometrie: m², strekkende meters en stuks afleiden uit de panelen ──────────
export interface PaneelTotalen { stuks: number; m2: number; strekkend: number }

export function paneelTotalen(panelen: PaneelMaat[], zijdig: Zijdig): PaneelTotalen {
  const factor = zijdig === '2-zijdig' ? 2 : 1
  let m2 = 0, strekkend = 0, stuks = 0
  for (const p of panelen) {
    stuks += p.aantal
    if (p.breedte > 0 && p.hoogte > 0) {
      m2 += p.aantal * (p.breedte / 100) * (p.hoogte / 100) * factor
    } else if (p.breedte > 0 || p.hoogte > 0) {
      strekkend += p.aantal * (Math.max(p.breedte, p.hoogte) / 100)
    }
  }
  return { stuks, m2: Math.round(m2 * 100) / 100, strekkend: Math.round(strekkend * 100) / 100 }
}

// Korte samenvatting achter de dienstnaam, bv. "20 stuks · 6,2 m²"
export function dienstHoeveelheid(d: Dienst): string {
  const t = paneelTotalen(d.panelen, d.zijdig)
  const delen: string[] = [`${t.stuks} ${t.stuks === 1 ? 'stuk' : 'stuks'}`]
  if (t.m2 > 0)        delen.push(`${t.m2.toLocaleString('nl-NL')} m²`)
  if (t.strekkend > 0) delen.push(`${t.strekkend.toLocaleString('nl-NL')} m`)
  return delen.join(' · ')
}

const orders = ref<Order[]>([
  {
    id: 'SOL-2025-010',
    klant: 'Fabian Wolters', datum: 'Vandaag', adres: 'Nieuwstraat 3, Utrecht',
    status: 'bevestigd', betaald: false, uitbetaald: false, bedrag: 180, beforeFotoGemaakt: false,
    verwacht_levering: 'do 23 mei',
    product: 'Kastdeuren (6 stuks)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Kastdeuren MDF',
        panelen: [
          { breedte: 40, hoogte: 80, aantal: 4, omschrijving: 'Kastdeuren groot' },
          { breedte: 40, hoogte: 40, aantal: 2, omschrijving: 'Kastdeuren klein' },
        ],
        zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
        kleur: 'Nog te bepalen', kleur_methode: 'later', glansgraad: 'mat',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-011',
    klant: 'Nina Brouwer', datum: 'Vandaag', adres: 'Dorpsweg 18, Haarlem',
    status: 'bevestigd', betaald: false, uitbetaald: false, bedrag: 95, beforeFotoGemaakt: false,
    verwacht_levering: 'vr 24 mei',
    product: 'Radiator (1 stuk)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Paneelradiator',
        panelen: [
          { breedte: 80, hoogte: 60, aantal: 1, omschrijving: 'Paneelradiator' },
        ],
        zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
        kleur: 'Kleurstaal meenemen', kleur_methode: 'kleurvoorbeeld', glansgraad: 'zijde',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-001',
    klant: 'Jan de Vries', datum: 'Vandaag', adres: 'Amsterdamseweg 12, Amstelveen',
    status: 'bevestigd', betaald: false, uitbetaald: false, bedrag: 580, beforeFotoGemaakt: false,
    verwacht_levering: 'vr 24 mei',
    product: 'Keukendeuren & ladefronten (20 stuks)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Keukendeuren & ladefronten',
        panelen: [
          { breedte: 40, hoogte: 70, aantal: 8,  omschrijving: 'Bovenkastdeuren' },
          { breedte: 60, hoogte: 70, aantal: 6,  omschrijving: 'Onderkastdeuren' },
          { breedte: 40, hoogte: 20, aantal: 6,  omschrijving: 'Ladefronten' },
        ],
        zijdig: '2-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
        kleur: 'RAL 9001 - Gebroken Wit', kleur_methode: 'ral_ncs', glansgraad: 'zijde',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
    ophaalmethode: 'klant',
    opmerkingen: 'Deuren en lades zijn al gedemonteerd en schoongemaakt aangeleverd'
  },
  {
    id: 'SOL-2025-002',
    klant: 'Sophie Bakker', datum: 'Gisteren', adres: 'Keizersgracht 45, Amsterdam',
    status: 'meerwerk_wacht', betaald: false, uitbetaald: false, bedrag: 420, beforeFotoGemaakt: false,
    verwacht_levering: 'ma 26 mei',
    product: 'Binnendeuren & trapleuning',
    type_service: 'montage_transport',
    diensten: [
      {
        naam: 'Binnendeuren',
        panelen: [{ breedte: 83, hoogte: 201, aantal: 5, omschrijving: 'Binnendeuren opdek' }],
        zijdig: '2-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
        kleur: 'RAL 7016 - Antraciet', kleur_methode: 'ral_ncs', glansgraad: 'mat',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
      {
        naam: 'Trapleuning & spijlen',
        panelen: [
          { breedte: 550, hoogte: 0, aantal: 1,  omschrijving: 'Trapleuning' },
          { breedte: 0,   hoogte: 0, aantal: 24, omschrijving: 'Spijlen' },
        ],
        zijdig: '1-zijdig', oppervlaktemateriaal: 'metaal', oppervlaktestructuur: 'glad',
        kleur: 'RAL 9005 - Zwart Mat', kleur_methode: 'ral_ncs', glansgraad: 'mat',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
    ophaalmethode: 'vervoerder',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-003',
    klant: 'Marco Pietersen', datum: '2 dagen geleden', adres: 'Binnenhof 8, Den Haag',
    status: 'in_productie', betaald: false, uitbetaald: false, bedrag: 340, beforeFotoGemaakt: true,
    verwacht_gereed_werkdagen: 15, verwacht_gereed_datum: 'do 19 jun', te_laat: true,
    product: 'Trapleuning + spijlen (volledig)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Trapleuning, aanzet & spijlen',
        panelen: [
          { breedte: 600, hoogte: 0, aantal: 1,  omschrijving: 'Trapleuning' },
          { breedte: 0,   hoogte: 0, aantal: 28, omschrijving: 'Spijlen (los meegeleverd)' },
        ],
        zijdig: '1-zijdig', oppervlaktemateriaal: 'metaal', oppervlaktestructuur: 'glad',
        kleur: 'RAL 9005 - Zwart Mat', kleur_methode: 'ral_ncs', glansgraad: 'mat',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
    ophaalmethode: 'klant',
    opmerkingen: 'Leuning nog gemonteerd - overleg bij inlevering of demonteren nodig is'
  },
  {
    id: 'SOL-2025-004',
    klant: 'Lisa van den Berg', datum: '3 dagen geleden', adres: 'Lijnbaan 22, Rotterdam',
    status: 'in_productie', betaald: false, uitbetaald: false, bedrag: 260, beforeFotoGemaakt: true,
    product: 'Buffetkast - deuren & zijwanden (8 stuks)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Kastdeuren & zijwanden',
        panelen: [
          { breedte: 45, hoogte: 90,  aantal: 4, omschrijving: 'Kastdeuren (MDF)' },
          { breedte: 45, hoogte: 180, aantal: 2, omschrijving: 'Zijwanden' },
          { breedte: 45, hoogte: 20,  aantal: 2, omschrijving: 'Tussenplanken (zichtbaar)' },
        ],
        zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
        kleur: 'Saliegroen (mengkleur)', kleur_methode: 'mengverhouding',
        kleur_recept: 'Sikkens basis WN · +12% RAL 6021 · +3% zwart 9005', glansgraad: 'zijde',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-005',
    klant: 'Peter Smit', datum: 'Vandaag', adres: 'Kalverstraat 88, Amsterdam',
    status: 'productie_gereed', betaald: false, uitbetaald: false, bedrag: 720, beforeFotoGemaakt: true,
    product: 'Keukendeuren & ladefronten incl. handgreepgaten (24 stuks)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Keukendeuren, ladefronten & plinten',
        panelen: [
          { breedte: 60, hoogte: 72, aantal: 10, omschrijving: 'Onderkastdeuren' },
          { breedte: 30, hoogte: 72, aantal: 4,  omschrijving: 'Smalle onderkastdeuren' },
          { breedte: 60, hoogte: 35, aantal: 6,  omschrijving: 'Ladefronten' },
          { breedte: 60, hoogte: 15, aantal: 4,  omschrijving: 'Plinten' },
        ],
        zijdig: '1-zijdig', oppervlaktemateriaal: 'kunststof', oppervlaktestructuur: 'huidige_structuur',
        kleur: 'Sikkens BN.00.86', kleur_methode: 'ander_merk', glansgraad: 'hoogglans',
        handgreepgaten: true, handgreepgaten_aantal: 14,
      },
    ],
    ophaalmethode: 'vervoerder',
    opmerkingen: 'Kunststof deuren, huidige structuur behouden. Handgreepgaten herstellen op 14 panelen.'
  },
  {
    id: 'SOL-2025-006',
    klant: 'Roos Hendriks', datum: '4 dagen geleden', adres: 'Haagse Bluf 3, Utrecht',
    status: 'klaar', betaald: true, uitbetaald: false, bedrag: 140, beforeFotoGemaakt: true,
    product: 'Radiatoren (2 stuks)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Radiatoren',
        panelen: [{ breedte: 60, hoogte: 90, aantal: 2, omschrijving: 'Paneelradiatoren (Stelrad Compact)' }],
        zijdig: '1-zijdig', oppervlaktemateriaal: 'metaal', oppervlaktestructuur: 'glad',
        kleur: 'RAL 9002 - Grijswit', kleur_methode: 'ral_ncs', glansgraad: 'zijde',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  // ── Afgeronde orders ──────────────────────────────────────────────
  {
    id: 'SOL-2025-007',
    klant: 'Dirk Jansen', datum: '1 week geleden', adres: 'Molenstraat 7, Haarlem',
    status: 'afgerond', betaald: true, uitbetaald: true, bedrag: 380, beforeFotoGemaakt: true,
    product: 'Keukendeuren (12 stuks)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Keukendeuren',
        panelen: [{ breedte: 50, hoogte: 70, aantal: 12, omschrijving: 'Keukendeuren' }],
        zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
        kleur: 'RAL 9005 - Zwart Mat', kleur_methode: 'ral_ncs', glansgraad: 'mat',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-008',
    klant: 'Anouk Visser', datum: '10 dagen geleden', adres: 'Prins Hendrikstraat 19, Utrecht',
    status: 'afgerond', betaald: true, uitbetaald: false, bedrag: 195, beforeFotoGemaakt: true,
    product: 'Binnendeuren (3 stuks)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Binnendeuren',
        panelen: [{ breedte: 83, hoogte: 201, aantal: 3, omschrijving: 'Binnendeuren' }],
        zijdig: '2-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
        kleur: 'RAL 9003 - Wit Glans', kleur_methode: 'ral_ncs', glansgraad: 'hoogglans',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
    ophaalmethode: 'klant',
    opmerkingen: ''
  },
  {
    id: 'SOL-2025-009',
    klant: 'Tom de Boer', datum: '2 weken geleden', adres: 'Velperweg 44, Arnhem',
    status: 'afgerond', betaald: true, uitbetaald: false, bedrag: 310, beforeFotoGemaakt: true,
    product: 'Trapleuning (volledig)',
    type_service: 'alleen_spuitwerk',
    diensten: [
      {
        naam: 'Trapleuning & spijlen',
        panelen: [
          { breedte: 480, hoogte: 0, aantal: 1,  omschrijving: 'Trapleuning' },
          { breedte: 0,   hoogte: 0, aantal: 22, omschrijving: 'Spijlen' },
        ],
        zijdig: '1-zijdig', oppervlaktemateriaal: 'verf_lak', oppervlaktestructuur: 'glad',
        kleur: 'RAL 7016 - Antraciet', kleur_methode: 'ral_ncs', glansgraad: 'zijde',
        handgreepgaten: false, handgreepgaten_aantal: 0,
      },
    ],
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
    // De foto bij ontvangst is de daadwerkelijke aanname van de goederen:
    // bevestigd → ontvangen. De controle (kleur/maten) is een aparte stap erna.
    const o = orders.value.find(o => o.id === id)
    if (o) {
      o.beforeFotoGemaakt = true
      if (o.status === 'bevestigd') {
        o.status = 'ontvangen'
      }
    }
  }
  function updateVerwachtGereed(id: string, dagen: number) {
    const o = orders.value.find(o => o.id === id)
    if (o) o.verwacht_gereed_werkdagen = dagen
  }
  function updateKleur(id: string, dienstIndex: number, payload: { kleur: string; methode: KleurMethode; recept?: string }) {
    const o = orders.value.find(o => o.id === id)
    const d = o?.diensten[dienstIndex]
    if (d) {
      d.kleur = payload.kleur
      d.kleur_methode = payload.methode
      d.kleur_recept = payload.methode === 'mengverhouding' ? payload.recept : undefined
    }
  }
  return { orders, getOrder, updateStatus, markBeforeFoto, updateKleur, updateVerwachtGereed }
}
