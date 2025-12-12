"use client"

import { validatePassword } from "@/lib/password-validator"
import { Check, X } from "lucide-react"

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const strength = validatePassword(password)

  const getStrengthColor = () => {
    switch (strength.strength) {
      case "strong":
        return "bg-success"
      case "medium":
        return "bg-yellow-500"
      case "weak":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }

  const getStrengthWidth = () => {
    switch (strength.strength) {
      case "strong":
        return "w-full"
      case "medium":
        return "w-2/3"
      case "weak":
        return "w-1/3"
      default:
        return "w-0"
    }
  }

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">Seguridad de contraseña</span>
          <span className="text-xs font-medium text-foreground">{strength.message}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${getStrengthColor()} ${getStrengthWidth()} transition-all duration-300`} />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1">
        <RequirementItem checked={strength.checks.minLength} text="Mínimo 8 caracteres" />
        <RequirementItem checked={strength.checks.hasUppercase} text="Al menos una mayúscula (A-Z)" />
        <RequirementItem checked={strength.checks.hasLowercase} text="Al menos una minúscula (a-z)" />
        <RequirementItem checked={strength.checks.hasNumber} text="Al menos un número (0-9)" />
        <RequirementItem checked={strength.checks.hasSpecialChar} text="Al menos un carácter especial (!@#$%...)" />
      </div>
    </div>
  )
}

function RequirementItem({ checked, text }: { checked: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {checked ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}
      <span className={checked ? "text-foreground" : "text-muted-foreground"}>{text}</span>
    </div>
  )
}
