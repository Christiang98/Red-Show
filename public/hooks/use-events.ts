"use client"

import useSWR from "swr"

interface Event {
  id: number
  ownerId: number
  title: string
  description: string
  category: string
  location: string
  eventDate: string
  capacity: number
  price: number
  createdAt: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Error fetching events")
    return res.json()
  })

export function useEvents(filters?: { category?: string; location?: string }) {
  const params = new URLSearchParams()
  if (filters?.category) params.append("category", filters.category)
  if (filters?.location) params.append("location", filters.location)

  const url = `/api/events${params.toString() ? "?" + params.toString() : ""}`
  const { data, error, isLoading, mutate } = useSWR<Event[]>(url, fetcher)

  return {
    events: data || [],
    isLoading,
    error,
    mutate,
  }
}
