import { ref } from 'vue'

export interface Spuiter {
  naam: string
  bedrijf: string
  initials: string
}

const spuiter = ref<Spuiter>({
  naam: 'Thomas van Dijk',
  bedrijf: 'Spuiterij Van Dijk',
  initials: 'TD'
})

export function useAuth() {
  return { spuiter }
}
