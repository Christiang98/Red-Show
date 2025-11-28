"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">R</span>
            </div>
            <span className="font-bold text-xl text-primary">Red Show</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-foreground hover:text-primary transition">
              Iniciar Sesión
            </Link>
            <Button asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-balance text-primary">
              Conecta eventos, <span className="text-secondary">crea experiencias</span>
            </h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              La plataforma que une espacios, artistas y organizadores en un mismo lugar. Gestiona, contrata y crece tu
              negocio.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/register">Comenzar Ahora</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">Conocer Más</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center text-primary mb-16">Funcionalidades Principales</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Búsqueda Inteligente",
              description:
                "Encuentra espacios, artistas y servicios con filtros avanzados por ubicación, tipo y categoría.",
            },
            {
              title: "Gestión Simplificada",
              description: "Crea perfiles profesionales, recibe solicitudes y gestiona tus contrataciones fácilmente.",
            },
            {
              title: "Chat Seguro",
              description: "Comunícate directamente con otros usuarios para coordinar todos los detalles del evento.",
            },
            {
              title: "Reputación Comprobada",
              description: "Calificaciones y reseñas que generan confianza y crecimiento mutuo en la plataforma.",
            },
            {
              title: "Historial Completo",
              description: "Acceso a tu historial de eventos, contrataciones y todas tus transacciones en un lugar.",
            },
            {
              title: "Panel Administrativo",
              description: "Herramientas de administración para gestionar usuarios y visualizar métricas clave.",
            },
          ].map((feature, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-6 hover:border-secondary/50 transition">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-secondary rounded-md"></div>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-muted-foreground">
          <p>Red Show © 2025. Conectando eventos y oportunidades.</p>
        </div>
      </footer>
    </main>
  )
}
