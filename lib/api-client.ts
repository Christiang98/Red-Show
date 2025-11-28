// Cliente para comunicarse con Django backend
const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api"

type AuthResponse = {}

type User = {}

type Artist = {}

type Event = {}

type Booking = {}

type Message = {}

type Review = {}

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "API Error")
  }

  return response.json()
}

// Auth endpoints
export const authAPI = {
  register: (data: any) =>
    apiCall<AuthResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) =>
    apiCall<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiCall("/auth/logout/", { method: "POST" }),

  getProfile: () => apiCall<User>("/auth/profile/"),
}

// Users endpoints
export const usersAPI = {
  getUser: (id: number) => apiCall<User>(`/users/${id}/`),
  updateProfile: (data: Partial<User>) =>
    apiCall<User>("/users/profile/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getArtists: (filters?: any) =>
    apiCall<Artist[]>("/users/artists/", {
      method: "GET",
    }),
}

// Events endpoints
export const eventsAPI = {
  list: (filters?: any) =>
    apiCall<Event[]>("/events/", {
      method: "GET",
    }),

  create: (data: Partial<Event>) =>
    apiCall<Event>("/events/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: number) => apiCall<Event>(`/events/${id}/`),

  update: (id: number, data: Partial<Event>) =>
    apiCall<Event>(`/events/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) => apiCall(`/events/${id}/`, { method: "DELETE" }),
}

// Bookings endpoints
export const bookingsAPI = {
  list: () => apiCall<Booking[]>("/bookings/"),

  create: (data: Partial<Booking>) =>
    apiCall<Booking>("/bookings/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, status: string) =>
    apiCall<Booking>(`/bookings/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
}

// Messaging endpoints
export const messagingAPI = {
  getConversations: () => apiCall<any[]>("/messages/conversations/"),

  getMessages: (userId: number) => apiCall<Message[]>(`/messages/with/${userId}/`),

  sendMessage: (recipientId: number, content: string) =>
    apiCall<Message>("/messages/", {
      method: "POST",
      body: JSON.stringify({ recipientId, content }),
    }),
}

// Reviews endpoints
export const reviewsAPI = {
  list: () => apiCall<Review[]>("/reviews/"),

  create: (data: Partial<Review>) =>
    apiCall<Review>("/reviews/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getByUser: (userId: number) => apiCall<Review[]>(`/reviews/user/${userId}/`),
}
