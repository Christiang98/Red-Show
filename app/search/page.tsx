"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/protectedRoute"
import { SearchFilters as SearchFiltersComponent } from "@/components/search/search-filters"
import { ResultCard } from "@/components/search/result-card"
import { Card } from "@/components/ui/card"

// Mock data - en producción vendría de la API
const mockResults = [
  {
    id: "1",
    type: "owner" as const,
    name: "La Sala del Tango",
    category: "Salón de Eventos",
    location: "Buenos Aires, San Telmo",
    rating: 4.8,
    image: "/hair-salon-interior.png",
    description: "Espacio moderno de 300 personas con servicios completos para eventos",
  },
  {
    id: "2",
    type: "artist" as const,
    name: "DJ Phoenix",
    category: "DJ - Música Electrónica",
    location: "Buenos Aires",
    rating: 4.9,
    image: "/dj-at-turntables.png",
    description: "Especialista en electrónica y house con 8 años de experiencia",
  },
  {
    id: "3",
    type: "owner" as const,
    name: "Garden Party Venue",
    category: "Jardín para Eventos",
    location: "Buenos Aires, Flores",
    rating: 4.7,
    image: "/jardin.jpg",
    description: "Espacio natural perfecto para bodas y celebraciones al aire libre",
  },
  {
    id: "4",
    type: "artist" as const,
    name: "Fotógrafos Creatives",
    category: "Fotografía Profesional",
    location: "Buenos Aires",
    rating: 4.9,
    image: "/fotografia.jpg",
    description: "Cobertura completa de eventos con edición digital profesional",
  },
  {
    id: "5",
    type: "owner" as const,
    name: "La Estancia Restaurante",
    category: "Restaurante - Catering",
    location: "Buenos Aires, Recoleta",
    rating: 4.6,
    image: "/cozy-italian-restaurant.png",
    description: "Menús variados con opciones gourmet para eventos corporativos",
  },
  {
    id: "6",
    type: "artist" as const,
    name: "Banda Folklore",
    category: "Banda Musical",
    location: "Buenos Aires",
    rating: 4.5,
    image: "/banda.jpg",
    description: "Música tradicional argentina para eventos y celebraciones",
  },
]

interface Filters {
  query: string
  location: string
  eventType: string
  serviceCategory: string
}

export default function SearchPage() {
  const [filters, setFilters] = useState<Filters>({
    query: "",
    location: "",
    eventType: "",
    serviceCategory: "",
  })

  // Filtrar resultados basado en los filtros
  const filteredResults = useMemo(() => {
    return mockResults.filter((result) => {
      const matchesQuery =
        filters.query === "" ||
        result.name.toLowerCase().includes(filters.query.toLowerCase()) ||
        result.category.toLowerCase().includes(filters.query.toLowerCase()) ||
        result.description.toLowerCase().includes(filters.query.toLowerCase())

      const matchesLocation =
        filters.location === "" || result.location.toLowerCase().includes(filters.location.toLowerCase())

      const matchesServiceCategory =
        filters.serviceCategory === "" ||
        (filters.serviceCategory === "space" && result.type === "owner") ||
        (filters.serviceCategory === "music" &&
          (result.category.includes("DJ") || result.category.includes("Banda"))) ||
        (filters.serviceCategory === "photography" && result.category.includes("Fotogr")) ||
        (filters.serviceCategory === "catering" && result.category.includes("Restaurante"))

      return matchesQuery && matchesLocation && matchesServiceCategory
    })
  }, [filters])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Busca en Red Show</h1>
            <p>Encuentra espacios, artistas y servicios para tu evento</p>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <SearchFiltersComponent onFiltersChange={setFilters} />

          {/* Resultados */}
          {filteredResults.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-6">
                Mostrando <span className="font-semibold">{filteredResults.length}</span> resultados
              </p>
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <ResultCard key={result.id} {...result} />
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-lg">No encontramos resultados para tu búsqueda.</p>
              <p className="text-sm text-muted-foreground mt-2">Prueba con otros filtros o términos de búsqueda.</p>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
