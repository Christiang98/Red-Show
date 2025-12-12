"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import { Menu, X, MessageSquare, Bell, User, HelpCircle } from "lucide-react"
import useSWR from "swr"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AppNavbar() {
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const { data: notificationsData } = useSWR(user ? `/api/notifications?userId=${user.id}` : null, fetcher, {
    refreshInterval: 30000,
  })

  const unreadCount = notificationsData?.notifications?.filter((n: any) => !n.read).length || 0

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    router.push("/")
    window.location.href = "/"
  }

  if (!user) return null

  const profileEditLink = user.role === "owner" ? "/profile/owner" : "/profile/artist"

  return (
    <nav className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition">
            <div className="w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold">R</span>
            </div>
            <span>Red Show</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="hover:text-secondary transition">
              Buscar
            </Link>
            <Link href="/bookings" className="hover:text-secondary transition">
              Contrataciones
            </Link>
            <Link href="/messaging" className="hover:text-secondary transition flex items-center gap-1">
              <MessageSquare size={18} />
              <span>Mensajes</span>
            </Link>
            <Link href="/notifications" className="hover:text-secondary transition relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <Link href="/support" className="hover:text-secondary transition flex items-center gap-1">
              <HelpCircle size={18} />
              <span>Soporte</span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 flex items-center gap-2">
                  <User size={18} />
                  <span>Perfil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/my-profile" className="cursor-pointer">
                    Ver Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={profileEditLink} className="cursor-pointer">
                    Editar Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/hirings" className="cursor-pointer">
                    Gestionar Contrataciones
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User dropdown */}
            <div className="border-l border-primary-foreground/30 pl-6">
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs opacity-75 capitalize">{user.role}</p>
                </div>
                <Button onClick={handleLogout} variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                  Salir
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-primary-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-3 border-t border-primary-foreground/30 pt-4">
            <Link href="/search" className="block text-sm hover:text-secondary transition py-2">
              Buscar
            </Link>
            <Link href="/bookings" className="block text-sm hover:text-secondary transition py-2">
              Contrataciones
            </Link>
            <Link href="/messaging" className="block text-sm hover:text-secondary transition py-2">
              Mensajes
            </Link>
            <Link
              href="/notifications"
              className="block text-sm hover:text-secondary transition py-2 flex items-center gap-2"
            >
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{unreadCount}</span>
              )}
            </Link>
            <Link href="/support" className="block text-sm hover:text-secondary transition py-2">
              Soporte Técnico
            </Link>
            <div className="border-t border-primary-foreground/20 pt-3 mt-3">
              <Link href="/my-profile" className="block text-sm hover:text-secondary transition py-2">
                Ver Mi Perfil
              </Link>
              <Link href={profileEditLink} className="block text-sm hover:text-secondary transition py-2">
                Editar Perfil
              </Link>
              <Link href="/hirings" className="block text-sm hover:text-secondary transition py-2">
                Gestionar Contrataciones
              </Link>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-primary-foreground justify-start mt-2"
            >
              Salir
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
