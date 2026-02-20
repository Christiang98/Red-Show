"use client"

import { ProtectedRoute } from "@/components/protectedRoute"
import { ArtistProfileForm } from "@/components/profile/artist-profile-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ArtistProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/my-profile" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Volver a Mi Perfil
              </Link>
            </Button>
          </div>
          <ArtistProfileForm />
        </div>
      </div>
    </ProtectedRoute>
  )
}
