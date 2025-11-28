"use client"

import useSWR from "swr"

interface Message {
  id: number
  senderId: number
  receiverId: number
  content: string
  read: boolean
  createdAt: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Error fetching messages")
    return res.json()
  })

export function useMessages(userId?: number) {
  const url = userId ? `/api/messages?userId=${userId}` : "/api/messages"
  const { data, error, isLoading, mutate } = useSWR<Message[]>(url, fetcher)

  const sendMessage = async (receiverId: number, content: string) => {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: userId, receiverId, content }),
    })
    mutate()
  }

  return {
    messages: data || [],
    isLoading,
    error,
    mutate,
    sendMessage,
  }
}
