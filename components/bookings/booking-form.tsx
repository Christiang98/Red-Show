"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface BookingFormData {
  date: string
  time: string
  serviceType: string
  message: string
  guestCount?: number
}

interface BookingFormProps {
  vendorName: string
  onSubmit: (data: BookingFormData) => void
  isLoading?: boolean
}

export function BookingForm({ vendorName, onSubmit, isLoading = false }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    date: "",
    time: "",
    serviceType: "",
    message: "",
    guestCount: undefined,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guestCount" ? (value ? Number.parseInt(value) : undefined) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.time || !formData.serviceType) {
      alert("Por favor completa los campos obligatorios")
      return
    }
    onSubmit(formData)
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-primary mb-4">Solicitar Contratación</h3>
      <p className="text-muted-foreground mb-6">
        Servicio: <span className="font-semibold text-foreground">{vendorName}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Fecha del Evento*</label>
            <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Hora*</label>
            <Input type="time" name="time" value={formData.time} onChange={handleChange} required />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tipo de Servicio*</label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Selecciona un tipo</option>
              <option value="full-event">Evento Completo</option>
              <option value="partial">Servicio Parcial</option>
              <option value="consultation">Consultoría</option>
              <option value="setup">Setup Técnico</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Cantidad de Personas</label>
            <Input
              type="number"
              name="guestCount"
              value={formData.guestCount || ""}
              onChange={handleChange}
              placeholder="Opcional"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Mensaje Adicional</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Cuéntanos detalles adicionales sobre tu evento..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={isLoading}>
          {isLoading ? "Enviando solicitud..." : "Enviar Solicitud"}
        </Button>
      </form>
    </Card>
  )
}
