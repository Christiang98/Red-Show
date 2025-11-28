"use client"

import { ProtectedRoute } from "@/components/protectedRoute"
import { OwnerProfileForm } from "@/components/profile/owner-profile-form"

export default function OwnerProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <OwnerProfileForm />
        </div>
      </div>
    </ProtectedRoute>
  )
}
