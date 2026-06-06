import { computed, ref } from 'vue'

const STORAGE_KEY = 'smart-mom-theme'
const defaultTheme = 'dark'

export const theme = ref(readTheme())
export const isLightTheme = computed(() => theme.value === 'light')

export function initTheme() {
  applyTheme(theme.value)
}

export function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  applyTheme(theme.value)
}

function readTheme() {
  if (typeof window === 'undefined') {
    return defaultTheme
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)

  if (saved === 'light' || saved === 'dark') {
    return saved
  }

  return defaultTheme
}

function applyTheme(value) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = value
  document.documentElement.style.colorScheme = value
  window.localStorage.setItem(STORAGE_KEY, value)
}
