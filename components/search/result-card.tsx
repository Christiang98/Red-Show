"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ResultCardProps {
  id: string
  type: "owner" | "artist"
  name: string
  category: string
  location: string
  rating: number
  image: string
  description: string
}

export function ResultCard({ id, type, name, category, location, rating, image, description }: ResultCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition">
      <div className="flex flex-col md:flex-row">
        {/* Imagen */}
        <div className="md:w-48 h-48 md:h-auto flex-shrink-0">
          <img src={image || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
        </div>

        {/* Contenido */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-primary">{name}</h3>
                <p className="text-sm text-muted-foreground">{category}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-2">📍 {location}</p>
            <p className="text-foreground text-sm line-clamp-2">{description}</p>
          </div>

          <div className="flex gap-2 mt-4">
            <Button asChild className="flex-1 bg-secondary hover:bg-secondary/90">
              <Link href={`/profile/${id}`}>Ver Perfil</Link>
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              Más Info
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
