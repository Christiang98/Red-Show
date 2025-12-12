"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Edit,
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Instagram,
  Music2,
  ExternalLink,
} from "lucide-react"
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">Administra tu información personal y profesional</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-start gap-6 mb-6">
            <img
              src={profileData?.specificProfile?.profile_image || "/placeholder.svg?height=100&width=100&query=usuario"}
              alt="Foto de perfil"
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-foreground mb-1">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Rol:{" "}
                <span className="font-medium capitalize">{user.role === "artist" ? "Artista" : "Dueño de Local"}</span>
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {user.phone || "No especificado"}
                </div>
              </div>
            </div>
          </div>
        </Card>

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
            <div className="space-y-6">
              {user.role === "artist" ? (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nombre Artístico
                      </p>
                      <p className="text-muted-foreground pl-6">
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
                      <p className="text-sm font-medium text-foreground mb-1">Tipo de Servicio</p>
                      <p className="text-muted-foreground">
                        {profileData.specificProfile?.service_type || "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Años de Experiencia</p>
                      <p className="text-muted-foreground">
                        {profileData.specificProfile?.years_of_experience || "No especificado"} años
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Rango de Precios</p>
                      <p className="text-muted-foreground">
                        {profileData.specificProfile?.price_range || "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Ubicación
                      </p>
                      <p className="text-muted-foreground pl-6">
                        {profileData.specificProfile?.city && profileData.specificProfile?.province
                          ? `${profileData.specificProfile.city}, ${profileData.specificProfile.province}`
                          : "No especificado"}
                      </p>
                      {profileData.specificProfile?.neighborhood && (
                        <p className="text-sm text-muted-foreground pl-6">
                          Barrio: {profileData.specificProfile.neighborhood}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Biografía</p>
                    <p className="text-muted-foreground">{profileData.specificProfile?.bio || "No especificada"}</p>
                  </div>

                  {profileData.specificProfile?.availability && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Disponibilidad Horaria
                      </p>
                      <div className="pl-6 space-y-2">
                        {JSON.parse(profileData.specificProfile.availability).map(
                          (day: any, idx: number) =>
                            day.enabled && (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{day.day}:</span>
                                <span className="text-muted-foreground">
                                  {day.start} - {day.end}
                                </span>
                              </div>
                            ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Redes sociales */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Redes Sociales</p>
                    <div className="pl-6 space-y-2">
                      {profileData.profile?.instagram && (
                        <a
                          href={`https://instagram.com/${profileData.profile.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-secondary hover:underline"
                        >
                          <Instagram className="h-4 w-4" />@{profileData.profile.instagram}
                        </a>
                      )}
                      {profileData.profile?.tiktok && (
                        <a
                          href={`https://tiktok.com/@${profileData.profile.tiktok}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-secondary hover:underline"
                        >
                          <Music2 className="h-4 w-4" />@{profileData.profile.tiktok}
                        </a>
                      )}
                      {profileData.specificProfile?.portfolio_url && (
                        <a
                          href={profileData.specificProfile.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-secondary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Portfolio
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Estado de Publicación</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.is_published
                        ? "✓ Publicado - Visible en búsquedas"
                        : "✗ No publicado - Solo visible para ti"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
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
                      <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Ubicación
                      </p>
                      <p className="text-muted-foreground pl-6">
                        {profileData.specificProfile?.city && profileData.specificProfile?.province
                          ? `${profileData.specificProfile.city}, ${profileData.specificProfile.province}`
                          : "No especificado"}
                      </p>
                      {profileData.specificProfile?.neighborhood && (
                        <p className="text-sm text-muted-foreground pl-6">
                          Barrio: {profileData.specificProfile.neighborhood}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Descripción del Espacio</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.description || "No especificada"}
                    </p>
                  </div>

                  {profileData.specificProfile?.business_hours && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Horarios del Establecimiento
                      </p>
                      <div className="pl-6 space-y-2">
                        {JSON.parse(profileData.specificProfile.business_hours).map(
                          (day: any, idx: number) =>
                            day.enabled && (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{day.day}:</span>
                                <span className="text-muted-foreground">
                                  {day.start} - {day.end}
                                </span>
                              </div>
                            ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Servicios adicionales */}
                  {profileData.specificProfile?.additional_services && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Servicios Adicionales</p>
                      <div className="pl-6">
                        <p className="text-muted-foreground text-sm">
                          {profileData.specificProfile.additional_services}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Redes sociales */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Redes Sociales</p>
                    <div className="pl-6 space-y-2">
                      {profileData.profile?.instagram && (
                        <a
                          href={`https://instagram.com/${profileData.profile.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-secondary hover:underline"
                        >
                          <Instagram className="h-4 w-4" />@{profileData.profile.instagram}
                        </a>
                      )}
                      {profileData.profile?.tiktok && (
                        <a
                          href={`https://tiktok.com/@${profileData.profile.tiktok}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-secondary hover:underline"
                        >
                          <Music2 className="h-4 w-4" />@{profileData.profile.tiktok}
                        </a>
                      )}
                      {profileData.profile?.facebook && (
                        <a
                          href={`https://facebook.com/${profileData.profile.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-secondary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Políticas de contratación */}
                  {profileData.specificProfile?.hiring_policies && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Políticas de Contratación</p>
                      <p className="text-muted-foreground text-sm">{profileData.specificProfile.hiring_policies}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Estado de Publicación</p>
                    <p className="text-muted-foreground">
                      {profileData.specificProfile?.is_published
                        ? "✓ Publicado - Visible en búsquedas"
                        : "✗ No publicado - Solo visible para ti"}
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
          <Button asChild variant="outline" size="lg">
            <Link href={`/profile/${user.id}?from=myprofile`}>Ver mi perfil público</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
