
"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Palette } from "lucide-react";
import { Badge } from "./ui/badge";
import { motion } from 'framer-motion';

export default function AuthorCardArchita() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
        >
            <Card className="bg-gradient-to-br from-slate-50 to-purple-100 border-purple-200 shadow-lg shadow-purple-500/10 text-slate-800">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
                    <Image
                        src="/archita/archuu.jpeg"
                        alt="Archita Saxena"
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-purple-300 shrink-0"
                    />
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                             <Palette className="h-5 w-5 text-purple-600" />
                             <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Featured Designer</h3>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mt-1">Archita Saxena</h2>
                        <p className="text-slate-600 mt-1">Samrat Ashok Technological Institute | Graphic Designer</p>
                        <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                            <Badge variant="secondary" className="bg-purple-200 text-purple-800">Figma</Badge>
                            <Badge variant="secondary" className="bg-pink-200 text-pink-800">Photoshop</Badge>
                            <Badge variant="secondary" className="bg-orange-200 text-orange-800">Illustrator</Badge>
                        </div>
                    </div>
                    <Button asChild className="mt-4 sm:mt-0 bg-purple-600 text-white hover:bg-purple-700 shrink-0">
                        <Link href="/archita-saxena">
                            View Portfolio <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
}
