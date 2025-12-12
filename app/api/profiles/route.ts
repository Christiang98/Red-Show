import { type NextRequest, NextResponse } from "next/server"
import { getQuery, runQuery } from "@/lib/db"

// GET - Obtener perfil del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    console.log("[v0] Obteniendo perfil para usuario:", userId)

    // Obtener perfil base
    const profile = await getQuery("SELECT * FROM profiles WHERE user_id = ?", [userId])

    if (!profile) {
      return NextResponse.json({ profile: null })
    }

    // Obtener perfil específico según rol del usuario
    const user = await getQuery("SELECT role FROM users WHERE id = ?", [userId])

    let specificProfile = null
    if (user?.role === "owner") {
      specificProfile = await getQuery("SELECT * FROM owner_profiles WHERE user_id = ?", [userId])
    } else if (user?.role === "artist") {
      specificProfile = await getQuery("SELECT * FROM artist_profiles WHERE user_id = ?", [userId])
    }

    return NextResponse.json({
      profile,
      specificProfile,
      role: user?.role,
    })
  } catch (error) {
    console.error("[v0] Error obteniendo perfil:", error)
    return NextResponse.json({ error: "Error obteniendo perfil" }, { status: 500 })
  }
}

// POST - Crear/Actualizar perfil
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, role, profileData, specificProfileData } = body

    console.log("[v0] Guardando perfil para usuario:", userId, "rol:", role)
    console.log("[v0] isPublished:", specificProfileData?.isPublished)

    // Crear o actualizar perfil base
    const existingProfile = await getQuery("SELECT id FROM profiles WHERE user_id = ?", [userId])

    if (existingProfile) {
      await runQuery(
        `UPDATE profiles SET 
          bio = ?, location = ?, avatar_url = ?, phone = ?
        WHERE user_id = ?`,
        [profileData.bio, profileData.location, profileData.avatarUrl, profileData.phone, userId],
      )
    } else {
      await runQuery(
        `INSERT INTO profiles (user_id, bio, location, avatar_url, phone) 
        VALUES (?, ?, ?, ?, ?)`,
        [userId, profileData.bio, profileData.location, profileData.avatarUrl, profileData.phone],
      )
    }

    // Crear o actualizar perfil específico según rol
    if (role === "owner" && specificProfileData) {
      const existingOwner = await getQuery("SELECT id FROM owner_profiles WHERE user_id = ?", [userId])

      if (existingOwner) {
        await runQuery(
          `UPDATE owner_profiles SET 
            business_name = ?, business_type = ?, address = ?, capacity = ?,
            description = ?, business_hours = ?, additional_services = ?,
            policies = ?, cuit_cuil = ?, profile_image = ?, featured_image = ?, 
            is_published = ?, other_business_type = ?, city = ?, neighborhood = ?,
            business_hours_data = ?, services = ?
          WHERE user_id = ?`,
          [
            specificProfileData.businessName,
            specificProfileData.businessType,
            specificProfileData.address,
            specificProfileData.capacity,
            specificProfileData.description,
            specificProfileData.businessHours || "",
            specificProfileData.additionalServices || "",
            specificProfileData.policies,
            specificProfileData.cuitCuil || "",
            specificProfileData.profileImage,
            specificProfileData.featuredImage,
            specificProfileData.isPublished ? 1 : 0,
            specificProfileData.otherBusinessType || "",
            specificProfileData.city || "",
            specificProfileData.neighborhood || "",
            specificProfileData.businessHoursData || "[]",
            specificProfileData.services || "[]",
            userId,
          ],
        )
      } else {
        await runQuery(
          `INSERT INTO owner_profiles 
          (user_id, business_name, business_type, address, capacity, description, 
           business_hours, additional_services, policies, cuit_cuil, profile_image, 
           featured_image, is_published, other_business_type, city, neighborhood, 
           business_hours_data, services) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            specificProfileData.businessName,
            specificProfileData.businessType,
            specificProfileData.address,
            specificProfileData.capacity,
            specificProfileData.description,
            specificProfileData.businessHours || "",
            specificProfileData.additionalServices || "",
            specificProfileData.policies,
            specificProfileData.cuitCuil || "",
            specificProfileData.profileImage,
            specificProfileData.featuredImage,
            specificProfileData.isPublished ? 1 : 0,
            specificProfileData.otherBusinessType || "",
            specificProfileData.city || "",
            specificProfileData.neighborhood || "",
            specificProfileData.businessHoursData || "[]",
            specificProfileData.services || "[]",
          ],
        )
      }
    } else if (role === "artist" && specificProfileData) {
      const existingArtist = await getQuery("SELECT id FROM artist_profiles WHERE user_id = ?", [userId])

      if (existingArtist) {
        await runQuery(
          `UPDATE artist_profiles SET 
            artist_name = ?, category = ?, years_of_experience = ?,
            portfolio_url = ?, description = ?, profile_image = ?,
            portfolio_images = ?, is_published = ?, stage_name = ?, 
            other_category = ?, service_type = ?, price_range = ?, 
            bio = ?, experience_years = ?, neighborhood = ?, availability = ?
          WHERE user_id = ?`,
          [
            specificProfileData.artistName || specificProfileData.stageName,
            specificProfileData.category,
            specificProfileData.yearsOfExperience || specificProfileData.experienceYears || 0,
            specificProfileData.portfolioUrl,
            specificProfileData.description || specificProfileData.bio,
            specificProfileData.profileImage,
            specificProfileData.portfolioImages,
            specificProfileData.isPublished ? 1 : 0,
            specificProfileData.stageName || "",
            specificProfileData.otherCategory || "",
            specificProfileData.serviceType || "",
            specificProfileData.priceRange || "",
            specificProfileData.bio || "",
            specificProfileData.experienceYears || 0,
            specificProfileData.neighborhood || "",
            specificProfileData.availability || "[]",
            userId,
          ],
        )
      } else {
        await runQuery(
          `INSERT INTO artist_profiles 
          (user_id, artist_name, category, years_of_experience, portfolio_url, 
           description, profile_image, portfolio_images, is_published, stage_name,
           other_category, service_type, price_range, bio, experience_years, 
           neighborhood, availability) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            specificProfileData.artistName || specificProfileData.stageName,
            specificProfileData.category,
            specificProfileData.yearsOfExperience || specificProfileData.experienceYears || 0,
            specificProfileData.portfolioUrl,
            specificProfileData.description || specificProfileData.bio,
            specificProfileData.profileImage,
            specificProfileData.portfolioImages,
            specificProfileData.isPublished ? 1 : 0,
            specificProfileData.stageName || "",
            specificProfileData.otherCategory || "",
            specificProfileData.serviceType || "",
            specificProfileData.priceRange || "",
            specificProfileData.bio || "",
            specificProfileData.experienceYears || 0,
            specificProfileData.neighborhood || "",
            specificProfileData.availability || "[]",
          ],
        )
      }
    }

    console.log("[v0] Perfil guardado exitosamente con estado de publicación")
    return NextResponse.json({ success: true, message: "Perfil guardado" })
  } catch (error) {
    console.error("[v0] Error guardando perfil:", error)
    return NextResponse.json({ error: "Error guardando perfil" }, { status: 500 })
  }
}
