"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, MessageSquare, Calendar, DollarSign, User, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Booking {
  id: string | number
  artist_id?: number
  owner_id?: number
  title?: string
  vendorName?: string
  date?: string
  booking_date?: string
  time?: string
  status: "pending" | "accepted" | "rejected" | "completed"
  serviceType?: string
  description?: string
  guestCount?: number
  message?: string
  clientName?: string
  price?: number
  sender_name?: string
  sender_image?: string
  sender_role?: string
}

interface BookingListProps {
  bookings: Booking[]
  isReceived?: boolean
  onUpdateStatus?: (bookingId: string, status: string) => void
}

export function BookingList({ bookings, isReceived = false, onUpdateStatus }: BookingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-success/10 text-success border-success/30"
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/30"
      case "completed":
        return "bg-blue-500/10 text-blue-700 border-blue-500/30"
      default:
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "accepted":
        return "Aceptada"
      case "rejected":
        return "Rechazada"
      case "completed":
        return "Completada"
      default:
        return "Pendiente"
    }
  }

  const formatBooking = (booking: Booking) => {
    return {
      id: booking.id,
      name: booking.title || booking.vendorName || "Sin titulo",
      date: booking.booking_date || booking.date || "",
      description: booking.description || booking.message || "",
      price: booking.price,
    }
  }

  const handleAccept = async (bookingId: string) => {
    setLoadingId(bookingId)
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(bookingId, "accepted")
        toast({
          title: "Contratacion aceptada",
          description: "Se ha habilitado la mensajeria con el solicitante",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aceptar la contratacion",
        variant: "destructive",
      })
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (bookingId: string) => {
    setLoadingId(bookingId)
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(bookingId, "rejected")
        toast({
          title: "Contratacion rechazada",
          description: "La solicitud ha sido rechazada",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la contratacion",
        variant: "destructive",
      })
    } finally {
      setLoadingId(null)
    }
  }

  const handleSendMessage = (booking: Booking) => {
    // Determinar el ID del otro usuario
    let targetUserId: number | undefined
    
    if (isReceived) {
      // Si recibo la solicitud, quiero chatear con quien la envio
      if (booking.sender_role === "artist") {
        targetUserId = booking.artist_id
      } else {
        targetUserId = booking.owner_id
      }
    } else {
      // Si envie la solicitud, quiero chatear con quien la recibio
      if (booking.sender_role === "artist") {
        targetUserId = booking.owner_id
      } else {
        targetUserId = booking.artist_id
      }
    }
    
    router.push(`/messaging?userId=${targetUserId}`)
  }

  const handleViewProfile = (booking: Booking) => {
    let profileUserId: number | undefined
    
    if (isReceived) {
      // Ver perfil de quien envio
      if (booking.sender_role === "artist") {
        profileUserId = booking.artist_id
      } else {
        profileUserId = booking.owner_id
      }
    } else {
      // Ver perfil de quien recibio
      if (booking.sender_role === "artist") {
        profileUserId = booking.owner_id
      } else {
        profileUserId = booking.artist_id
      }
    }
    
    router.push(`/profile/${profileUserId}`)
  }

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {isReceived ? "No hay solicitudes recibidas aun" : "No tienes solicitudes"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const formatted = formatBooking(booking)
            const isLoading = loadingId === formatted.id.toString()
            
            return (
              <Card key={formatted.id} className="p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground truncate">{formatted.name}</h4>
                      <Badge className={`${getStatusColor(booking.status)} border`}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {formatted.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(formatted.date).toLocaleDateString("es-AR")}
                        </div>
                      )}
                      {formatted.price && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${formatted.price.toLocaleString()}
                        </div>
                      )}
                      {booking.sender_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {booking.sender_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    onClick={() =>
                      setExpandedId(expandedId === formatted.id.toString() ? null : formatted.id.toString())
                    }
                  >
                    {expandedId === formatted.id.toString() ? "Ver menos" : "Ver mas"}
                  </Button>
                </div>

                {expandedId === formatted.id.toString() && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    {/* Info del remitente */}
                    {booking.sender_name && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {booking.sender_image ? (
                            <img 
                              src={booking.sender_image || "/placeholder.svg"} 
                              alt={booking.sender_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                              {booking.sender_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Solicitud de:</p>
                            <p className="font-semibold text-gray-900">{booking.sender_name}</p>
                            {booking.sender_role && (
                              <span className="text-xs text-gray-500 capitalize">
                                {booking.sender_role === "artist" ? "Artista/Emprendedor" : "Dueño de Local"}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          onClick={() => handleViewProfile(booking)}
                        >
                          Ver perfil
                        </Button>
                      </div>
                    )}

                    {/* Mensaje del solicitante */}
                    {booking.message && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Mensaje:</p>
                        <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                          "{booking.message}"
                        </p>
                      </div>
                    )}

                    {formatted.description && !booking.message && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Descripcion:</p>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{formatted.description}</p>
                      </div>
                    )}

                    {/* Acciones para solicitudes recibidas pendientes */}
                    {isReceived && booking.status === "pending" && onUpdateStatus && (
                      <div>
                        <div className="mb-3 p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                          <p className="text-sm text-foreground">
                            <strong>Importante:</strong> Al aceptar esta contratacion, se habilitara la mensajeria con
                            la otra parte para que puedan coordinar todos los detalles.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-success hover:bg-success/90"
                            onClick={() => handleAccept(formatted.id.toString())}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Aceptar Contratacion
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
                            onClick={() => handleReject(formatted.id.toString())}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Acciones para solicitudes aceptadas */}
                    {booking.status === "accepted" && (
                      <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-3 text-success">
                          <Check className="h-5 w-5" />
                          <span className="font-semibold">Contratacion aceptada</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Ya puedes comunicarte para coordinar los detalles del evento.
                        </p>
                        <Button
                          onClick={() => handleSendMessage(booking)}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Abrir Chat
                        </Button>
                      </div>
                    )}

                    {/* Info para solicitudes rechazadas */}
                    {booking.status === "rejected" && (
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <div className="flex items-center gap-2 text-destructive">
                          <X className="h-5 w-5" />
                          <span className="font-medium">Contratacion rechazada</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
