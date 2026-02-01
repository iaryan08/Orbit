'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { signOut } from '@/lib/actions/auth'
import {
  Heart,
  LogOut,
  Settings,
  User,
  LayoutGrid,
  Mail,
  Image as ImageIcon,
  Gamepad2,
  Bell
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  userName: string
  userAvatar?: string | null
  partnerName?: string | null
  daysTogetherCount?: number
}

export function DashboardHeader({
  userName,
  userAvatar,
  partnerName,
  daysTogetherCount
}: DashboardHeaderProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Home' },
    { href: '/dashboard/letters', icon: Mail, label: 'Letters' },
    { href: '/dashboard/memories', icon: ImageIcon, label: 'Memories' },
    { href: '/dashboard/games', icon: Gamepad2, label: 'Games' },
  ]

  return (
    <>
      {/* 1. Logo (Top Left Floating) */}
      <div className={cn(
        "fixed top-6 left-6 z-50 hidden md:flex items-center gap-2 text-amber-200/90 drop-shadow-xl text-glow-gold transition-all duration-500",
        scrolled ? "opacity-0 -translate-x-10 pointer-events-none" : "opacity-100 translate-x-0"
      )}>
        <Heart className="w-6 h-6 text-rose-300 animate-pulse-slow" fill="currentColor" />
        <span className="font-serif text-xl font-semibold tracking-wide">MoonBetweenUs</span>
      </div>

      {/* 2. Days Counter (Absolute Top Center - Optional, or kept in profile) */}

      {/* 3. The Dock (Adaptive Positioning with Pop Animations) */}
      <div
        key={scrolled ? 'vertical' : 'horizontal'}
        className={cn(
          "fixed z-50",
          // Base animation: pop in
          "animate-in fade-in duration-300",
          // Mobile: always bottom-center, pop from bottom
          "bottom-6 left-1/2 -translate-x-1/2 slide-in-from-bottom-4",
          // Desktop Switch
          scrolled
            ? "md:top-1/2 md:bottom-auto md:left-6 md:-translate-y-1/2 md:translate-x-0 md:slide-in-from-left-4"
            : "md:bottom-auto md:top-6 md:left-1/2 md:-translate-x-1/2 md:slide-in-from-bottom-4"
        )}
      >
        <nav
          onMouseLeave={() => setHoveredPath(null)}
          className={cn(
            "glass-card flex items-center gap-1 p-1.5 rounded-full border border-white/10 shadow-2xl ring-1 ring-white/5",
            "backdrop-blur-3xl bg-black/60", // Increased blur and darkness for mobile
            scrolled ? "md:flex-col md:rounded-[40px] md:py-4 md:px-2" : "md:flex-row md:rounded-full md:p-1.5"
          )}
        >
          <TooltipProvider delayDuration={0}>
            {/* Search/Dashboard aesthetic from reference */}
            <div className={cn(
              "p-3 text-white/40 hover:text-white/60 cursor-not-allowed",
              scrolled && "md:mb-2"
            )}>
              <Settings className="w-5 h-5 transition-colors" />
            </div>

            {navItems.map((item) => {
              const isActive = pathname === item.href
              const isHovered = hoveredPath === item.href

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setHoveredPath(item.href)}
                      className="relative block"
                    >
                      <div className={cn(
                        "p-3 rounded-full flex items-center justify-center relative group transition-all duration-300",
                        isActive ? "text-white" : "text-white/40 group-hover:text-white"
                      )}>
                        {/* Smooth Sliding Pill Indicator */}
                        <AnimatePresence>
                          {(isActive || isHovered) && (
                            <motion.div
                              layoutId="nav-indicator"
                              className={cn(
                                "absolute inset-0 z-0 bg-white/10 border border-white/10 shadow-xl rounded-full px-4",
                                scrolled ? "md:rounded-[18px]" : "md:rounded-full"
                              )}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{
                                type: "spring",
                                bounce: 0.25,
                                stiffness: 130,
                                damping: 18,
                              }}
                            />
                          )}
                        </AnimatePresence>

                        <item.icon className={cn(
                          "w-5 h-5 relative z-10 transition-transform group-hover:scale-110",
                          isActive && "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                        )} />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side={scrolled ? "right" : "bottom"}
                    sideOffset={15}
                    className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl"
                  >
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}

            {/* Separator in Dock */}
            <div className={cn(
              "bg-white/10 transition-all duration-300",
              scrolled ? "md:w-6 md:h-px md:my-4 mx-0" : "md:w-px md:h-6 md:mx-2 my-0",
              "w-px h-6 mx-2" // Mobile default
            )} />

            {/* Settings / Notifications placeholder */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-white/40 hover:text-white hover:bg-white/5 w-10 h-10 group relative">
                  <Bell className="w-5 h-5 relative z-10 transition-transform group-hover:scale-110" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side={scrolled ? "right" : "bottom"}
                sideOffset={15}
                className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl"
              >
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>

          </TooltipProvider>
        </nav>
      </div>

      {/* 4. Profile Dropdown (Top Right Floating) */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        {partnerName && daysTogetherCount !== undefined && (
          <div className="hidden lg:flex flex-col items-end mr-2 text-white/90 drop-shadow-sm">
            <span className="text-xs font-light uppercase tracking-widest opacity-80">Together</span>
            <span className="text-sm font-semibold">{daysTogetherCount} Days</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0 border-2 border-white/10 shadow-lg hover:scale-105 transition-transform">
              <Avatar className="h-full w-full">
                <AvatarImage src={userAvatar || undefined} alt={userName} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {userName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glass-card border-white/10 backdrop-blur-xl text-white rounded-2xl mr-4 mt-2" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-lg">{userName}</p>
                {partnerName && (
                  <p className="text-xs text-white/60 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-primary" fill="currentColor" />
                    with {partnerName}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer">
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer">
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="cursor-pointer text-red-300 focus:text-red-200 focus:bg-red-500/10 rounded-xl"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
