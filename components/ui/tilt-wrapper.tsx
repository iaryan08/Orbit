"use client";

import React, { useEffect, useRef } from "react";
import VanillaTilt from "vanilla-tilt";

interface TiltWrapperProps {
    children: React.ReactNode;
    className?: string;
    options?: any;
}

export function TiltWrapper({ children, className, options }: TiltWrapperProps) {
    const tiltRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const defaultOptions = {
            max: 5,
            speed: 400,
            glare: true,
            "max-glare": 0.1,
            perspective: 1000,
            scale: 1.01,
            ...options,
        };

        if (tiltRef.current) {
            VanillaTilt.init(tiltRef.current, defaultOptions);
        }

        return () => {
            if (tiltRef.current && (tiltRef.current as any).vanillaTilt) {
                (tiltRef.current as any).vanillaTilt.destroy();
            }
        };
    }, [options]);

    return (
        <div ref={tiltRef} className={className}>
            {children}
        </div>
    );
}
