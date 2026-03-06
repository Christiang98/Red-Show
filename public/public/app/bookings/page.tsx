"use client"

import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingList } from "@/components/bookings/booking-list"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import useSWR from "swr"
import { Send, Inbox } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function BookingsPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => { setUser(getCurrentUser()) }, [])

  const { data: bookings, mutate } = useSWR(
    user ? `/api/bookings?userId=${user.id}` : null, fetcher,
    { refreshInterval: 8000 },
  )

  const sentBookings = bookings?.filter((b: any) => {
    if (b.sender_role === "artist") return b.artist_id === user?.id
    if (b.sender_role === "owner")  return b.owner_id  === user?.id
    return user?.role === "artist" ? b.artist_id === user?.id : b.owner_id === user?.id
  }) ?? []

  const receivedBookings = bookings?.filter((b: any) => {
    if (b.sender_role === "artist") return b.owner_id  === user?.id
    if (b.sender_role === "owner")  return b.artist_id === user?.id
    return user?.role === "artist" ? b.owner_id === user?.id : b.artist_id === user?.id
  }) ?? []

  const handleUpdateStatus = async (_id: string, _status: string) => {
    mutate()
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen"
           style={{ background: "linear-gradient(160deg, #080b14 0%, #0d0817 50%, #080b14 100%)" }}>
        <AppNavbar />
        <div className="max-w-4xl mx-auto px-4 py-8">

          <div className="mb-7">
            <h1 className="text-3xl font-black mb-1" style={{ color: "#FFFCF2" }}>
              Mis Contrataciones
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,252,242,0.4)" }}>
              Gestioná tus propuestas y confirmá eventos
            </p>
          </div>

          <Tabs defaultValue="sent" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Send size={14}/>
                Enviadas
                {sentBookings.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                    {sentBookings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="received" className="flex items-center gap-2">
                <Inbox size={14}/>
                Recibidas
                {receivedBookings.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                    {receivedBookings.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sent" className="space-y-4">
              <div className="p-3 rounded-xl text-sm"
                   style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd" }}>
                Aquí aparecen todas las propuestas que enviaste y su estado actual.
              </div>
              <BookingList
                bookings={sentBookings}
                isReceived={false}
                onUpdateStatus={handleUpdateStatus}
              />
            </TabsContent>

            <TabsContent value="received" className="space-y-4">
              <div className="p-3 rounded-xl text-sm"
                   style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#c084fc" }}>
                Aquí aparecen todas las propuestas que recibiste. Podés aceptarlas o rechazarlas.
              </div>
              <BookingList
                bookings={receivedBookings}
                isReceived={true}
                onUpdateStatus={handleUpdateStatus}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
