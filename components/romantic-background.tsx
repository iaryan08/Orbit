"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAtmosphereTheme, isDaytime } from "@/lib/utils";

interface RomanticBackgroundProps {
    initialImage?: string;
}

export function RomanticBackground({ initialImage = "/images/1.jpg" }: RomanticBackgroundProps) {
    const [elements, setElements] = useState<{ id: number; type: "star" | "heart"; style: React.CSSProperties }[]>([]);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [theme, setTheme] = useState(getAtmosphereTheme());

    useEffect(() => {
        // Randomly select background image 1-4 on mount
        const randomId = Math.floor(Math.random() * 4) + 1;
        setBgImage(`/images/${randomId}.jpg`);

        const isDay = isDaytime();
        const isMobile = window.innerWidth < 768;
        const elementCount = isMobile ? 50 : 80;

        // Generate static hearts and stars based on daytime
        const newElements = Array.from({ length: elementCount }).map((_, i) => {
            const type = isDay ? (Math.random() > 0.1 ? "heart" : "star") : "star";
            const size = type === "heart" ? Math.random() * 14 + 8 : Math.random() * 8 + 2;
            const duration = Math.random() * 20 + 20;
            const delay = Math.random() * -30;

            const starColors = ["#fef3c7", "#fff9db", "#ffffff", "#f3a65aff"];
            const heartColors = ["#fda4af", "#fecdd3", "#fff1f2", "#de1867ff", "#cf638eff"];

            return {
                id: i,
                type: type as "star" | "heart",
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    opacity: Math.random() * (isDay ? 0.35 : 0.25) + 0.15,
                    color: type === "heart"
                        ? heartColors[Math.floor(Math.random() * heartColors.length)]
                        : starColors[Math.floor(Math.random() * starColors.length)]
                },
            };
        });
        setElements(newElements);
        setTheme(getAtmosphereTheme());
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setTheme(getAtmosphereTheme()), 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-[100lvh] z-0 overflow-hidden pointer-events-none bg-black">
            {/* Optimized Background Image */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${bgImage ? 'opacity-100' : 'opacity-0'}`}>
                {bgImage && (
                    <>
                        <div className="hidden md:block absolute inset-0">
                            <Image
                                src={bgImage}
                                alt="Background"
                                fill
                                priority
                                className="object-cover opacity-80"
                                quality={85}
                                sizes="(min-width: 768px) 100vw, 0px"
                            />
                        </div>
                        <div className="md:hidden absolute inset-0">
                            <Image
                                src={bgImage.replace('.jpg', '-m.jpg')}
                                alt="Background"
                                fill
                                priority
                                className="object-cover opacity-80"
                                quality={85}
                                sizes="(max-width: 767px) 100vw, 0px"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Daytime/Nighttime Overlay Gradient */}
            <div
                className="absolute inset-0 transition-all duration-[3000ms] ease-in-out"
                style={{ background: theme.overlay }}
            />

            {/* Dynamic Atmospheric Orbs */}
            <div
                className="absolute top-[-10%] left-[-10%] w-[60vh] h-[60vh] blur-[120px] rounded-full animate-pulse-slow mix-blend-overlay transition-colors duration-[3000ms] ease-in-out"
                style={{ backgroundColor: theme.orb1 }}
            />
            <div
                className="absolute bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] blur-[120px] rounded-full animate-pulse-slow delay-1000 mix-blend-overlay transition-colors duration-[3000ms] ease-in-out"
                style={{ backgroundColor: theme.orb2 }}
            />

            {/* Floating Hearts/Stars */}
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
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_8px_rgba(253,164,175,0.4)]">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    )}
                </div>
            ))}

            <div className="absolute inset-0 opacity-[0.25] pointer-events-none mix-blend-overlay z-[2] brightness-150 contrast-150" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>
    );
}
