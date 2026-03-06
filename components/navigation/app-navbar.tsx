"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import { Menu, X, MessageSquare, Bell, User, HelpCircle, Shield, Search, Calendar, LogOut, Ticket } from "lucide-react"
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
  const isAdmin = user.role === "admin"

  return (
    <nav className="bg-[#FFFCF2]/95 backdrop-blur-md border-b border-primary/10 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <img 
              src="/logo-redshow.png" 
              alt="Red Show" 
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <Link 
              href="/search" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
            >
              <Search size={18} />
              <span>Buscar</span>
            </Link>
            <Link 
              href="/bookings" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
            >
              <Calendar size={18} />
              <span>Contrataciones</span>
            </Link>
            <Link 
              href="/events" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
            >
              <Ticket size={18} />
              <span>Eventos</span>
            </Link>
            <Link 
              href="/messaging" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
            >
              <MessageSquare size={18} />
              <span>Mensajes</span>
            </Link>
            
            <Link 
              href="/notifications" 
              className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <Link 
              href="/support" 
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              title="Soporte"
            >
              <HelpCircle size={20} />
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition font-medium"
              >
                <Shield size={18} />
                <span>Admin</span>
              </Link>
            )}

            <div className="w-px h-8 bg-gray-200 mx-2" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:bg-gray-100">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-gray-700">
                      {user.firstName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role === "owner" ? "Dueño" : user.role === "artist" ? "Artista/Emprendedor" : user.role}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" style={{ background: "#0d1022", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-white/50">{user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/my-profile" className="cursor-pointer flex items-center gap-2 text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                    <User size={16} />
                    Ver Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={profileEditLink} className="cursor-pointer flex items-center gap-2 text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                    <User size={16} />
                    Editar Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.1)" }} />
                <DropdownMenuItem asChild>
                  <Link href="/hirings" className="cursor-pointer flex items-center gap-2 text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                    <Calendar size={16} />
                    Gestionar Contrataciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tickets" className="cursor-pointer flex items-center gap-2 text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                    <Ticket size={16} />
                    Mis Entradas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.1)" }} />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 flex items-center gap-2">
                  <LogOut size={16} />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-700 p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-1 border-t border-gray-200 pt-4">
            <Link href="/search" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition">
              <Search size={20} />
              <span>Buscar</span>
            </Link>
            <Link href="/bookings" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition">
              <Calendar size={20} />
              <span>Contrataciones</span>
            </Link>
            <Link href="/events" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition">
              <Ticket size={20} />
              <span>Eventos</span>
            </Link>
            <Link href="/tickets" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition">
              <Ticket size={20} />
              <span>Mis Entradas</span>
            </Link>
            <Link href="/messaging" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition">
              <MessageSquare size={20} />
              <span>Mensajes</span>
            </Link>
            <Link href="/notifications" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition">
              <Bell size={20} />
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-auto">{unreadCount}</span>
              )}
            </Link>
            <Link href="/support" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition">
              <HelpCircle size={20} />
              <span>Soporte</span>
            </Link>
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/10 text-primary font-semibold">
                <Shield size={20} />
                <span>Gestion del Sistema</span>
              </Link>
            )}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <Link href="/my-profile" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition">
                <User size={20} />
                <span>Ver Mi Perfil</span>
              </Link>
              <Link href={profileEditLink} className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition">
                <User size={20} />
                <span>Editar Perfil</span>
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition mt-2"
            >
              <LogOut size={20} />
              <span>Cerrar Sesion</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
