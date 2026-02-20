"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Lock, Send } from "lucide-react"
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
  /** Si se pasa un bookingId, el chat verifica si la contratación está confirmada */
  bookingId?: string | number | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Patrones de datos de contacto que se bloquean en modo limitado
const CONTACT_PATTERNS = [
  /\b\d{7,}\b/,                           // números de teléfono
  /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,          // emails
  /(?:wa\.me|whatsapp\.com|t\.me|wa\.link)/i,
  /instagram\.com|facebook\.com|twitter\.com|tiktok\.com/i,
  /@[\w.]+/,                               // @usuario
]

function hasContactData(text: string): boolean {
  return CONTACT_PATTERNS.some((p) => p.test(text))
}

export function ChatWindow({
  conversationWith,
  currentUser,
  receiverId,
  senderId,
  onMessageSent,
  bookingId,
}: ChatWindowProps) {
  const { data: allMessages, mutate } = useSWR(
    `/api/messages?userId=${senderId}`,
    fetcher,
    { refreshInterval: 5000 },
  )

  // Estado de la contratación
  const { data: bookingData } = useSWR(
    bookingId ? `/api/bookings/${bookingId}` : null,
    fetcher,
  )

  const isConfirmed =
    !bookingId ||                          // sin booking = chat libre
    bookingData?.status === "confirmed" ||
    bookingData?.status === "accepted"     // compatibilidad estado viejo

  const messages =
    allMessages?.filter(
      (m: Message) =>
        (m.sender_id === senderId   && m.receiver_id === receiverId) ||
        (m.sender_id === receiverId && m.receiver_id === senderId),
    ) ?? []

  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading]   = useState(false)
  const [contactWarn, setContactWarn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || isLoading) return

    // Bloquear datos de contacto si no está confirmada
    if (!isConfirmed && hasContactData(newMessage)) {
      setContactWarn(true)
      return
    }
    setContactWarn(false)
    setIsLoading(true)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId, receiverId, content: newMessage }),
      })
      if (res.ok) {
        setNewMessage("")
        mutate()
        onMessageSent?.()
      }
    } catch { /* silencioso */ }
    finally { setIsLoading(false) }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen rounded-2xl overflow-hidden border border-white/10"
         style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))", backdropFilter:"blur(12px)" }}>

      {/* Header */}
      <div className="border-b border-white/10 p-4 flex items-center justify-between"
           style={{ background:"rgba(8,11,20,0.6)" }}>
        <div>
          <h2 className="font-semibold text-white text-sm">{conversationWith}</h2>
          <p className="text-xs text-white/35">
            {isConfirmed ? "Chat habilitado" : "Modo limitado — confirma la contratación para chat completo"}
          </p>
        </div>
        {!isConfirmed && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-yellow-400 bg-yellow-500/12 border border-yellow-500/20">
            <Lock className="h-3 w-3"/>
            Limitado
          </div>
        )}
      </div>

      {/* Aviso modo limitado */}
      {!isConfirmed && (
        <div className="mx-3 mt-3 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/8 text-yellow-300/80 text-xs flex items-start gap-2">
          <Lock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"/>
          <span>
            <strong>Chat limitado.</strong> Los datos de contacto directo (teléfono, email, redes sociales)
            se habilitan una vez que el local confirme la contratación y abone la tarifa de gestión.
          </span>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/30 text-sm">No hay mensajes aún. Iniciá la conversación.</p>
          </div>
        ) : (
          messages.map((m: Message) => {
            const isOwn = m.sender_id === senderId
            return (
              <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-2xl ${
                  isOwn
                    ? "rounded-br-sm text-white"
                    : "rounded-bl-sm text-white/80 bg-white/10 border border-white/10"
                }`}
                style={isOwn ? { background:"linear-gradient(135deg,#001C55,#B744B8)" } : {}}>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-white/50" : "text-white/30"}`}>
                    {new Date(m.created_at).toLocaleTimeString("es-AR",
                      { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3"
           style={{ background:"rgba(8,11,20,0.5)" }}>
        {contactWarn && (
          <div className="mb-2 p-2 rounded-lg border border-red-500/25 bg-red-500/8 text-red-400 text-xs flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 flex-shrink-0"/>
            No podés enviar datos de contacto hasta que se confirme la contratación.
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); setContactWarn(false) }}
            onKeyPress={handleKeyPress}
            placeholder={isConfirmed ? "Escribí tu mensaje..." : "Escribí tu mensaje (sin datos de contacto)..."}
            rows={2}
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-xl border border-white/12 bg-white/6 text-white
                       placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-purple-500/40
                       resize-none disabled:opacity-50 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isLoading}
            className="self-end h-10 px-4 font-bold border-0"
            style={{ background:"linear-gradient(135deg,#B744B8,#7a1a8a)" }}
          >
            {isLoading ? "..." : <Send className="h-4 w-4"/>}
          </Button>
        </div>
      </div>
    </div>
  )
}
