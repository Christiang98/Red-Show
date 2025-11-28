"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PublicProfileProps {
  type: "owner" | "artist"
  data: Record<string, any>
}

export function PublicProfileView({ type, data }: PublicProfileProps) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header con imagen */}
      <div className="relative mb-8">
        <div className="h-64 bg-gradient-to-r from-primary to-secondary rounded-xl overflow-hidden">
          <img
            src={data.featuredImage || data.profileImage || "/placeholder.svg?height=256&width=1024&query=perfil"}
            alt="Portada"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar - Info principal */}
        <div className="md:col-span-1">
          <Card className="p-6 text-center sticky top-4">
            <img
              src={data.profileImage || "/placeholder.svg?height=128&width=128&query=usuario"}
              alt={data.businessName || data.artistName}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
            <h1 className="text-xl font-bold text-primary mb-2">{data.businessName || data.artistName}</h1>
            {type === "owner" && <p className="text-sm text-muted-foreground mb-4">{data.businessType}</p>}
            {type === "artist" && (
              <>
                <p className="text-sm text-muted-foreground mb-2">{data.category}</p>
                <p className="text-xs text-muted-foreground mb-4">{data.yearsOfExperience} años de experiencia</p>
              </>
            )}

            <div className="space-y-2 mb-6">
              <p className="text-sm text-foreground">
                {data.city}, {data.province}
              </p>
            </div>

            <Button className="w-full bg-secondary hover:bg-secondary/90 mb-2">Solicitar Contratación</Button>
            <Button variant="outline" className="w-full bg-transparent">
              Enviar Mensaje
            </Button>

            {/* Redes sociales */}
            <div className="mt-6 pt-6 border-t border-border space-y-2 text-sm">
              {data.instagram && (
                <a href={`https://instagram.com/${data.instagram}`} className="block text-secondary hover:underline">
                  Instagram: {data.instagram}
                </a>
              )}
              {data.tiktok && (
                <a href={`https://tiktok.com/@${data.tiktok}`} className="block text-secondary hover:underline">
                  TikTok: {data.tiktok}
                </a>
              )}
              {data.portfolioUrl && (
                <a href={data.portfolioUrl} className="block text-secondary hover:underline">
                  Portfolio
                </a>
              )}
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="md:col-span-3 space-y-6">
          {/* Descripción */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">Acerca de</h2>
            <p className="text-foreground">{data.description}</p>
          </Card>

          {/* Información adicional */}
          {type === "owner" && (
            <>
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-primary mb-4">Información del Establecimiento</h2>
                <div className="space-y-4 text-foreground">
                  <div>
                    <p className="font-medium">Capacidad:</p>
                    <p>{data.capacity} personas</p>
                  </div>
                  <div>
                    <p className="font-medium">Horarios:</p>
                    <p>{data.businessHours}</p>
                  </div>
                  {data.additionalServices && (
                    <div>
                      <p className="font-medium">Servicios Adicionales:</p>
                      <p>{data.additionalServices}</p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* Reseñas */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">Reseñas ({data.reviews?.length || 0})</h2>
            {data.reviews && data.reviews.length > 0 ? (
              <div className="space-y-4">
                {data.reviews.map((review: any, idx: number) => (
                  <div key={idx} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-foreground">{review.author}</p>
                      <span className="text-yellow-500">{"⭐".repeat(review.rating)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Sin reseñas aún</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
