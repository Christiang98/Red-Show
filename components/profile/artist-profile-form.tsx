"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { compressImage } from "@/lib/image-utils"
import { Upload, X } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { Checkbox } from "@/components/ui/checkbox"

interface ArtistProfileData {
  stageName: string
  category: string
  otherCategory: string
  serviceType: string
  priceRange: string
  bio: string
  experienceYears: number
  portfolioUrl: string
  instagram: string
  tiktok: string
  otherSocial: string
  location: string
  neighborhood: string
  availability: {
    day: string
    enabled: boolean
    from: string
    to: string
  }[]
  profileImage: string | null
  portfolioImages: string[]
  isPublished: boolean
}

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export function ArtistProfileForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ArtistProfileData>({
    stageName: "",
    category: "",
    otherCategory: "",
    serviceType: "",
    priceRange: "",
    bio: "",
    experienceYears: 0,
    portfolioUrl: "",
    instagram: "",
    tiktok: "",
    otherSocial: "",
    location: "",
    neighborhood: "",
    availability: DAYS_OF_WEEK.map((day) => ({ day, enabled: false, from: "09:00", to: "18:00" })),
    profileImage: null,
    portfolioImages: [],
    isPublished: false,
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const user = getCurrentUser()
      if (!user) return

      console.log("[v0] Cargando perfil para usuario:", user.id)
      const response = await fetch(`/api/profiles?userId=${user.id}`)
      const data = await response.json()

      if (data.specificProfile) {
        const availabilityData = data.specificProfile.availability
          ? JSON.parse(data.specificProfile.availability)
          : DAYS_OF_WEEK.map((day) => ({ day, enabled: false, from: "09:00", to: "18:00" }))

        setFormData({
          stageName: data.specificProfile.stage_name || "",
          category: data.specificProfile.category || "",
          otherCategory: data.specificProfile.other_category || "",
          serviceType: data.specificProfile.service_type || "",
          priceRange: data.specificProfile.price_range || "",
          bio: data.specificProfile.bio || "",
          experienceYears: data.specificProfile.experience_years || 0,
          portfolioUrl: data.specificProfile.portfolio_url || "",
          instagram: data.profile?.instagram || "",
          tiktok: data.profile?.tiktok || "",
          otherSocial: data.profile?.other_social || "",
          location: data.profile?.location || "",
          neighborhood: data.specificProfile.neighborhood || "",
          availability: availabilityData,
          profileImage: data.specificProfile.profile_image || null,
          portfolioImages: data.specificProfile.portfolio_images
            ? JSON.parse(data.specificProfile.portfolio_images)
            : [],
          isPublished: data.specificProfile.is_published || false,
        })
      }
    } catch (error) {
      console.error("[v0] Error cargando perfil:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "experienceYears" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleAvailabilityChange = (index: number, field: "enabled" | "from" | "to", value: boolean | string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressed = await compressImage(file, 400)
      setFormData((prev) => ({ ...prev, profileImage: compressed }))
    } catch (error) {
      console.error("[v0] Error procesando imagen:", error)
      alert("Error procesando la imagen")
    }
  }

  const handlePortfolioImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      const compressed = await Promise.all(files.map((file) => compressImage(file, 800)))
      setFormData((prev) => ({
        ...prev,
        portfolioImages: [...prev.portfolioImages, ...compressed].slice(0, 10),
      }))
    } catch (error) {
      console.error("[v0] Error procesando imágenes:", error)
      alert("Error procesando las imágenes")
    }
  }

  const removePortfolioImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = getCurrentUser()
      if (!user) {
        alert("No se encontró información de usuario")
        setLoading(false)
        return
      }

      console.log("[v0] Guardando perfil para usuario:", user.id)

      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role: "artist",
          profileData: {
            bio: formData.bio,
            location: formData.location,
            avatarUrl: formData.profileImage,
            phone: "",
            instagram: formData.instagram,
            tiktok: formData.tiktok,
            other_social: formData.otherSocial,
          },
          specificProfileData: {
            stageName: formData.stageName,
            category: formData.category,
            otherCategory: formData.otherCategory,
            serviceType: formData.serviceType,
            priceRange: formData.priceRange,
            bio: formData.bio,
            experienceYears: formData.experienceYears,
            portfolioUrl: formData.portfolioUrl,
            neighborhood: formData.neighborhood,
            availability: JSON.stringify(formData.availability),
            profileImage: formData.profileImage,
            portfolioImages: JSON.stringify(formData.portfolioImages),
            isPublished: formData.isPublished,
          },
        }),
      })

      const result = await response.json()
      console.log("[v0] Respuesta del servidor:", result)

      if (response.ok) {
        alert("Perfil guardado exitosamente!")
        window.location.href = "/dashboard"
      } else {
        alert(`Error guardando el perfil: ${result.error || "Error desconocido"}`)
      }
    } catch (error) {
      console.error("[v0] Error guardando perfil:", error)
      alert("Error guardando el perfil")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Perfil de Artista Emprendedor</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identidad Artística */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Identidad Artística</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre Artístico *</label>
                <Input
                  type="text"
                  name="stageName"
                  value={formData.stageName}
                  onChange={handleInputChange}
                  placeholder="Ej: DJ Phoenix"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Categoría *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  <option value="musician">Músico</option>
                  <option value="band">Banda</option>
                  <option value="dj">DJ</option>
                  <option value="comedian">Comediante</option>
                  <option value="photographer">Fotógrafo</option>
                  <option value="videographer">Videógrafo</option>
                  <option value="gastronomy">Gastronómico/Catering</option>
                  <option value="decorator">Decorador</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            {formData.category === "other" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Especifica tu categoría</label>
                <Input
                  type="text"
                  name="otherCategory"
                  value={formData.otherCategory}
                  onChange={handleInputChange}
                  placeholder="Ej: Maquillador profesional"
                />
              </div>
            )}
          </div>

          {/* Servicio y Tarifas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Servicio y Tarifas</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tipo de Servicio</label>
                <Input
                  type="text"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  placeholder="Ej: Shows en vivo, sesiones privadas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Rango de Precios</label>
                <select
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecciona un rango</option>
                  <option value="budget">Económico ($ - $$)</option>
                  <option value="moderate">Moderado ($$ - $$$)</option>
                  <option value="premium">Premium ($$$ - $$$$)</option>
                  <option value="luxury">Lujo ($$$$+)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Biografía */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Biografía</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Cuéntanos sobre ti, tu estilo, experiencia..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Experiencia y Portfolio */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Experiencia y Portfolio
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Años de Experiencia</label>
                <Input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  placeholder="5"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Portfolio/Website URL</label>
                <Input
                  type="url"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleInputChange}
                  placeholder="https://miportfolio.com"
                />
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Redes Sociales</h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Instagram</label>
                <Input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  placeholder="@usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">TikTok</label>
                <Input
                  type="text"
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleInputChange}
                  placeholder="@usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Otras Redes</label>
                <Input
                  type="text"
                  name="otherSocial"
                  value={formData.otherSocial}
                  onChange={handleInputChange}
                  placeholder="Facebook, YouTube, etc."
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Ubicación</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ciudad/Provincia</label>
                <Input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Buenos Aires, Argentina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Barrio</label>
                <Input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  placeholder="Palermo"
                />
              </div>
            </div>
          </div>

          {/* Disponibilidad Horaria */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Disponibilidad Horaria
            </h3>
            <p className="text-sm text-muted-foreground">Marca los días y horarios en que estás disponible</p>

            <div className="space-y-3">
              {formData.availability.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-2 w-32">
                    <Checkbox
                      checked={item.enabled}
                      onCheckedChange={(checked) => handleAvailabilityChange(index, "enabled", checked as boolean)}
                    />
                    <label className="text-sm font-medium">{item.day}</label>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={item.from}
                      onChange={(e) => handleAvailabilityChange(index, "from", e.target.value)}
                      disabled={!item.enabled}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">hasta</span>
                    <Input
                      type="time"
                      value={item.to}
                      onChange={(e) => handleAvailabilityChange(index, "to", e.target.value)}
                      disabled={!item.enabled}
                      className="w-32"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Imágenes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Imágenes</h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Imagen de Perfil</label>
              {formData.profileImage ? (
                <div className="relative inline-block">
                  <img
                    src={formData.profileImage || "/placeholder.svg"}
                    alt="Perfil"
                    className="w-32 h-32 object-cover rounded-full"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, profileImage: null }))}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-border rounded-full cursor-pointer hover:bg-muted/50">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Imágenes de Portfolio ({formData.portfolioImages.length}/10)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.portfolioImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Portfolio ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePortfolioImage(idx)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {formData.portfolioImages.length < 10 && (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50">
                    <Upload className="h-8 w-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Agregar</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePortfolioImagesChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Puedes subir hasta 10 imágenes de tus trabajos anteriores</p>
            </div>
          </div>

          {/* Publicación */}
          <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublished: checked as boolean }))}
              />
              <div>
                <label htmlFor="isPublished" className="text-sm font-medium text-foreground cursor-pointer">
                  Publicar mi perfil
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Al marcar esta opción, tu perfil será visible en las búsquedas públicas y podrás recibir solicitudes
                  de contratación.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar Perfil"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
