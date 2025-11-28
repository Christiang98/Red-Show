"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protectedRoute"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ChatWindow } from "@/components/messaging/chat-window"
import { Card } from "@/components/ui/card"

// Mock conversations
const mockConversations = [
  {
    id: "1",
    name: "DJ Phoenix",
    lastMessage: "Mi tarifa es $5000 por 4 horas. ¿Te interesa?",
    timestamp: new Date("2024-11-10"),
    unread: true,
    avatar: "/placeholder.svg?key=ah58d",
  },
  {
    id: "2",
    name: "La Sala del Tango",
    lastMessage: "Excelente, confirmamos para el 15 de diciembre.",
    timestamp: new Date("2024-11-09"),
    unread: false,
    avatar: "/placeholder.svg?key=pf4cn",
  },
  {
    id: "3",
    name: "Fotógrafos Creatives",
    lastMessage: "Desafortunadamente no estamos disponibles para esa fecha.",
    timestamp: new Date("2024-11-08"),
    unread: false,
    avatar: "/placeholder.svg?key=jmzra",
  },
  {
    id: "4",
    name: "Catering Service",
    lastMessage: "¿Cuántas personas confirmas para la cena?",
    timestamp: new Date("2024-11-07"),
    unread: false,
    avatar: "/placeholder.svg?key=5ewbq",
  },
]

export default function MessagingPage() {
  const [selectedConversationId, setSelectedConversationId] = useState("1")

  const selectedConversation = mockConversations.find((c) => c.id === selectedConversationId)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-screen max-h-screen p-4">
          {/* Lista de conversaciones - visible solo en desktop o cuando seleccionado */}
          <div className="md:col-span-1">
            <ConversationList
              conversations={mockConversations}
              onSelectConversation={setSelectedConversationId}
              selectedId={selectedConversationId}
            />
          </div>

          {/* Chat window */}
          <div className="md:col-span-3">
            {selectedConversation ? (
              <ChatWindow conversationWith={selectedConversation.name} currentUser="Mi Negocio" />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Selecciona una conversación</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
