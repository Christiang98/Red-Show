'use client'
import { useState } from 'react'

export default function AdminUsuarios() {
  const [usuarios] = useState([]) // conectar con DB existente

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Usuarios</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Rol</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user:any) => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.nombre}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.rol}</td>
                <td className="p-3">{user.estado}</td>
                <td className="p-3 flex gap-2 justify-center">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded">
                    Ver más
                  </button>
                  <button className="px-3 py-1 bg-green-600 text-white rounded">
                    Enviar mensaje
                  </button>
                  <button className="px-3 py-1 bg-yellow-500 text-white rounded">
                    Aplicar sanción
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded">
                    Dar de baja
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
