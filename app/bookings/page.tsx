"use client"

import { ProtectedRoute } from "@/components/protectedRoute"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingList } from "@/components/bookings/booking-list"
import { Card } from "@/components/ui/card"

// Mock data
const mockSentBookings = [
  {
    id: "1",
    vendorName: "DJ Phoenix",
    date: "2024-12-20",
    time: "22:00",
    status: "accepted" as const,
    serviceType: "Full Event",
    guestCount: 150,
    message: "Buscamos DJ para fiesta de fin de año. Necesitamos música electrónica y house.",
    clientName: "Juan García",
  },
  {
    id: "2",
    vendorName: "La Sala del Tango",
    date: "2024-11-15",
    time: "20:00",
    status: "pending" as const,
    serviceType: "Venue",
    guestCount: 200,
    message: "Evento corporativo con cena. Necesitamos espacio con acceso a catering.",
    clientName: "María López",
  },
  {
    id: "3",
    vendorName: "Fotógrafos Creatives",
    date: "2024-12-10",
    time: "14:00",
    status: "rejected" as const,
    serviceType: "Photography",
    message: "Sesión de fotos familiar. Edición digital incluida.",
    clientName: "Carlos Pérez",
  },
]

const mockReceivedBookings = [
  {
    id: "4",
    vendorName: "Mi Negocio",
    date: "2024-11-25",
    time: "18:00",
    status: "pending" as const,
    serviceType: "Venue",
    guestCount: 100,
    message: "Queremos hacer una fiesta en tu espacio. Somos 100 personas.",
    clientName: "Ana Martínez",
  },
  {
    id: "5",
    vendorName: "Mi Negocio",
    date: "2024-12-02",
    time: "20:00",
    status: "accepted" as const,
    serviceType: "Venue",
    guestCount: 80,
    message: "Evento empresarial confirmado. Gracias.",
    clientName: "Roberto Sánchez",
  },
]

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-4xl font-bold text-primary mb-2">Mis Contrataciones</h1>
          <p className="text-muted-foreground mb-8">Gestiona tus solicitudes y confirma eventos</p>

          <Tabs defaultValue="sent" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="sent">Solicitudes Enviadas</TabsTrigger>
              <TabsTrigger value="received">Solicitudes Recibidas</TabsTrigger>
            </TabsList>

            <TabsContent value="sent" className="space-y-6">
              <Card className="p-6 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-900">
                  Aquí verás todas las solicitudes de contratación que has enviado y sus estados.
                </p>
              </Card>
              <BookingList bookings={mockSentBookings} isReceived={false} />
            </TabsContent>

            <TabsContent value="received" className="space-y-6">
              <Card className="p-6 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-900">
                  Aquí verás todas las solicitudes de contratación que has recibido. Puedes aceptarlas o rechazarlas.
                </p>
              </Card>
              <BookingList bookings={mockReceivedBookings} isReceived={true} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
