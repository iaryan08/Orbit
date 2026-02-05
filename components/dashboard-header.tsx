'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
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
  LayoutGrid,
  Mail,
  Image as ImageIcon,
  Moon,
  BookOpen
} from 'lucide-react'
import { NotificationBell } from './notification-bell'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)

  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { mode, activeLunaraTab, setActiveLunaraTab } = useAppMode()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Scrolled state for dock switching
      setScrolled(currentScrollY > 40)

      // Visibility logic (Hide on down, Show on up)
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      lastScrollYRef.current = currentScrollY
    }
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    handleResize()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  if (!mounted) {
    return null
  }

  // Mobile: Always show default dock (dock-top style effectively)
  // Desktop: Toggle between dock-top and dock-scrolled based on scrolled state
  const isDesktopScrolled = scrolled && !isMobile

  return (
    <>
      {/* 1. Logo (Top Left Floating) */}
      <motion.div
        className={cn(
          "fixed top-6 md:top-10 left-6 md:left-10 z-50 hidden md:flex items-center gap-2",
          mode === 'moon' ? "text-amber-100/90" : "text-purple-100/90"
        )}
        animate={{
          x: !isVisible ? -160 : (isDesktopScrolled ? -40 : 0),
          opacity: !isVisible || isDesktopScrolled ? 0 : 1,
          scale: !isVisible ? 0.9 : 1,
          pointerEvents: !isVisible || isDesktopScrolled ? 'none' : 'auto'
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 35
        }}
      >
        {mode === 'moon' ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Heart className="w-8 h-8 text-rose-400/80 animate-pulse-slow relative z-10" fill="currentColor" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-serif text-2xl font-light tracking-[0.05em]">
                Moon<span className="font-pinyon font-normal text-3xl lowercase mx-0.5 text-rose-300">between</span>Us
              </span>
              <span className="text-[7px] uppercase tracking-[0.5em] font-bold opacity-40 ml-1">Private Sanctuary</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Moon className="w-8 h-8 text-purple-300 relative z-10" fill="currentColor" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-serif text-2xl font-light tracking-[0.05em]">
                Lunara<span className="font-pinyon font-normal text-3xl lowercase mx-0.5 text-purple-300">sync</span>
              </span>
              <span className="text-[7px] uppercase tracking-[0.5em] font-bold opacity-40 ml-1">Cycle Rhythm</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* 3. The Dock (Adaptive Positioning with Pop Animations) */}
      {/* We use isDesktopScrolled to determine which dock to show. 
          On Mobile (isMobile=true), isDesktopScrolled will always be false, so standard dock shows always. 
      */}
      <AnimatePresence>
        {isDesktopScrolled ? (
          <motion.nav
            key="dock-scrolled"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onMouseLeave={() => setHoveredPath(null)}
            className={cn(
              "fixed z-50 flex items-center gap-1 border shadow-2xl backdrop-blur-md",
              "bottom-6 left-1/2 -translate-x-1/2", // Mobile / Default (Not used here mostly but fallback)
              "md:top-1/2 md:bottom-auto md:left-8 md:-translate-y-1/2 md:translate-x-0", // Desktop Scrolled specific
              "md:flex-col md:rounded-[40px] md:py-4 md:px-2",
              mode === 'moon' ? "border-white/10 bg-black/40" : "border-purple-500/20 bg-purple-950/40",
              "rounded-full p-1.5",
              "transition-[background-color,border-color,shadow] duration-300"
            )}
          >
            <TooltipProvider delayDuration={0}>
              <div className="flex items-center justify-center">
                <NotificationBell />
              </div>
              <div className={cn(
                "bg-white/10 transition-all duration-300",
                "md:w-6 md:h-px md:my-2 mx-0",
                "w-px h-6 mx-2"
              )} />
              {mode === 'moon' ? (
                [
                  { href: '/dashboard', icon: LayoutGrid, label: 'Home' },
                  { href: '/letters', icon: Mail, label: 'Letters' },
                  { href: '/memories', icon: ImageIcon, label: 'Memories' },
                  { href: '/intimacy', icon: Heart, label: 'Intimacy' },
                ].map((item) => {
                  const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard' && !hoveredPath) // Keep Home active if nothing else
                  const isHovered = hoveredPath === item.href
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link href={item.href} onMouseEnter={() => setHoveredPath(item.href)} className="relative block">
                          <div className={cn(
                            "p-3 rounded-full flex items-center justify-center relative group transition-all duration-300",
                            isActive ? "text-white" : "text-white/40 group-hover:text-white"
                          )}>
                            <AnimatePresence>
                              {(isActive || isHovered) && (
                                <motion.div
                                  layoutId="nav-indicator-scrolled"
                                  className="absolute inset-0 z-0 bg-white/10 border border-white/10 shadow-xl rounded-full px-4 md:rounded-[18px]"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                              )}
                            </AnimatePresence>
                            <item.icon className={cn("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", isActive && "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]")} />
                            {item.label === 'Memories' && unreadCounts.memories > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] z-20" />}
                            {item.label === 'Letters' && unreadCounts.letters > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] z-20" />}
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={15} className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })
              ) : (
                [
                  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
                  { id: 'insights', icon: BookOpen, label: 'Insights' },
                  { id: 'partner', icon: Heart, label: 'Partner' },
                ].map((item) => {
                  const isActive = activeLunaraTab === item.id && pathname === '/dashboard'
                  const isHovered = hoveredPath === item.id
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button onClick={() => { setActiveLunaraTab(item.id as any); if (pathname !== '/dashboard') router.push('/dashboard') }} onMouseEnter={() => setHoveredPath(item.id)} className="relative block cursor-pointer">
                          <div className={cn("p-3 rounded-full flex items-center justify-center relative group transition-all duration-300", isActive ? "text-purple-200" : "text-purple-300/40 group-hover:text-purple-200")}>
                            <AnimatePresence>
                              {(isActive || isHovered) && (
                                <motion.div layoutId="lunara-nav-indicator-scrolled" className="absolute inset-0 z-0 bg-purple-500/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] rounded-full px-4 md:rounded-[18px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                              )}
                            </AnimatePresence>
                            <item.icon className={cn("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", isActive && "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]")} />
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={15} className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })
              )}
              <div className={cn(
                "bg-white/10 transition-all duration-300",
                "md:w-6 md:h-px md:my-2 mx-0",
                "w-px h-6 mx-2"
              )} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/dashboard/settings" className={cn("p-3 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors", scrolled && "md:mb-0")}>
                    <Settings className="w-5 h-5 transition-colors" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={15} className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.nav>
        ) : (
          <motion.nav
            key="dock-top"
            initial={isMobile ? false : { y: -40, opacity: 0 }} // No animation on initial load for mobile
            animate={{ y: 0, opacity: 1 }}
            exit={isMobile ? undefined : { y: -20, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onMouseLeave={() => setHoveredPath(null)}
            className={cn(
              "fixed z-50 flex items-center gap-1 border shadow-2xl backdrop-blur-md",
              "bottom-6 left-1/2 -translate-x-1/2", // Mobile / Default
              "md:bottom-auto md:top-10 md:left-1/2 md:-translate-x-1/2", // Desktop Top
              "md:flex-row md:rounded-full md:p-1.5",
              mode === 'moon' ? "border-white/10 bg-black/40" : "border-purple-500/20 bg-purple-950/40",
              "rounded-full p-1.5", // Mobile fallback
              "transition-[background-color,border-color,shadow] duration-300" // No transition-all
            )}
          >
            <TooltipProvider delayDuration={0}>
              <div className="flex items-center justify-center">
                <NotificationBell />
              </div>
              <div className="bg-white/10 w-px h-6 mx-2" />
              {mode === 'moon' ? (
                [
                  { href: '/dashboard', icon: LayoutGrid, label: 'Home' },
                  { href: '/letters', icon: Mail, label: 'Letters' },
                  { href: '/memories', icon: ImageIcon, label: 'Memories' },
                  { href: '/intimacy', icon: Heart, label: 'Intimacy' },
                ].map((item) => {
                  const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard' && !hoveredPath) // Keep active logic consistent
                  const isHovered = hoveredPath === item.href
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link href={item.href} onMouseEnter={() => setHoveredPath(item.href)} className="relative block">
                          <div className={cn(
                            "p-3 rounded-full flex items-center justify-center relative group transition-all duration-300",
                            isActive ? "text-white" : "text-white/40 group-hover:text-white"
                          )}>
                            <AnimatePresence>
                              {(isActive || isHovered) && (
                                <motion.div
                                  layoutId="nav-indicator-top"
                                  className="absolute inset-0 z-0 bg-white/10 border border-white/10 shadow-xl rounded-full px-4"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                              )}
                            </AnimatePresence>
                            <item.icon className={cn("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", isActive && "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]")} />
                            {item.label === 'Memories' && unreadCounts.memories > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] z-20" />}
                            {item.label === 'Letters' && unreadCounts.letters > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] z-20" />}
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={15} className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })
              ) : (
                [
                  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
                  { id: 'insights', icon: BookOpen, label: 'Insights' },
                  { id: 'partner', icon: Heart, label: 'Partner' },
                ].map((item) => {
                  const isActive = activeLunaraTab === item.id && pathname === '/dashboard'
                  const isHovered = hoveredPath === item.id
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button onClick={() => { setActiveLunaraTab(item.id as any); if (pathname !== '/dashboard') router.push('/dashboard') }} onMouseEnter={() => setHoveredPath(item.id)} className="relative block cursor-pointer">
                          <div className={cn("p-3 rounded-full flex items-center justify-center relative group transition-all duration-300", isActive ? "text-purple-200" : "text-purple-300/40 group-hover:text-purple-200")}>
                            <AnimatePresence>
                              {(isActive || isHovered) && (
                                <motion.div layoutId="lunara-nav-indicator-top" className="absolute inset-0 z-0 bg-purple-500/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] rounded-full px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                              )}
                            </AnimatePresence>
                            <item.icon className={cn("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", isActive && "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]")} />
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={15} className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })
              )}
              <div className="bg-white/10 w-px h-6 mx-2" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/dashboard/settings" className="p-3 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <Settings className="w-5 h-5 transition-colors" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={15} className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* 4. Profile Dropdown & Mode Toggle (Top Right Floating) */}
      <motion.div
        className="fixed top-6 md:top-10 right-6 md:right-10 z-50 flex items-center gap-4"
        animate={{
          x: !isVisible ? 160 : 0,
          opacity: !isVisible ? 0 : 1,
          scale: !isVisible ? 0.9 : 1,
          pointerEvents: !isVisible ? 'none' : 'auto'
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 35
        }}
      >
        {/* Lunara Mode Toggle Indicator - ALWAYS VISIBLE TO PREVENT SHIFT */}
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
      </motion.div>
    </>
  )
}
