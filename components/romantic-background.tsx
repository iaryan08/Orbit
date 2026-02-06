"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAtmosphereTheme, isDaytime } from "@/lib/utils";

interface RomanticBackgroundProps {
    initialImage?: string;
}

export function RomanticBackground({ initialImage }: RomanticBackgroundProps) {
    const [elements, setElements] = useState<{ id: string | number; type: "star" | "heart"; style: React.CSSProperties }[]>([]);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [theme, setTheme] = useState(getAtmosphereTheme());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Randomly select background image 1-4 on mount
        const randomId = Math.floor(Math.random() * 4) + 1;
        setBgImage(`/images/${randomId}.jpg`);

        const isDay = isDaytime();
        const isMobile = window.innerWidth < 768;

        // Balanced: Increased counts for atmosphere
        // Mobile: 18 (was 8), Desktop: 35 (was 15)
        const elementCount = isMobile ? 18 : 35;

        const newElements = Array.from({ length: elementCount }).map((_, i) => {
            const type = isDay ? "heart" : "star";
            const size = type === "heart" ? Math.random() * 10 + 6 : Math.random() * 3 + 2;
            const duration = Math.random() * 40 + 40; // Even slower (40-80s)
            const delay = Math.random() * -60;

            const starColors = ["#ffffff", "#fef3c7", "#f3a65aff"];
            const heartColors = ["#fda4af", "#fecdd3", "#fb7185"];

            return {
                id: `${isDay ? 'd' : 'n'}-${i}`,
                type: type as "star" | "heart",
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    opacity: Math.random() * 0.10 + 0.05, // reduced max opacity (0.05-0.15)
                    color: type === "heart"
                        ? heartColors[Math.floor(Math.random() * heartColors.length)]
                        : starColors[Math.floor(Math.random() * starColors.length)]
                },
            };
        });
        setElements(newElements);
        setTheme(getAtmosphereTheme());
    }, []);

    // Periodic theme sync
    useEffect(() => {
        const interval = setInterval(() => {
            const newTheme = getAtmosphereTheme();
            setTheme(newTheme);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-[100lvh] z-0 overflow-hidden pointer-events-none bg-black">
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
                                className="object-cover opacity-40 contrast-[1.05] saturate-[0.8]"
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
                                className="object-cover opacity-40 contrast-[1.05] saturate-[0.8]"
                                quality={85}
                                sizes="100vw"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Daytime/Nighttime Overlay Gradient (Subtle) */}
            <div
                className="absolute inset-0 transition-all duration-[3000ms] ease-in-out"
                style={{ background: theme.overlay }}
            />

            {/* Atmospheric Depth Orbs */}
            <div
                className="absolute top-[5%] left-[-5%] w-[70vh] h-[70vh] blur-[150px] rounded-full animate-pulse-slow mix-blend-overlay transition-colors duration-[3000ms]"
                style={{ backgroundColor: theme.orb1, opacity: 0.6 }}
            />
            <div
                className="absolute bottom-[5%] right-[-5%] w-[70vh] h-[70vh] blur-[150px] rounded-full animate-pulse-slow delay-1500 mix-blend-overlay transition-colors duration-[3000ms]"
                style={{ backgroundColor: theme.orb2, opacity: 0.6 }}
            />

            {/* Minimalist Floating Elements (Hearts or Stars) */}
            {elements.map((el) => (
                <div
                    key={el.id}
                    className="absolute animate-float"
                    style={{
                        ...el.style,
                        zIndex: 1
                    }}
                >
                    {el.type === "heart" ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    ) : (
                        <div className="w-full h-full bg-white rounded-full blur-[0.8px]" style={{ opacity: 0.8 }} />
                    )}
                </div>
            ))}

            {/* Cinematic Grain - Dramatically Reduced */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay z-[2]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>
    );
}
