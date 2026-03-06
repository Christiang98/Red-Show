"use client"

import useSWR from "swr"

interface Review {
  id: number
  reviewerId: number
  reviewedUserId: number
  bookingId?: number
  rating: number
  comment: string
  createdAt: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Error fetching reviews")
    return res.json()
  })

export function useReviews(userId?: number) {
  const url = userId ? `/api/reviews?userId=${userId}` : "/api/reviews"
  const { data, error, isLoading, mutate } = useSWR<Review[]>(url, fetcher)

  const createReview = async (reviewedUserId: number, rating: number, comment: string, bookingId?: number) => {
    const user = JSON.parse(localStorage.getItem("userData") || "{}")
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: user.id,
        reviewedUserId,
        rating,
        comment,
        bookingId,
      }),
    })
    mutate()
  }

  return {
    reviews: data || [],
    isLoading,
    error,
    mutate,
    createReview,
  }
}
