// Thumbnail per dienst: koppelt de dienstnaam aan een product-illustratie.
// Gedeeld door OrderCard (dashboard) en OrderDetail, zodat kaart en detail
// dezelfde afbeelding tonen.
import keukenImg      from '@/images/Keuken.svg'
import binnendeurImg  from '@/images/binnendeur.svg'
import buffetkastImg  from '@/images/buffetkast.svg'
import trapleuningImg from '@/images/trapleuning.svg'
import radiatorImg    from '@/images/badkamerradiator.svg'

export function dienstImage(naam: string): string {
  const n = naam.toLowerCase()
  if (n.includes('trapleuning') || n.includes('trap') || n.includes('spijl')) return trapleuningImg
  if (n.includes('buffetkast'))                          return buffetkastImg
  if (n.includes('keuken') || n.includes('ladefront'))   return keukenImg
  if (n.includes('binnendeur') || n.includes('deur'))    return binnendeurImg
  if (n.includes('radiator'))                            return radiatorImg
  if (n.includes('kast'))                                return buffetkastImg
  return buffetkastImg
}
