"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { compressImage } from "@/lib/image-utils"
import { Upload, X, Check, Clock, Calendar, ImageIcon } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ArtistProfileData {
  stageName: string
  category: string
  otherCategory: string
  serviceType: string
  priceRange: string
  priceMin: string
  priceMax: string
  bio: string
  experienceYears: number
  portfolioUrl: string
  instagram: string
  tiktok: string
  otherSocial: string
  phone: string
  location: string
  neighborhood: string
  availability: {
    day: string
    enabled: boolean
    from: string
    to: string
  }[]
  profileImage: string | null
  featuredImage: string | null
  portfolioImages: string[]
  isPublished: boolean
}

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]

export function ArtistProfileForm() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState<ArtistProfileData>({
    stageName: "",
    category: "",
    otherCategory: "",
    serviceType: "",
    priceRange: "",
    priceMin: "",
    priceMax: "",
    bio: "",
    experienceYears: 0,
    portfolioUrl: "",
    instagram: "",
    tiktok: "",
    otherSocial: "",
    phone: "",
    location: "",
    neighborhood: "",
    availability: DAYS_OF_WEEK.map((day) => ({ day, enabled: false, from: "09:00", to: "18:00" })),
    profileImage: null,
    featuredImage: null,
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
          priceMin: data.specificProfile.price_min || "",
          priceMax: data.specificProfile.price_max || "",
          bio: data.specificProfile.bio || "",
          experienceYears: data.specificProfile.experience_years || 0,
          portfolioUrl: data.specificProfile.portfolio_url || "",
          instagram: data.profile?.instagram || "",
          tiktok: data.profile?.tiktok || "",
          otherSocial: data.profile?.other_social || "",
          phone: data.profile?.phone || "",
          location: data.profile?.location || "",
          neighborhood: data.specificProfile.neighborhood || "",
          availability: availabilityData,
          profileImage: data.specificProfile.profile_image || null,
          featuredImage: data.specificProfile.featured_image || null,
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

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "profileImage" | "featuredImage" = "profileImage",
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressed = await compressImage(file, fieldName === "profileImage" ? 400 : 1200)
      setFormData((prev) => ({ ...prev, [fieldName]: compressed }))
      toast({
        title: "Imagen cargada",
        description: "La imagen se ha procesado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error procesando la imagen",
        variant: "destructive",
      })
    }
  }

  const removeImage = (fieldName: "profileImage" | "featuredImage") => {
    setFormData((prev) => ({ ...prev, [fieldName]: null }))
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
      toast({
        title: "Imagenes agregadas",
        description: `Se agregaron ${compressed.length} imagen(es) al portfolio`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error procesando las imagenes",
        variant: "destructive",
      })
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
        toast({
          title: "Error",
          description: "No se encontro informacion de usuario",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

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
            phone: formData.phone,
            instagram: formData.instagram,
            tiktok: formData.tiktok,
            otherSocial: formData.otherSocial,
          },
          specificProfileData: {
            stageName: formData.stageName,
            category: formData.category,
            otherCategory: formData.otherCategory,
            serviceType: formData.serviceType,
            priceRange: formData.priceRange,
            priceMin: formData.priceMin,
            priceMax: formData.priceMax,
            bio: formData.bio,
            experienceYears: formData.experienceYears,
            portfolioUrl: formData.portfolioUrl,
            neighborhood: formData.neighborhood,
            availability: JSON.stringify(formData.availability),
            profileImage: formData.profileImage,
            featuredImage: formData.featuredImage,
            portfolioImages: JSON.stringify(formData.portfolioImages),
            isPublished: formData.isPublished,
          },
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Perfil guardado",
          description: "Tu perfil se ha guardado exitosamente",
        })
        setTimeout(() => router.push("/my-profile"), 1500)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error guardando el perfil",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error guardando el perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Perfil de Artista Emprendedor</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identidad Artistica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Identidad Artistica</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre Artistico *</label>
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
                <label className="block text-sm font-medium text-foreground mb-2">Categoria *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground appearance-none cursor-pointer hover:border-primary/50 transition-colors"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  
                  {/* Música */}
                  <option value="musico">🎵 Músico Solista</option>
                  <option value="banda">🎸 Banda Musical</option>
                  <option value="dj">🎧 DJ</option>
                  <option value="cantante">🎤 Cantante</option>
                  <option value="orquesta">🎻 Orquesta</option>
                  <option value="mariachi">🎺 Mariachi</option>
                  
                  {/* Entretenimiento */}
                  <option value="comediante">😄 Comediante</option>
                  <option value="mago">🎩 Mago/Ilusionista</option>
                  <option value="animador">🎉 Animador de Eventos</option>
                  <option value="payaso">🤡 Payaso Infantil</option>
                  <option value="mimo">🎭 Mimo/Performer</option>
                  <option value="bailarin">💃 Bailarín/Coreógrafo</option>
                  
                  {/* Visual */}
                  <option value="fotografo">📷 Fotógrafo</option>
                  <option value="videografo">🎥 Videógrafo</option>
                  <option value="drone">🚁 Operador de Drone</option>
                  
                  {/* Servicios */}
                  <option value="gastronomia">🍽️ Gastronómico/Catering</option>
                  <option value="bartender">🍸 Bartender/Coctelería</option>
                  <option value="decorador">🎨 Decorador de Eventos</option>
                  <option value="florista">🌸 Florista/Arreglos Florales</option>
                  <option value="maquillador">💄 Maquillador Profesional</option>
                  <option value="peluquero">💇 Peluquero/Estilista</option>
                  <option value="productor">🎬 Productor de Eventos</option>
                  <option value="sonido">🔊 Técnico de Sonido/Luces</option>
                  
                  {/* Otros */}
                  <option value="otro">➕ Otro</option>
                </select>
              </div>
            </div>

            {formData.category === "otro" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Especifica tu categoría</label>
                <Input
                  type="text"
                  name="otherCategory"
                  value={formData.otherCategory}
                  onChange={handleInputChange}
                  placeholder="Ej: Actor de teatro, Artista circense, etc."
                />
              </div>
            )}
          </div>

          {/* Servicio y Tarifas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Servicio y Tarifas</h3>

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
              <label className="block text-sm font-medium text-foreground mb-2">Precio / Tarifa</label>
              <Input
                type="text"
                name="priceRange"
                value={formData.priceRange}
                onChange={handleInputChange}
                placeholder="Ej: $50.000 por show, $80.000 por evento completo"
              />
              <p className="text-xs text-muted-foreground mt-1">Escribe tu precio o tarifa como prefieras. Es referencial y puede variar segun el evento.</p>
            </div>
          </div>

          {/* Biografia */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Biografia</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Cuentanos sobre ti, tu estilo, experiencia..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
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

          {/* Redes Sociales y Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Redes Sociales y Contacto</h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Telefono de Contacto</label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+54 9 11 1234-5678"
              />
            </div>

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

          {/* Ubicacion */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Ubicacion</h3>

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

          {/* Disponibilidad Horaria - misma estética que Owner */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Disponibilidad Horaria</h3>
            </div>
            <p className="text-sm text-muted-foreground">Activa los días en que estás disponible para trabajar</p>

            <div className="space-y-3">
              {formData.availability.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAvailabilityChange(index, "enabled", !item.enabled)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    item.enabled
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  {/* Checkbox visual */}
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      item.enabled
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/50 bg-background"
                    }`}
                  >
                    {item.enabled && <Check className="h-4 w-4 text-primary-foreground" />}
                  </div>

                  {/* Nombre del día */}
                  <span
                    className={`text-base font-semibold w-28 text-left ${
                      item.enabled ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {item.day}
                  </span>

                  {/* Horarios */}
                  <div
                    className="flex items-center gap-2 flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Clock className={`h-4 w-4 ${item.enabled ? "text-primary" : "text-muted-foreground"}`} />
                    <Input
                      type="time"
                      value={item.from}
                      onChange={(e) => handleAvailabilityChange(index, "from", e.target.value)}
                      disabled={!item.enabled}
                      className={`w-28 ${!item.enabled ? "opacity-40" : "border-primary/50"}`}
                    />
                    <span className={`${item.enabled ? "text-foreground" : "text-muted-foreground"}`}>a</span>
                    <Input
                      type="time"
                      value={item.to}
                      onChange={(e) => handleAvailabilityChange(index, "to", e.target.value)}
                      disabled={!item.enabled}
                      className={`w-28 ${!item.enabled ? "opacity-40" : "border-primary/50"}`}
                    />
                  </div>

                  {/* Indicador activo */}
                  {item.enabled && (
                    <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Disponible
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Imagenes - MEJORADO */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Imagenes</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Imagen de perfil */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Imagen de Perfil</label>
                <p className="text-xs text-muted-foreground mb-3">Esta imagen aparecera en los resultados de busqueda</p>
                {formData.profileImage ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.profileImage || "/placeholder.svg"}
                      alt="Perfil"
                      className="w-32 h-32 object-cover rounded-full border-4 border-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage("profileImage")}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-primary/50 rounded-full cursor-pointer hover:bg-primary/5 transition-colors">
                    <Upload className="h-8 w-8 text-primary" />
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "profileImage")} className="hidden" />
                  </label>
                )}
              </div>

              {/* Imagen destacada / portada */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Imagen Destacada (Portada)</label>
                <p className="text-xs text-muted-foreground mb-3">Imagen de cabecera para tu perfil publico, distinta a tu foto de perfil</p>
                {formData.featuredImage ? (
                  <div className="relative">
                    <img
                      src={formData.featuredImage || "/placeholder.svg"}
                      alt="Destacada"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage("featuredImage")}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                    <Upload className="h-12 w-12 text-primary mb-2" />
                    <span className="text-sm text-primary font-medium">Subir imagen destacada</span>
                    <span className="text-xs text-muted-foreground mt-1">JPG, PNG hasta 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "featuredImage")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Imagenes de Portfolio ({formData.portfolioImages.length}/10)
              </label>
              <p className="text-xs text-muted-foreground mb-3">Agrega hasta 10 imagenes de tus trabajos anteriores</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {formData.portfolioImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Portfolio ${idx + 1}`}
                      className="w-full h-28 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePortfolioImage(idx)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {formData.portfolioImages.length < 10 && (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-secondary/50 rounded-lg cursor-pointer hover:bg-secondary/5 transition-colors">
                    <Upload className="h-6 w-6 text-secondary mb-1" />
                    <span className="text-xs text-secondary">Agregar</span>
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
            </div>
          </div>

          {/* Publicacion - mayor visibilidad */}
          <div className={`p-6 rounded-xl border-2 transition-all ${formData.isPublished 
            ? 'bg-gradient-to-r from-secondary/15 to-primary/15 border-secondary shadow-lg shadow-secondary/10' 
            : 'bg-gradient-to-r from-secondary/5 to-primary/5 border-secondary/30'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${formData.isPublished ? 'bg-success animate-pulse' : 'bg-gray-300'}`} />
                  <h4 className="text-lg font-bold text-foreground">
                    {formData.isPublished ? "✅ Perfil Publicado" : "Publicar Perfil Público"}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.isPublished 
                    ? "Tu perfil es visible en las búsquedas y puede recibir solicitudes." 
                    : "Activá esta opción para aparecer en búsquedas y recibir solicitudes de contratación."}
                </p>
              </div>
              <Switch
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublished: checked }))}
                className="scale-150"
              />
            </div>
            {!formData.isPublished && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <span className="text-amber-600 text-lg">⚠️</span>
                <span className="text-sm text-amber-800 font-medium">Tu perfil no está visible para otros usuarios hasta que lo publiques.</span>
              </div>
            )}
            {formData.isPublished && (
              <div className="mt-4 flex items-center gap-2 text-success">
                <Check className="h-5 w-5" />
                <span className="text-sm font-semibold">Tu perfil es visible para todos los usuarios de Red Show</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground h-14 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl transition-all hover:shadow-xl hover:shadow-primary/30"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar Perfil"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
