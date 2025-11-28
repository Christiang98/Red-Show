// Tipos compartidos entre frontend y backend
export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: "owner" | "artist" | "organizer"
  profileImage?: string
  location?: string
  bio?: string
  socialMedia?: {
    instagram?: string
    facebook?: string
    whatsapp?: string
  }
  createdAt: string
}

export interface Event {
  id: number
  name: string
  description: string
  category: string
  location: string
  latitude?: number
  longitude?: number
  image?: string
  rating: number
  reviews: number
  owner: User
  createdAt: string
}

export interface Artist {
  id: number
  user: User
  category: string
  experience: string
  portfolio?: string
  availability?: string
  pricePerHour: number
  rating: number
}

export interface Booking {
  id: number
  event: Event
  artist: Artist
  eventDate: string
  status: "pending" | "accepted" | "rejected" | "completed"
  notes?: string
  createdAt: string
}

export interface Message {
  id: number
  sender: User
  receiver: User
  content: string
  createdAt: string
  read: boolean
}

export interface Review {
  id: number
  author: User
  target: User
  rating: number
  comment: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}
