"use client"

import { PublicProfileView } from "@/components/profile/public-profile-view"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function ProfilePage({ params }: { params: { id: string } }) {
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [params.id])

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/profiles?userId=${params.id}`)
      const data = await response.json()

      // Cargar reseñas reales
      let reviewsData: any[] = []
      try {
        const reviewsRes = await fetch(`/api/reviews?userId=${params.id}`)
        if (reviewsRes.ok) {
          reviewsData = await reviewsRes.json()
        }
      } catch (e) {
        console.error("[v0] Error cargando reseñas:", e)
      }

      if (data.specificProfile) {
        // Usar el rol del usuario que viene del API, no del profile
        const userRole = data.role
        setIsOwner(userRole === "owner")

        if (userRole === "owner") {
          // Parse galeria de imagenes si existe
          let galleryImages: string[] = []
          try {
            if (data.specificProfile.gallery_images) {
              const parsed = JSON.parse(data.specificProfile.gallery_images)
              galleryImages = Array.isArray(parsed) ? parsed : []
            }
          } catch (e) {
            console.error("[v0] Error parsing gallery images:", e)
          }

          // Parse servicios si existe
          let services: string[] = []
          try {
            if (data.specificProfile.services) {
              const parsed = JSON.parse(data.specificProfile.services)
              services = Array.isArray(parsed) ? parsed : []
            }
          } catch (e) {
            console.error("[v0] Error parsing services:", e)
          }

          // Extraer ciudad y barrio correctamente, evitando duplicados
          const city = data.specificProfile.city || ""
          const neighborhood = data.specificProfile.neighborhood || ""
          
          // Evitar que barrio sea igual a ciudad
          const cleanNeighborhood = neighborhood && neighborhood.toLowerCase() !== city.toLowerCase() ? neighborhood : ""
          
          setProfileData({
            businessName: data.specificProfile.business_name,
            businessType: data.specificProfile.business_type,
            otherBusinessType: data.specificProfile.other_business_type || "",
            businessTypeLabel: getBusinessTypeLabel(data.specificProfile.business_type, data.specificProfile.other_business_type),
            city: city,
            neighborhood: cleanNeighborhood,
            address: data.specificProfile.address,
            capacity: data.specificProfile.capacity,
            businessHours: formatBusinessHours(data.specificProfile.business_hours_data),
            businessHoursData: data.specificProfile.business_hours_data,
            description: data.specificProfile.description,
            additionalServices: services.length > 0 ? services.join(", ") : (data.specificProfile.additional_services || ""),
            otherService: data.specificProfile.other_service || "",
            contractPolicies: data.specificProfile.policies,
            profileImage: data.specificProfile.profile_image,
            featuredImage: data.specificProfile.featured_image,
            galleryImages: galleryImages,
            instagram: data.profile?.instagram || "",
            tiktok: data.profile?.tiktok || "",
            facebook: data.profile?.facebook || "",
            phone: data.profile?.phone || "",
            otherSocial: data.profile?.other_social || "",
            reviews: reviewsData,
          })
        } else {
          // Parse portfolio images si existe
          let portfolioImages: string[] = []
          try {
            if (data.specificProfile.portfolio_images) {
              portfolioImages = JSON.parse(data.specificProfile.portfolio_images)
            }
          } catch (e) {
            console.error("[v0] Error parsing portfolio images:", e)
          }

          // Formatear disponibilidad del artista
          let availabilityFormatted = null
          try {
            if (data.specificProfile.availability) {
              const avail = JSON.parse(data.specificProfile.availability)
              const enabledDays = avail.filter((a: any) => a.enabled)
              if (enabledDays.length > 0) {
                availabilityFormatted = enabledDays
                  .map((a: any) => `${a.day}: ${a.from} - ${a.to}`)
                  .join(" | ")
              }
            }
          } catch (e) {
            console.error("[v0] Error parsing availability:", e)
          }

          // Extraer ciudad y barrio correctamente para artistas
          const artistCity = data.profile?.location || ""
          const artistNeighborhood = data.specificProfile.neighborhood || ""

          setProfileData({
            artistName: data.specificProfile.stage_name || data.specificProfile.artist_name,
            category: data.specificProfile.category,
            otherCategory: data.specificProfile.other_category || "",
            categoryLabel: getCategoryLabel(data.specificProfile.category, data.specificProfile.other_category),
            city: artistCity,
            neighborhood: artistNeighborhood !== artistCity ? artistNeighborhood : "",
            yearsOfExperience: data.specificProfile.experience_years || data.specificProfile.years_of_experience,
            description: data.specificProfile.bio || data.specificProfile.description,
            serviceType: data.specificProfile.service_type,
            priceRange: data.specificProfile.price_range || "",
            availability: availabilityFormatted,
            instagram: data.profile?.instagram,
            tiktok: data.profile?.tiktok,
            facebook: data.profile?.facebook,
            otherSocial: data.profile?.other_social,
            phone: data.profile?.phone,
            portfolioUrl: data.specificProfile.portfolio_url,
            profileImage: data.specificProfile.profile_image,
            featuredImage: data.specificProfile.featured_image || null,
            portfolioImages: portfolioImages,
            reviews: reviewsData,
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error cargando perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  // Funcion para obtener label del tipo de negocio
  const getBusinessTypeLabel = (type: string, otherType?: string) => {
    if (type === "other" && otherType) {
      return otherType
    }
    const types: Record<string, string> = {
      salon: "Salon de Eventos",
      bar: "Bar",
      restaurant: "Restaurante",
      cultural: "Centro Cultural",
      theater: "Teatro",
      club: "Club/Discoteca",
      hotel: "Hotel/Salon de Hotel",
      other: "Otro",
    }
    return types[type] || type
  }

  // Funcion para obtener label de categoria de artista
  const getCategoryLabel = (category: string, otherCategory?: string) => {
    if (category === "other" && otherCategory) {
      return otherCategory
    }
    const categories: Record<string, string> = {
      musician: "Musico",
      band: "Banda",
      dj: "DJ",
      comedian: "Comediante",
      photographer: "Fotografo",
      videographer: "Videografo",
      gastronomy: "Gastronomico/Catering",
      decorator: "Decorador",
      other: "Otro",
    }
    return categories[category] || category
  }

  // Funcion para formatear horarios de negocio
  const formatBusinessHours = (hoursData: string | null) => {
    if (!hoursData) return null
    
    try {
      const hours = JSON.parse(hoursData)
      const enabledDays = hours.filter((h: any) => h.enabled)
      
      if (enabledDays.length === 0) return "Horarios no especificados"
      
      return enabledDays
        .map((h: any) => `${h.day}: ${h.from} - ${h.to}`)
        .join(" | ")
    } catch (e) {
      return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Perfil no encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">El perfil que buscas no existe o no esta disponible</p>
        </div>
      </div>
    )
  }

  return <PublicProfileView type={isOwner ? "owner" : "artist"} data={profileData} userId={params.id} />
}
