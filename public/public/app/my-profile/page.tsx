"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, User, Briefcase } from "lucide-react"
import Link from "next/link"

export default function MyProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMyProfile()
  }, [])

  const loadMyProfile = async () => {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)

      // Cargar datos del perfil
      const response = await fetch(`/api/profiles?userId=${currentUser.id}`)
      const data = await response.json()

      if (data.profile && data.specificProfile) {
        setProfileData({
          role: data.profile.role,
          specificProfile: data.specificProfile,
          profile: data.profile,
        })
      }
    } catch (error) {
      console.error("[v0] Error cargando perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">Administra tu información personal y profesional</p>
        </div>

        {/* Card de información personal */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rol: <span className="font-medium">{user.role === "artist" ? "Artista" : "Dueño"}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Nombre</p>
              <p className="text-muted-foreground">{user.firstName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Apellido</p>
              <p className="text-muted-foreground">{user.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Email</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Teléfono</p>
              <p className="text-muted-foreground">{user.phone || "No especificado"}</p>
            </div>
          </div>
        </Card>

        {/* Card de perfil profesional */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-full">
                <Briefcase className="h-8 w-8 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Perfil Profesional</h2>
                <p className="text-sm text-muted-foreground">
                  {user.role === "artist" ? "Información de tu perfil artístico" : "Información de tu establecimiento"}
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href={user.role === "artist" ? "/profile/artist" : "/profile/owner"}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          </div>

          {profileData ? (
            <div className="space-y-4">
              {user.role === "artist" ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Nombre Artístico</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.artist_name || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Categoría</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.category || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Años de Experiencia</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.years_of_experience || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Perfil Publicado</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.is_published
                        ? "Sí - Visible en búsquedas"
                        : "No - Solo visible para ti"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Nombre del Negocio</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.business_name || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Tipo de Negocio</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.business_type || "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Capacidad</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.capacity || "No especificado"} personas
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Establecimiento Publicado</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.is_published
                        ? "Sí - Visible en búsquedas"
                        : "No - Solo visible para ti"}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Aún no has completado tu perfil profesional</p>
              <Button asChild>
                <Link href={user.role === "artist" ? "/profile/artist" : "/profile/owner"}>Completar Perfil</Link>
              </Button>
            </div>
          )}
        </Card>

        {/* Botón para ver perfil público */}
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href={`/profile/${user.id}`}>Ver mi perfil público</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
