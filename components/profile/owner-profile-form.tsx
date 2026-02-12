"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { compressImage } from "@/lib/image-utils"
import { Upload, X, Check, ImageIcon, Clock, Calendar } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface OwnerProfileData {
  businessName: string
  businessType: string
  otherBusinessType: string
  city: string
  neighborhood: string
  address: string
  capacity: number
  description: string
  businessHours: {
    day: string
    enabled: boolean
    from: string
    to: string
  }[]
  instagram: string
  tiktok: string
  facebook: string
  alternateContact: string
  services: string[]
  otherService: string
  policies: string
  profileImage: string | null
  featuredImage: string | null
  galleryImages: string[]
  isPublished: boolean
}

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

const AVAILABLE_SERVICES = [
  "Sonido Profesional",
  "Luces y Efectos",
  "WiFi",
  "Estacionamiento",
  "Catering",
  "Bar",
  "Aire Acondicionado",
  "Calefacción",
  "Proyector",
  "Escenario",
  "Cocina",
  "Vestuarios",
]

export function OwnerProfileForm() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState<OwnerProfileData>({
    businessName: "",
    businessType: "",
    otherBusinessType: "",
    city: "",
    neighborhood: "",
    address: "",
    capacity: 0,
    description: "",
    businessHours: DAYS_OF_WEEK.map((day) => ({ day, enabled: false, from: "09:00", to: "18:00" })),
    instagram: "",
    tiktok: "",
    facebook: "",
    alternateContact: "",
    services: [],
    otherService: "",
    policies: "",
    profileImage: null,
    featuredImage: null,
    galleryImages: [],
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
        const hoursData = data.specificProfile.business_hours_data
          ? JSON.parse(data.specificProfile.business_hours_data)
          : DAYS_OF_WEEK.map((day) => ({ day, enabled: false, from: "09:00", to: "18:00" }))

        const servicesData = data.specificProfile.services ? JSON.parse(data.specificProfile.services) : []
        const galleryData = data.specificProfile.gallery_images ? JSON.parse(data.specificProfile.gallery_images) : []

        setFormData({
          businessName: data.specificProfile.business_name || "",
          businessType: data.specificProfile.business_type || "",
          otherBusinessType: data.specificProfile.other_business_type || "",
          city: data.specificProfile.city || "",
          neighborhood: data.specificProfile.neighborhood || "",
          address: data.specificProfile.address || "",
          capacity: data.specificProfile.capacity || 0,
          description: data.specificProfile.description || "",
          businessHours: hoursData,
          instagram: data.profile?.instagram || "",
          tiktok: data.profile?.tiktok || "",
          facebook: data.profile?.facebook || "",
          alternateContact: data.profile?.phone || "",
          services: servicesData,
          otherService: data.specificProfile.other_service || "",
          policies: data.specificProfile.policies || "",
          profileImage: data.specificProfile.profile_image || null,
          featuredImage: data.specificProfile.featured_image || null,
          galleryImages: galleryData,
          isPublished: data.specificProfile.is_published || false,
        })
      }
    } catch (error) {
      console.error("[v0] Error cargando perfil:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleBusinessHoursChange = (index: number, field: "enabled" | "from" | "to", value: boolean | string) => {
    setFormData((prev) => ({
      ...prev,
      businessHours: prev.businessHours.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }))
  }

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "profileImage" | "featuredImage",
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
        description: "Error procesando la imagen. Intenta con otra.",
        variant: "destructive",
      })
    }
  }

  const handleGalleryImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      const compressed = await Promise.all(files.map((file) => compressImage(file, 800)))
      setFormData((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...compressed].slice(0, 10),
      }))
      toast({
        title: "Imagenes agregadas",
        description: `Se agregaron ${compressed.length} imagen(es) a la galeria`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error procesando las imagenes",
        variant: "destructive",
      })
    }
  }

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }))
  }

  const removeImage = (fieldName: "profileImage" | "featuredImage") => {
    setFormData((prev) => ({ ...prev, [fieldName]: null }))
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
          role: "owner",
          profileData: {
            bio: formData.description,
            location: `${formData.city}, ${formData.neighborhood}`,
            avatarUrl: formData.profileImage,
            phone: formData.alternateContact,
            instagram: formData.instagram,
            tiktok: formData.tiktok,
            facebook: formData.facebook,
          },
          specificProfileData: {
            businessName: formData.businessName,
            businessType: formData.businessType,
            otherBusinessType: formData.otherBusinessType,
            city: formData.city,
            neighborhood: formData.neighborhood,
            address: formData.address,
            capacity: formData.capacity,
            description: formData.description,
            businessHoursData: JSON.stringify(formData.businessHours),
            services: JSON.stringify(formData.services),
            otherService: formData.otherService,
            policies: formData.policies,
            profileImage: formData.profileImage,
            featuredImage: formData.featuredImage,
            galleryImages: JSON.stringify(formData.galleryImages),
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
        <h2 className="text-2xl font-bold text-primary mb-6">Perfil del Establecimiento</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informacion General */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Informacion General</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre del Negocio *</label>
                <Input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Ej: La Sala del Tango"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tipo de Negocio *</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="salon">Salon de Eventos</option>
                  <option value="bar">Bar</option>
                  <option value="restaurant">Restaurante</option>
                  <option value="cultural">Centro Cultural</option>
                  <option value="theater">Teatro</option>
                  <option value="club">Club/Discoteca</option>
                  <option value="hotel">Hotel/Salon de Hotel</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            {formData.businessType === "other" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Especifica el tipo de negocio</label>
                <Input
                  type="text"
                  name="otherBusinessType"
                  value={formData.otherBusinessType}
                  onChange={handleInputChange}
                  placeholder="Ej: Espacio al aire libre"
                />
              </div>
            )}
          </div>

          {/* Ubicacion */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Ubicacion</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ciudad/Provincia *</label>
                <Input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Buenos Aires, Argentina"
                  required
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Direccion Completa</label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Av. Principal 1234"
              />
            </div>
          </div>

          {/* Capacidad */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Capacidad de Personas</label>
            <Input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              placeholder="200"
              min="0"
            />
          </div>

          {/* Descripcion */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Descripcion del Espacio</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe tu espacio, caracteristicas, ambiente..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          {/* Dias y Horarios - MEJORADO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Dias y Horarios de Funcionamiento</h3>
            </div>
            <p className="text-sm text-muted-foreground">Selecciona los dias en que tu negocio esta abierto</p>

            <div className="space-y-3">
              {formData.businessHours.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleBusinessHoursChange(index, "enabled", !item.enabled)}
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

                  {/* Nombre del dia */}
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
                      onChange={(e) => handleBusinessHoursChange(index, "from", e.target.value)}
                      disabled={!item.enabled}
                      className={`w-28 ${!item.enabled ? "opacity-40" : "border-primary/50"}`}
                    />
                    <span className={`${item.enabled ? "text-foreground" : "text-muted-foreground"}`}>a</span>
                    <Input
                      type="time"
                      value={item.to}
                      onChange={(e) => handleBusinessHoursChange(index, "to", e.target.value)}
                      disabled={!item.enabled}
                      className={`w-28 ${!item.enabled ? "opacity-40" : "border-primary/50"}`}
                    />
                  </div>

                  {/* Indicador activo */}
                  {item.enabled && (
                    <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Abierto
                    </span>
                  )}
                </button>
              ))}
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
                  placeholder="@negocio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">TikTok</label>
                <Input
                  type="text"
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleInputChange}
                  placeholder="@negocio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Facebook</label>
                <Input
                  type="text"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleInputChange}
                  placeholder="Pagina de Facebook"
                />
              </div>
            </div>
          </div>

          {/* Contacto Alternativo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Contacto Alternativo</label>
            <Input
              type="tel"
              name="alternateContact"
              value={formData.alternateContact}
              onChange={handleInputChange}
              placeholder="+54 9 1234 56789"
            />
          </div>

          {/* Servicios Adicionales - MEJORADO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Servicios Adicionales</h3>
            <p className="text-sm text-muted-foreground">Selecciona los servicios que ofrece tu establecimiento</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AVAILABLE_SERVICES.map((service) => {
                const isSelected = formData.services.includes(service)
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleServiceToggle(service)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                      isSelected
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-border bg-background text-foreground hover:border-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                      <span>{service}</span>
                    </div>
                  </button>
                )
              })}

              {/* Opción Otro */}
              <button
                type="button"
                onClick={() => handleServiceToggle("__other__")}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                  formData.services.includes("__other__")
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-border bg-background text-foreground hover:border-secondary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {formData.services.includes("__other__") && <Check className="h-4 w-4 flex-shrink-0" />}
                  <span>Otro</span>
                </div>
              </button>
            </div>

            {/* Campo de texto para servicio personalizado */}
            {formData.services.includes("__other__") && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Especifica el servicio adicional</label>
                <Input
                  type="text"
                  name="otherService"
                  value={formData.otherService}
                  onChange={handleInputChange}
                  placeholder="Ej: Seguridad privada, salón de fumadores..."
                />
              </div>
            )}
          </div>

          {/* Politicas de Contratacion */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Politicas de Contratacion</label>
            <textarea
              name="policies"
              value={formData.policies}
              onChange={handleInputChange}
              placeholder="Deposito requerido, politica de cancelacion, terminos de uso..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          {/* Imagenes - MEJORADO */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Imagenes del Establecimiento</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Imagen de perfil */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Imagen de Perfil</label>
                <p className="text-xs text-muted-foreground mb-3">Esta imagen aparecera en los resultados de busqueda</p>
                {formData.profileImage ? (
                  <div className="relative">
                    <img
                      src={formData.profileImage || "/placeholder.svg"}
                      alt="Perfil"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage("profileImage")}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                    <Upload className="h-12 w-12 text-primary mb-2" />
                    <span className="text-sm text-primary font-medium">Subir imagen de perfil</span>
                    <span className="text-xs text-muted-foreground mt-1">JPG, PNG hasta 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "profileImage")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Imagen destacada */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Imagen Destacada</label>
                <p className="text-xs text-muted-foreground mb-3">Imagen principal de tu perfil publico</p>
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

            {/* Galeria de imagenes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Galeria de Fotos ({formData.galleryImages.length}/10)
              </label>
              <p className="text-xs text-muted-foreground mb-3">Agrega hasta 10 fotos de tu establecimiento</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {formData.galleryImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Galeria ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {formData.galleryImages.length < 10 && (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-secondary/50 rounded-lg cursor-pointer hover:bg-secondary/5 transition-colors">
                    <Upload className="h-6 w-6 text-secondary mb-1" />
                    <span className="text-xs text-secondary">Agregar</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImagesChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Publicacion - mayor visibilidad MEJORADO */}
          <div className={`p-8 rounded-2xl border-3 transition-all duration-300 ${formData.isPublished 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-500 shadow-2xl shadow-green-500/20' 
            : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-400 shadow-xl shadow-amber-500/10'}`}>
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-4 h-4 rounded-full ${formData.isPublished ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50'}`} />
                  <h4 className={`text-xl font-black ${formData.isPublished ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {formData.isPublished ? "✅ Establecimiento Visible Públicamente" : "⚠️ Activar Visibilidad Pública"}
                  </h4>
                </div>
                <p className={`text-sm font-medium ${formData.isPublished ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {formData.isPublished 
                    ? "Tu establecimiento aparece en las búsquedas y puedes recibir solicitudes de contratación." 
                    : "Activa este interruptor para que tu establecimiento sea visible y recibir oportunidades."}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublished: checked }))}
                  className={`scale-[1.8] ${formData.isPublished ? 'data-[state=checked]:bg-green-500' : ''}`}
                />
                <span className={`text-xs font-bold ${formData.isPublished ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {formData.isPublished ? 'VISIBLE' : 'OCULTO'}
                </span>
              </div>
            </div>
            {!formData.isPublished && (
              <div className="mt-6 p-4 bg-amber-100 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600 rounded-xl flex items-start gap-3 shadow-lg">
                <span className="text-amber-600 dark:text-amber-400 text-2xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-sm text-amber-900 dark:text-amber-200 font-bold mb-1">Establecimiento no visible</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">Tu establecimiento está oculto. Activa el interruptor arriba para aparecer en búsquedas y recibir contrataciones.</p>
                </div>
              </div>
            )}
            {formData.isPublished && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-400 dark:border-green-600 rounded-xl flex items-center gap-3 shadow-lg">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-900 dark:text-green-200 mb-1">¡Establecimiento activo!</p>
                  <p className="text-xs text-green-800 dark:text-green-300">Tu establecimiento es visible para todos los usuarios de Red Show.</p>
                </div>
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
