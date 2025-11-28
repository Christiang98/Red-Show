"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Booking {
  id: string
  vendorName: string
  date: string
  time: string
  status: "pending" | "accepted" | "rejected"
  serviceType: string
  guestCount?: number
  message: string
  clientName: string
}

interface BookingListProps {
  bookings: Booking[]
  isReceived?: boolean
}

export function BookingList({ bookings, isReceived = false }: BookingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-success/10 text-success border-success/30"
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/30"
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
      default:
        return "Pendiente"
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">{isReceived ? "Solicitudes Recibidas" : "Mis Solicitudes"}</h3>

      {bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {isReceived ? "No hay solicitudes recibidas aún" : "No tienes solicitudes"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-foreground truncate">
                      {isReceived ? booking.clientName : booking.vendorName}
                    </h4>
                    <Badge className={`${getStatusColor(booking.status)} border`}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <div>📅 {new Date(booking.date).toLocaleDateString("es-AR")}</div>
                    <div>⏰ {booking.time}</div>
                    <div>📌 {booking.serviceType}</div>
                    {booking.guestCount && <div>👥 {booking.guestCount} personas</div>}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                >
                  {expandedId === booking.id ? "Ver menos" : "Ver más"}
                </Button>
              </div>

              {expandedId === booking.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  {booking.message && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-1">Mensaje:</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{booking.message}</p>
                    </div>
                  )}

                  {isReceived && booking.status === "pending" && (
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-success hover:bg-success/90">Aceptar</Button>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        Rechazar
                      </Button>
                    </div>
                  )}

                  <Button className="w-full mt-2 bg-transparent" variant="outline">
                    Enviar Mensaje
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
