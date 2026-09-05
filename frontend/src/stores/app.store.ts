import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface GeneralSettings {
  appName: string
  institution: string
  timezone: string
}

export interface DisplaySettings {
  defaultView: 'schedule' | 'requests' | 'usage' | string
  autoRefresh: boolean
  refreshInterval: string
  showAnnouncements: boolean
  showRoomStatus: boolean
}

export interface AppSettingsConfig {
  general: GeneralSettings
  display: DisplaySettings
}

export const SETTINGS_STORAGE_KEY = 'app_settings_config'

export const defaultGeneralSettings: GeneralSettings = {
  appName: 'LabDisplay',
  institution: 'FIK UPN Veteran Jakarta',
  timezone: 'Asia/Jakarta',
}

export const defaultDisplaySettings: DisplaySettings = {
  defaultView: 'schedule',
  autoRefresh: true,
  refreshInterval: '30',
  showAnnouncements: true,
  showRoomStatus: true,
}

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const sidebarCollapsed = ref(false)

  const generalSettings = ref<GeneralSettings>({ ...defaultGeneralSettings })
  const displaySettings = ref<DisplaySettings>({ ...defaultDisplaySettings })

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (saved) {
        const parsed: Partial<AppSettingsConfig> = JSON.parse(saved)
        if (parsed.general) {
          generalSettings.value = { ...defaultGeneralSettings, ...parsed.general }
        }
        if (parsed.display) {
          displaySettings.value = { ...defaultDisplaySettings, ...parsed.display }
        }
      }
    } catch {
      // fallback to defaults
    }
  }

  const saveSettings = (config: {
    general?: Partial<GeneralSettings>
    display?: Partial<DisplaySettings>
  }) => {
    if (config.general) {
      generalSettings.value = { ...generalSettings.value, ...config.general }
    }
    if (config.display) {
      displaySettings.value = { ...displaySettings.value, ...config.display }
    }

    const payload: AppSettingsConfig = {
      general: generalSettings.value,
      display: displaySettings.value,
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload))
  }

  const resetSettings = () => {
    generalSettings.value = { ...defaultGeneralSettings }
    displaySettings.value = { ...defaultDisplaySettings }
    localStorage.removeItem(SETTINGS_STORAGE_KEY)
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // Initialize settings on store creation
  loadSettings()

  return {
    loading,
    sidebarCollapsed,
    generalSettings,
    displaySettings,
    loadSettings,
    saveSettings,
    resetSettings,
    setLoading,
    toggleSidebar,
  }
})
