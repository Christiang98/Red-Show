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

function StarRating({ rating, size = "sm", interactive = false, onRate }: { 
  rating: number; size?: "sm" | "lg"; interactive?: boolean; onRate?: (r: number) => void 
}) {
  const [hover, setHover] = useState(0)
  const starSize = size === "lg" ? "w-5 h-5" : "w-4 h-4"
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${starSize} transition-all ${interactive ? "cursor-pointer hover:scale-125" : ""} ${
            star <= Math.round(hover || rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-600 text-gray-600"
          }`}
        />
      ))}
    </div>
  )
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 shadow-xl ${className}`}
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)", backdropFilter: "blur(12px)" }}
    >
      {children}
    </div>
  )
}

function InfoPill({ icon, label, value, accent = false }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${accent ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/5 border border-white/10"}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? "bg-purple-500/20" : "bg-white/10"}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm font-semibold text-white truncate">{value}</p>
      </div>
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
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewLoading, setReviewLoading] = useState(false)
  const [localReviews, setLocalReviews] = useState<any[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const isOwner = type === "owner"

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    const isOwn = user && user.id === userId
    setIsOwnProfile(isOwn)
    setLocalReviews(data.reviews || [])
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
    } catch { /* silent */ }
  }

  const openHiringModal = () => {
    if (!currentUser) {
      toast({ title: "Inicia sesion", description: "Debes iniciar sesion para enviar una solicitud", variant: "destructive" })
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
        toast({ title: "Solicitud enviada", description: "Tu solicitud de contratacion ha sido enviada exitosamente." })
      } else {
        throw new Error(result.error)
      }
    } catch {
      setHiringStatus("idle")
      toast({ title: "Error", description: "No se pudo enviar la solicitud. Intenta nuevamente.", variant: "destructive" })
    }
  }

  const handleSubmitReview = async () => {
    if (!currentUser || reviewRating === 0 || !reviewComment.trim()) return
    setReviewLoading(true)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId: currentUser.id, reviewedUserId: userId, rating: reviewRating, comment: reviewComment }),
      })
      const result = await response.json()
      if (response.ok) {
        const newReview = { author: `${currentUser.firstName} ${currentUser.lastName}`, rating: reviewRating, comment: reviewComment, date: "Ahora" }
        setLocalReviews((prev) => [newReview, ...prev])
        setShowReviewForm(false)
        setReviewRating(0)
        setReviewComment("")
        toast({ title: "Reseña publicada", description: "Tu reseña fue enviada exitosamente." })
      } else {
        toast({ title: "Error", description: result.error || "No se pudo publicar la reseña.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión al publicar la reseña.", variant: "destructive" })
    } finally {
      setReviewLoading(false)
    }
  }

  const handleGoToChat = () => router.push(`/messaging?userId=${userId}`)
  const handleReportUser = () => router.push(`/report/${userId}`)

  const bioText = data.description || data.biography || ""
  const shouldTruncateBio = bioText.length > 400

  const servicesList = data.additionalServices
    ? data.additionalServices.split(",").map((s: string) => s.trim()).filter((s: string) => Boolean(s) && s !== "__other__")
    : []
  if (data.otherService && data.otherService.trim()) servicesList.push(data.otherService.trim())

  const avgRating = localReviews?.length > 0
    ? localReviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / localReviews.length
    : 0

  const neighborhood = data.neighborhood?.trim() || ""
  const city = data.city?.trim() || ""
  const normalizedNeighborhood = neighborhood.toLowerCase().replace(/\s+/g, " ")
  const normalizedCity = city.toLowerCase().replace(/\s+/g, " ")
  let fullLocation = ""
  if (neighborhood && city && normalizedNeighborhood !== normalizedCity) {
    fullLocation = `${neighborhood}, ${city}`
  } else if (city) {
    fullLocation = city
  } else if (neighborhood) {
    fullLocation = neighborhood
  }

  const profileName = data.businessName || data.artistName || "Perfil"
  const categoryLabel = isOwner
    ? (data.businessTypeLabel || data.businessType || "Espacio")
    : (data.categoryLabel || data.category || "Artista")

  const renderActionButtons = () => {
    if (isOwnProfile) {
      return (
        <Button asChild className="w-full h-12 font-bold text-base border-0 shadow-lg"
          style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
          <Link href={isOwner ? "/profile/owner" : "/profile/artist"}>Editar Perfil</Link>
        </Button>
      )
    }
    return (
      <div className="flex flex-col gap-3 w-full">
        {hiringStatus === "idle" && (
          <Button onClick={openHiringModal} className="w-full h-12 font-bold text-base border-0 shadow-lg shadow-purple-900/30"
            style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
            <Send className="h-4 w-4 mr-2" />
            Solicitar Contratación
          </Button>
        )}
        {hiringStatus === "loading" && (
          <Button disabled className="w-full h-12 font-bold bg-white/10 border border-white/20 text-white/50">
            Enviando solicitud...
          </Button>
        )}
        {hiringStatus === "pending" && (
          <Button disabled className="w-full h-12 font-bold bg-green-500/20 border border-green-500/30 text-green-400">
            <Check className="h-4 w-4 mr-2" />
            Solicitud Enviada
          </Button>
        )}
        {hiringStatus === "accepted" && (
          <Button onClick={handleGoToChat} className="w-full h-12 font-bold border-0 shadow-lg shadow-green-900/30"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            <Send className="h-4 w-4 mr-2" />
            Enviar Mensaje
          </Button>
        )}
        <div className="border-t border-white/10 my-1" />
        <Button onClick={handleReportUser} variant="outline"
          className="w-full h-10 font-semibold border border-red-500/40 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:border-red-500/60 hover:text-red-300 transition-all">
          <Flag className="h-4 w-4 mr-2" />
          Reportar Usuario
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #080b14 0%, #0d0817 50%, #080b14 100%)" }}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(0,28,85,0.8) 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 -right-60 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(183,68,184,0.7) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, rgba(183,68,184,0.6) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar for own profile */}
      {isOwnProfile && <div className="relative z-50"><AppNavbar /></div>}

      {/* Visitor header */}
      {!isOwnProfile && (
        <header className="relative z-40 border-b border-white/8"
          style={{ background: "rgba(8,11,20,0.85)", backdropFilter: "blur(20px)" }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}
              className="text-white/50 hover:text-white hover:bg-white/8 transition-all">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <img src="/logo-redshow.png" alt="Red Show" className="h-10 w-auto" />
          </div>
        </header>
      )}

      {/* ══════ HERO ══════ */}
      <div className="relative z-10">
        <div className="h-72 md:h-96 relative overflow-hidden">
          <img
            src={data.featuredImage || data.profileImage || "/placeholder.svg?height=400&width=1200"}
            alt="Portada"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(8,11,20,1) 0%, rgba(8,11,20,0.55) 55%, rgba(8,11,20,0.1) 100%)" }} />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(100deg, rgba(0,28,85,0.25) 0%, transparent 55%)" }} />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-24 md:-mt-20 pb-8 relative">
            
            {/* Avatar */}
            <div className="relative flex-shrink-0 mt-4 md:mt-0">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-50"
                style={{ background: "linear-gradient(135deg, #001C55, #B744B8)", transform: "scale(1.15)" }} />
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl">
                <img src={data.profileImage || "/placeholder.svg?height=160&width=160"} alt={profileName} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${isOwner ? "bg-blue-700/70" : "bg-purple-700/70"}`}
                  style={{ backdropFilter: "blur(8px)", border: `1px solid ${isOwner ? "rgba(59,130,246,0.3)" : "rgba(168,85,247,0.3)"}` }}>
                  {isOwner ? <Building2 className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                  {categoryLabel}
                </span>
                {avgRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-yellow-300 bg-yellow-400/10 border border-yellow-400/20">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {avgRating.toFixed(1)} · {localReviews.length} reseña{localReviews.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2">
                {profileName}
              </h1>
              {fullLocation && (
                <p className="flex items-center gap-1.5 text-white/45 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  {fullLocation}
                </p>
              )}
            </div>

            {/* Desktop inline CTA */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <GlassCard className="p-4">
                {renderActionButtons()}
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-16">

        {/* Mobile actions */}
        <div className="lg:hidden mb-6">
          <GlassCard className="p-4">
            {renderActionButtons()}
          </GlassCard>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* ─── LEFT COLUMN ─── */}
          <div className="lg:col-span-2 space-y-5">

            {/* About */}
            <GlassCard className="p-6">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full inline-block" style={{ background: "linear-gradient(to bottom, #B744B8, #001C55)" }} />
                {isOwner ? "Acerca del Espacio" : "Biografía"}
              </h2>
              {bioText ? (
                <div>
                  <p className="text-white/65 leading-relaxed whitespace-pre-line text-sm">
                    {showFullBio || !shouldTruncateBio ? bioText : `${bioText.substring(0, 400)}...`}
                  </p>
                  {shouldTruncateBio && (
                    <button onClick={() => setShowFullBio(!showFullBio)}
                      className="mt-3 text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 text-sm transition-colors">
                      {showFullBio ? <><ChevronUp className="h-4 w-4" /> Ver menos</> : <><ChevronDown className="h-4 w-4" /> Leer más</>}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-white/25 italic text-sm">Sin descripción disponible</p>
              )}
            </GlassCard>

            {/* Gallery / Portfolio */}
            {((isOwner && data.galleryImages?.length > 0) || (!isOwner && data.portfolioImages?.length > 0)) && (
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full inline-block" style={{ background: "linear-gradient(to bottom, #B744B8, #001C55)" }} />
                    {isOwner ? "Galería" : "Portfolio"}
                  </h2>
                  <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 gap-1">
                    {["fotos", "videos"].map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab as any)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                          activeTab === tab
                            ? "text-white shadow-lg"
                            : "text-white/35 hover:text-white/60"
                        }`}
                        style={activeTab === tab ? { background: "linear-gradient(135deg, #001C55, #B744B8)" } : {}}>
                        {tab === "fotos" ? <ImageIcon className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
                {activeTab === "fotos" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(isOwner ? data.galleryImages : data.portfolioImages)?.map((img: string, idx: number) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden group cursor-pointer relative border border-white/10">
                        <img src={img || "/placeholder.svg"} alt={`Imagen ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-white/25 text-sm">No hay videos disponibles</div>
                )}
              </GlassCard>
            )}

            {/* Reviews */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full inline-block" style={{ background: "linear-gradient(to bottom, #B744B8, #001C55)" }} />
                  Reseñas
                </h2>
                {avgRating > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">{avgRating.toFixed(1)}</p>
                      <p className="text-xs text-white/35">{localReviews.length} reseña{localReviews.length !== 1 ? "s" : ""}</p>
                    </div>
                    <StarRating rating={avgRating} size="lg" />
                  </div>
                )}
              </div>

              {!isOwnProfile && currentUser && !showReviewForm && (
                <button onClick={() => setShowReviewForm(true)}
                  className="w-full mb-5 p-3 rounded-xl border-2 border-dashed border-purple-500/25 text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-sm font-semibold flex items-center justify-center gap-2">
                  <Star className="h-4 w-4" />
                  Dejar una reseña
                </button>
              )}

              {showReviewForm && !isOwnProfile && (
                <div className="mb-5 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-4">
                  <h3 className="font-bold text-white text-sm">Tu reseña</h3>
                  <div className="flex items-center gap-2">
                    <StarRating rating={reviewRating} size="lg" interactive onRate={setReviewRating} />
                    <span className="ml-1 text-xs text-white/40">
                      {reviewRating === 0 ? "Selecciona" : reviewRating === 1 ? "Malo" : reviewRating === 2 ? "Regular" : reviewRating === 3 ? "Bueno" : reviewRating === 4 ? "Muy bueno" : "Excelente"}
                    </span>
                  </div>
                  <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Contá tu experiencia..." rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/25 focus:outline-none focus:ring-2 resize-none text-sm"
                    style={{ outline: "none" }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment("") }}
                      className="px-4 py-2 rounded-lg border border-white/15 text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all">Cancelar</button>
                    <button onClick={handleSubmitReview}
                      disabled={reviewRating === 0 || !reviewComment.trim() || reviewLoading}
                      className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-30 transition-all"
                      style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
                      {reviewLoading ? "Publicando..." : "Publicar reseña"}
                    </button>
                  </div>
                </div>
              )}

              {localReviews && localReviews.length > 0 ? (
                <div className="space-y-3">
                  {localReviews.map((review: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border border-white/8 bg-white/3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {review.authorAvatar ? (
                            <img src={review.authorAvatar} alt={review.author} className="w-9 h-9 rounded-full object-cover border border-white/15" />
                          ) : (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                              {review.author?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white text-sm">{review.author}</p>
                            <p className="text-xs text-white/30">{review.date || "Hace tiempo"}</p>
                          </div>
                        </div>
                        <StarRating rating={review.rating || 0} />
                      </div>
                      <p className="text-white/55 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Star className="w-10 h-10 text-white/12 mx-auto mb-3" />
                  <p className="text-white/35 text-sm">Aún no hay reseñas</p>
                  {!isOwnProfile && currentUser && (
                    <p className="text-xs text-white/20 mt-1">¡Sé el primero en dejar una reseña!</p>
                  )}
                </div>
              )}
            </GlassCard>
          </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <div className="space-y-4">

            {/* Desktop sticky CTA - hidden when already shown inline in hero */}
            <div className="hidden lg:block sticky top-6">
              {/* intentionally empty - CTA is in hero for desktop */}
            </div>

            {/* Owner info */}
            {isOwner && (
              <>
                {(data.capacity || data.businessHours || data.address) && (
                  <GlassCard className="p-5 space-y-3">
                    <h3 className="text-xs font-bold text-white/35 uppercase tracking-widest pb-1">Detalles del espacio</h3>
                    {data.capacity && (
                      <InfoPill icon={<Users className="w-4 h-4 text-blue-400" />} label="Capacidad" value={`${data.capacity} personas`} accent />
                    )}
                    {data.address && (
                      <InfoPill icon={<MapPin className="w-4 h-4 text-purple-400" />} label="Dirección" value={data.address} />
                    )}
                    {data.businessHours && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          <p className="text-xs text-white/35 uppercase tracking-wider font-medium">Horarios</p>
                        </div>
                        <div className="space-y-1">
                          {data.businessHours.split(" | ").map((hour: string, idx: number) => (
                            <p key={idx} className="text-sm text-white/60">{hour}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </GlassCard>
                )}

                {servicesList.length > 0 && (
                  <GlassCard className="p-5">
                    <h3 className="text-xs font-bold text-white/35 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      Servicios adicionales
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {servicesList.map((service: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/25 bg-purple-500/10 text-purple-300">
                          {service}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {data.contractPolicies && (
                  <GlassCard className="p-5">
                    <h3 className="text-xs font-bold text-white/35 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      Políticas de contratación
                    </h3>
                    <p className="text-white/55 text-sm whitespace-pre-line leading-relaxed">{data.contractPolicies}</p>
                  </GlassCard>
                )}
              </>
            )}

            {/* Artist info */}
            {!isOwner && (
              <>
                {(data.yearsOfExperience || data.availability || data.serviceType || data.priceRange) && (
                  <GlassCard className="p-5 space-y-3">
                    <h3 className="text-xs font-bold text-white/35 uppercase tracking-widest pb-1">Detalles profesionales</h3>
                    {data.yearsOfExperience && (
                      <InfoPill icon={<Briefcase className="w-4 h-4 text-purple-400" />} label="Experiencia" value={`${data.yearsOfExperience} años`} accent />
                    )}
                    {data.priceRange && (
                      <InfoPill icon={<DollarSign className="w-4 h-4 text-green-400" />} label="Tarifa" value={data.priceRange} />
                    )}
                    {data.serviceType && (
                      <InfoPill icon={<Music className="w-4 h-4 text-blue-400" />} label="Tipo de servicio" value={data.serviceType} />
                    )}
                    {data.availability && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                          <p className="text-xs text-white/35 uppercase tracking-wider font-medium">Disponibilidad</p>
                        </div>
                        <div className="space-y-1">
                          {data.availability.split(" | ").map((avail: string, idx: number) => (
                            <p key={idx} className="text-sm text-white/60">{avail}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </GlassCard>
                )}
              </>
            )}

            {/* Social links */}
            {(data.instagram || data.tiktok || data.facebook || data.otherSocial || data.spotify || data.portfolioUrl) && (
              <GlassCard className="p-5">
                <h3 className="text-xs font-bold text-white/35 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  Redes y Web
                </h3>
                <div className="space-y-2">
                  {data.instagram && (
                    <a href={`https://instagram.com/${data.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-white/8 bg-white/3 hover:bg-pink-500/10 hover:border-pink-500/25 transition-all group">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}>
                        <Instagram className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-white/60 group-hover:text-white transition-colors truncate">{data.instagram}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/25 ml-auto flex-shrink-0" />
                    </a>
                  )}
                  {data.tiktok && (
                    <a href={`https://tiktok.com/@${data.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 hover:border-white/15 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-black border border-white/15 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                      </div>
                      <span className="text-sm text-white/60 group-hover:text-white transition-colors truncate">{data.tiktok}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/25 ml-auto flex-shrink-0" />
                    </a>
                  )}
                  {data.facebook && (
                    <a href={data.facebook.startsWith("http") ? data.facebook : `https://facebook.com/${data.facebook}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-white/8 bg-white/3 hover:bg-blue-600/10 hover:border-blue-500/25 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Facebook className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-white/60 group-hover:text-white transition-colors truncate">{data.facebook}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/25 ml-auto flex-shrink-0" />
                    </a>
                  )}
                  {data.spotify && (
                    <a href={data.spotify} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-white/8 bg-white/3 hover:bg-green-500/10 hover:border-green-500/25 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-white/60 group-hover:text-white transition-colors">Spotify</span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/25 ml-auto flex-shrink-0" />
                    </a>
                  )}
                  {data.portfolioUrl && (
                    <a href={data.portfolioUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-white/8 bg-white/3 hover:bg-purple-500/10 hover:border-purple-500/25 transition-all group">
                      <div className="w-8 h-8 rounded-lg border border-purple-500/30 flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(183,68,184,0.15)" }}>
                        <Globe className="w-4 h-4 text-purple-300" />
                      </div>
                      <span className="text-sm text-white/60 group-hover:text-white transition-colors">Portfolio Web</span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/25 ml-auto flex-shrink-0" />
                    </a>
                  )}
                  {data.otherSocial && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/8 bg-white/3">
                      <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-white/40" />
                      </div>
                      <span className="text-sm text-white/45 truncate">{data.otherSocial}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* ══════ HIRING MODAL ══════ */}
      <Dialog open={showHiringModal} onOpenChange={setShowHiringModal}>
        <DialogContent className="sm:max-w-md border border-white/10 text-white"
          style={{ background: "linear-gradient(135deg, #0d1022 0%, #080b14 100%)" }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white">Solicitar Contratación</DialogTitle>
            <DialogDescription className="text-white/45">
              Envía una solicitud a {data.businessName || data.artistName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
              <img src={data.profileImage || "/placeholder.svg?height=50&width=50"} alt={profileName}
                className="w-11 h-11 rounded-xl object-cover border border-white/15" />
              <div>
                <p className="font-bold text-white text-sm">{profileName}</p>
                <p className="text-xs text-white/35">{categoryLabel}</p>
              </div>
            </div>
            {currentUser && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/12 bg-white/3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                  {currentUser.firstName?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-xs text-white/35">Solicitud de:</p>
                  <p className="text-sm font-semibold text-white">{currentUser.firstName} {currentUser.lastName}</p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Fecha propuesta (opcional)</label>
              <Input type="date" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="bg-white/5 border-white/12 text-white focus:border-purple-500/50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Mensaje (opcional)</label>
              <textarea value={hiringMessage} onChange={(e) => setHiringMessage(e.target.value)}
                placeholder={`Hola! Me interesa contratar tus servicios para...`} rows={4}
                className="w-full px-3 py-2 rounded-lg border border-white/12 bg-white/5 text-white placeholder-white/25 focus:outline-none resize-none text-sm" />
              <p className="text-xs text-white/25 mt-1">Este mensaje se enviará junto con tu solicitud</p>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => setShowHiringModal(false)}
              className="flex-1 border-white/15 bg-white/5 text-white/60 hover:text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSendHiringRequest} className="flex-1 font-bold border-0"
              style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Solicitud
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
