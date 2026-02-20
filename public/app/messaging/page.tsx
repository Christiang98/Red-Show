"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ChatWindow } from "@/components/messaging/chat-window"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MessagingPage() {
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get("userId")
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [targetUserName, setTargetUserName] = useState<string>("")

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  // Si viene un userId desde la URL (ej: desde contratacion aceptada), cargar info del usuario
  useEffect(() => {
    if (targetUserId) {
      setSelectedConversationId(targetUserId)
      // Cargar nombre del usuario destino
      fetch(`/api/profiles?userId=${targetUserId}`)
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            const name = data.specificProfile?.business_name || 
                        data.specificProfile?.artist_name ||
                        `${data.profile.first_name || ''} ${data.profile.last_name || ''}`.trim() ||
                        `Usuario ${targetUserId}`
            setTargetUserName(name)
          }
        })
        .catch(() => {
          setTargetUserName(`Usuario ${targetUserId}`)
        })
    }
  }, [targetUserId])

  const { data: messages, mutate } = useSWR(user ? `/api/messages?userId=${user.id}` : null, fetcher)

  const conversations =
    messages?.reduce((acc: any[], msg: any) => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      const existing = acc.find((c) => c.id === otherUserId.toString())

      if (!existing) {
        acc.push({
          id: otherUserId.toString(),
          name: msg.sender_id === user.id 
            ? (msg.receiver_name || `Usuario ${otherUserId}`)
            : (msg.sender_name || `Usuario ${otherUserId}`),
          lastMessage: msg.content,
          timestamp: new Date(msg.created_at),
          unread: !msg.read && msg.receiver_id === user.id,
          avatar: msg.sender_id === user.id 
            ? (msg.receiver_avatar || "/placeholder.svg?height=40&width=40")
            : (msg.sender_avatar || "/placeholder.svg?height=40&width=40"),
        })
      }
      return acc
    }, []) || []

  // Si hay un targetUserId y no existe en las conversaciones, agregarlo
  const allConversations = targetUserId && !conversations.find((c: any) => c.id === targetUserId)
    ? [...conversations, {
        id: targetUserId,
        name: targetUserName || `Usuario ${targetUserId}`,
        lastMessage: "Nueva conversacion",
        timestamp: new Date(),
        unread: false,
        avatar: "/placeholder.svg?height=40&width=40",
      }]
    : conversations

  const selectedConversation = allConversations.find((c: any) => c.id === selectedConversationId)

  useEffect(() => {
    if (allConversations.length > 0 && !selectedConversationId && !targetUserId) {
      setSelectedConversationId(allConversations[0].id)
    }
  }, [allConversations, selectedConversationId, targetUserId])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppNavbar />

        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-primary mb-6">Mensajes</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
            <div className="md:col-span-1">
              {allConversations.length > 0 ? (
                <ConversationList
                  conversations={allConversations}
                  onSelectConversation={setSelectedConversationId}
                  selectedId={selectedConversationId}
                />
              ) : (
                <Card className="h-full flex items-center justify-center p-4">
                  <p className="text-muted-foreground text-center">No hay conversaciones aun</p>
                </Card>
              )}
            </div>

            <div className="md:col-span-3">
              {selectedConversationId && user ? (
                <ChatWindow
                  conversationWith={selectedConversation?.name || targetUserName || `Usuario ${selectedConversationId}`}
                  currentUser={`${user.firstName} ${user.lastName}`}
                  receiverId={Number.parseInt(selectedConversationId)}
                  senderId={user.id}
                  onMessageSent={mutate}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    {allConversations.length === 0 ? "No hay mensajes" : "Selecciona una conversacion"}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
