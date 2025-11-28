"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface ArtistProfileData {
  artistName: string
  category: string
  yearsOfExperience: number
  portfolioUrl: string
  description: string
  profileImage: File | null
}

export function ArtistProfileForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ArtistProfileData>({
    artistName: "",
    category: "",
    yearsOfExperience: 0,
    portfolioUrl: "",
    description: "",
    profileImage: null,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "yearsOfExperience" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, profileImage: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log("[v0] Perfil artista guardado:", formData)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Perfil Artista</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nombre Artístico</label>
              <Input
                type="text"
                name="artistName"
                value={formData.artistName}
                onChange={handleInputChange}
                placeholder="Ej: DJ Phoenix"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Categoría</label>
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
                <option value="gastronomy">Gastronómico</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Años de Experiencia</label>
              <Input
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                placeholder="5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">URL del Portfolio</label>
              <Input
                type="url"
                name="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={handleInputChange}
                placeholder="https://miportfolio.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Cuéntanos sobre ti, tu estilo, experiencia..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Imagen de Perfil</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
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
