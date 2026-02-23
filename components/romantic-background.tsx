"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { getAtmosphereTheme, isDaytime, getLunarPhase, cn } from "@/lib/utils";
import { useBatteryOptimization } from "@/hooks/use-battery-optimization";
import { getCustomWallpaper, setCustomWallpaper, clearCustomWallpaper } from "@/lib/idb";
import { createClient } from "@/lib/supabase/client";

interface RomanticBackgroundProps {
    initialImage?: string;
}

export function RomanticBackground({ initialImage }: RomanticBackgroundProps) {
    const { isVisible } = useBatteryOptimization();
    const [bgImage, setBgImage] = useState<string | null>(initialImage || `/images/1.webp`);
    const [theme, setTheme] = useState(getAtmosphereTheme());
    const [mounted, setMounted] = useState(false);
    const [ready, setReady] = useState(false); // New: Delayed ready state
    const [isDay, setIsDay] = useState(false); // Local state for immediate access
    const [moonRotation, setMoonRotation] = useState(0);
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        setMounted(true);
        setMoonRotation(getLunarPhase() * 360);

        // Instantly load custom wallpaper if present
        getCustomWallpaper().then((localWallpaper) => {
            if (localWallpaper) {
                setBgImage(localWallpaper);
                setIsCustom(true);
            }
            // Show immediately to prioritize LCP and SI
            setTimeout(() => setReady(true), localWallpaper ? 50 : 50);

            // Sync with Supabase (Stale-while-revalidate pattern)
            const isExplicitlyDeleted = localStorage.getItem('orbit_deleted_wallpaper') === 'true';
            if (isExplicitlyDeleted) return;

            const runSync = async () => {
                const now = Date.now();
                const lastSyncRaw = localStorage.getItem('orbit_wallpaper_last_sync_at');
                const lastSync = lastSyncRaw ? Number(lastSyncRaw) : 0;
                const twelveHours = 12 * 60 * 60 * 1000;
                const shouldSync = !localWallpaper || !Number.isFinite(lastSync) || now - lastSync > twelveHours;
                if (!shouldSync) return;

                const supabase = createClient();
                const authRes: any = await supabase.auth.getUser();
                const user = authRes?.data?.user;
                if (!user) return;

                const { data: { publicUrl } } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(`${user.id}-wallpaper.webp`);

                const fetchUrl = publicUrl;
                const headRes = await fetch(fetchUrl, { method: "HEAD", cache: "default" }).catch(() => null);
                if (!headRes) return;

                if (headRes.ok && headRes.headers.get("content-type")?.includes("image")) {
                    const fileSize = headRes.headers.get("content-length") || "";
                    const lastMod = headRes.headers.get("last-modified") || headRes.headers.get("etag") || "";
                    const imgMeta = `${fileSize}-${lastMod}`;
                    const cachedMeta = localStorage.getItem("orbit_wallpaper_meta");

                    if (localWallpaper && cachedMeta === imgMeta && imgMeta !== "-") {
                        localStorage.setItem('orbit_wallpaper_last_sync_at', String(now));
                        return;
                    }

                    const imgRes = await fetch(fetchUrl, { cache: "force-cache" }).catch(() => null);
                    if (!imgRes) return;
                    const blob = await imgRes.blob();
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64 = reader.result as string;
                        if (base64 && base64 !== localWallpaper && base64.length > 100) {
                            setBgImage(base64);
                            setIsCustom(true);
                            setCustomWallpaper(base64);
                            if (imgMeta !== "-") {
                                localStorage.setItem("orbit_wallpaper_meta", imgMeta);
                            }
                            localStorage.setItem('orbit_wallpaper_last_sync_at', String(now));
                        }
                    };
                    reader.readAsDataURL(blob);
                } else if (headRes.status === 400 || headRes.status === 404 || headRes.status === 403) {
                    if (localWallpaper) {
                        clearCustomWallpaper();
                        localStorage.removeItem("orbit_wallpaper_meta");
                        localStorage.setItem('orbit_wallpaper_last_sync_at', String(now));
                        setIsCustom(false);
                        setBgImage(initialImage || `/images/1.webp`);
                    }
                }
            };

            const idle = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
            if (idle) {
                idle(() => { void runSync(); }, { timeout: 20000 });
            } else {
                setTimeout(() => { void runSync(); }, 15000);
            }
        });
    }, []);

    // Stable seed for elements to prevent layout shifts and regeneration
    const elements = useMemo(() => {
        // Reduced count for better performance, no window.innerWidth dependency
        const count = 20;
        const starColors = ["#ffffff", "#fef3c7", "#e0f2fe"];
        const heartColors = ["#fda4af", "#fecdd3", "#fb7185"];

        return Array.from({ length: count }).map((_, i) => {
            const isSharp = Math.random() > 0.4;
            const size = Math.random() * 10 + 6;
            const duration = Math.random() * 40 + 40;
            const delay = Math.random() * -60;

            return {
                id: i,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                isSharp,
                opacityBase: Math.random(),
                colorIndex: Math.floor(Math.random() * 3),
                starColors,
                heartColors
            };
        });
    }, []);

    useEffect(() => {
        if (!mounted) return;
        setIsDay(isDaytime());
        setTheme(getAtmosphereTheme());
    }, [mounted]);

    // Periodic theme sync (every minute)
    useEffect(() => {
        const interval = setInterval(() => {
            const newIsDay = isDaytime();
            if (newIsDay !== isDay) {
                setIsDay(newIsDay);
                setTheme(getAtmosphereTheme());
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [isDay]);

    return (
        <div className="fixed top-0 left-0 w-full h-[100lvh] z-0 overflow-hidden pointer-events-none bg-neutral-950">
            {/* Background Image Layer - Rendered Immediately for LCP */}
            <div className="absolute inset-0">
                {bgImage && isCustom ? (
                    <img
                        src={bgImage}
                        alt="Custom Atmosphere"
                        className="w-full h-full object-cover opacity-[0.85] contrast-[1.05]"
                    />
                ) : bgImage && (
                    <>
                        {/* Desktop Background */}
                        <div className="hidden md:block absolute inset-0">
                            <Image
                                src={bgImage}
                                alt="Background"
                                fill
                                sizes="100vw"
                                quality={55}
                                priority
                                className="object-cover opacity-40 contrast-[1.05] saturate-[0.8]"
                            />
                            <div className="absolute inset-0 backdrop-blur-[2px]" />
                        </div>
                        {/* Mobile Background */}
                        <div className="md:hidden absolute inset-0">
                            <Image
                                src={bgImage.replace('.webp', '-m.webp')}
                                alt="Background"
                                fill
                                sizes="100vw"
                                quality={50}
                                priority
                                className="object-cover opacity-40 contrast-[1.05] saturate-[0.8]"
                            />
                            <div className="absolute inset-0 backdrop-blur-[2px]" />
                        </div>
                    </>
                )}
            </div>

            {/* Progressive Background Overlay - Instant Render */}
            <div
                className="absolute inset-0 z-[1] opacity-100"
                style={{ background: isCustom ? "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)" : theme.overlay }}
            />

            {/* INTEGRATED MOON BACKDROP (Night Only) */}
            {mounted && ready && !isDay && !isCustom && (
                <svg
                    className="absolute inset-0 z-[0] w-full h-full opacity-[0.4] pointer-events-none transition-opacity duration-[3000ms]"
                    viewBox="0 0 1000 1000"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <title>Moon and Constellations</title>
                    <path
                        d="M600 200a180 180 0 1 0 0 360a140 180 0 1 1 0-360z"
                        fill="white"
                        opacity="0.15"
                        style={{ transform: `rotate(${moonRotation}deg)`, transformOrigin: '600px 380px' }}
                    />
                    <g stroke="white" strokeWidth="0.5" opacity="0.3">
                        <line x1="200" y1="300" x2="260" y2="260" />
                        <line x1="260" y1="260" x2="330" y2="300" />
                        <line x1="330" y1="300" x2="380" y2="250" />
                    </g>
                    <g fill="white" opacity="0.5">
                        <circle cx="200" cy="300" r="1.5" />
                        <circle cx="260" cy="260" r="1.5" />
                        <circle cx="330" cy="300" r="1.5" />
                        <circle cx="380" cy="250" r="1.5" />
                    </g>
                    <path
                        d="M150 800 A500 500 0 0 1 850 800"
                        stroke="white"
                        strokeWidth="0.5"
                        fill="none"
                        opacity="0.1"
                    />
                </svg>
            )}

            {/* Atmospheric Depth Orbs */}
            {!isCustom && (
                <>
                    <div
                        className="absolute top-[5%] left-[-5%] w-[70vh] h-[70vh] mix-blend-normal md:mix-blend-overlay transition-all duration-[3000ms] opacity-30 md:opacity-50"
                        style={{ background: `radial-gradient(circle at center, ${theme.orb1}, transparent 70%)` }}
                    />
                    <div
                        className="absolute bottom-[5%] right-[-5%] w-[70vh] h-[70vh] mix-blend-normal md:mix-blend-overlay transition-all duration-[3000ms] opacity-30 md:opacity-50"
                        style={{ background: `radial-gradient(circle at center, ${theme.orb2}, transparent 70%)` }}
                    />
                </>
            )}

            {/* Minimalist Floating Elements (Hearts or Stars) */}
            {mounted && ready && isVisible && !isCustom && elements.map((el) => (
                <div
                    key={el.id}
                    className={cn(
                        "absolute transition-opacity duration-1000",
                        // Hide half on mobile via CSS to save battery/performance without JS listeners
                        el.id % 2 === 1 ? "hidden md:block" : "block"
                    )}
                    style={{
                        left: el.left,
                        top: el.top,
                        width: el.width,
                        height: el.height,
                        animationDuration: el.animationDuration,
                        animationDelay: el.animationDelay,
                        opacity: isDay
                            ? el.opacityBase * 0.10 + 0.05
                            : (el.isSharp ? el.opacityBase * 0.3 + 0.2 : el.opacityBase * 0.15 + 0.05),
                        zIndex: 1,
                        willChange: 'transform'
                    }}
                >
                    {isDay ? (
                        <div className="text-[20px] leading-none opacity-80 blur-[0.5px]">❤️</div>
                    ) : (
                        <div
                            className={cn(
                                "w-full h-full rounded-full",
                                el.isSharp ? "blur-[0.2px]" : "blur-[2px]"
                            )}
                            style={{
                                backgroundColor: el.starColors[el.colorIndex],
                                opacity: el.isSharp ? 0.9 : 0.6
                            }}
                        />
                    )}
                </div>
            ))}

            {/* Cinematic Grain */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay z-[2] hidden md:block" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>
    );
}
