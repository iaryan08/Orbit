'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun } from 'lucide-react'
import { fetchWeather } from '@/lib/actions/weather'

interface WeatherBadgeProps {
    lat?: number | null;
    lon?: number | null;
    city?: string | null;
}

export function WeatherBadge({ lat, lon, city }: WeatherBadgeProps) {
    const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!lat || !lon) return

        const getWeatherData = async () => {
            setLoading(true)
            const data = await fetchWeather(lat, lon)
            if (data) {
                setWeather(data)
            }
            setLoading(false)
        }

        getWeatherData()
    }, [lat, lon])

    if (!lat || !lon || !weather) return null

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun className="w-3 h-3 text-amber-400" />
        if (code <= 3) return <Cloud className="w-3 h-3 text-slate-300" />
        if (code <= 48) return <CloudFog className="w-3 h-3 text-slate-400" />
        if (code <= 57) return <CloudDrizzle className="w-3 h-3 text-blue-300" />
        if (code <= 67) return <CloudRain className="w-3 h-3 text-blue-400" />
        if (code <= 77) return <CloudSnow className="w-3 h-3 text-white" />
        if (code <= 82) return <CloudRain className="w-3 h-3 text-blue-500" />
        if (code <= 99) return <CloudLightning className="w-3 h-3 text-purple-400" />
        return <Sun className="w-3 h-3 text-amber-400" />
    }

    return (
        <div className="flex items-center gap-1.5 px-1 py-0.5 group bg-black/10 rounded-full border border-white/5 backdrop-blur-sm">
            <span className="text-[10px] md:text-[11px] text-rose-100/60 uppercase tracking-[0.15em] font-bold pl-2 max-w-[120px] md:max-w-[200px] truncate">
                {city || 'Location'}
            </span>
            <span className="text-rose-100/20">•</span>
            <div className="flex items-center gap-1.5 pr-2">
                <div className="opacity-70 scale-90">{getWeatherIcon(weather.code)}</div>
                <span className="text-[10px] md:text-[11px] font-bold text-rose-100/80 tabular-nums">
                    {weather.temp}°C
                </span>
            </div>
        </div>
    )
}
