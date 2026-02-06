'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, Wind, Thermometer } from 'lucide-react'

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

        const fetchWeather = async () => {
            setLoading(true)
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
                const data = await res.json()
                if (data.current_weather) {
                    setWeather({
                        temp: Math.round(data.current_weather.temperature),
                        code: data.current_weather.weathercode
                    })
                }
            } catch (err) {
                console.error('Weather fetch error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchWeather()
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
        <div className="flex items-center gap-2 px-1 group">
            <span className="text-[11px] text-rose-100/50 uppercase tracking-[0.15em] font-bold">
                {city || 'Location'}
            </span>
            <span className="text-rose-100/20 mr-1">•</span>
            <div className="flex items-center gap-1.5">
                <div className="opacity-70">{getWeatherIcon(weather.code)}</div>
                <span className="text-[11px] font-bold text-rose-100/80 tabular-nums">
                    {weather.temp}°C
                </span>
            </div>
        </div>
    )
}
