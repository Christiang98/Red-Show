"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ReviewFormData {
  rating: number
  comment: string
}

interface ReviewFormProps {
  vendorName: string
  onSubmit: (data: ReviewFormData) => void
  isLoading?: boolean
}

export function ReviewForm({ vendorName, onSubmit, isLoading = false }: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    comment: "",
  })

  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.comment.trim()) {
      alert("Por favor escribe un comentario")
      return
    }
    onSubmit(formData)
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-primary mb-2">Dejar una Reseña</h3>
      <p className="text-muted-foreground mb-6">
        Comparte tu experiencia con <span className="font-semibold">{vendorName}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Calificación */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Calificación</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition transform hover:scale-110"
              >
                <span
                  className={`text-3xl ${
                    star <= (hoveredRating || formData.rating) ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {formData.rating === 5 && "Excelente"}
            {formData.rating === 4 && "Muy bueno"}
            {formData.rating === 3 && "Bueno"}
            {formData.rating === 2 && "Aceptable"}
            {formData.rating === 1 && "Malo"}
          </p>
        </div>

        {/* Comentario */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Comentario</label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
            placeholder="Cuéntanos tu experiencia con este proveedor. ¿Qué te gustó? ¿Qué mejoraría?"
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading ? "Publicando..." : "Publicar Reseña"}
        </Button>
      </form>
    </Card>
  )
}
