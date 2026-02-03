"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface RomanticBackgroundProps {
    initialImage?: string;
}

export function RomanticBackground({ initialImage = "/images/1.jpg" }: RomanticBackgroundProps) {
    // Generate random positions for stars and hearts
    const [elements, setElements] = useState<{ id: number; type: "star" | "heart"; style: React.CSSProperties }[]>([]);
    const [bgImage, setBgImage] = useState<string | null>(null);

    useEffect(() => {
        // Randomly select background image 1-4 on mount
        const randomId = Math.floor(Math.random() * 4) + 1;
        setBgImage(`/images/${randomId}.jpg`);

        // Generate static hearts and stars
        const newElements = Array.from({ length: 30 }).map((_, i) => {
            const type = Math.random() > 0.6 ? "heart" : "star";
            const size = Math.random() * 20 + 10;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 10;

            return {
                id: i,
                type: type as "star" | "heart",
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    minHeight: `100%`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    opacity: Math.random() * 0.5 + 0.1,
                },
            };
        });
        setElements(newElements);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-[100lvh] z-0 overflow-hidden pointer-events-none bg-black">
            {/* Optimized Background Image */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${bgImage ? 'opacity-100' : 'opacity-0'}`}>
                {bgImage && (
                    <>
                        {/* Desktop variant */}
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
                        {/* Mobile variant */}
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

            {/* Dark overlay for readability and merging visual layers */}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(20, 16, 15, 0.2) 0%, rgba(45, 25, 42, 0.5) 100%)' }}
            />

            {/* Floating orbs for atmosphere */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-primary/30 blur-[100px] rounded-full animate-pulse-slow mix-blend-overlay" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-accent/30 blur-[100px] rounded-full animate-pulse-slow delay-1000 mix-blend-overlay" />

            {/* Animated Elements */}
            {elements.map((el) => (
                <div
                    key={el.id}
                    className={`absolute animate-float ${el.type === "heart" ? "text-primary/60" : "text-yellow-200/60"}`}
                    style={el.style}
                >
                    {el.type === "heart" ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-lg">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-md">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    )}
                </div>
            ))}

            {/* Grain texture for premium feel */}
            <div className="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/gray-floral.png')] mix-blend-overlay"></div>
        </div>
    );
}
