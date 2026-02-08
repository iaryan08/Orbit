import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))

}

export function getTodayIST() {
  // Returns YYYY-MM-DD in IST
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export function getISTDate() {
  // Returns a Date object adjusted to IST time
  const now = new Date()
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
}

export function isDaytime() {
  const now = getISTDate()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const totalMinutes = hours * 60 + minutes

  const start = 5 * 60; // 5:00 AM
  const end = 18 * 60 + 30; // 6:30 PM

  return totalMinutes >= start && totalMinutes < end
}

export function getAtmosphereTheme() {
  const isDay = isDaytime()

  if (isDay) {
    return {
      overlay: 'linear-gradient(135deg, rgba(255, 182, 193, 0.15) 0%, rgba(20, 16, 15, 0.4) 100%)', // Soft Rose Day
      accent: 'rose-400',
      orb1: 'rgba(251, 113, 133, 0.15)', // Rose
      orb2: 'rgba(251, 191, 36, 0.1)',   // Amber
      mode: 'day' as const
    }
  }

  return {
    overlay: 'linear-gradient(135deg, rgba(20, 16, 15, 0.3) 0%, rgba(45, 25, 42, 0.6) 100%)', // Deep Night
    accent: 'purple-400',
    orb1: 'rgba(168, 85, 247, 0.1)',  // Purple
    orb2: 'rgba(219, 39, 119, 0.08)',   // Pinkish Purple
    mode: 'night' as const
  }
}
export function getLunarPhase() {
  const now = getISTDate()
  const lp = 2551443;
  const newMoon = new Date('1970-01-07T20:35:00Z').getTime() / 1000;
  const phase = ((now.getTime() / 1000) - newMoon) % lp;
  return phase / lp; // Returns 0.0 to 1.0
}
