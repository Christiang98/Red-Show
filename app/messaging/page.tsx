"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ChatWindow } from "@/components/messaging/chat-window"
import { Card } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MessagingPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const { data: messages, mutate } = useSWR(user ? `/api/messages?userId=${user.id}` : null, fetcher)

  const conversations =
    messages?.reduce((acc: any[], msg: any) => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      const existing = acc.find((c) => c.id === otherUserId.toString())

      if (!existing) {
        acc.push({
          id: otherUserId.toString(),
          name: `Usuario ${otherUserId}`,
          lastMessage: msg.content,
          timestamp: new Date(msg.created_at),
          unread: !msg.read && msg.receiver_id === user.id,
          avatar: "/placeholder.svg?height=40&width=40",
        })
      }
      return acc
    }, []) || []

  const selectedConversation = conversations.find((c: any) => c.id === selectedConversationId)

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id)
    }
  }, [conversations, selectedConversationId])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppNavbar />

        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-primary mb-6">Mensajes</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
            <div className="md:col-span-1">
              {conversations.length > 0 ? (
                <ConversationList
                  conversations={conversations}
                  onSelectConversation={setSelectedConversationId}
                  selectedId={selectedConversationId}
                />
              ) : (
                <Card className="h-full flex items-center justify-center p-4">
                  <p className="text-muted-foreground text-center">No hay conversaciones aún</p>
                </Card>
              )}
            </div>

            <div className="md:col-span-3">
              {selectedConversation && user ? (
                <ChatWindow
                  conversationWith={selectedConversation.name}
                  currentUser={`${user.firstName} ${user.lastName}`}
                  receiverId={Number.parseInt(selectedConversationId || "0")}
                  senderId={user.id}
                  onMessageSent={mutate}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    {conversations.length === 0 ? "No hay mensajes" : "Selecciona una conversación"}
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
