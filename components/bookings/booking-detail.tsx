"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, DollarSign, User, Check, X, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface BookingDetailProps {
  booking: {
    id: number
    title: string
    description: string
    bookingDate: string
    price: number
    status: string
    artistName: string
    ownerName: string
    venueName?: string
    location?: string
    createdAt: string
  }
  userRole: "artist" | "owner" | "organizer"
  onAccept?: (id: number) => void
  onReject?: (id: number) => void
  onCancel?: (id: number) => void
}

export function BookingDetail({ booking, userRole, onAccept, onReject, onCancel }: BookingDetailProps) {
  const statusConfig = {
    pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
    accepted: { label: "Aceptada", color: "bg-green-500", icon: Check },
    rejected: { label: "Rechazada", color: "bg-red-500", icon: X },
    completed: { label: "Completada", color: "bg-blue-500", icon: Check },
  }

  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  const canAcceptOrReject = booking.status === "pending" && (userRole === "artist" || userRole === "owner")
  const canCancel = booking.status === "pending"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{booking.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(booking.bookingDate), "PPP 'a las' p", { locale: es })}</span>
            </div>
          </div>
          <Badge className={`${status.color} text-white`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Descripción */}
        <div>
          <h3 className="font-semibold mb-2">Descripción</h3>
          <p className="text-sm text-muted-foreground">{booking.description}</p>
        </div>

        {/* Información de las partes */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Artista:</span>
            </div>
            <p className="text-sm">{booking.artistName}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Propietario:</span>
            </div>
            <p className="text-sm">{booking.ownerName}</p>
          </div>
        </div>

        {/* Ubicación */}
        {booking.venueName && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Lugar:</span>
            </div>
            <p className="text-sm">{booking.venueName}</p>
            {booking.location && <p className="text-sm text-muted-foreground">{booking.location}</p>}
          </div>
        )}

        {/* Precio */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Monto:</span>
          </div>
          <p className="text-2xl font-bold text-primary">${booking.price.toLocaleString()}</p>
        </div>

        {/* Acciones */}
        {canAcceptOrReject && (
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={() => onAccept?.(booking.id)} className="flex-1 bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Aceptar
            </Button>
            <Button onClick={() => onReject?.(booking.id)} variant="destructive" className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          </div>
        )}

        {canCancel && (
          <Button onClick={() => onCancel?.(booking.id)} variant="outline" className="w-full">
            Cancelar Solicitud
          </Button>
        )}

        {/* Info de creación */}
        <p className="text-xs text-muted-foreground pt-4 border-t">
          Solicitud creada el {format(new Date(booking.createdAt), "PPP", { locale: es })}
        </p>
      </CardContent>
    </Card>
  )
}
