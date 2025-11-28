"use client"

import { PublicProfileView } from "@/components/profile/public-profile-view"

// Mock data - en producción esto vendría de la API
const mockProfiles = {
  owner: {
    businessName: "La Sala del Tango",
    businessType: "Salón de Eventos",
    city: "Buenos Aires",
    province: "Buenos Aires",
    capacity: 300,
    businessHours: "Lun-Jue: 18hs-02hs / Vie-Sab: 18hs-04hs",
    description:
      "Somos un salón de eventos con más de 20 años de trayectoria en el barrio de San Telmo. Contamos con una amplia variedad de servicios para hacer tu evento inolvidable.",
    additionalServices: "Estacionamiento, catering, sonido profesional, aire acondicionado",
    profileImage: "/hair-salon-interior.png",
    featuredImage: "/hair-salon-interior.png",
    reviews: [
      { author: "Juan P.", rating: 5, comment: "Excelente lugar para eventos, muy profesionales" },
      { author: "María G.", rating: 4, comment: "Buena atención y lugar cómodo" },
    ],
  },
  artist: {
    artistName: "DJ Phoenix",
    category: "DJ",
    city: "Buenos Aires",
    province: "Buenos Aires",
    yearsOfExperience: 8,
    description:
      "DJ especializado en electrónica y house. He tocado en los mejores lugares de Buenos Aires y tengo experiencia en eventos corporativos y celebraciones privadas.",
    instagram: "@djphoenix",
    tiktok: "@djphoenix",
    portfolioUrl: "https://djphoenix.com",
    profileImage: "/dj-at-turntables.png",
    reviews: [{ author: "Carlos M.", rating: 5, comment: "Excelente musicalización para nuestro evento" }],
  },
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const isOwner = params.id === "owner" || Math.random() > 0.5
  const profileData = isOwner ? mockProfiles.owner : mockProfiles.artist

  return <PublicProfileView type={isOwner ? "owner" : "artist"} data={profileData} />
}
