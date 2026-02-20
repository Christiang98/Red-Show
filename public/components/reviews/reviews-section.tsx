"use client"

import { useState } from "react"
import { ReviewCard } from "./review-card"
import { Card } from "@/components/ui/card"

interface Review {
  id: string
  author: string
  rating: number
  comment: string
  date: Date
  avatar: string
}

interface ReviewsSectionProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ReviewsSection({ reviews, averageRating, totalReviews }: ReviewsSectionProps) {
  const [sortBy, setSortBy] = useState<"recent" | "rating">("recent")

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "recent") {
      return b.date.getTime() - a.date.getTime()
    } else {
      return b.rating - a.rating
    }
  })

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <Card className="p-6">
        <h3 className="text-2xl font-bold text-primary mb-4">Reseñas y Calificaciones</h3>

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          {/* Rating promedio */}
          <div className="flex items-center gap-6">
            <div>
              <div className="text-5xl font-bold text-primary">{averageRating.toFixed(1)}</div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-2xl ${star <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Basado en {totalReviews} reseña{totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Distribución */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter((r) => r.rating === rating).length
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground w-8">{rating}⭐</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filtro de ordenamiento */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("recent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === "recent" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted"
            }`}
          >
            Más Recientes
          </button>
          <button
            onClick={() => setSortBy("rating")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === "rating" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted"
            }`}
          >
            Mejor Calificación
          </button>
        </div>
      </Card>

      {/* Lista de reseñas */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-primary">Todas las Reseñas</h4>
        {sortedReviews.length > 0 ? (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Sin reseñas aún</p>
          </Card>
        )}
      </div>
    </div>
  )
}
