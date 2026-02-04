
"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { Badge } from "./ui/badge";
import { motion } from 'framer-motion';


export default function AuthorCard() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
        >
            <Card className="bg-gradient-to-br from-card to-green-950/20 border-green-900/30 shadow-lg shadow-green-950/20">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
                    <Image
                        src="/aryan-photo.jpg"
                        alt="Aryan Mehra"
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-green-800/50 shrink-0"
                    />
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                             <Star className="h-5 w-5 text-green-500" />
                             <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Featured Author</h3>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mt-1">Aryan Mehra</h2>
                        <p className="text-muted-foreground mt-1">IIT Roorkee | Full-Stack Developer | AI Enthusiast</p>
                        <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                            <Badge variant="secondary">React</Badge>
                            <Badge variant="secondary">Next.js</Badge>
                            <Badge variant="secondary">Python</Badge>
                            <Badge variant="secondary">AI/ML</Badge>
                        </div>
                    </div>
                    <Button asChild className="mt-4 sm:mt-0 bg-green-700 text-green-50 hover:bg-green-600 shrink-0">
                        <Link href="/aryan-mehra">
                            View Portfolio <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
}
