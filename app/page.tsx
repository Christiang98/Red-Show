"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Music, MapPin, Calendar, Users, Search, MessageSquare, Shield,
  Star, TrendingUp, CheckCircle, ArrowRight, Zap, Crown, Sparkles
} from "lucide-react"

export default function LandingPage() {
  const router = useRouter()

  const artistPlans = [
    {
      name: "Básico",
      price: "GRATIS",
      popular: false,
      gradient: "from-gray-600 to-gray-500",
      features: [
        "Perfil básico",
        "3 fotos",
        "Contacto directo limitado (5 consultas/mes)",
        "Aparición estándar en búsquedas",
        "Comisión por contratación: $1.500"
      ]
    },
    {
      name: "Pro",
      price: "$8.000/mes",
      popular: true,
      gradient: "from-blue-600 to-purple-600",
      features: [
        "Perfil destacado",
        "Fotos ilimitadas + videos",
        "Portfolio completo",
        "Consultas ilimitadas",
        "Aparición prioritaria en búsquedas",
        "Analytics básicos (vistas, contactos)",
        "Comisión por contratación: $1.200"
      ]
    },
    {
      name: "Premium",
      price: "$12.000/mes",
      popular: false,
      gradient: "from-purple-600 to-pink-600",
      features: [
        "Todo del Plan Pro +",
        "Calendario de disponibilidad público",
        "Promoción en newsletter semanal",
        "Analytics avanzados",
        "Comisión por contratación: $1.000",
        "Soporte prioritario"
      ]
    }
  ]

  const spacePlans = [
    {
      name: "Básico",
      price: "GRATIS",
      popular: false,
      gradient: "from-gray-600 to-gray-500",
      features: [
        "Perfil básico del espacio",
        "5 fotos",
        "Información básica (capacidad, ubicación)",
        "Aparición estándar en búsquedas",
        "Comisión por contratación: $1.500"
      ]
    },
    {
      name: "Pro",
      price: "$8.000/mes",
      popular: true,
      gradient: "from-green-600 to-teal-600",
      features: [
        "Perfil destacado",
        "Fotos + videos ilimitados",
        "Tour virtual 360°",
        "Aparición prioritaria",
        "Gestión de calendario avanzada",
        "Analytics de vistas y consultas",
        "Comisión por contratación: $1.200"
      ]
    },
    {
      name: "Premium",
      price: "$12.000/mes",
      popular: false,
      gradient: "from-orange-600 to-red-600",
      features: [
        "Todo del Pro +",
        "Múltiples espacios en un perfil",
        "API para integración con sistemas propios",
        "Comisión por contratación: $1.000",
        "Promoción destacada en home"
      ]
    }
  ]

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #080b14 0%, #0d0817 50%, #080b14 100%)" }}>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(0,28,85,0.8) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(183,68,184,0.6) 0%, transparent 50%)" }} />
        
        <nav className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-redshow.png" 
              alt="Red Show" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/login")} variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              Iniciar Sesión
            </Button>
            <Button onClick={() => router.push("/register")}
              className="border-0" style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
              Registrarse
            </Button>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <Badge className="mb-6 px-4 py-2 text-sm font-bold bg-purple-500/20 border-purple-500/40">
            <Sparkles className="h-4 w-4 mr-2" />
            Plataforma #1 en Argentina
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black mb-6"
            style={{ background: "linear-gradient(135deg, #fff 30%, #B744B8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Conectamos artistas<br />con espacios únicos
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
            La plataforma que revoluciona la industria del entretenimiento y los eventos en Argentina
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/register")}
              className="h-14 px-8 text-lg font-bold border-0"
              style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
              <ArrowRight className="mr-2 h-5 w-5" />
              Comenzar Gratis
            </Button>
            <Button size="lg" onClick={() => router.push("/search")} variant="outline"
              className="h-14 px-8 text-lg font-bold border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Search className="mr-2 h-5 w-5" />
              Explorar
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: "Búsqueda Inteligente", desc: "Encuentra el artista o espacio perfecto en segundos", color: "#3b82f6" },
            { icon: MessageSquare, title: "Comunicación Directa", desc: "Chat integrado para coordinar todos los detalles", color: "#B744B8" },
            { icon: Shield, title: "Pagos Seguros", desc: "Sistema de pagos protegido y confiable", color: "#10b981" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="rounded-2xl p-8 text-center border transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `${color}20` }}>
                <Icon className="h-8 w-8" style={{ color }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-white/50 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plans Section - Artists */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <Badge className="mb-4 px-4 py-2 text-sm font-bold bg-blue-500/20 border-blue-500/40">
            <Music className="h-4 w-4 mr-2" />
            Planes para Artistas
          </Badge>
          <h2 className="text-4xl font-black text-white mb-4">Planes de Suscripción Premium</h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Elegí el plan perfecto para tu carrera artística
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {artistPlans.map((plan) => (
            <div key={plan.name}
              className={`rounded-3xl p-8 border relative overflow-hidden transition-all ${plan.popular ? 'scale-105 shadow-2xl' : 'hover:scale-105'}`}
              style={{ background: "rgba(255,255,255,0.04)", borderColor: plan.popular ? "rgba(183,68,184,0.4)" : "rgba(255,255,255,0.1)" }}>
              {plan.popular && (
                <div className="absolute top-4 right-4">
                  <Badge className={`bg-gradient-to-r ${plan.gradient} text-white border-0 px-3 py-1`}>
                    <Crown className="h-3 w-3 mr-1" /> Popular
                  </Badge>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    {plan.price.split('/')[0]}
                  </span>
                  {plan.price.includes('/') && <span className="text-white/70 text-lg">/mes</span>}
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => router.push("/register")}
                className={`w-full h-12 font-bold border-0 ${plan.popular ? `bg-gradient-to-r ${plan.gradient}` : 'bg-white/10'}`}>
                {plan.name === "Básico" ? "Comenzar Gratis" : "Suscribirse"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Plans Section - Spaces */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <Badge className="mb-4 px-4 py-2 text-sm font-bold bg-green-500/20 border-green-500/40">
            <MapPin className="h-4 w-4 mr-2" />
            Planes para Espacios
          </Badge>
          <h2 className="text-4xl font-black text-white mb-4">Planes para Locales y Espacios</h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Maximizá el potencial de tu espacio
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {spacePlans.map((plan) => (
            <div key={plan.name}
              className={`rounded-3xl p-8 border relative overflow-hidden transition-all ${plan.popular ? 'scale-105 shadow-2xl' : 'hover:scale-105'}`}
              style={{ background: "rgba(255,255,255,0.04)", borderColor: plan.popular ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)" }}>
              {plan.popular && (
                <div className="absolute top-4 right-4">
                  <Badge className={`bg-gradient-to-r ${plan.gradient} text-white border-0 px-3 py-1`}>
                    <Zap className="h-3 w-3 mr-1" /> Recomendado
                  </Badge>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    {plan.price.split('/')[0]}
                  </span>
                  {plan.price.includes('/') && <span className="text-white/70 text-lg">/mes</span>}
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => router.push("/register")}
                className={`w-full h-12 font-bold border-0 ${plan.popular ? `bg-gradient-to-r ${plan.gradient}` : 'bg-white/10'}`}>
                {plan.name === "Básico" ? "Comenzar Gratis" : "Suscribirse"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Final */}
      <div className="container mx-auto px-4 py-20">
        <div className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-white mb-4">¿Listo para empezar?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Únete a cientos de artistas y espacios que ya confían en Red Show
            </p>
            <Button size="lg" onClick={() => router.push("/register")}
              className="h-14 px-10 text-lg font-bold bg-white text-purple-600 hover:bg-white/90 border-0">
              <ArrowRight className="mr-2 h-5 w-5" />
              Crear mi cuenta gratis
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/40 text-sm">© 2026 Red Show. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
