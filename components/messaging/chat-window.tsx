"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
  isOwn: boolean
}

interface ChatWindowProps {
  conversationWith: string
  currentUser: string
}

export function ChatWindow({ conversationWith, currentUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "DJ Phoenix",
      content: "Hola! Vi tu solicitud. Estoy disponible para el 20 de diciembre.",
      timestamp: new Date("2024-11-10T14:30:00"),
      isOwn: false,
    },
    {
      id: "2",
      sender: currentUser,
      content: "Perfecto! Necesitamos música electrónica. ¿Cuál es tu tarifa?",
      timestamp: new Date("2024-11-10T14:35:00"),
      isOwn: true,
    },
    {
      id: "3",
      sender: "DJ Phoenix",
      content: "Mi tarifa es $5000 por 4 horas. ¿Te interesa?",
      timestamp: new Date("2024-11-10T14:40:00"),
      isOwn: false,
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Math.random().toString(),
      sender: currentUser,
      content: newMessage,
      timestamp: new Date(),
      isOwn: true,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
    setIsLoading(false)

    console.log("[v0] Mensaje enviado:", message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card">
        <h2 className="font-semibold text-foreground">{conversationWith}</h2>
        <p className="text-xs text-muted-foreground">Conversación activa</p>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                message.isOwn
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-foreground rounded-bl-none"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {message.timestamp.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-card">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            rows={2}
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isLoading}
            className="bg-secondary hover:bg-secondary/90"
          >
            Enviar
          </Button>
        </div>
      </div>
    </Card>
  )
}
