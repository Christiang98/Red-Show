'use client'
import { useState, useEffect } from 'react'
import { Crown, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface SubscriptionInfo {
  plan_name: string
  plan_type: string
  price: string
  status: string
  expires_at: string
  days_remaining: number
}

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  is_active: number
  created_at: string
  subscription?: SubscriptionInfo | null
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const [usersRes, subsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/subscriptions')
      ])
      const usersData = await usersRes.json()
      const subsData = subsRes.ok ? await subsRes.json() : { subscriptions: [] }

      const subsMap: Record<number, SubscriptionInfo> = {}
      ;(subsData.subscriptions || []).forEach((s: any) => {
        subsMap[s.user_id] = s
      })

      const users = (usersData.users || []).map((u: User) => ({
        ...u,
        subscription: subsMap[u.id] || null
      }))
      setUsuarios(users)
    } catch {
      setError('Error al cargar usuarios')
    }
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const handleAction = async (userId: number, action: string) => {
    setActionLoading(userId)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action })
    })
    await loadUsers()
    setActionLoading(null)
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = { artist: 'Artista', owner: 'Propietario', organizer: 'Organizador', admin: 'Administrador' }
    return labels[role] || role
  }

  const getStatusIcon = (user: User) => {
    if (!user.is_active) return <XCircle className="h-4 w-4 text-red-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="text-gray-500">Cargando usuarios...</div>
    </div>
  )

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Usuarios</h1>
        <span className="text-sm text-gray-500">{usuarios.length} usuarios registrados</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Suscripción</th>
              <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrado</th>
              <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div>
                    <p className="font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'artist' ? 'bg-blue-100 text-blue-700' :
                    user.role === 'owner' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(user)}
                    <span className={`text-sm font-medium ${user.is_active ? 'text-green-700' : 'text-red-600'}`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  {user.subscription ? (
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
                        <Crown className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{user.subscription.plan_name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className={`text-xs font-medium ${
                            user.subscription.days_remaining > 7 ? 'text-green-600' :
                            user.subscription.days_remaining > 0 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {user.subscription.days_remaining > 0
                              ? `${user.subscription.days_remaining} días restantes`
                              : 'Expirado'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{user.subscription.price}/mes</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Sin suscripción
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </td>
                <td className="p-4">
                  {user.role !== 'admin' && (
                    <div className="flex gap-1.5 justify-center flex-wrap">
                      <button
                        onClick={() => handleAction(user.id, user.is_active ? 'disable' : 'enable')}
                        disabled={actionLoading === user.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                          user.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}>
                        {user.is_active ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                      <a href={`/admin/usuarios/${user.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all">
                        Ver más
                      </a>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">No hay usuarios registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
