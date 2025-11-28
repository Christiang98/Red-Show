"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import { Menu, X, MessageSquare } from "lucide-react"

export function AppNavbar() {
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const handleLogout = () => {
    logoutUser()
    router.push("/login")
  }

  if (!user) return null

  const profileLink = user.role === "owner" ? "/profile/owner" : "/profile/artist"

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
            <Link href="/bookings" className="hover:text-secondary transition flex items-center gap-1">
              <span>Contrataciones</span>
              <span className="bg-secondary text-primary px-2 py-0.5 rounded-full text-xs font-bold">2</span>
            </Link>
            <Link href="/messaging" className="hover:text-secondary transition flex items-center gap-1">
              <MessageSquare size={18} />
              <span>Mensajes</span>
            </Link>
            <Link href={profileLink} className="hover:text-secondary transition">
              Perfil
            </Link>

            {/* User dropdown */}
            <div className="border-l border-primary-foreground/30 pl-6">
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold">{user.username}</p>
                  <p className="text-xs opacity-75">{user.role}</p>
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
            <Link href={profileLink} className="block text-sm hover:text-secondary transition py-2">
              Perfil
            </Link>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-primary-foreground justify-start">
              Salir
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
