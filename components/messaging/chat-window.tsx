"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import useSWR from "swr"

interface Message {
  id: string | number
  sender_id: number
  receiver_id: number
  content: string
  created_at: string
  read: boolean
}

interface ChatWindowProps {
  conversationWith: string
  currentUser: string
  receiverId: number
  senderId: number
  onMessageSent?: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ChatWindow({ conversationWith, currentUser, receiverId, senderId, onMessageSent }: ChatWindowProps) {
  const { data: allMessages, mutate } = useSWR(`/api/messages?userId=${senderId}`, fetcher)

  const messages =
    allMessages?.filter(
      (m: Message) =>
        (m.sender_id === senderId && m.receiver_id === receiverId) ||
        (m.sender_id === receiverId && m.receiver_id === senderId),
    ) || []

  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId,
          receiverId,
          content: newMessage,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        mutate()
        onMessageSent?.()
      }
    } catch (error) {
      console.error("[v0] Error enviando mensaje:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="flex flex-col h-screen max-h-screen">
      <div className="border-b border-border p-4 bg-card">
        <h2 className="font-semibold text-foreground">{conversationWith}</h2>
        <p className="text-xs text-muted-foreground">Conversación activa</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No hay mensajes aún. Inicia la conversación.</p>
          </div>
        ) : (
          messages.map((message: Message) => {
            const isOwn = message.sender_id === senderId
            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(message.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 bg-card">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            rows={2}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isLoading}
            className="bg-secondary hover:bg-secondary/90"
          >
            {isLoading ? "..." : "Enviar"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
