"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Building2, Music, Users, DollarSign, Briefcase } from "lucide-react"

interface ResultCardProps {
  id: string
  type: "owner" | "artist"
  name: string
  category: string
  location: string
  rating: number
  image: string
  description: string
  // Campos para Locales
  capacity?: number
  services?: string[]
  businessType?: string
  otherBusinessType?: string
  // Campos para Artistas
  priceRange?: string
  yearsOfExperience?: number
  otherCategory?: string
}

// Funcion para mostrar rating con estrellas
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

// Funcion para convertir precio a formato $ - $$$$
function getPriceDisplay(priceRange?: string): { text: string; color: string } {
  if (!priceRange) return { text: "", color: "" }
  const price = parseInt(priceRange) || 0
  if (price <= 15000) return { text: "$", color: "text-green-600" }
  if (price <= 40000) return { text: "$$", color: "text-green-600" }
  if (price <= 80000) return { text: "$$$", color: "text-amber-600" }
  return { text: "$$$$", color: "text-red-600" }
}

export function ResultCard({ 
  id, 
  type, 
  name, 
  category, 
  location, 
  rating, 
  image, 
  description,
  capacity,
  services = [],
  businessType,
  otherBusinessType,
  priceRange,
  yearsOfExperience,
  otherCategory
}: ResultCardProps) {
  const isOwner = type === "owner"
  const priceDisplay = getPriceDisplay(priceRange)
  
  // Mostrar otherBusinessType o otherCategory si aplica
  const displayCategory = isOwner
    ? (businessType === "other" ? (otherBusinessType || "Otro") : businessType)
    : (category === "other" ? (otherCategory || "Otro") : category)
  
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-border/50 hover:border-primary/20 bg-card">
      <div className="flex flex-col md:flex-row">
        {/* Imagen con overlay y badge */}
        <div className="md:w-64 h-52 md:h-auto flex-shrink-0 relative overflow-hidden">
          <img 
            src={image || "/placeholder.svg"} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badge de tipo */}
          <div className="absolute top-3 left-3">
            <Badge 
              className={`${isOwner ? 'bg-primary' : 'bg-secondary'} text-white shadow-lg`}
            >
              {isOwner ? (
                <><Building2 className="w-3 h-3 mr-1" /> {displayCategory || "Espacio"}</>
              ) : (
                <><Music className="w-3 h-3 mr-1" /> {displayCategory || "Artista"}</>
              )}
            </Badge>
          </div>

          {/* Rating en la imagen */}
          {rating > 0 ? (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow">
              <StarRating rating={rating} />
              <span className="text-gray-900 text-sm font-bold">{rating.toFixed(1)}</span>
            </div>
          ) : (
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow">
              <span className="text-gray-500 text-xs font-medium">Sin reseñas</span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            {/* Header con nombre */}
            <div className="mb-3">
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {name}
              </h3>
              {!isOwner && displayCategory && (
                <p className="text-sm text-secondary font-medium">{displayCategory}</p>
              )}
            </div>

            {/* Info segun tipo */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
              {/* Ubicacion (ambos) */}
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                {location}
              </span>

              {/* Campos especificos para LOCALES */}
              {isOwner && capacity && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Capacidad: <strong className="text-foreground">{capacity} pers.</strong></span>
                </span>
              )}

              {/* Campos especificos para ARTISTAS */}
              {!isOwner && priceDisplay.text && (
                <span className={`flex items-center gap-1 font-bold text-base ${priceDisplay.color}`}>
                  <DollarSign className="w-4 h-4" />
                  {priceDisplay.text}
                </span>
              )}
              {!isOwner && yearsOfExperience && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span><strong className="text-foreground">{yearsOfExperience}</strong> anos exp.</span>
                </span>
              )}
            </div>
            
            {/* Descripcion */}
            <p className="text-foreground/70 text-sm line-clamp-2 mb-4">{description}</p>
            
            {/* Servicios adicionales (solo para Locales) */}
            {isOwner && services.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Servicios:</p>
                <div className="flex flex-wrap gap-1.5">
                  {services.slice(0, 4).map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-muted/50 border-muted">
                      {service}
                    </Badge>
                  ))}
                  {services.length > 4 && (
                    <Badge variant="outline" className="text-xs bg-muted/50 border-muted">
                      +{services.length - 4} mas
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botones de accion */}
          <div className="flex gap-3 mt-2">
            <Button asChild className="flex-1 bg-primary hover:bg-primary/90 font-semibold">
              <Link href={`/profile/${id}`}>Ver Perfil</Link>
            </Button>
            <Button asChild variant="outline" className="flex-none px-6 bg-transparent hover:bg-muted/50">
              <Link href={`/profile/${id}#contact`}>Contactar</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
