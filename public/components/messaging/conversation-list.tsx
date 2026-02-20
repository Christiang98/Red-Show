"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

interface Conversation {
  id: string
  name: string
  lastMessage: string
  timestamp: Date
  unread: boolean
  avatar: string
}

interface ConversationListProps {
  conversations: Conversation[]
  onSelectConversation: (id: string) => void
  selectedId?: string
}

export function ConversationList({ conversations, onSelectConversation, selectedId }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-screen max-h-screen bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-lg text-foreground mb-4">Mensajes</h2>
        <Input
          type="text"
          placeholder="Buscar conversaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">No hay conversaciones</div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-3 rounded-lg hover:bg-muted transition text-left ${
                  selectedId === conv.id ? "bg-secondary/10 border border-secondary" : "border border-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={conv.avatar || "/placeholder.svg?height=40&width=40"}
                    alt={conv.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`font-semibold text-sm truncate ${conv.unread ? "text-foreground font-bold" : "text-foreground"}`}
                      >
                        {conv.name}
                      </h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {conv.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate line-clamp-1 ${conv.unread ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unread && <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0"></div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
