"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

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
}

interface BookingListProps {
  bookings: Booking[]
  isReceived?: boolean
  onUpdateStatus?: (bookingId: string, status: string) => void
}

export function BookingList({ bookings, isReceived = false, onUpdateStatus }: BookingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()

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
      name: booking.title || booking.vendorName || "Sin título",
      date: booking.booking_date || booking.date || "",
      description: booking.description || booking.message || "",
      price: booking.price,
    }
  }

  const handleAccept = (bookingId: string) => {
    if (onUpdateStatus) {
      onUpdateStatus(bookingId, "accepted")
      alert("Contratación aceptada. Ahora puedes comunicarte mediante mensajes.")
    }
  }

  const handleSendMessage = (booking: Booking) => {
    const targetUserId = isReceived ? booking.artist_id : booking.owner_id
    router.push(`/messaging?userId=${targetUserId}`)
  }

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {isReceived ? "No hay solicitudes recibidas aún" : "No tienes solicitudes"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const formatted = formatBooking(booking)
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      {formatted.date && <div>📅 {new Date(formatted.date).toLocaleDateString("es-AR")}</div>}
                      {formatted.price && <div>💰 ${formatted.price.toLocaleString()}</div>}
                      <div>📌 {booking.status === "pending" ? "En espera" : "Procesada"}</div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setExpandedId(expandedId === formatted.id.toString() ? null : formatted.id.toString())
                    }
                  >
                    {expandedId === formatted.id.toString() ? "Ver menos" : "Ver más"}
                  </Button>
                </div>

                {expandedId === formatted.id.toString() && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    {formatted.description && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Descripción:</p>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{formatted.description}</p>
                      </div>
                    )}

                    {isReceived && booking.status === "pending" && onUpdateStatus && (
                      <div>
                        <div className="mb-3 p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                          <p className="text-xs text-foreground">
                            <strong>Importante:</strong> Al aceptar esta contratación, se habilitará la mensajería con
                            la otra parte para que puedan coordinar todos los detalles del evento.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-success hover:bg-success/90"
                            onClick={() => handleAccept(formatted.id.toString())}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Aceptar Contratación
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
                            onClick={() => onUpdateStatus(formatted.id.toString(), "rejected")}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    )}

                    {booking.status === "accepted" && (
                      <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2 text-sm text-success">
                          <Check className="h-4 w-4" />
                          <span className="font-medium">Contratación aceptada - Mensajería habilitada</span>
                        </div>
                        <Button
                          onClick={() => handleSendMessage(booking)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Enviar Mensaje
                        </Button>
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
