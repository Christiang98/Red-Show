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
  policies: string
  profileImage: string | null
  featuredImage: string | null
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
    policies: "",
    profileImage: null,
    featuredImage: null,
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
        const hoursData = data.specificProfile.business_hours_data
          ? JSON.parse(data.specificProfile.business_hours_data)
          : DAYS_OF_WEEK.map((day) => ({ day, enabled: false, from: "09:00", to: "18:00" }))

        const servicesData = data.specificProfile.services ? JSON.parse(data.specificProfile.services) : []

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
          policies: data.specificProfile.policies || "",
          profileImage: data.specificProfile.profile_image || null,
          featuredImage: data.specificProfile.featured_image || null,
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
      console.log("[v0] Imagen procesada:", fieldName)
    } catch (error) {
      console.error("[v0] Error procesando imagen:", error)
      alert("Error procesando la imagen. Intenta con otra.")
    }
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
            policies: formData.policies,
            profileImage: formData.profileImage,
            featuredImage: formData.featuredImage,
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
        <h2 className="text-2xl font-bold text-primary mb-6">Perfil del Establecimiento</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Información General</h3>

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
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="salon">Salón de Eventos</option>
                  <option value="bar">Bar</option>
                  <option value="restaurant">Restaurante</option>
                  <option value="cultural">Centro Cultural</option>
                  <option value="theater">Teatro</option>
                  <option value="club">Club/Discoteca</option>
                  <option value="hotel">Hotel/Salón de Hotel</option>
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

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Ubicación</h3>

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
              <label className="block text-sm font-medium text-foreground mb-2">Dirección Completa</label>
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

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Descripción del Espacio</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe tu espacio, características, ambiente..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Días y Horarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Días y Horarios de Funcionamiento
            </h3>
            <p className="text-sm text-muted-foreground">Marca los días y horarios en que tu negocio está abierto</p>

            <div className="space-y-3">
              {formData.businessHours.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-2 w-32">
                    <Checkbox
                      checked={item.enabled}
                      onCheckedChange={(checked) => handleBusinessHoursChange(index, "enabled", checked as boolean)}
                    />
                    <label className="text-sm font-medium">{item.day}</label>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={item.from}
                      onChange={(e) => handleBusinessHoursChange(index, "from", e.target.value)}
                      disabled={!item.enabled}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">hasta</span>
                    <Input
                      type="time"
                      value={item.to}
                      onChange={(e) => handleBusinessHoursChange(index, "to", e.target.value)}
                      disabled={!item.enabled}
                      className="w-32"
                    />
                  </div>
                </div>
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
                  placeholder="Página de Facebook"
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

          {/* Servicios Adicionales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Servicios Adicionales</h3>
            <p className="text-sm text-muted-foreground">Selecciona los servicios que ofrece tu establecimiento</p>

            <div className="grid md:grid-cols-3 gap-3">
              {AVAILABLE_SERVICES.map((service) => (
                <div key={service} className="flex items-center gap-2">
                  <Checkbox
                    id={`service-${service}`}
                    checked={formData.services.includes(service)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                  <label htmlFor={`service-${service}`} className="text-sm cursor-pointer">
                    {service}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Políticas de Contratación */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Políticas de Contratación</label>
            <textarea
              name="policies"
              value={formData.policies}
              onChange={handleInputChange}
              placeholder="Depósito requerido, política de cancelación, términos de uso..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Imágenes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Imágenes</h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Imagen de perfil */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Imagen de Perfil</label>
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
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50">
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Subir imagen de perfil</span>
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Imagen Destacada del Establecimiento
                </label>
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
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50">
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Subir imagen destacada</span>
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
                  Publicar mi establecimiento
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Al marcar esta opción, tu establecimiento será visible en las búsquedas públicas y podrás recibir
                  solicitudes de contratación.
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
