export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: "owner" | "artist" | "organizer"
  phone?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// Hashing functions are now handled only on the server side in /api/auth routes

export async function register(userData: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: "owner" | "artist" | "organizer"
  phone?: string
}): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, message: error.error || "Error al registrarse" }
    }

    const data = await response.json()
    return { success: true, message: data.message, user: data.user }
  } catch (error) {
    console.error("[v0] Register error:", error)
    return { success: false, message: "Error de conexión" }
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, message: error.error || "Error al iniciar sesión" }
    }

    const data = await response.json()
    return { success: true, message: "Login exitoso", user: data.user, token: data.token }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return { success: false, message: "Error de conexión" }
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userData = localStorage.getItem("userData")
  if (!userData) return null

  try {
    const parsed = JSON.parse(userData)
    return parsed.user || parsed
  } catch {
    return null
  }
}

export function logoutUser(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")
  window.location.href = "/login"
}
