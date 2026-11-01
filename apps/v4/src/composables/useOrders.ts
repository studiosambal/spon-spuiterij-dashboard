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
export type Aanlevering = 'klant' | 'koerier'   // wie de goederen bij de spuiter aflevert

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

export interface MeerwerkPaneel { aantal: string; breedte: string; hoogte: string; omschrijving: string }

// Een orderregel waarvan de spuiter een ander aantal telde dan besteld.
// Robert prijst dit zelf via de configurator; de spuiter geeft alleen de telling door.
export interface AantalWijziging { dienst: string; regel: string; was: number; geteld: number }

// Twee soorten afwijking, elk met hun eigen prijslogica:
// aantallen (configureerbaar, SpuitwerkOnline prijst) en de staat van het werk
// (ondergrond of huidige afwerking vraagt extra werk, de spuiter geeft zijn prijs).
export interface MeerwerkMelding {
  datum: string
  aantallen: AantalWijziging[]
  extraItems: MeerwerkPaneel[]
  overig?: string             // overige afwijking (bv. kleur of maten): wat de spuiter ziet
  overigKosten?: number       // geschatte meerkosten bij 'overige', als die er zijn
  omschrijving?: string       // staat van het werk: wat de spuiter ziet
  fotos?: number              // aantal foto's bij de staat van het werk
  indicatie?: number          // totale geschatte meerkosten van de spuiter (staat van het werk + overige)
  status: 'wacht' | 'akkoord' | 'afgewezen'
  besluitdatum?: string       // wanneer de klant akkoord gaf of afwees
  goedgekeurdBedrag?: number  // pas gevuld als SpuitwerkOnline akkoord heeft van de klant
  behandelaar: string         // wie er nu aan zet is
  laatsteUpdate: string       // korte status vanuit SpuitwerkOnline
}

// De spuiter geeft door dat de opleverdatum niet lukt. Elke wijziging blijft
// bewaard (oude en nieuwe datum, reden), zodat SpuitwerkOnline later kan zien
// hoe vaak en waarom een datum schuift. De klant krijgt bericht van kantoor.
export type DatumReden = 'drukte' | 'ondergrond' | 'overig'
export const DATUM_REDEN_LABELS: Record<DatumReden, string> = {
  drukte:     'Drukte in de werkplaats',
  ondergrond: 'Ondergrond of oude afwerking',
  overig:     'Overig',
}
export interface DatumWijziging {
  gemeld: string              // wanneer de spuiter het doorgaf
  oud: string                 // opleverdatum tot dan toe
  nieuw: string               // nieuwe verwachte opleverdatum
  reden: DatumReden
  toelichting?: string
  // Alleen voor 'ongedaan maken': hoe de order er vóór de wijziging bij stond
  vorig: { te_laat?: boolean; gereed_relatief?: string }
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
  aanlevering?: Aanlevering           // door de klant of via een koerier
  ontvangstdatum?: string             // datum van aanname — hier start de opleverklok
  verwacht_gereed_werkdagen?: number  // aantal werkdagen na inname (standaard 15)
  verwacht_gereed_datum?: string      // verwachte opleverdatum (weergave), bv. 'do 19 jun'
  gereed_relatief?: string            // 'indruk' van haast, bv. 'over 8 dagen' / '3 dagen te laat' (fake)
  te_laat?: boolean                   // verwachte opleverdatum overschreden zonder actie
  datumWijzigingen?: DatumWijziging[] // door de spuiter doorgegeven nieuwe opleverdata

  // Meerwerk — de verzonden melding hoort bij de order te blijven, anders kan de
  // spuiter niet terugzien wat hij heeft gemeld. 'Bekijk meerwerk' toont dit.
  meerwerk?: MeerwerkMelding

  // Gebeurtenissen — voeden het logboek op de detailpagina. In productie levert
  // de backend deze; hier worden ze gezet zodra de spuiter een stap bevestigt.
  controledatum?: string              // controle afgerond, productie gestart
  meerwerkdatum?: string              // afwijking gemeld bij SpuitwerkOnline
  gereeddatum?: string                // productie afgerond
  betaaldatum?: string                // betaling van de klant binnen
  opgehaalddatum?: string             // goederen mee met klant/vervoerder

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
  bevestigd:         'Binnenkomst verwacht',
  meerwerk_wacht:    'Wacht op akkoord',
  ontvangen:         'Ontvangen',
  in_productie:      'In productie',
  productie_gereed:  'Wacht op klantbetaling',
  klaar:             'Klaar voor ophalen',
  afgerond:          'Afgerond'
}

// Severity voor de PrimeVue-Tag op de detailpagina. Zelfde regel als op het
// dashboard: kleur is signaal, niet fase-identiteit. Normale voortgang is grijs —
// anders is de badge het enige verzadigde element op een verder rustige pagina.
// Oranje = wacht op een ander, rood = niet meegeven, groen = mag mee met de klant.
export type StatusSeverity = 'info' | 'warn' | 'danger' | 'success' | 'secondary'
export const STATUS_SEVERITY: Record<OrderStatus, StatusSeverity> = {
  bevestigd:         'secondary',
  ontvangen:         'secondary',
  in_productie:      'secondary',
  meerwerk_wacht:    'warn',
  productie_gereed:  'danger',   // niet meegeven: net zo belangrijk als te laat
  klaar:             'success',
  afgerond:          'secondary'
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

// ── Opleverduur: vast aantal werkdagen, vanaf de ontvangstdatum (geen spuiter-input) ──
export const WERKDAGEN_STANDAARD = 15

const WEEKDAG_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const MAAND_KORT   = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export function datumKort(d: Date): string {
  return `${WEEKDAG_KORT[d.getDay()]} ${d.getDate()} ${MAAND_KORT[d.getMonth()]}`
}

// Tel een aantal werkdagen (ma–vr) op bij een startdatum
export function plusWerkdagen(werkdagen: number, vanaf: Date): Date {
  const d = new Date(vanaf)
  let geteld = 0
  while (geteld < werkdagen) {
    d.setDate(d.getDate() + 1)
    const dag = d.getDay()
    if (dag !== 0 && dag !== 6) geteld++
  }
  return d
}
function opleverdatum(werkdagen: number, vanaf: Date): string {
  return datumKort(plusWerkdagen(werkdagen, vanaf))
}

// ── Logboek ──────────────────────────────────────────────────────────────────
// Wordt afgeleid uit de order in plaats van apart opgeslagen, zodat hij meegroeit
// zodra de spuiter in de app een stap bevestigt. In productie levert de backend
// deze regels; de vorm blijft hetzelfde.
export interface LogRegel {
  datum?: string
  tekst: string
  state: 'gedaan' | 'nu' | 'verwacht'
}

export function orderLogboek(o: Order): LogRegel[] {
  const rang = STATUS_ORDER[o.status]
  const r: LogRegel[] = []

  if (o.ontvangstdatum) {
    r.push({ datum: o.ontvangstdatum, tekst: 'Goederen ontvangen', state: 'gedaan' })
    if (o.beforeFotoGemaakt) r.push({ datum: o.ontvangstdatum, tekst: 'Foto bij ontvangst gemaakt', state: 'gedaan' })
  } else if (o.verwacht_levering) {
    const wie = o.aanlevering === 'klant' ? ' door de klant' : o.aanlevering === 'koerier' ? ' via koerier' : ''
    r.push({ datum: o.verwacht_levering, tekst: `Levering verwacht${wie}`, state: 'verwacht' })
  }

  const mw = o.meerwerk
  if (mw || o.meerwerkdatum) {
    r.push({ datum: mw?.datum ?? o.meerwerkdatum, tekst: 'Afwijking gemeld bij SpuitwerkOnline', state: 'gedaan' })
    // De uitkomst hoort in het log: zonder die regel blijft 'goedgekeurd' in het
    // overzicht een bedrag zonder moment waarop het is toegezegd.
    if (mw?.status === 'akkoord')   r.push({ datum: mw.besluitdatum, tekst: 'Klant akkoord, meerwerk goedgekeurd', state: 'gedaan' })
    if (mw?.status === 'afgewezen') r.push({ datum: mw.besluitdatum, tekst: 'Klant niet akkoord, meerwerk vervalt', state: 'gedaan' })
  }
  if (o.status === 'meerwerk_wacht') r.push({ tekst: 'Wacht op akkoord van de klant', state: 'nu' })

  if (o.controledatum) r.push({ datum: o.controledatum, tekst: 'Controle afgerond, productie gestart', state: 'gedaan' })
  for (const w of o.datumWijzigingen ?? []) {
    r.push({ datum: w.gemeld, tekst: `Nieuwe opleverdatum doorgegeven: ${w.nieuw}`, state: 'gedaan' })
  }
  if (o.status === 'in_productie') r.push({ tekst: 'In productie', state: 'nu' })

  if (o.gereeddatum) r.push({ datum: o.gereeddatum, tekst: 'Productie afgerond', state: 'gedaan' })
  else if (o.verwacht_gereed_datum && rang < STATUS_ORDER['productie_gereed']) {
    r.push({ datum: o.verwacht_gereed_datum, tekst: o.te_laat ? 'Gereed verwacht, datum verstreken' : 'Gereed verwacht', state: 'verwacht' })
  }

  if (o.status === 'productie_gereed') r.push({ tekst: 'Wacht op betaling door de klant', state: 'nu' })
  if (o.betaaldatum) r.push({ datum: o.betaaldatum, tekst: 'Klant heeft betaald, mag mee', state: 'gedaan' })
  if (o.status === 'klaar') r.push({ tekst: 'Klaar voor ophalen', state: 'nu' })

  if (o.opgehaalddatum) r.push({ datum: o.opgehaalddatum, tekst: 'Opgehaald door de klant', state: 'gedaan' })
  if (o.status === 'afgerond') {
    r.push(o.uitbetaald
      ? { tekst: 'Jouw vergoeding is uitbetaald', state: 'gedaan' }
      : { tekst: 'Wacht op jouw uitbetaling', state: 'nu' })
  }
  return r
}

// Wat de order oplevert. Meerwerk telt pas mee als SpuitwerkOnline akkoord heeft
// van de klant; een aanvraag is geen bedrag waar de spuiter op mag rekenen.
export function orderTotaal(o: Order): number {
  const m = o.meerwerk
  return o.bedrag + (m?.status === 'akkoord' ? (m.goedgekeurdBedrag ?? m.indicatie ?? 0) : 0)
}

// ── Orderregels tonen: het aantal voorop, de maat alleen om de regel te herkennen ──
export function regelNaam(p: PaneelMaat, i: number): string {
  return p.omschrijving || (p.breedte > 0 || p.hoogte > 0 ? 'Paneel' : `Onderdeel ${i + 1}`)
}
export function regelMaat(p: PaneelMaat): string {
  if (p.breedte > 0 && p.hoogte > 0) return `${p.breedte} × ${p.hoogte} cm`
  if (p.breedte > 0 || p.hoogte > 0) return `${Math.max(p.breedte, p.hoogte)} cm`
  return ''
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

// Klantnaam met plaats (afgeleid uit het adres) — makkelijker te onthouden,
// bv. 'Nina Brouwer • Haarlem'. Veilig bij een ontbrekende order.
export function klantPlaats(o?: Order): string {
  if (!o) return ''
  const delen = o.adres.split(',')
  const plaats = delen.length > 1 ? delen[delen.length - 1].trim() : ''
  return plaats ? `${o.klant} • ${plaats}` : o.klant
}

const orders = ref<Order[]>([
  {
    id: 'SOL-2025-010',
    klant: 'Fabian Wolters', datum: '29 jun', adres: 'Nieuwstraat 3, Utrecht',
    status: 'bevestigd', betaald: false, uitbetaald: false, bedrag: 180, beforeFotoGemaakt: false,
    verwacht_levering: 'do 23 mei',
    aanlevering: 'koerier',
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
    klant: 'Nina Brouwer', datum: '29 jun', adres: 'Dorpsweg 18, Haarlem',
    status: 'bevestigd', betaald: false, uitbetaald: false, bedrag: 95, beforeFotoGemaakt: false,
    verwacht_levering: 'vr 24 mei',
    aanlevering: 'klant',
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
    klant: 'Jan de Vries', datum: '29 jun', adres: 'Amsterdamseweg 12, Amstelveen',
    status: 'bevestigd', betaald: false, uitbetaald: false, bedrag: 580, beforeFotoGemaakt: false,
    verwacht_levering: 'vr 24 mei',
    aanlevering: 'klant',
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
    klant: 'Sophie Bakker', datum: '28 jun', adres: 'Keizersgracht 45, Amsterdam',
    status: 'meerwerk_wacht', betaald: false, uitbetaald: false, bedrag: 420, beforeFotoGemaakt: false,
    ontvangstdatum: 'ma 26 mei', verwacht_gereed_werkdagen: 15, verwacht_gereed_datum: 'ma 16 jun',
    meerwerkdatum: 'di 27 mei',
    meerwerk: {
      datum: 'di 27 mei',
      omschrijving: 'Twee binnendeuren hebben diepe krassen aan de onderzijde. Die moeten eerst geplamuurd en geschuurd worden, anders zie je het door de lak heen.',
      aantallen: [],
      extraItems: [],
      fotos: 1,
      indicatie: 85,
      status: 'wacht',
      behandelaar: 'SpuitwerkOnline',
      laatsteUpdate: 'Offerte naar de klant gestuurd, wachten op akkoord',
    },
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
    klant: 'Marco Pietersen', datum: '27 jun', adres: 'Binnenhof 8, Den Haag',
    status: 'in_productie', betaald: false, uitbetaald: false, bedrag: 340, beforeFotoGemaakt: true,
    ontvangstdatum: 'do 29 mei', verwacht_gereed_werkdagen: 15, verwacht_gereed_datum: 'do 19 jun', gereed_relatief: '3 dagen te laat', te_laat: true,
    controledatum: 'vr 30 mei',
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
    opmerkingen: 'Leuning nog gemonteerd. Overleg bij inlevering of demonteren nodig is.'
  },
  {
    id: 'SOL-2025-004',
    klant: 'Lisa van den Berg', datum: '26 jun', adres: 'Lijnbaan 22, Rotterdam',
    status: 'in_productie', betaald: false, uitbetaald: false, bedrag: 260, beforeFotoGemaakt: true,
    ontvangstdatum: 'wo 4 jun', verwacht_gereed_werkdagen: 15, verwacht_gereed_datum: 'wo 25 jun', gereed_relatief: 'over 8 dagen',
    controledatum: 'do 5 jun',
    meerwerk: {
      datum: 'do 5 jun',
      omschrijving: 'Twee zijwanden waren aan de achterkant niet geschuurd. Extra voorbehandeling nodig.',
      aantallen: [],
      extraItems: [],
      fotos: 1,
      indicatie: 60,
      status: 'akkoord',
      goedgekeurdBedrag: 60,
      besluitdatum: 'do 5 jun',
      behandelaar: 'SpuitwerkOnline',
      laatsteUpdate: 'Klant is akkoord, het meerwerk is goedgekeurd',
    },
    product: 'Buffetkast, deuren & zijwanden (8 stuks)',
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
    klant: 'Peter Smit', datum: '29 jun', adres: 'Kalverstraat 88, Amsterdam',
    status: 'productie_gereed', betaald: false, uitbetaald: false, bedrag: 720, beforeFotoGemaakt: true,
    ontvangstdatum: 'ma 2 jun', verwacht_gereed_werkdagen: 15, verwacht_gereed_datum: 'ma 23 jun',
    controledatum: 'di 3 jun', gereeddatum: 'ma 16 jun',
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
    klant: 'Roos Hendriks', datum: '25 jun', adres: 'Haagse Bluf 3, Utrecht',
    status: 'klaar', betaald: true, uitbetaald: false, bedrag: 140, beforeFotoGemaakt: true,
    ontvangstdatum: 'wo 21 mei', verwacht_gereed_werkdagen: 15, verwacht_gereed_datum: 'wo 11 jun',
    controledatum: 'do 22 mei', gereeddatum: 'di 10 jun', betaaldatum: 'wo 11 jun',
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
    klant: 'Dirk Jansen', datum: '22 jun', adres: 'Molenstraat 7, Haarlem',
    status: 'afgerond', betaald: true, uitbetaald: true, bedrag: 380, beforeFotoGemaakt: true,
    ontvangstdatum: 'ma 12 mei', verwacht_gereed_werkdagen: 15, verwacht_gereed_datum: 'ma 2 jun',
    controledatum: 'di 13 mei', gereeddatum: 'vr 30 mei', betaaldatum: 'ma 2 jun', opgehaalddatum: 'di 3 jun',
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
    klant: 'Anouk Visser', datum: '19 jun', adres: 'Prins Hendrikstraat 19, Utrecht',
    status: 'afgerond', betaald: true, uitbetaald: false, bedrag: 195, beforeFotoGemaakt: true,
    ontvangstdatum: 'wo 14 mei', verwacht_gereed_werkdagen: 15, verwacht_gereed_datum: 'wo 4 jun',
    controledatum: 'do 15 mei', gereeddatum: 'di 3 jun', betaaldatum: 'wo 4 jun', opgehaalddatum: 'do 5 jun',
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
    klant: 'Tom de Boer', datum: '15 jun', adres: 'Velperweg 44, Arnhem',
    status: 'afgerond', betaald: true, uitbetaald: false, bedrag: 310, beforeFotoGemaakt: true,
    ontvangstdatum: 'ma 19 mei', verwacht_gereed_werkdagen: 15, verwacht_gereed_datum: 'ma 9 jun',
    controledatum: 'di 20 mei', gereeddatum: 'vr 6 jun', betaaldatum: 'ma 9 jun', opgehaalddatum: 'di 10 jun',
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
    if (!o) return
    // Gebeurtenis vastleggen zodat het logboek meegroeit met wat de spuiter doet
    const nu = datumKort(new Date())
    if (status === 'in_productie'     && !o.controledatum)  o.controledatum  = nu
    if (status === 'meerwerk_wacht'   && !o.meerwerkdatum)  o.meerwerkdatum  = nu
    if (status === 'productie_gereed' && !o.gereeddatum)    o.gereeddatum    = nu
    if (status === 'klaar'            && !o.betaaldatum)    o.betaaldatum    = nu
    if (status === 'afgerond'         && !o.opgehaalddatum) o.opgehaalddatum = nu
    o.status = status
  }
  // Aanname van de goederen: bevestigd → ontvangen. Hier start de opleverklok —
  // 15 werkdagen vanaf nu, vast. De controle (kleur/maten) is een aparte stap erna
  // en verschuift deze datum niet.
  function markOntvangen(o: Order) {
    if (o.status !== 'bevestigd') return
    const nu = new Date()
    o.status = 'ontvangen'
    o.ontvangstdatum = datumKort(nu)
    o.verwacht_gereed_werkdagen = WERKDAGEN_STANDAARD
    o.verwacht_gereed_datum = opleverdatum(WERKDAGEN_STANDAARD, nu)
  }
  function ontvangGoederen(id: string) {
    const o = orders.value.find(o => o.id === id)
    if (o) markOntvangen(o)
  }
  function markBeforeFoto(id: string) {
    const o = orders.value.find(o => o.id === id)
    if (o) {
      o.beforeFotoGemaakt = true
      markOntvangen(o)   // een eerste foto telt ook als aanname van de goederen
    }
  }
  // Ontvangst is een echte handeling, dus ook echt terug te draaien. De opleverklok
  // start bij ontvangst; die moet dus mee terug.
  function maakOntvangstOngedaan(id: string) {
    const o = orders.value.find(o => o.id === id)
    if (!o || o.status !== 'ontvangen') return
    o.status = 'bevestigd'
    o.ontvangstdatum = undefined
    o.verwacht_gereed_datum = undefined
    o.verwacht_gereed_werkdagen = undefined
    o.gereed_relatief = undefined
  }

  // Nieuwe opleverdatum: de spuiter redt de oude niet. Status blijft gelijk;
  // alleen de datum schuift, en de wijziging wordt vastgelegd.
  function verschuifOplevering(id: string, nieuw: Date, reden: DatumReden, toelichting?: string) {
    const o = orders.value.find(o => o.id === id)
    if (!o || !o.verwacht_gereed_datum) return
    ;(o.datumWijzigingen ??= []).push({
      gemeld: datumKort(new Date()), oud: o.verwacht_gereed_datum, nieuw: datumKort(nieuw),
      reden, toelichting, vorig: { te_laat: o.te_laat, gereed_relatief: o.gereed_relatief },
    })
    o.verwacht_gereed_datum = datumKort(nieuw)
    o.te_laat = false
    o.gereed_relatief = undefined
  }
  function maakVerschuivingOngedaan(id: string) {
    const o = orders.value.find(o => o.id === id)
    const w = o?.datumWijzigingen?.pop()
    if (!o || !w) return
    o.verwacht_gereed_datum = w.oud
    o.te_laat = w.vorig.te_laat
    o.gereed_relatief = w.vorig.gereed_relatief
  }

  function meldMeerwerk(id: string, melding: Omit<MeerwerkMelding, 'datum' | 'behandelaar' | 'laatsteUpdate' | 'status' | 'goedgekeurdBedrag'>) {
    const o = orders.value.find(o => o.id === id)
    if (!o) return
    const nu = datumKort(new Date())
    o.meerwerk = {
      ...melding,
      datum: nu,
      status: 'wacht',
      behandelaar: 'SpuitwerkOnline',
      laatsteUpdate: 'Melding ontvangen, we nemen contact op met de klant',
    }
    o.meerwerkdatum = nu
    o.status = 'meerwerk_wacht'
  }

  // Overdracht terugdraaien — één verkeerde tik mag geen order archiveren
  function maakOverdrachtOngedaan(id: string) {
    const o = orders.value.find(o => o.id === id)
    if (!o || o.status !== 'afgerond') return
    o.status = 'klaar'
    o.opgehaalddatum = undefined
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
  return {
    orders, getOrder, updateStatus, ontvangGoederen, markBeforeFoto, updateKleur,
    maakOntvangstOngedaan, meldMeerwerk, maakOverdrachtOngedaan,
    verschuifOplevering, maakVerschuivingOngedaan,
  }
}
