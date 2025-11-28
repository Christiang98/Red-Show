"use client"

import { Card } from "@/components/ui/card"

interface Review {
  id: string
  author: string
  rating: number
  comment: string
  date: Date
  avatar: string
}

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <img
          src={review.avatar || "/placeholder.svg?height=40&width=40"}
          alt={review.author}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{review.author}</h4>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {review.date.toLocaleDateString("es-AR")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-lg ${star <= review.rating ? "text-yellow-400" : "text-gray-300"}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">{review.rating.toFixed(1)} / 5</span>
          </div>
        </div>
      </div>

      <p className="text-foreground text-sm leading-relaxed">{review.comment}</p>
    </Card>
  )
}
