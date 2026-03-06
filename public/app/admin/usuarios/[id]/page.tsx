'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Crown, Clock, CheckCircle, XCircle, Star, User, Mail,
  Phone, MapPin, Shield, Music, Building2, AlertTriangle, Calendar,
  TrendingUp, Package, BadgeCheck, Ban, RefreshCw
} from 'lucide-react'

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    blue:   'bg-blue-100   text-blue-700   border-blue-200',
    green:  'bg-green-100  text-green-700  border-green-200',
    red:    'bg-red-100    text-red-700    border-red-200',
    amber:  'bg-amber-100  text-amber-700  border-amber-200',
    gray:   'bg-gray-100   text-gray-600   border-gray-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  )
}

function InfoRow({ icon: Icon, label, value, color = 'text-gray-500' }: any) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-gray-800 font-medium break-words">{value}</p>
      </div>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-4 w-4 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  )
}

export default function UsuarioDetalle() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [showUnsanctionConfirm, setShowUnsanctionConfirm] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`)
      if (!res.ok) throw new Error('No encontrado')
      const json = await res.json()
      setData(json.user)
    } catch {
      setError('No se pudo cargar el usuario')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const doAction = async (action: string, extra?: any) => {
    setActionLoading(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, action, ...extra }),
    })
    await load()
    setActionLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-500">
        <RefreshCw className="h-5 w-5 animate-spin" />
        Cargando usuario...
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 font-semibold mb-3">{error || 'Usuario no encontrado'}</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">← Volver</button>
      </div>
    </div>
  )

  const sub = data.subscription
  const roleLabel: Record<string, { label: string; color: string; Icon: any }> = {
    artist:    { label: 'Artista',        color: 'purple', Icon: Music },
    owner:     { label: 'Propietario',    color: 'blue',   Icon: Building2 },
    organizer: { label: 'Organizador',    color: 'green',  Icon: Calendar },
    admin:     { label: 'Administrador',  color: 'red',    Icon: Shield },
  }
  const role = roleLabel[data.role] || { label: data.role, color: 'gray', Icon: User }
  const RoleIcon = role.Icon

  const subDays = sub?.days_remaining ?? -1
  const subColor = subDays > 7 ? 'green' : subDays > 0 ? 'amber' : 'red'

  const fullName = `${data.first_name} ${data.last_name}`
  const initials = `${data.first_name?.[0] ?? ''}${data.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Detalle de usuario</h1>
          <p className="text-xs text-gray-500">{fullName}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Columna izquierda ─────────────────────────────── */}
        <div className="space-y-5">

          {/* Avatar + datos básicos */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-purple-600 to-blue-600" />
            <div className="px-5 pb-5">
              <div className="-mt-9 mb-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-black text-xl border-4 border-white shadow-md">
                  {initials}
                </div>
              </div>
              <h2 className="font-bold text-gray-900 text-lg leading-tight">{fullName}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge color={role.color}>
                  <RoleIcon className="h-3 w-3" />{role.label}
                </Badge>
                <Badge color={data.is_active ? 'green' : 'red'}>
                  {data.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {data.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
                {data.verified && <Badge color="blue"><BadgeCheck className="h-3 w-3" />Verificado</Badge>}
                {data.is_sanctioned && <Badge color="red"><AlertTriangle className="h-3 w-3" />Sancionado</Badge>}
              </div>
            </div>
          </div>

          {/* Suscripción */}
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${sub ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Crown className={`h-4 w-4 ${sub ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className="font-bold text-sm text-gray-800">Suscripción</span>
              </div>
            </div>
            <div className="p-5">
              {sub ? (
                <div className="space-y-3">
                  {/* Plan name + gradient */}
                  <div className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(183,68,184,0.1), rgba(0,28,85,0.08))', border: '1px solid rgba(183,68,184,0.2)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #B744B8, #7a1a8a)' }}>
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{sub.plan_name}</p>
                      <p className="text-xs text-gray-500">{sub.price}/mes</p>
                    </div>
                  </div>

                  {/* Días restantes */}
                  <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                    subDays > 7  ? 'bg-green-50 border-green-200'  :
                    subDays > 0  ? 'bg-amber-50 border-amber-200'  :
                    'bg-red-50 border-red-200'
                  }`}>
                    <Clock className={`h-4 w-4 flex-shrink-0 ${
                      subDays > 7 ? 'text-green-600' : subDays > 0 ? 'text-amber-600' : 'text-red-600'
                    }`} />
                    <div>
                      <p className={`font-bold text-sm ${
                        subDays > 7 ? 'text-green-800' : subDays > 0 ? 'text-amber-800' : 'text-red-800'
                      }`}>
                        {subDays > 0 ? `${subDays} días restantes` : subDays === 0 ? 'Expira hoy' : 'Expirado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Vence: {new Date(sub.expires_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span>Método de pago</span>
                      <span className="font-medium text-gray-600">{sub.payment_method || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inicio</span>
                      <span className="font-medium text-gray-600">
                        {new Date(sub.starts_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ref.</span>
                      <span className="font-medium text-gray-600 truncate max-w-[120px]">{sub.payment_reference || '—'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">Sin suscripción activa</p>
                  <p className="text-xs text-gray-300 mt-0.5">Plan gratuito</p>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Estadísticas</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calificación', value: data.average_rating > 0 ? data.average_rating.toFixed(1) : '—', sub: `${data.review_count} reseñas`, icon: Star, color: 'text-amber-500' },
                { label: 'Reseñas', value: data.review_count, sub: 'recibidas', icon: TrendingUp, color: 'text-blue-500' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                  <p className="text-xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
              ))}
            </div>
            {data.average_rating > 0 && (
              <div className="mt-3 flex justify-center">
                <StarRating rating={data.average_rating} />
              </div>
            )}
          </div>

          {/* Acciones */}
          {data.role !== 'admin' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Acciones</p>
              <div className="space-y-2">
                <button onClick={() => doAction(data.is_active ? 'disable' : 'enable')}
                  disabled={actionLoading}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                    data.is_active
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  }`}>
                  {data.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  {data.is_active ? 'Deshabilitar cuenta' : 'Habilitar cuenta'}
                </button>
                {/* Botón quitar sanción si está sancionado */}
                {data.is_sanctioned && data.is_active ? (
                  <button
                    onClick={() => setShowUnsanctionConfirm(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-all disabled:opacity-50">
                    <CheckCircle className="h-4 w-4" />
                    Quitar sanción
                  </button>
                ) : null}
                {!data.verified && (
                  <button onClick={() => doAction('verify')} disabled={actionLoading}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all disabled:opacity-50">
                    <BadgeCheck className="h-4 w-4" />
                    Verificar usuario
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info de sanción activa */}
          {data.is_sanctioned && (() => {
            const daysLeft = data.sanction_end
              ? Math.max(0, Math.ceil((new Date(data.sanction_end).getTime() - Date.now()) / 86400000))
              : null
            return (
              <div className="bg-orange-50 rounded-2xl border border-orange-200 shadow-sm p-5">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Sanción activa
                </p>
                <div className="space-y-3 text-sm">
                  {daysLeft !== null && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-orange-500 font-medium uppercase">Días restantes</p>
                        <p className="font-bold text-orange-800 text-base">{daysLeft} día{daysLeft !== 1 ? 's' : ''}</p>
                        {data.sanction_end && (
                          <p className="text-xs text-orange-500 mt-0.5">
                            Vence: {new Date(data.sanction_end).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {data.sanction_reason && (
                    <div className="flex items-start gap-2 p-3 bg-orange-100 rounded-xl border border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-orange-500 font-medium uppercase mb-1">Mensaje enviado al usuario</p>
                        <p className="text-orange-900 leading-relaxed">{data.sanction_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Confirmación para quitar sanción */}
          {showUnsanctionConfirm && (
            <div className="bg-white rounded-2xl border-2 border-green-400 shadow-lg p-5">
              <p className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                ¿Deseas quitarle la sanción a este usuario?
              </p>
              <p className="text-sm text-gray-500 mb-4">El perfil del usuario volverá a estar disponible.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { doAction('unsanction'); setShowUnsanctionConfirm(false) }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50">
                  Sí, quitar sanción
                </button>
                <button
                  onClick={() => setShowUnsanctionConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Columna derecha ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Información personal */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Información personal</p>
            <div className="divide-y-0">
              <InfoRow icon={Mail}  label="Email"    value={data.email}                                  color="text-purple-500" />
              <InfoRow icon={Phone} label="Teléfono" value={data.phone || data.profile_phone}            color="text-blue-500"   />
              <InfoRow icon={MapPin} label="Ubicación" value={data.location}                             color="text-green-500"  />
              <InfoRow icon={User}  label="Biografía" value={data.bio}                                   color="text-gray-400"   />
              <InfoRow icon={Calendar} label="Registrado"
                value={new Date(data.created_at || Date.now()).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                color="text-gray-400" />
            </div>
          </div>

          {/* Perfil artista */}
          {data.artist_profile && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Music className="h-4 w-4 text-purple-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Perfil de Artista</p>
                <Badge color={data.artist_profile.is_published ? 'green' : 'gray'}>
                  {data.artist_profile.is_published ? 'Publicado' : 'Borrador'}
                </Badge>
              </div>
              <div className="divide-y-0">
                <InfoRow icon={User}    label="Nombre artístico" value={data.artist_profile.stage_name}      color="text-purple-500" />
                <InfoRow icon={Music}   label="Categoría"        value={data.artist_profile.category}        color="text-blue-500"   />
                <InfoRow icon={TrendingUp} label="Experiencia"   value={data.artist_profile.experience_years ? `${data.artist_profile.experience_years} años` : null} color="text-green-500" />
                <InfoRow icon={User}    label="Bio"              value={data.artist_profile.bio}             color="text-gray-400"   />
              </div>
            </div>
          )}

          {/* Perfil propietario */}
          {data.owner_profile && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Perfil de Local</p>
                <Badge color={data.owner_profile.is_published ? 'green' : 'gray'}>
                  {data.owner_profile.is_published ? 'Publicado' : 'Borrador'}
                </Badge>
              </div>
              <div className="divide-y-0">
                <InfoRow icon={Building2} label="Nombre del local" value={data.owner_profile.business_name}  color="text-blue-500"   />
                <InfoRow icon={User}      label="Tipo de negocio"  value={data.owner_profile.business_type}   color="text-purple-500" />
                <InfoRow icon={MapPin}    label="Dirección"        value={[data.owner_profile.address, data.owner_profile.neighborhood, data.owner_profile.city].filter(Boolean).join(', ')} color="text-green-500" />
                <InfoRow icon={TrendingUp} label="Capacidad"       value={data.owner_profile.capacity ? `${data.owner_profile.capacity} personas` : null} color="text-orange-500" />
                <InfoRow icon={User}      label="Descripción"      value={data.owner_profile.description}     color="text-gray-400"   />
              </div>
            </div>
          )}

          {/* Reseñas */}
          {data.reviews?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                Reseñas recibidas ({data.reviews.length})
              </p>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.reviews.map((r: any) => (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {r.reviewer_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{r.reviewer_name || 'Usuario'}</p>
                          <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <StarRating rating={r.rating} />
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 leading-relaxed mt-2">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
