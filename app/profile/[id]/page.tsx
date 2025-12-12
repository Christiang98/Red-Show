"use client"

import { PublicProfileView } from "@/components/profile/public-profile-view"
import { useEffect, useState } from "react"

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

      if (data.profile && data.specificProfile) {
        setIsOwner(data.profile.role === "owner")

        if (data.profile.role === "owner") {
          setProfileData({
            businessName: data.specificProfile.business_name,
            businessType: data.specificProfile.business_type,
            city: data.specificProfile.city || data.profile.location,
            province: data.specificProfile.province || data.profile.location,
            neighborhood: data.specificProfile.neighborhood,
            capacity: data.specificProfile.capacity,
            businessHours: data.specificProfile.business_hours,
            description: data.specificProfile.description,
            additionalServices: data.specificProfile.additional_services,
            hiringPolicies: data.specificProfile.hiring_policies,
            profileImage: data.specificProfile.profile_image,
            featuredImage: data.specificProfile.featured_image,
            instagram: data.profile.instagram,
            tiktok: data.profile.tiktok,
            facebook: data.profile.facebook,
            availability: data.specificProfile.business_hours
              ? JSON.parse(data.specificProfile.business_hours).filter((d: any) => d.enabled)
              : [],
            reviews: [],
          })
        } else {
          setProfileData({
            artistName: data.specificProfile.artist_name,
            category: data.specificProfile.category,
            city: data.specificProfile.city || data.profile.location,
            province: data.specificProfile.province || data.profile.location,
            neighborhood: data.specificProfile.neighborhood,
            yearsOfExperience: data.specificProfile.years_of_experience,
            priceRange: data.specificProfile.price_range,
            serviceType: data.specificProfile.service_type,
            description: data.specificProfile.bio || data.specificProfile.description,
            instagram: data.profile.instagram,
            tiktok: data.profile.tiktok,
            portfolioUrl: data.specificProfile.portfolio_url,
            profileImage: data.specificProfile.profile_image,
            portfolioImages: data.specificProfile.portfolio_images
              ? JSON.parse(data.specificProfile.portfolio_images)
              : [],
            availability: data.specificProfile.availability
              ? JSON.parse(data.specificProfile.availability).filter((d: any) => d.enabled)
              : [],
            reviews: [],
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error cargando perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Perfil no encontrado</p>
      </div>
    )
  }

  return <PublicProfileView type={isOwner ? "owner" : "artist"} data={profileData} userId={params.id} />
}
