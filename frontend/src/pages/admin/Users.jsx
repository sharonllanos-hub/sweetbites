import { useState, useEffect } from 'react'
import { api } from '@services/api'
import Card from '@components/common/Card'
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import Badge from '@components/common/Badge'
import Spinner from '@components/common/Spinner'
import Modal from '@components/common/Modal'
import BackButton from '@components/common/BackButton'
import { formatRelativeDate } from '@utils/helpers'
import toast from 'react-hot-toast'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null })

  useEffect(() => {
    loadUsers()
  }, [page, search])

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { search, page, limit: 10 }
      })
      if (response.data.success) {
        setUsers(response.data.users)
        setTotalPages(response.data.totalPages || 1)
      }
    } catch (error) {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { rol: newRole })
      if (response.data.success) {
        toast.success('Rol actualizado correctamente')
        loadUsers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar rol')
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return

    try {
      const response = await api.delete(`/admin/users/${deleteModal.user.id}`)
      if (response.data.success) {
        toast.success('Usuario eliminado correctamente')
        setDeleteModal({ isOpen: false, user: null })
        loadUsers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar usuario')
    }
  }

  const getRoleBadge = (rol) => {
    const badges = {
      admin: { variant: 'error', text: 'Admin' },
      usuario: { variant: 'primary', text: 'Usuario' }
    }
    return badges[rol] || badges.usuario
  }

  if (loading) return <Spinner fullScreen />

  return (
    <div className="py-12">
      <div className="container-custom">
        <BackButton />
        <div className="mb-8">
          <h1 className="text-4xl font-heading text-primary mb-2">Gestión de Usuarios</h1>
          <p className="text-neutral-gray-600">
            Administra usuarios y sus roles en la plataforma
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </Card>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-gray-700">Usuario</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-gray-700">Rol</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-gray-700">Registro</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleBadge = getRoleBadge(user.rol)
                  return (
                    <tr key={user.id} className="border-b border-neutral-gray-100 hover:bg-neutral-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-gray-800">{user.nombre}</p>
                            {user.telefono && (
                              <p className="text-sm text-neutral-gray-500">{user.telefono}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-neutral-gray-600">{user.email}</td>
                      <td className="py-4 px-4">
                        <select
                          className="input py-1 text-sm"
                          value={user.rol}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          <option value="usuario">Usuario</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-sm text-neutral-gray-500">
                        {formatRelativeDate(user.fecha_registro)}
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteModal({ isOpen: true, user })}
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6 pt-6 border-t border-neutral-gray-200">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← Anterior
              </Button>
              <span className="px-4 py-2 text-neutral-gray-600">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente →
              </Button>
            </div>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, user: null })}
          title="Confirmar Eliminación"
        >
          <div className="space-y-4">
            <p className="text-neutral-gray-700">
              ¿Estás seguro de que deseas eliminar al usuario{' '}
              <strong>{deleteModal.user?.nombre}</strong>?
            </p>
            <p className="text-sm text-error">
              Esta acción no se puede deshacer. Se eliminarán todas las recetas, comentarios y favoritos asociados a este usuario.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ isOpen: false, user: null })}
              >
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteUser}>
                Eliminar Usuario
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default Users
