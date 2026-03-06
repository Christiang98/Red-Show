"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { getCurrentUser } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { HelpCircle, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function SupportPage() {
  const router = useRouter()
  const { toast } = useToast()
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
        toast({
          title: (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-800 dark:text-green-200 text-lg">¡Ticket Enviado!</p>
              </div>
            </div>
          ),
          description: (
            <div className="mt-2 ml-13 space-y-2">
              <p className="text-green-700 dark:text-green-300 font-medium">
                Tu solicitud ha sido recibida con éxito
              </p>
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400 flex items-start gap-2">
                  <span className="text-lg">⏱️</span>
                  <span>Nuestro equipo de soporte revisará tu consulta y te responderá en un plazo de <strong>24-48 horas</strong></span>
                </p>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">Ticket #{result.ticketId || Date.now().toString().slice(-6)}</p>
            </div>
          ),
          className: "border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 shadow-xl",
          duration: 6000,
        })
        setFormData({
          subject: "",
          category: "",
          message: "",
          priority: "medium",
        })
        setTimeout(() => router.push("/dashboard"), 3000)
      } else {
        toast({
          title: "Error al crear el ticket",
          description: result.error || "Hubo un problema al enviar tu solicitud. Por favor intenta nuevamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error creando ticket:", error)
      toast({
        title: "Error de conexión",
        description: "No se pudo enviar el ticket de soporte. Por favor verifica tu conexión a internet e intenta nuevamente.",
        variant: "destructive",
      })
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
