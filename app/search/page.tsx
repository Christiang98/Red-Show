"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { SearchFilters as SearchFiltersComponent } from "@/components/search/search-filters"
import { ResultCard } from "@/components/search/result-card"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import useSWR from "swr"

interface Filters {
  query: string
  location: string
  eventType: string
  serviceCategory: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SearchPage() {
  const [filters, setFilters] = useState<Filters>({
    query: "",
    location: "",
    eventType: "",
    serviceCategory: "",
  })

  const { data: results, error } = useSWR(
    `/api/search?${new URLSearchParams({
      query: filters.query,
      location: filters.location,
      category: filters.serviceCategory,
    }).toString()}`,
    fetcher,
  )

  const filteredResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return []

    return results.filter((result: any) => {
      // Si no hay filtro de categoría, mostrar todos
      if (!filters.serviceCategory || filters.serviceCategory === "") {
        return true
      }

      // Filtrar por categoría
      if (filters.serviceCategory === "space") {
        return result.role === "owner" || result.type === "owner"
      }

      if (filters.serviceCategory === "music") {
        return (
          result.category?.toLowerCase().includes("dj") ||
          result.category?.toLowerCase().includes("banda") ||
          result.category?.toLowerCase().includes("musician") ||
          result.category?.toLowerCase().includes("música")
        )
      }

      if (filters.serviceCategory === "photography") {
        return (
          result.category?.toLowerCase().includes("photograph") || result.category?.toLowerCase().includes("fotograf")
        )
      }

      if (filters.serviceCategory === "catering") {
        return (
          result.category?.toLowerCase().includes("gastronom") || result.category?.toLowerCase().includes("catering")
        )
      }

      return true
    })
  }, [results, filters.serviceCategory])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppNavbar />

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
          {error ? (
            <Card className="p-12 text-center">
              <p className="text-destructive">Error cargando resultados. Intenta nuevamente.</p>
            </Card>
          ) : !results ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredResults.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-6">
                Mostrando <span className="font-semibold">{filteredResults.length}</span> resultados
              </p>
              <div className="space-y-4">
                {filteredResults.map((result: any) => (
                  <ResultCard
                    key={result.id}
                    id={result.id}
                    type={result.role === "owner" ? "owner" : "artist"}
                    name={result.name}
                    category={result.category || "Sin categoría"}
                    location={result.location || "Sin ubicación"}
                    rating={result.rating || 0}
                    image={result.avatar_url || result.image || "/placeholder.svg"}
                    description={result.bio || result.description || "Sin descripción"}
                  />
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
