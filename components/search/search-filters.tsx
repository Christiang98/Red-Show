"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface SearchFilters {
  query: string
  location: string
  eventType: string
  serviceCategory: string
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    location: "",
    eventType: "",
    serviceCategory: "",
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const handleChange = (field: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleReset = () => {
    const emptyFilters = {
      query: "",
      location: "",
      eventType: "",
      serviceCategory: "",
    }
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  return (
    <Card className="p-6 mb-8">
      <div className="space-y-6">
        {/* Búsqueda principal */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">¿Qué buscas?</label>
          <Input
            type="text"
            placeholder="Busca espacios, artistas o servicios..."
            value={filters.query}
            onChange={(e) => handleChange("query", e.target.value)}
            className="text-base"
          />
        </div>

        {/* Filtros expandibles */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-secondary hover:underline text-sm font-medium w-full text-left"
        >
          {isExpanded ? "− Ocultar filtros avanzados" : "+ Mostrar filtros avanzados"}
        </button>

        {isExpanded && (
          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-border">
            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Ubicación</label>
              <select
                value={filters.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas las ciudades</option>
                <option value="buenos_aires">Buenos Aires</option>
                <option value="cordoba">Córdoba</option>
                <option value="rosario">Rosario</option>
                <option value="mendoza">Mendoza</option>
                <option value="la_plata">La Plata</option>
              </select>
            </div>

            {/* Tipo de evento */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tipo de Evento</label>
              <select
                value={filters.eventType}
                onChange={(e) => handleChange("eventType", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos los eventos</option>
                <option value="wedding">Matrimonio</option>
                <option value="corporate">Evento Corporativo</option>
                <option value="birthday">Cumpleaños</option>
                <option value="concert">Concierto</option>
                <option value="conference">Conferencia</option>
                <option value="other">Otro</option>
              </select>
            </div>

            {/* Categoría de servicio */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Categoría de Servicio</label>
              <select
                value={filters.serviceCategory}
                onChange={(e) => handleChange("serviceCategory", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas las categorías</option>
                <option value="space">Espacios</option>
                <option value="music">Música/DJ</option>
                <option value="photography">Fotografía</option>
                <option value="catering">Catering</option>
                <option value="decoration">Decoración</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent">
            Limpiar Filtros
          </Button>
        </div>
      </div>
    </Card>
  )
}
