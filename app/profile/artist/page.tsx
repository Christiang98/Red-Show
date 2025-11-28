"use client"

import { ProtectedRoute } from "@/components/protectedRoute"
import { ArtistProfileForm } from "@/components/profile/artist-profile-form"

export default function ArtistProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <ArtistProfileForm />
        </div>
      </div>
    </ProtectedRoute>
  )
}
