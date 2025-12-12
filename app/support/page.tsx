"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { getCurrentUser } from "@/lib/auth"
import { HelpCircle, ArrowLeft } from "lucide-react"

export default function SupportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    message: "",
    priority: "medium",
  })

  const SUPPORT_CATEGORIES = [
    "Problema técnico",
    "Problema con reservas",
    "Problema de pago",
    "Cuenta y perfil",
    "Reporte de bug",
    "Sugerencia",
    "Otro",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = getCurrentUser()
      if (!user) {
        alert("Debes iniciar sesión para contactar soporte")
        router.push("/login")
        return
      }

      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          priority: formData.priority,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert("Ticket de soporte creado exitosamente. Te responderemos pronto.")
        setFormData({
          subject: "",
          category: "",
          message: "",
          priority: "medium",
        })
        router.push("/dashboard")
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Error creando ticket:", error)
      alert("Error creando el ticket de soporte")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Soporte Técnico</h1>
              <p className="text-sm text-muted-foreground">Estamos aquí para ayudarte</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Asunto *</label>
              <Input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Resumen breve del problema"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Selecciona una categoría</option>
                {SUPPORT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Mensaje *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Describe tu problema o pregunta con el mayor detalle posible..."
                rows={6}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={20}
              />
              <p className="text-xs text-muted-foreground mt-1">Mínimo 20 caracteres</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Nuestro equipo de soporte responderá tu consulta en un plazo de 24-48 horas. Para problemas urgentes,
                selecciona la prioridad "Urgente".
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Enviando..." : "Enviar Ticket"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
