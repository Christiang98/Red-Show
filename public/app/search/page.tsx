"use client"

import { useState, useMemo, useEffect } from "react"
import { ProtectedRoute } from "@/components/protectedRoute"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { SearchFilters as SearchFiltersComponent } from "@/components/search/search-filters"
import { ResultCard } from "@/components/search/result-card"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { getCurrentUser } from "@/lib/auth"
import useSWR from "swr"

interface Filters {
  query: string
  location: string
  eventType: string
  serviceCategory: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SearchPage() {
  const [user, setUser] = useState<any>(null)
  const [defaultFilterApplied, setDefaultFilterApplied] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    query: "",
    location: "",
    eventType: "",
    serviceCategory: "",
  })

  // Cargar usuario y aplicar filtro inteligente por defecto
  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    
    // Aplicar filtro inteligente segun el rol del usuario
    if (currentUser && !defaultFilterApplied) {
      if (currentUser.role === "artist") {
        // Si es artista, mostrar espacios por defecto
        setFilters(prev => ({ ...prev, serviceCategory: "space" }))
      } else if (currentUser.role === "owner") {
        // Si es dueno, mostrar artistas por defecto
        setFilters(prev => ({ ...prev, serviceCategory: "artist" }))
      }
      setDefaultFilterApplied(true)
    }
  }, [defaultFilterApplied])

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
      // Si no hay filtro de categoria, mostrar todos
      if (!filters.serviceCategory || filters.serviceCategory === "") {
        return true
      }

      // Filtrar por categoria
      if (filters.serviceCategory === "space") {
        return result.role === "owner" || result.type === "owner"
      }

      // Nuevo filtro para mostrar solo artistas
      if (filters.serviceCategory === "artist") {
        return result.role === "artist" || result.type === "artist"
      }

      if (filters.serviceCategory === "music") {
        return (
          result.category?.toLowerCase().includes("dj") ||
          result.category?.toLowerCase().includes("banda") ||
          result.category?.toLowerCase().includes("band") ||
          result.category?.toLowerCase().includes("musico") ||
          result.category?.toLowerCase().includes("música") ||
          result.category?.toLowerCase().includes("musician") ||
          result.category?.toLowerCase().includes("cantante") ||
          result.category?.toLowerCase().includes("orquesta") ||
          result.category?.toLowerCase().includes("mariachi")
        )
      }

      if (filters.serviceCategory === "photography") {
        return (
          result.category?.toLowerCase().includes("fotografo") || 
          result.category?.toLowerCase().includes("fotograf") ||
          result.category?.toLowerCase().includes("videografo") ||
          result.category?.toLowerCase().includes("videograf") ||
          result.category?.toLowerCase().includes("photograph") || 
          result.category?.toLowerCase().includes("videograph") ||
          result.category?.toLowerCase().includes("drone")
        )
      }

      if (filters.serviceCategory === "catering") {
        return (
          result.category?.toLowerCase().includes("gastronomia") || 
          result.category?.toLowerCase().includes("gastronom") || 
          result.category?.toLowerCase().includes("catering") ||
          result.category?.toLowerCase().includes("bartender") ||
          result.category?.toLowerCase().includes("coctel")
        )
      }

      if (filters.serviceCategory === "decoration") {
        return (
          result.category?.toLowerCase().includes("decorador") || 
          result.category?.toLowerCase().includes("decorad") || 
          result.category?.toLowerCase().includes("decorat") ||
          result.category?.toLowerCase().includes("florista") ||
          result.category?.toLowerCase().includes("flor")
        )
      }

      if (filters.serviceCategory === "comedy") {
        return (
          result.category?.toLowerCase().includes("comediante") || 
          result.category?.toLowerCase().includes("comedia") ||
          result.category?.toLowerCase().includes("comedian") ||
          result.category?.toLowerCase().includes("mago") ||
          result.category?.toLowerCase().includes("animador") ||
          result.category?.toLowerCase().includes("payaso") ||
          result.category?.toLowerCase().includes("mimo")
        )
      }

      return true
    })
  }, [results, filters.serviceCategory])

  const getHeaderText = () => {
    if (user?.role === "artist") {
      return {
        title: "Busca Oportunidades",
        subtitle: "Encuentra espacios y establecimientos que buscan artistas como tu"
      }
    } else if (user?.role === "owner") {
      return {
        title: "Busca Talentos",
        subtitle: "Encuentra artistas y servicios para tu establecimiento"
      }
    }
    return {
      title: "Busca en Red Show",
      subtitle: "Encuentra espacios, artistas y servicios para tu evento"
    }
  }

  const headerText = getHeaderText()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppNavbar />

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">{headerText.title}</h1>
            <p>{headerText.subtitle}</p>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <SearchFiltersComponent 
            onFiltersChange={setFilters} 
            userRole={user?.role}
            initialCategory={filters.serviceCategory}
          />

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
                    category={result.category || "Sin categoria"}
                    otherCategory={result.otherCategory || ""}
                    otherBusinessType={result.otherBusinessType || ""}
                    location={result.location || "Sin ubicacion"}
                    rating={result.rating || 0}
                    image={result.avatar_url || result.image || "/placeholder.svg"}
                    description={result.bio || result.description || "Sin descripcion"}
                    // Campos para Locales
                    capacity={result.capacity}
                    services={result.additional_services ? result.additional_services.split(",").map((s: string) => s.trim()).filter(Boolean) : []}
                    businessType={result.business_type}
                    // Campos para Artistas
                    priceRange={result.price_range}
                    yearsOfExperience={result.experience_years}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-lg">No encontramos resultados para tu busqueda.</p>
              <p className="text-sm text-muted-foreground mt-2">Prueba con otros filtros o terminos de busqueda.</p>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
