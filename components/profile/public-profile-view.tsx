"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  Instagram,
  Music2,
  ExternalLink,
  Briefcase,
  DollarSign,
} from "lucide-react"

interface PublicProfileProps {
  type: "owner" | "artist"
  data: Record<string, any>
  userId: string
}

export function PublicProfileView({ type, data, userId }: PublicProfileProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromMyProfile = searchParams.get("from") === "myprofile"

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    setIsOwnProfile(user && user.id === userId)
  }, [userId])

  const handleRequestHiring = () => {
    router.push(`/hirings/request?userId=${userId}`)
  }

  const handleSendMessage = () => {
    router.push(`/messaging?userId=${userId}`)
  }

  const handleReportUser = () => {
    router.push(`/report/${userId}`)
  }

  const handleBackNavigation = () => {
    if (fromMyProfile) {
      router.push("/my-profile")
    } else {
      router.push("/search")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" onClick={handleBackNavigation} className="hover:bg-secondary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {fromMyProfile ? "Volver a mi perfil" : "Volver a búsquedas"}
        </Button>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="relative mb-8">
          <div className="h-80 bg-gradient-to-br from-primary via-secondary to-primary/50 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={
                data.featuredImage || data.profileImage || "/placeholder.svg?height=320&width=1024&query=portada perfil"
              }
              alt="Portada"
              className="w-full h-full object-cover opacity-90 mix-blend-overlay"
            />
          </div>
          {/* Avatar flotante */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <img
                src={data.profileImage || "/placeholder.svg?height=160&width=160&query=usuario"}
                alt={data.businessName || data.artistName}
                className="w-32 h-32 rounded-2xl border-4 border-background shadow-xl object-cover"
              />
              {data.verified && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                  <Star className="h-5 w-5 fill-current" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mt-20">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 shadow-lg">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">{data.businessName || data.artistName}</h1>
                  {type === "owner" && (
                    <Badge variant="secondary" className="text-sm">
                      {data.businessType}
                    </Badge>
                  )}
                  {type === "artist" && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">{data.category}</Badge>
                      <Badge variant="secondary">{data.yearsOfExperience} años exp.</Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        {data.city}, {data.province}
                      </p>
                      {data.neighborhood && (
                        <p className="text-xs text-muted-foreground">Barrio: {data.neighborhood}</p>
                      )}
                    </div>
                  </div>

                  {type === "owner" && data.capacity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">Capacidad: {data.capacity} personas</span>
                    </div>
                  )}

                  {type === "artist" && data.priceRange && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{data.priceRange}</span>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="space-y-2 pt-4">
                  {isOwnProfile ? (
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href={type === "owner" ? "/profile/owner" : "/profile/artist"}>
                        <Briefcase className="h-4 w-4 mr-2" />
                        Editar Perfil
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleRequestHiring} className="w-full bg-secondary hover:bg-secondary/90">
                        Solicitar Contratación
                      </Button>
                      <Button onClick={handleSendMessage} variant="outline" className="w-full bg-transparent">
                        Enviar Mensaje
                      </Button>
                      <Button
                        onClick={handleReportUser}
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Reportar Usuario
                      </Button>
                    </>
                  )}
                </div>

                {/* Redes sociales */}
                {(data.instagram || data.tiktok || data.facebook || data.portfolioUrl) && (
                  <div className="pt-4 border-t border-border space-y-2">
                    <p className="text-sm font-medium text-foreground mb-3">Redes Sociales</p>
                    {data.instagram && (
                      <a
                        href={`https://instagram.com/${data.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-secondary hover:underline"
                      >
                        <Instagram className="h-4 w-4" />@{data.instagram}
                      </a>
                    )}
                    {data.tiktok && (
                      <a
                        href={`https://tiktok.com/@${data.tiktok}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-secondary hover:underline"
                      >
                        <Music2 className="h-4 w-4" />@{data.tiktok}
                      </a>
                    )}
                    {data.facebook && (
                      <a
                        href={`https://facebook.com/${data.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-secondary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Facebook
                      </a>
                    )}
                    {data.portfolioUrl && (
                      <a
                        href={data.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-secondary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Portfolio
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {type === "artist" ? "Sobre el Artista" : "Sobre el Establecimiento"}
              </h2>
              <p className="text-foreground leading-relaxed">{data.description || "Sin descripción disponible"}</p>
            </Card>

            {data.availability && data.availability.length > 0 && (
              <Card className="p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {type === "artist" ? "Disponibilidad" : "Horarios"}
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {data.availability.map((day: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{day.day}</p>
                        <p className="text-xs text-muted-foreground">
                          {day.start} - {day.end}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Información adicional para dueños */}
            {type === "owner" && (
              <>
                {data.additionalServices && (
                  <Card className="p-6 shadow-lg">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Servicios Adicionales</h2>
                    <p className="text-foreground">{data.additionalServices}</p>
                  </Card>
                )}
                {data.hiringPolicies && (
                  <Card className="p-6 shadow-lg">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Políticas de Contratación</h2>
                    <p className="text-foreground">{data.hiringPolicies}</p>
                  </Card>
                )}
              </>
            )}

            {/* Portfolio de artista */}
            {type === "artist" && data.portfolioImages && data.portfolioImages.length > 0 && (
              <Card className="p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-foreground mb-4">Portfolio</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {data.portfolioImages.map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img
                        src={img || "/placeholder.svg?height=300&width=300&query=portfolio"}
                        alt={`Portfolio ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Reseñas */}
            <Card className="p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-foreground mb-4">Reseñas ({data.reviews?.length || 0})</h2>
              {data.reviews && data.reviews.length > 0 ? (
                <div className="space-y-4">
                  {data.reviews.map((review: any, idx: number) => (
                    <div key={idx} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-foreground">{review.author}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sin reseñas aún</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
