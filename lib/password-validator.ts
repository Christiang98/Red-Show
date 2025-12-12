export interface PasswordStrength {
  isValid: boolean
  strength: "weak" | "medium" | "strong"
  checks: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }
  message: string
}

export function validatePassword(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const passedChecks = Object.values(checks).filter(Boolean).length
  const isValid = passedChecks >= 4 && checks.minLength

  let strength: "weak" | "medium" | "strong" = "weak"
  let message = "La contraseña es muy débil"

  if (passedChecks >= 5) {
    strength = "strong"
    message = "Contraseña fuerte"
  } else if (passedChecks >= 4 && checks.minLength) {
    strength = "medium"
    message = "Contraseña aceptable"
  }

  return {
    isValid,
    strength,
    checks,
    message,
  }
}
