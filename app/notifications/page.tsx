"use client"

import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, Calendar, MessageSquare, Star } from "lucide-react"
import { useState, useEffect } from "react"
import useSWR from "swr"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Notification {
  id: number
  type: "booking_accepted" | "booking_rejected" | "new_booking" | "new_message" | "new_review"
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedId?: number
  relatedType?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("userData")
    if (userData) {
      setUser(JSON.parse(userData).user)
    }
  }, [])

  const { data, error, mutate } = useSWR(user ? `/api/notifications?userId=${user.id}` : null, fetcher)

  const notifications: Notification[] = data?.notifications || []

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
      mutate()
    } catch (error) {
      console.error("[v0] Error marcando notificación:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read?userId=${user.id}`, {
        method: "POST",
      })
      mutate()
    } catch (error) {
      console.error("[v0] Error marcando todas las notificaciones:", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "booking_accepted":
        return <Check className="h-5 w-5 text-green-500" />
      case "booking_rejected":
        return <X className="h-5 w-5 text-red-500" />
      case "new_booking":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "new_message":
        return <MessageSquare className="h-5 w-5 text-purple-500" />
      case "new_review":
        return <Star className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getLink = (notification: Notification) => {
    switch (notification.relatedType) {
      case "booking":
        return `/bookings/${notification.relatedId}`
      case "message":
        return `/messaging`
      case "review":
        return `/reviews`
      default:
        return null
    }
  }

  if (!user) return null

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppNavbar />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Notificaciones</h1>
                <p className="text-muted-foreground">{notifications.filter((n) => !n.read).length} sin leer</p>
              </div>
              {notifications.some((n) => !n.read) && (
                <button onClick={markAllAsRead} className="text-sm text-primary hover:underline">
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tienes notificaciones</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const link = getLink(notification)
                  const content = (
                    <Card
                      key={notification.id} // Added key property
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        !notification.read ? "bg-muted/30" : ""
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <CardContent className="flex gap-4 p-4">
                        <div className="flex-shrink-0 pt-1">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground">{notification.title}</h3>
                            {!notification.read && (
                              <Badge variant="default" className="flex-shrink-0">
                                Nueva
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(notification.createdAt), "PPP 'a las' p", { locale: es })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )

                  return link ? (
                    <Link key={notification.id} href={link}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
