"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, User, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { compressImage } from "@/lib/image-utils"

export default function UserProfileEditPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    avatarUrl: "",
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) { router.push("/login"); return }
    if (user.role !== "user") { router.push("/dashboard"); return }
    setCurrentUser(user)
    loadProfile(user.id)
  }, [])

  const loadProfile = async (userId: number) => {
    try {
      const res = await fetch(`/api/user-profile?userId=${userId}`)
      const data = await res.json()
      if (data.user) {
        setFormData({
          firstName: data.user.first_name || "",
          lastName:  data.user.last_name  || "",
          username:  data.user.username   || "",
          phone:     data.user.phone      || "",
          avatarUrl: data.user.avatarUrl  || "",
        })
      }
    } catch (err) {
      console.error("Error cargando perfil:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file, 512)
      setFormData(prev => ({ ...prev, avatarUrl: compressed }))
    } catch {
      setError("Error al procesar la imagen")
    }
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")

    // Basic validation
    if (!formData.firstName.trim()) { setError("El nombre es obligatorio"); return }

    if (formData.username && !/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      setError("El nombre de usuario solo puede contener letras, números y guiones bajos (3-30 caracteres)")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/user-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          firstName: formData.firstName,
          lastName:  formData.lastName,
          username:  formData.username || null,
          phone:     formData.phone,
          avatarUrl: formData.avatarUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al guardar")
      } else {
        // Update localStorage
        const stored = localStorage.getItem("userData")
        if (stored) {
          const parsed = JSON.parse(stored)
          const userObj = parsed.user || parsed
          userObj.firstName = formData.firstName
          userObj.lastName  = formData.lastName
          userObj.phone     = formData.phone
          userObj.username  = formData.username
          if (parsed.user) parsed.user = userObj
          else Object.assign(parsed, userObj)
          localStorage.setItem("userData", JSON.stringify(parsed))
        }
        setSuccess("¡Perfil actualizado correctamente!")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/my-profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-4">
            <ArrowLeft className="h-4 w-4" />
            Volver a mi perfil
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Editar mi perfil</h1>
          <p className="text-muted-foreground mt-1">Actualizá tu información personal</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Avatar */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-secondary" />
            Foto de perfil
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-border"
                  style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                  {(formData.firstName?.charAt(0) || currentUser?.firstName?.charAt(0) || "?").toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Hacé clic en el ícono de cámara para cambiar tu foto. Se recomienda una imagen cuadrada de al menos 200×200px.
              </p>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                Cambiar foto
              </Button>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </Card>

        {/* Personal data */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-secondary" />
            Datos personales
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre *</label>
                <Input
                  value={formData.firstName}
                  onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Apellido</label>
                <Input
                  value={formData.lastName}
                  onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre de usuario
                <span className="ml-2 text-xs text-muted-foreground font-normal">(único en la plataforma)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  value={formData.username}
                  onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  placeholder="tu_nombre"
                  className="pl-7"
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Solo letras minúsculas, números y guiones bajos. Entre 3 y 30 caracteres.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Teléfono</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="+54 9 11 1234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                value={currentUser?.email || ""}
                disabled
                className="opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">El email no se puede modificar.</p>
            </div>
          </div>
        </Card>

        {/* Privacy notice */}
        <div className="p-4 rounded-xl mb-6 text-sm text-muted-foreground"
          style={{ background: "rgba(183,68,184,0.06)", border: "1px solid rgba(183,68,184,0.15)" }}>
          🔒 <span className="font-semibold text-foreground/80">Tu perfil es privado.</span> Esta información no es visible públicamente en búsquedas.
        </div>

        {/* Save button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 font-bold border-0"
            style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</> : "Guardar cambios"}
          </Button>
          <Button variant="outline" asChild className="flex-1 bg-transparent">
            <Link href="/my-profile">Cancelar</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
