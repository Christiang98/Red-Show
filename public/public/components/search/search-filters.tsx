"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, SlidersHorizontal, X } from "lucide-react"

interface SearchFilters {
  query: string
  location: string
  eventType: string
  serviceCategory: string
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void
  userRole?: string
  initialCategory?: string
}

export function SearchFilters({ onFiltersChange, userRole, initialCategory }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    location: "",
    eventType: "",
    serviceCategory: initialCategory || "",
  })

  const [isExpanded, setIsExpanded] = useState(false)

  // Actualizar filtros cuando cambia la categoria inicial
  useEffect(() => {
    if (initialCategory && initialCategory !== filters.serviceCategory) {
      setFilters(prev => ({ ...prev, serviceCategory: initialCategory }))
    }
  }, [initialCategory])

  const handleChange = (field: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleReset = () => {
    // Al resetear, volver al filtro inteligente por defecto segun el rol
    const defaultCategory = userRole === "artist" ? "space" : userRole === "owner" ? "artist" : ""
    const emptyFilters = {
      query: "",
      location: "",
      eventType: "",
      serviceCategory: defaultCategory,
    }
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const quickFilters = [
    { value: "space", label: "Espacios", forRole: "artist" },
    { value: "artist", label: "Artistas", forRole: "owner" },
    { value: "music", label: "Musica/DJ", forRole: "all" },
    { value: "photography", label: "Fotografia", forRole: "all" },
    { value: "catering", label: "Catering", forRole: "all" },
    { value: "decoration", label: "Decoracion", forRole: "all" },
    { value: "comedy", label: "Comedia", forRole: "all" },
  ]

  // Filtrar los quick filters segun el rol del usuario
  const visibleQuickFilters = quickFilters.filter(f => {
    if (f.forRole === "all") return true
    if (userRole === "artist" && f.forRole === "artist") return true
    if (userRole === "owner" && f.forRole === "owner") return true
    // Permitir que todos vean todas las categorias pero priorizar las relevantes
    return true
  })

  return (
    <Card className="p-6 mb-8">
      <div className="space-y-6">
        {/* Busqueda principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Busca espacios, artistas o servicios..."
            value={filters.query}
            onChange={(e) => handleChange("query", e.target.value)}
            className="pl-10 text-base h-12"
          />
        </div>

        {/* Filtros rapidos */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Filtros rapidos:</p>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filters.serviceCategory === "" ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                filters.serviceCategory === ""
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-primary/10 bg-transparent"
              }`}
              onClick={() => handleChange("serviceCategory", "")}
            >
              Todos
            </Badge>
            {visibleQuickFilters.map((filter) => (
              <Badge
                key={filter.value}
                variant={filters.serviceCategory === filter.value ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                  filters.serviceCategory === filter.value
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/10 bg-transparent"
                }`}
                onClick={() => handleChange("serviceCategory", filter.value)}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Filtros expandibles */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-secondary hover:text-secondary/80 text-sm font-medium w-full"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {isExpanded ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
        </button>

        {isExpanded && (
          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-border">
            {/* Ubicacion */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Ubicacion</label>
              <select
                value={filters.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="">Todas las ciudades</option>
                <option value="buenos_aires">Buenos Aires</option>
                <option value="cordoba">Cordoba</option>
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
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="">Todos los eventos</option>
                <option value="wedding">Matrimonio</option>
                <option value="corporate">Evento Corporativo</option>
                <option value="birthday">Cumpleanos</option>
                <option value="concert">Concierto</option>
                <option value="conference">Conferencia</option>
                <option value="other">Otro</option>
              </select>
            </div>

            {/* Categoria de servicio (para busqueda mas especifica) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Categoria de Servicio</label>
              <select
                value={filters.serviceCategory}
                onChange={(e) => handleChange("serviceCategory", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="">Todas las categorias</option>
                <option value="space">Espacios</option>
                <option value="artist">Artistas (todos)</option>
                <option value="music">Musica/DJ</option>
                <option value="photography">Fotografia/Video</option>
                <option value="catering">Catering</option>
                <option value="decoration">Decoracion</option>
                <option value="comedy">Comedia</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>
        )}

        {/* Botones de accion */}
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent">
            <X className="h-4 w-4 mr-2" />
            Limpiar Filtros
          </Button>
        </div>
      </div>
    </Card>
  )
}
