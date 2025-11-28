"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protectedRoute"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewsSection } from "@/components/reviews/reviews-section"

// Mock reviews data
const mockReviews = [
  {
    id: "1",
    author: "Juan García",
    rating: 5,
    comment:
      "Excelente servicio. DJ Phoenix fue profesional, puntual y la música fue exactamente lo que pedimos. Toda nuestra fiesta estuvo genial. Recomendado 100%.",
    date: new Date("2024-10-25"),
    avatar: "/placeholder.svg?key=0mcde",
  },
  {
    id: "2",
    author: "María López",
    rating: 4,
    comment:
      "Muy buena experiencia. El DJ fue flexible con nuestras solicitudes de canciones. La única observación es que hubiera estado bien que nos contacte el día anterior para confirmar detalles.",
    date: new Date("2024-10-15"),
    avatar: "/placeholder.svg?key=60jjy",
  },
  {
    id: "3",
    author: "Carlos Pérez",
    rating: 5,
    comment:
      "Perfecto de principio a fin. DJ Phoenix es profesional, creativo y sabe leer al público. Nuestra fiesta corporativa fue un éxito total. Ya lo contratamos para otro evento.",
    date: new Date("2024-09-30"),
    avatar: "/placeholder.svg?key=qm0yt",
  },
  {
    id: "4",
    author: "Ana Martínez",
    rating: 4,
    comment:
      "Buen trabajo, buena selección musical. Estuvo atenta a las solicitudes del cliente. Precio justo para la calidad ofrecida.",
    date: new Date("2024-09-10"),
    avatar: "/placeholder.svg?key=a7b2e",
  },
]

const calculateAverageRating = (reviews: typeof mockReviews) => {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
  return sum / reviews.length
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(mockReviews)

  const handleSubmitReview = (data: { rating: number; comment: string }) => {
    const newReview = {
      id: Math.random().toString(),
      author: "Tu Nombre",
      rating: data.rating,
      comment: data.comment,
      date: new Date(),
      avatar: "/placeholder.svg?height=40&width=40",
    }

    setReviews((prev) => [newReview, ...prev])
    console.log("[v0] Nueva reseña:", newReview)
  }

  const averageRating = calculateAverageRating(reviews)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-4xl font-bold text-primary mb-2">DJ Phoenix - Reseñas</h1>
          <p className="text-muted-foreground mb-8">Profesional con {reviews.length} reseñas verificadas</p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Formulario de reseña */}
            <div className="md:col-span-1">
              <ReviewForm vendorName="DJ Phoenix" onSubmit={handleSubmitReview} />
            </div>

            {/* Sección de reseñas */}
            <div className="md:col-span-2">
              <ReviewsSection reviews={reviews} averageRating={averageRating} totalReviews={reviews.length} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
