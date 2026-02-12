"use client"

import type React from "react"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { getCurrentUser } from "@/lib/auth"
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ReportUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const reportedUserId = resolvedParams.id
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
  })

  const REPORT_REASONS = [
    "Contenido inapropiado",
    "Comportamiento abusivo",
    "Spam o fraude",
    "Información falsa",
    "Incumplimiento de términos",
    "Otro",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = getCurrentUser()
      if (!user) {
        toast({
          title: "Sesión requerida",
          description: "Debes iniciar sesión para reportar un usuario.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId: user.id,
          reportedUserId: reportedUserId,
          reason: formData.reason,
          description: formData.description,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitted(true)
        toast({
          title: "Reporte enviado",
          description: "Nuestro equipo lo revisará pronto. Gracias por ayudar a mantener la comunidad segura.",
        })
      } else {
        toast({
          title: "Error al enviar el reporte",
          description: result.error || "Intenta nuevamente en unos momentos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error enviando reporte:", error)
      toast({
        title: "Error de conexión",
        description: "No se pudo enviar el reporte. Verifica tu conexión e intenta nuevamente.",
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

        {submitted ? (
          /* Pantalla de éxito estilizada */
          <Card className="p-10 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Reporte enviado</h2>
              <p className="text-muted-foreground max-w-sm">
                Nuestro equipo de moderación revisará el reporte a la brevedad. Todos los reportes son tratados de forma confidencial.
              </p>
              <div className="flex gap-3 mt-4">
                <Button onClick={() => router.push("/search")} className="bg-primary hover:bg-primary/90">
                  Volver a la búsqueda
                </Button>
                <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ reason: "", description: "" }) }}>
                  Nuevo reporte
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Reportar Usuario</h1>
                <p className="text-sm text-muted-foreground">Ayúdanos a mantener una comunidad segura</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Motivo del Reporte *</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  required
                >
                  <option value="">Selecciona un motivo</option>
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Descripción *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Por favor describe la situación con el mayor detalle posible..."
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
                  required
                  minLength={20}
                />
                <p className="text-xs text-muted-foreground mt-1">Mínimo 20 caracteres ({formData.description.length}/20)</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Tu reporte será revisado por nuestro equipo de moderación. Todos los reportes son confidenciales y se
                  toman en serio. El abuso del sistema de reportes puede resultar en acciones contra tu cuenta.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || formData.description.length < 20} 
                  className="flex-1 bg-destructive hover:bg-destructive/90"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : "Enviar Reporte"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  )
}
