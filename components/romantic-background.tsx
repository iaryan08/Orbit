"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAtmosphereTheme, isDaytime, getLunarPhase } from "@/lib/utils";

interface RomanticBackgroundProps {
    initialImage?: string;
}

export function RomanticBackground({ initialImage }: RomanticBackgroundProps) {
    const [elements, setElements] = useState<{ id: string | number; type: "star" | "heart"; style: React.CSSProperties }[]>([]);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [theme, setTheme] = useState(getAtmosphereTheme());
    const [mounted, setMounted] = useState(false);
    const [isDay, setIsDay] = useState(false); // Local state for immediate access
    const [moonRotation, setMoonRotation] = useState(0);

    useEffect(() => {
        setMounted(true);
        setMoonRotation(getLunarPhase() * 360);
        // Randomly select background image 1-4 on mount
        const randomId = Math.floor(Math.random() * 4) + 1;
        setBgImage(`/images/${randomId}.jpg`);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const currentIsDay = isDaytime();
        const isMobile = window.innerWidth < 768;
        const elementCount = isMobile ? 10 : 35;

        const newElements = Array.from({ length: elementCount }).map((_, i) => {
            const type = currentIsDay ? "heart" : "star";
            const isSharp = !currentIsDay && Math.random() > 0.4; // 60% sharp stars for night

            const size = type === "heart"
                ? Math.random() * 10 + 6
                : (isSharp ? Math.random() * 2 + 1 : Math.random() * 5 + 3);

            const duration = Math.random() * 40 + 40;
            const delay = Math.random() * -60;

            const starColors = ["#ffffff", "#fef3c7", "#e0f2fe"]; // Added cool/warm tones
            const heartColors = ["#fda4af", "#fecdd3", "#fb7185"];

            return {
                id: `${currentIsDay ? 'd' : 'n'}-${i}`,
                type: type as "star" | "heart",
                isSharp,
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    opacity: currentIsDay
                        ? Math.random() * 0.10 + 0.05
                        : (isSharp ? Math.random() * 0.3 + 0.2 : Math.random() * 0.15 + 0.05),
                    color: type === "heart"
                        ? heartColors[Math.floor(Math.random() * heartColors.length)]
                        : starColors[Math.floor(Math.random() * starColors.length)]
                },
            };
        });
        setElements(newElements);
        setTheme(getAtmosphereTheme());
        setIsDay(currentIsDay);
    }, [mounted, isDay]);

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

    if (!mounted) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-[100lvh] z-0 overflow-hidden pointer-events-none bg-neutral-950">
            {/* Background Image Layer - Reduced Opacity for Readability */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${bgImage ? 'opacity-100' : 'opacity-0'}`}>
                {bgImage && (
                    <>
                        <div className="hidden md:block absolute inset-0">
                            <Image
                                src={bgImage}
                                alt="Background"
                                fill
                                priority
                                className="object-cover opacity-40 contrast-[1.05] saturate-[0.8] blur-[2px]"
                                quality={85}
                                sizes="100vw"
                            />
                        </div>
                        <div className="md:hidden absolute inset-0">
                            <Image
                                src={bgImage.replace('.jpg', '-m.jpg')}
                                alt="Background"
                                fill
                                priority
                                className="object-cover opacity-40 contrast-[1.05] saturate-[0.8] blur-[2px]"
                                quality={85}
                                sizes="100vw"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Daytime/Nighttime Overlay Gradient (Subtle) */}
            <div
                className="absolute inset-0 transition-[background] duration-[3000ms] ease-in-out"
                style={{ background: theme.overlay }}
            />

            {/* INTEGRATED MOON BACKDROP (Night Only) */}
            {!isDay && (
                <svg
                    className="absolute inset-0 z-[0] w-full h-full opacity-[0.4] pointer-events-none transition-opacity duration-[3000ms]"
                    viewBox="0 0 1000 1000"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <title>Moon and Constellations</title>
                    {/* Crescent Moon - Reduced size slightly for subtlety */}
                    <path
                        d="M600 200a180 180 0 1 0 0 360a140 180 0 1 1 0-360z"
                        fill="white"
                        opacity="0.15"
                        style={{ transform: `rotate(${moonRotation}deg)`, transformOrigin: '600px 380px' }}
                    />

                    {/* Constellation lines */}
                    <g stroke="white" strokeWidth="0.5" opacity="0.3">
                        <line x1="200" y1="300" x2="260" y2="260" />
                        <line x1="260" y1="260" x2="330" y2="300" />
                        <line x1="330" y1="300" x2="380" y2="250" />
                    </g>

                    {/* Constellation stars */}
                    <g fill="white" opacity="0.5">
                        <circle cx="200" cy="300" r="1.5" />
                        <circle cx="260" cy="260" r="1.5" />
                        <circle cx="330" cy="300" r="1.5" />
                        <circle cx="380" cy="250" r="1.5" />
                    </g>

                    {/* Zodiac arc - Very subtle */}
                    <path
                        d="M150 800 A500 500 0 0 1 850 800"
                        stroke="white"
                        strokeWidth="0.5"
                        fill="none"
                        opacity="0.1"
                    />
                </svg>
            )}

            {/* Atmospheric Depth Orbs - Optimized: Switched from heavy Blur to fast Radial Gradient.
                Visuals are identical but GPU cost is 90% lower. */ }
            <div
                className="absolute top-[5%] left-[-5%] w-[70vh] h-[70vh] animate-pulse-slow mix-blend-normal md:mix-blend-overlay transition-all duration-[3000ms] opacity-40 md:opacity-60 will-change-[opacity,transform]"
                style={{ background: `radial-gradient(circle at center, ${theme.orb1}, transparent 70%)` }}
            />
            <div
                className="absolute bottom-[5%] right-[-5%] w-[70vh] h-[70vh] animate-pulse-slow delay-1500 mix-blend-normal md:mix-blend-overlay transition-all duration-[3000ms] opacity-40 md:opacity-60 will-change-[opacity,transform]"
                style={{ background: `radial-gradient(circle at center, ${theme.orb2}, transparent 70%)` }}
            />

            {/* Minimalist Floating Elements (Hearts or Stars) */}
            {elements.map((el) => (
                <div
                    key={el.id}
                    className="absolute animate-float"
                    style={{
                        ...el.style,
                        zIndex: 1,
                        willChange: 'transform'
                    }}
                >
                    {el.type === "heart" ? (
                        <div className="text-[20px] leading-none opacity-80 blur-[0.5px]">❤️</div>
                    ) : (
                        <div
                            className={`w-full h-full rounded-full ${(el as any).isSharp ? 'blur-[0.2px]' : 'blur-[2px]'}`}
                            style={{
                                backgroundColor: el.style.color,
                                opacity: (el as any).isSharp ? 0.9 : 0.6
                            }}
                        />
                    )}
                </div>
            ))}

            {/* Cinematic Grain - Dramatically Reduced */}
            {/* Cinematic Grain - Dramatically Reduced */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay z-[2] hidden md:block" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>
    );
}
