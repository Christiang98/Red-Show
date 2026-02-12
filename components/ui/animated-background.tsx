"use client"

import { useEffect, useState } from "react"

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Gradiente de fondo principal */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/5" />
      
      {/* Círculos decorativos animados */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Círculo grande superior derecho */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        
        {/* Círculo mediano inferior izquierdo */}
        <div 
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '1s' }}
        />
        
        {/* Círculo pequeño centro */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
        
        {/* Círculo adicional superior izquierdo */}
        <div 
          className="absolute top-20 left-20 w-48 h-48 bg-primary/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: '7s', animationDelay: '0.5s' }}
        />
        
        {/* Círculo adicional inferior derecho */}
        <div 
          className="absolute bottom-20 right-20 w-56 h-56 bg-secondary/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: '9s', animationDelay: '1.5s' }}
        />
      </div>
      
      {/* Patrón de puntos sutil */}
      <div 
        className="fixed inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Líneas decorativas */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </>
  )
}
