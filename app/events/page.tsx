"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar, Clock, MapPin, Users, Plus, X, Image as ImageIcon,
  Upload, ChevronLeft, ChevronRight, Loader2, Music, Sparkles
} from "lucide-react"

const CATEGORIES = ["Música en vivo", "DJ", "Teatro", "Humor", "Danza", "Arte", "Feria", "Otro"]

function EventCard({ event, currentUserId, onDelete }: { event: any; currentUserId: number; onDelete: (id: number) => void }) {
  const images = (() => {
    try { return JSON.parse(event.images || "[]") } catch { return event.image_url ? [event.image_url] : [] }
  })()
  const [imgIdx, setImgIdx] = useState(0)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Fecha a confirmar"
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    } catch { return dateStr }
  }

  const isOwner = event.user_id === currentUserId || event.owner_id === currentUserId

  return (
    <Card className="overflow-hidden border-0 transition-all hover:shadow-xl hover:-translate-y-1"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-900/40 to-blue-900/40 overflow-hidden">
        {images.length > 0 ? (
          <>
            <img src={images[imgIdx]} alt={event.title} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_: any, i: number) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-16 w-16 text-white/20" />
          </div>
        )}
        {event.category && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
            {event.category}
          </span>
        )}
        {isOwner && (
          <button onClick={() => onDelete(event.id)}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-600 transition-all">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white text-base mb-2 line-clamp-2">{event.title}</h3>
        {event.description && (
          <p className="text-white/50 text-sm mb-3 line-clamp-2">{event.description}</p>
        )}
        <div className="space-y-1.5">
          {event.event_date && (
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Calendar className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
              <span>{formatDate(event.event_date)}</span>
            </div>
          )}
          {event.event_time && (
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Clock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <span>{event.event_time}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <MapPin className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Users className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
              <span>Capacidad: {event.capacity}</span>
            </div>
          )}
        </div>
        {event.creator_name && (
          <p className="mt-3 pt-3 text-white/30 text-xs border-t border-white/5">
            Publicado por {event.creator_name}
          </p>
        )}
      </div>
    </Card>
  )
}

function CreateEventModal({ userId, onClose, onCreated }: { userId: number; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [capacity, setCapacity] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.slice(0, 5 - images.length).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImages(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "El título es requerido", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, description, category, location, eventDate, eventTime, capacity: capacity ? Number(capacity) : null, images }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "¡Evento publicado!" })
      onCreated()
      onClose()
    } catch {
      toast({ title: "Error al publicar el evento", variant: "destructive" })
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "linear-gradient(160deg, #0d1022 0%, #080b14 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>

        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: "linear-gradient(160deg, #0d1022 0%, #080b14 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-black text-white text-base">Publicar Evento</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Título del evento *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre del evento"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Contá de qué trata el evento..." rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Categoría</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <option value="">Seleccioná una categoría</option>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#0d1022" }}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Fecha</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Horario</label>
              <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", colorScheme: "dark" }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Lugar / Dirección</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ej: Palermo, Buenos Aires"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Capacidad</label>
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Número de personas"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Imágenes / Flyer (hasta 5)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-500 transition-all">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-white/40 hover:text-white/70 transition-all"
                  style={{ border: "2px dashed rgba(255,255,255,0.15)" }}>
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Subir</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={handleImages} />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
              Cancelar
            </button>
            <Button onClick={handleSubmit} disabled={loading}
              className="flex-1 h-12 font-bold border-0 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Publicar Evento
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filterCategory, setFilterCategory] = useState("")

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) { router.push("/login"); return }
    setUser(currentUser)
  }, [router])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCategory) params.set("category", filterCategory)
      const res = await fetch(`/api/events?${params}`)
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Error al cargar eventos", variant: "destructive" })
    }
    setLoading(false)
  }

  useEffect(() => { if (user) loadEvents() }, [user, filterCategory])

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este evento?")) return
    await fetch(`/api/events?id=${id}`, { method: "DELETE" })
    loadEvents()
    toast({ title: "Evento eliminado" })
  }

  if (!user) return <div className="flex items-center justify-center min-h-screen text-white">Cargando...</div>

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #050914 0%, #0a0f1e 50%, #080b18 100%)" }}>
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">Eventos</h1>
            <p className="text-white/50 text-sm">Descubrí y publicá eventos de la comunidad</p>
          </div>
          <Button onClick={() => setShowCreate(true)}
            className="h-10 font-bold border-0 gap-2"
            style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
            <Plus className="h-4 w-4" />
            Publicar evento
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFilterCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!filterCategory ? "text-white" : "text-white/50 hover:text-white/80"}`}
            style={{ background: !filterCategory ? "linear-gradient(135deg, #B744B8, #7a1a8a)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat}
              onClick={() => setFilterCategory(cat === filterCategory ? "" : cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterCategory === cat ? "text-white" : "text-white/50 hover:text-white/80"}`}
              style={{ background: filterCategory === cat ? "linear-gradient(135deg, #B744B8, #7a1a8a)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-lg font-semibold">No hay eventos todavía</p>
            <p className="text-white/25 text-sm mt-1">¡Sé el primero en publicar uno!</p>
            <Button onClick={() => setShowCreate(true)} className="mt-6 font-bold border-0"
              style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
              <Plus className="h-4 w-4 mr-2" />
              Publicar evento
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {events.map(event => (
              <EventCard key={event.id} event={event} currentUserId={user.id} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateEventModal
          userId={user.id}
          onClose={() => setShowCreate(false)}
          onCreated={loadEvents}
        />
      )}
    </div>
  )
}
