"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, DollarSign, Info } from "lucide-react"

interface BookingFormData {
  date: string
  timeStart: string
  timeEnd: string
  proposedPrice: number | undefined
}

interface BookingFormProps {
  vendorName: string
  onSubmit: (data: BookingFormData) => void
  isLoading?: boolean
}

export function BookingForm({ vendorName, onSubmit, isLoading = false }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    date: "",
    timeStart: "",
    timeEnd: "",
    proposedPrice: undefined,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "proposedPrice" ? (value ? Number(value) : undefined) : value,
    }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.date) errs.date = "La fecha es obligatoria"
    if (!formData.timeStart) errs.timeStart = "El horario de inicio es obligatorio"
    if (!formData.timeEnd) errs.timeEnd = "El horario de cierre es obligatorio"
    if (formData.timeStart && formData.timeEnd && formData.timeEnd <= formData.timeStart) {
      errs.timeEnd = "El horario de cierre debe ser posterior al de inicio"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(formData)
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#FFFCF2",
    borderRadius: "12px",
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
  }

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,252,242,0.55)",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: "6px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  }

  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mb-5">
        <h3 className="text-xl font-black mb-1" style={{ color: "#FFFCF2" }}>
          Solicitar Contratación
        </h3>
        <p className="text-sm" style={{ color: "rgba(255,252,242,0.45)" }}>
          Para: <span className="font-semibold" style={{ color: "#c084fc" }}>{vendorName}</span>
        </p>
      </div>

      {/* Aviso */}
      <div
        className="flex items-start gap-2.5 p-3 rounded-xl mb-5 text-xs"
        style={{ background: "rgba(183,68,184,0.08)", border: "1px solid rgba(183,68,184,0.22)" }}
      >
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#c084fc" }} />
        <p style={{ color: "rgba(216,180,254,0.8)" }}>
          Completá los datos del evento. Podrás negociar precio y horarios antes de confirmar. No hay mensajes libres hasta confirmar y pagar la tarifa de gestión.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fecha */}
        <div>
          <label style={labelStyle}>
            <Calendar className="h-3.5 w-3.5" /> Fecha del Evento *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
            style={inputStyle}
          />
          {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
        </div>

        {/* Horarios */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>
              <Clock className="h-3.5 w-3.5" /> Horario de Inicio *
            </label>
            <input
              type="time"
              name="timeStart"
              value={formData.timeStart}
              onChange={handleChange}
              style={inputStyle}
            />
            {errors.timeStart && <p className="text-red-400 text-xs mt-1">{errors.timeStart}</p>}
          </div>
          <div>
            <label style={labelStyle}>
              <Clock className="h-3.5 w-3.5" /> Horario de Cierre *
            </label>
            <input
              type="time"
              name="timeEnd"
              value={formData.timeEnd}
              onChange={handleChange}
              style={inputStyle}
            />
            {errors.timeEnd && <p className="text-red-400 text-xs mt-1">{errors.timeEnd}</p>}
          </div>
        </div>

        {/* Precio */}
        <div>
          <label style={labelStyle}>
            <DollarSign className="h-3.5 w-3.5" />
            Precio Propuesto{" "}
            <span style={{ color: "rgba(255,252,242,0.3)", fontWeight: 400, textTransform: "none" }}>(opcional)</span>
          </label>
          <input
            type="number"
            name="proposedPrice"
            value={formData.proposedPrice ?? ""}
            onChange={handleChange}
            placeholder="$ Tu presupuesto"
            min="0"
            style={inputStyle}
          />
          <p className="text-xs mt-1.5" style={{ color: "rgba(255,252,242,0.3)" }}>
            Podés negociar el precio con contraofertas después de enviar
          </p>
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-bold border-0 mt-2"
          style={{
            background: "linear-gradient(135deg, #001C55, #B744B8)",
            boxShadow: "0 4px 20px rgba(183,68,184,0.3)",
          }}
          disabled={isLoading}
        >
          {isLoading ? "Enviando propuesta..." : "Enviar Propuesta de Contratación"}
        </Button>
      </form>
    </div>
  )
}
