"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface OwnerProfileData {
  businessName: string
  businessType: string
  address: string
  capacity: number
  description: string
  alternateContact: string
  businessHours: string
  additionalServices: string
  policies: string
  cuitCuil: string
  profileImage: File | null
  featuredImage: File | null
}

export function OwnerProfileForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<OwnerProfileData>({
    businessName: "",
    businessType: "",
    address: "",
    capacity: 0,
    description: "",
    alternateContact: "",
    businessHours: "",
    additionalServices: "",
    policies: "",
    cuitCuil: "",
    profileImage: null,
    featuredImage: null,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "profileImage" | "featuredImage") => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, [fieldName]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log("[v0] Perfil propietario guardado:", formData)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Perfil del Establecimiento</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Información Básica</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre del Negocio</label>
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
                <label className="block text-sm font-medium text-foreground mb-2">Tipo de Negocio</label>
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
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Dirección</label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Av. Principal 1234"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Capacidad</label>
                <Input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">CUIT/CUIL</label>
                <Input
                  type="text"
                  name="cuitCuil"
                  value={formData.cuitCuil}
                  onChange={handleInputChange}
                  placeholder="20123456789"
                />
              </div>
            </div>
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

          {/* Servicios y Políticas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Servicios Adicionales</label>
              <textarea
                name="additionalServices"
                value={formData.additionalServices}
                onChange={handleInputChange}
                placeholder="Estacionamiento, catering, acceso WiFi..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Políticas de Contratación</label>
              <textarea
                name="policies"
                value={formData.policies}
                onChange={handleInputChange}
                placeholder="Depósito requerido, cancelación, términos..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Horarios */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Horarios de Funcionamiento</label>
            <Input
              type="text"
              name="businessHours"
              value={formData.businessHours}
              onChange={handleInputChange}
              placeholder="Lun-Jue: 18hs-02hs / Vie-Sab: 18hs-04hs"
            />
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

          {/* Imágenes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Imagen de Perfil</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "profileImage")}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Imagen Destacada del Establecimiento
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "featuredImage")}
                className="w-full"
              />
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
