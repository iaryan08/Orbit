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
  Moon
} from 'lucide-react'
import { NotificationBell } from './notification-bell'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppMode } from './app-mode-context'
import { LunaraToggle } from './lunara-toggle'

interface DashboardHeaderProps {
  userName: string
  userAvatar?: string | null
  partnerName?: string | null
  daysTogetherCount?: number
  unreadCounts?: {
    memories: number
    letters: number
  }
}

export function DashboardHeader({
  userName,
  userAvatar,
  partnerName,
  daysTogetherCount,
  unreadCounts = { memories: 0, letters: 0 }
}: DashboardHeaderProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { mode } = useAppMode()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!mounted) {
    return null // Or a simpler skeleton to avoid layout shift, but null is safest for hydration
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Home' },
    { href: '/dashboard/letters', icon: Mail, label: 'Letters' },
    { href: '/dashboard/memories', icon: ImageIcon, label: 'Memories' },
    // { href: '/dashboard/games', icon: Gamepad2, label: 'Games' },
    { href: '/dashboard/intimacy', icon: Heart, label: 'Intimacy' },
  ]

  return (
    <>
      {/* 1. Logo (Top Left Floating) */}
      <div className={cn(
        "fixed top-6 left-6 z-50 hidden md:flex items-center gap-2 drop-shadow-xl transition-all duration-500",
        mode === 'moon' ? "text-amber-200/90 text-glow-gold" : "text-purple-200/90 shadow-[0_0_10px_rgba(168,85,247,0.3)]",
        scrolled ? "opacity-0 -translate-x-10 pointer-events-none" : "opacity-100 translate-x-0"
      )}>
        {mode === 'moon' ? (
          <>
            <Heart className="w-6 h-6 text-rose-300 animate-pulse-slow" fill="currentColor" />
            <span className="font-serif text-xl font-semibold tracking-wide">MoonBetweenUs</span>
          </>
        ) : (
          <>
            <Moon className="w-6 h-6 text-purple-300" fill="currentColor" />
            <span className="font-serif text-xl font-semibold tracking-wide">Lunara</span>
          </>
        )}
      </div>

      {/* 2. Days Counter (Absolute Top Center - Optional, or kept in profile) */}

      {/* 3. The Dock (Adaptive Positioning with Pop Animations) */}
      {mode !== 'lunara' && (
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
              "glass-card flex items-center gap-1 p-1.5 rounded-full border shadow-2xl ring-1 ring-white/5",
              mode === 'moon' ? "border-white/10" : "border-purple-500/30 bg-purple-950/40",
              "backdrop-blur-[12px] md:backdrop-blur-3xl bg-black/60", // 12px blur for mobile per request
              scrolled ? "md:flex-col md:rounded-[40px] md:py-4 md:px-2" : "md:flex-row md:rounded-full md:p-1.5"
            )}
          >
            <TooltipProvider delayDuration={0}>
              {/* Search/Dashboard aesthetic from reference */}
              {/* Search/Dashboard aesthetic from reference */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/dashboard/settings" className={cn(
                    "p-3 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors",
                    scrolled && "md:mb-2"
                  )}>
                    <Settings className="w-5 h-5 transition-colors" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side={scrolled ? "right" : "bottom"}
                  sideOffset={15}
                  className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl"
                >
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>

              <div className="flex items-center justify-center">
                <NotificationBell />
              </div>

              {/* Separator in Dock */}
              <div className={cn(
                "bg-white/10 transition-all duration-300",
                scrolled ? "md:w-6 md:h-px md:my-4 mx-0" : "md:w-px md:h-6 md:mx-2 my-0",
                "w-px h-6 mx-2" // Mobile default
              )} />

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

                          {/* Red Dot Notification */}
                          {item.label === 'Memories' && unreadCounts.memories > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] z-20" />
                          )}
                          {item.label === 'Letters' && unreadCounts.letters > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] z-20" />
                          )}
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
            </TooltipProvider>
          </nav>
        </div>
      )}

      {/* 4. Profile Dropdown & Mode Toggle (Top Right Floating) */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        {/* Lunara Mode Toggle Indicator */}
        <LunaraToggle />

        {partnerName && daysTogetherCount !== undefined && mode === 'moon' && (
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
