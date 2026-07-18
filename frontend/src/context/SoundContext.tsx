import { createContext, useContext, useState } from 'react'
import type { SoundSettings } from '../types/interface'
import { DEFAULT_SOUND } from '../types/interface'

type SoundContextType = {
  soundSettings: SoundSettings
  setSoundSettings: (s: SoundSettings) => void
}

const SoundContext = createContext<SoundContextType>({
  soundSettings: DEFAULT_SOUND,
  setSoundSettings: () => {},
})

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(DEFAULT_SOUND)
  return (
    <SoundContext.Provider value={{ soundSettings, setSoundSettings }}>
      {children}
    </SoundContext.Provider>
  )
}

export const useSoundSettings = () => useContext(SoundContext)
