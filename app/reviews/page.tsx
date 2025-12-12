"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewsSection } from "@/components/reviews/reviews-section"
import { getCurrentUser } from "@/lib/auth"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const calculateAverageRating = (reviews: any[]) => {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
  return sum / reviews.length
}

export default function ReviewsPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const { data: reviews, mutate } = useSWR(user ? `/api/reviews?userId=${user.user.id}` : null, fetcher)

  const handleSubmitReview = async (data: { rating: number; comment: string }) => {
    if (!user) return

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: user.user.id,
          reviewedUserId: user.user.id,
          rating: data.rating,
          comment: data.comment,
        }),
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error("[v0] Error creando reseña:", error)
    }
  }

  const averageRating = reviews ? calculateAverageRating(reviews) : 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppNavbar />

        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-4xl font-bold text-primary mb-2">Mis Reseñas</h1>
          <p className="text-muted-foreground mb-8">
            {reviews ? `${reviews.length} reseñas verificadas` : "Cargando reseñas..."}
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <ReviewForm vendorName="Mi perfil" onSubmit={handleSubmitReview} />
            </div>

            <div className="md:col-span-2">
              {reviews ? (
                <ReviewsSection reviews={reviews} averageRating={averageRating} totalReviews={reviews.length} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">Cargando reseñas...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
