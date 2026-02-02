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
