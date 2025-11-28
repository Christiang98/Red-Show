"use client"

import useSWR from "swr"

interface Booking {
  id: number
  artistId: number
  ownerId: number
  eventId?: number
  title: string
  description: string
  bookingDate: string
  status: "pending" | "accepted" | "rejected" | "completed"
  price: number
  createdAt: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Error fetching bookings")
    return res.json()
  })

export function useBookings(userId?: number) {
  const url = userId ? `/api/bookings?userId=${userId}` : "/api/bookings"
  const { data, error, isLoading, mutate } = useSWR<Booking[]>(url, fetcher)

  const updateBooking = async (bookingId: number, status: string) => {
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    mutate()
  }

  return {
    bookings: data || [],
    isLoading,
    error,
    mutate,
    updateBooking,
  }
}
