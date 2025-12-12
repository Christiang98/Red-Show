"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from 'next/navigation'
import type { User } from "@/lib/auth"

const API_URL = "/api"

interface AuthResponse {
  user: User
  token: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const userData = localStorage.getItem("userData")

    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al iniciar sesión")
      }

      const data: AuthResponse = await response.json()
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("userData", JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } catch (err: any) {
      const message = err.message || "Error al iniciar sesión"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (userData: any) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al registrarse")
      }

      return { success: true }
    } catch (err: any) {
      const message = err.message || "Error al registrarse"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    setUser(null)
    router.push("/login")
  }, [router])

  const isAuthenticated = !!user && !!localStorage.getItem("authToken")

  return { user, loading, error, login, register, logout, isAuthenticated }
}
