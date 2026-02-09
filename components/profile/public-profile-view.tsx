"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  AlertCircle, 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Users, 
  Instagram, 
  Star,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
  ExternalLink,
  Calendar,
  DollarSign,
  Globe,
  Music,
  Building2,
  Play,
  ImageIcon,
  CheckCircle2,
  Flag,
  Phone,
  FileText,
  Facebook
} from "lucide-react"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { useToast } from "@/hooks/use-toast"

interface PublicProfileProps {
  type: "owner" | "artist"
  data: Record<string, any>
  userId: string
}

// Componente de estrellas
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const starSize = size === "lg" ? "w-5 h-5" : "w-4 h-4"
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

export function PublicProfileView({ type, data, userId }: PublicProfileProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [showFullBio, setShowFullBio] = useState(false)
  const [hiringStatus, setHiringStatus] = useState<"idle" | "pending" | "accepted" | "loading">("idle")
  const [existingBookingId, setExistingBookingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"fotos" | "videos">("fotos")
  const [showHiringModal, setShowHiringModal] = useState(false)
  const [hiringMessage, setHiringMessage] = useState("")
  const [proposedDate, setProposedDate] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const isOwner = type === "owner"

  

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    setIsOwnProfile(user && user.id === userId)
    
    if (user && user.id !== userId) {
      checkExistingBooking(user.id)
    }
  }, [userId])

  const checkExistingBooking = async (currentUserId: string) => {
    try {
      const response = await fetch(`/api/bookings?userId=${currentUserId}`)
      const bookings = await response.json()
      
      const existingBooking = bookings.find((b: any) => {
        const isRequester = b.artist_id === currentUserId || b.owner_id === currentUserId
        const isReceiver = b.artist_id === parseInt(userId) || b.owner_id === parseInt(userId)
        return isRequester && isReceiver
      })
      
      if (existingBooking) {
        setHiringStatus(existingBooking.status === "accepted" ? "accepted" : "pending")
        setExistingBookingId(existingBooking.id.toString())
      }
    } catch {
      // Error silencioso al verificar booking existente
    }
  }

  const openHiringModal = () => {
    if (!currentUser) {
      toast({
        title: "Inicia sesion",
        description: "Debes iniciar sesion para enviar una solicitud",
        variant: "destructive",
      })
      return
    }
    setShowHiringModal(true)
  }

  const handleSendHiringRequest = async () => {
    if (!currentUser) return

    setHiringStatus("loading")
    setShowHiringModal(false)
    
    try {
      const isCurrentUserArtist = currentUser.role === "artist"
      
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: isCurrentUserArtist ? currentUser.id : parseInt(userId),
          ownerId: isCurrentUserArtist ? parseInt(userId) : currentUser.id,
          title: `Solicitud de contratacion - ${data.businessName || data.artistName}`,
          description: hiringMessage || `Solicitud enviada desde el perfil`,
          bookingDate: proposedDate || null,
          price: null,
          senderName: `${currentUser.firstName} ${currentUser.lastName}`,
          senderImage: currentUser.profileImage || null,
          senderRole: currentUser.role,
          message: hiringMessage,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setHiringStatus("pending")
        setExistingBookingId(result.id.toString())
        setHiringMessage("")
        setProposedDate("")
        toast({
          title: "Solicitud enviada",
          description: "Tu solicitud de contratacion ha sido enviada exitosamente.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch {
      setHiringStatus("idle")
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleGoToChat = () => {
    router.push(`/messaging?userId=${userId}`)
  }

  const handleReportUser = () => {
    router.push(`/report/${userId}`)
  }

  const bioText = data.description || data.biography || ""
  const shouldTruncateBio = bioText.length > 400
  
  // Parsear servicios adicionales
  const servicesList = data.additionalServices 
    ? data.additionalServices.split(",").map((s: string) => s.trim()).filter(Boolean)
    : []

  // Calcular rating promedio
  const avgRating = data.reviews?.length > 0 
    ? data.reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / data.reviews.length 
    : 0

  // Obtener ubicacion completa sin duplicados
  const neighborhood = data.neighborhood?.trim() || ""
  const city = data.city?.trim() || ""
  
  // Normalizar para comparacion (minusculas, sin espacios extra)
  const normalizedNeighborhood = neighborhood.toLowerCase().replace(/\s+/g, ' ')
  const normalizedCity = city.toLowerCase().replace(/\s+/g, ' ')
  
  // Construir ubicacion evitando duplicados
  let fullLocation = ""
  if (neighborhood && city && normalizedNeighborhood !== normalizedCity) {
    fullLocation = `${neighborhood}, ${city}`
  } else if (city) {
    fullLocation = city
  } else if (neighborhood) {
    fullLocation = neighborhood
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isOwnProfile && <AppNavbar />}

      {/* Header de navegacion para visitantes */}
      {!isOwnProfile && (
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <img src="/logo-redshow.png" alt="Red Show" className="h-10 w-auto" />
          </div>
        </header>
      )}

      {/* Hero con imagen de portada */}
      <div className="relative">
        <div className="h-64 md:h-80 overflow-hidden">
          <img
            src={data.featuredImage || data.profileImage || "/placeholder.svg?height=400&width=1200"}
            alt="Portada"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
        
        {/* Info superpuesta en el hero */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-6xl mx-auto px-4 pb-6">
            <div className="flex flex-col md:flex-row items-end gap-4 md:gap-6">
              {/* Foto de perfil */}
              <div className="relative -mb-16 md:-mb-12">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                  <img
                    src={data.profileImage || "/placeholder.svg?height=160&width=160"}
                    alt={data.businessName || data.artistName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Info basica */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${isOwner ? 'bg-primary' : 'bg-secondary'} text-white`}>
                    {isOwner ? <Building2 className="w-3 h-3 mr-1" /> : <Music className="w-3 h-3 mr-1" />}
                    {isOwner ? (data.businessType || "Espacio") : (data.category || "Artista")}
                  </Badge>
                  {avgRating > 0 && (
                    <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded-full">
                      <StarRating rating={avgRating} />
                      <span className="font-bold text-gray-900 text-sm">{avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                  {data.businessName || data.artistName}
                </h1>
                {fullLocation && (
                  <p className="flex items-center gap-1.5 text-white/90 mt-1">
                    <MapPin className="w-4 h-4" />
                    {fullLocation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 pt-20 md:pt-16 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Columna principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Botones de accion (mobile) */}
            <div className="lg:hidden flex gap-3">
              {isOwnProfile ? (
                <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
                  <Link href={isOwner ? "/profile/owner" : "/profile/artist"}>Editar Perfil</Link>
                </Button>
              ) : (
                <>
                  {hiringStatus === "idle" && (
                    <Button onClick={openHiringModal} className="flex-1 bg-secondary hover:bg-secondary/90 font-semibold">
                      <Send className="h-4 w-4 mr-2" />
                      Solicitar Contratacion
                    </Button>
                  )}
                  {hiringStatus === "loading" && (
                    <Button disabled className="flex-1">Enviando...</Button>
                  )}
                  {hiringStatus === "pending" && (
                    <Button disabled className="flex-1 bg-gray-200 text-gray-600">
                      <Check className="h-4 w-4 mr-2" />
                      Solicitud Enviada
                    </Button>
                  )}
                  {hiringStatus === "accepted" && (
                    <Button onClick={handleGoToChat} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensaje
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Seccion: Acerca de / Biografia */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                {isOwner ? "Acerca del Espacio" : "Biografia"}
              </h2>
              {bioText ? (
                <div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {showFullBio || !shouldTruncateBio ? bioText : `${bioText.substring(0, 400)}...`}
                  </p>
                  {shouldTruncateBio && (
                    <button
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="mt-3 text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                    >
                      {showFullBio ? <><ChevronUp className="h-4 w-4" /> Ver menos</> : <><ChevronDown className="h-4 w-4" /> Leer mas</>}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">Sin descripcion disponible</p>
              )}
            </Card>

            {/* Galeria / Portfolio */}
            {((isOwner && data.galleryImages?.length > 0) || (!isOwner && data.portfolioImages?.length > 0)) && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    {isOwner ? "Galeria del Espacio" : "Portfolio Multimedia"}
                  </h2>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab("fotos")}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        activeTab === "fotos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab("videos")}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                        activeTab === "videos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                      }`}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {activeTab === "fotos" && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(isOwner ? data.galleryImages : data.portfolioImages)?.map((img: string, idx: number) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden group cursor-pointer">
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`Imagen ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === "videos" && (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <p>No hay videos disponibles</p>
                  </div>
                )}
              </Card>
            )}

            {/* Resenas */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Resenas
                </h2>
                {avgRating > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                      <p className="text-xs text-gray-500">{data.reviews?.length} resenas</p>
                    </div>
                    <StarRating rating={avgRating} size="lg" />
                  </div>
                )}
              </div>
              
              {data.reviews && data.reviews.length > 0 ? (
                <div className="space-y-4">
                  {data.reviews.map((review: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                            {review.author?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{review.author}</p>
                            <p className="text-xs text-gray-500">{review.date || "Hace tiempo"}</p>
                          </div>
                        </div>
                        <StarRating rating={review.rating || 0} />
                      </div>
                      <p className="text-gray-700 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">Aun no hay resenas</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-4">
            
            {/* Card de acciones (desktop) */}
            <Card className="p-5 hidden lg:block sticky top-20">
              <div className="space-y-3">
                {isOwnProfile ? (
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 h-11 font-semibold">
                    <Link href={isOwner ? "/profile/owner" : "/profile/artist"}>Editar Perfil</Link>
                  </Button>
                ) : (
                  <>
                    {hiringStatus === "idle" && (
                      <Button onClick={openHiringModal} className="w-full bg-secondary hover:bg-secondary/90 h-11 font-semibold">
                        <Send className="h-4 w-4 mr-2" />
                        Solicitar Contratacion
                      </Button>
                    )}
                    {hiringStatus === "loading" && (
                      <Button disabled className="w-full h-11">Enviando solicitud...</Button>
                    )}
                    {hiringStatus === "pending" && (
                      <Button disabled className="w-full h-11 bg-gray-200 text-gray-600">
                        <Check className="h-4 w-4 mr-2" />
                        Solicitud Enviada
                      </Button>
                    )}
                    {hiringStatus === "accepted" && (
                      <Button onClick={handleGoToChat} className="w-full h-11 bg-green-600 hover:bg-green-700">
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensaje
                      </Button>
                    )}
                  </>
                )}
                
                {!isOwnProfile && (
                  <Button
                    onClick={handleReportUser}
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar
                  </Button>
                )}
              </div>
            </Card>

            {/* Info especifica para LOCALES */}
            {isOwner && (
              <>
                {data.capacity && (
                  <Card className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Capacidad</p>
                        <p className="text-xl font-bold text-gray-900">{data.capacity} personas</p>
                      </div>
                    </div>
                  </Card>
                )}

                {data.businessHours && (
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-gray-900">Horarios</h3>
                    </div>
                    <div className="space-y-1.5">
                      {data.businessHours.split(" | ").map((hour: string, idx: number) => (
                        <p key={idx} className="text-gray-700 text-sm">{hour}</p>
                      ))}
                    </div>
                  </Card>
                )}

                {data.address && (
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-gray-900">Direccion</h3>
                    </div>
                    <p className="text-gray-700 text-sm">{data.address}</p>
                  </Card>
                )}

                {servicesList.length > 0 && (
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-gray-900">Servicios Adicionales</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {servicesList.map((service: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-gray-50">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {data.contractPolicies && (
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-gray-900">Politicas de Contratacion</h3>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-line">{data.contractPolicies}</p>
                  </Card>
                )}

                {data.phone && (
                  <Card className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contacto</p>
                        <p className="text-lg font-semibold text-gray-900">{data.phone}</p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Info especifica para ARTISTAS */}
            {!isOwner && (
              <>
                {data.yearsOfExperience && (
                  <Card className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Experiencia</p>
                        <p className="text-xl font-bold text-gray-900">{data.yearsOfExperience} Años</p>
                      </div>
                    </div>
                  </Card>
                )}

                {data.availability && (
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-secondary" />
                      <h3 className="font-semibold text-gray-900">Disponibilidad</h3>
                    </div>
                    <div className="space-y-1.5">
                      {data.availability.split(" | ").map((avail: string, idx: number) => (
                        <p key={idx} className="text-gray-700 text-sm">{avail}</p>
                      ))}
                    </div>
                  </Card>
                )}

                {data.serviceType && (
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="w-5 h-5 text-secondary" />
                      <h3 className="font-semibold text-gray-900">Tipo de Servicio</h3>
                    </div>
                    <p className="text-gray-700 text-sm">{data.serviceType}</p>
                  </Card>
                )}

                {data.priceRange && (
                  <Card className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rango de Precios</p>
                        <p className="text-lg font-bold text-gray-900">{data.priceRange}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {data.phone && (
                  <Card className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contacto</p>
                        <p className="text-lg font-semibold text-gray-900">{data.phone}</p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Redes sociales */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">Redes y Web</h3>
              </div>
              <div className="space-y-3">
                {data.instagram && (
                  <a 
                    href={`https://instagram.com/${data.instagram.replace('@', '')}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-pink-600 transition group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <span className="group-hover:underline">{data.instagram}</span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </a>
                )}
                {data.tiktok && (
                  <a 
                    href={`https://tiktok.com/@${data.tiktok.replace('@', '')}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </div>
                    <span className="group-hover:underline">{data.tiktok}</span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </a>
                )}
                {data.facebook && (
                  <a 
                    href={data.facebook.startsWith('http') ? data.facebook : `https://facebook.com/${data.facebook}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <span className="group-hover:underline">{data.facebook}</span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </a>
                )}
                {data.otherSocial && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-sm">{data.otherSocial}</span>
                  </div>
                )}
                {data.spotify && (
                  <a 
                    href={data.spotify} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <span className="group-hover:underline">Spotify</span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </a>
                )}
                {data.portfolioUrl && (
                  <a 
                    href={data.portfolioUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-primary transition group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <span className="group-hover:underline">Portfolio Web</span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </a>
                )}
                {!data.instagram && !data.tiktok && !data.portfolioUrl && !data.spotify && !data.facebook && !data.otherSocial && (
                  <p className="text-gray-500 text-sm">Sin redes sociales configuradas</p>
                )}
              </div>
            </Card>

            {/* Reportar (mobile) */}
            {!isOwnProfile && (
              <Button
                onClick={handleReportUser}
                variant="ghost"
                size="sm"
                className="w-full lg:hidden text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Flag className="h-4 w-4 mr-2" />
                Reportar Usuario
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Contratacion */}
      <Dialog open={showHiringModal} onOpenChange={setShowHiringModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Solicitar Contratacion</DialogTitle>
            <DialogDescription>
              Envia una solicitud a {data.businessName || data.artistName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Info del destinatario */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img 
                src={data.profileImage || "/placeholder.svg?height=50&width=50"} 
                alt={data.businessName || data.artistName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{data.businessName || data.artistName}</p>
                <p className="text-sm text-gray-500">{isOwner ? data.businessType : data.category}</p>
              </div>
            </div>

            {/* Info del remitente */}
            {currentUser && (
              <div className="flex items-center gap-3 p-3 border border-dashed border-gray-200 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                  {currentUser.firstName?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Solicitud de:</p>
                  <p className="font-medium text-gray-900">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                </div>
              </div>
            )}

            {/* Campo de fecha propuesta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha propuesta (opcional)
              </label>
              <Input 
                type="date" 
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>

            {/* Campo de mensaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mensaje (opcional)
              </label>
              <textarea 
                value={hiringMessage}
                onChange={(e) => setHiringMessage(e.target.value)}
                placeholder={`Hola! Me interesa contratar tus servicios para...`}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Este mensaje se enviara junto con tu solicitud
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowHiringModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSendHiringRequest}
              className="flex-1 bg-secondary hover:bg-secondary/90"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Solicitud
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
