import { ref } from 'vue'

// Werkt de gebruiker met muis of trackpad (desktop) of met een vinger (telefoon,
// tablet)? Bepaalt alleen de copy — 'tik' of 'klik', 'foto maken' of 'foto
// toevoegen'. De layout regelt main.css zelf met media queries.
const query = typeof window !== 'undefined' ? window.matchMedia('(hover: hover) and (pointer: fine)') : null
const heeftMuis = ref(query?.matches ?? false)
query?.addEventListener('change', e => { heeftMuis.value = e.matches })

export function useMuis() {
  return { heeftMuis }
}
