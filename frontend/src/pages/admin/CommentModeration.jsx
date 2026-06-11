import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@services/api'
import Card from '@components/common/Card'
import Button from '@components/common/Button'
import Spinner from '@components/common/Spinner'
import EmptyState from '@components/common/EmptyState'
import BackButton from '@components/common/BackButton'
import { formatRelativeDate } from '@utils/helpers'
import toast from 'react-hot-toast'

const CommentModeration = () => {
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    loadComments()
  }, [])

  const loadComments = async () => {
    try {
      const response = await api.get('/admin/comments')
      if (response.data.success) {
        setComments(response.data.comments)
      }
    } catch (error) {
      toast.error('Error al cargar comentarios')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId) => {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) {
      return
    }

    setDeleting(commentId)
    try {
      const response = await api.delete(`/admin/comments/${commentId}`)
      if (response.data.success) {
        toast.success('Comentario eliminado')
        loadComments()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar comentario')
    } finally {
      setDeleting(null)
    }
  }

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??'
  }

  if (loading) return <Spinner fullScreen />

  if (comments.length === 0) {
    return (
      <div className="py-12">
        <div className="container-custom">
          <BackButton />
          <h1 className="text-4xl font-heading text-primary mb-8">Moderación de Comentarios</h1>
          <EmptyState
            emoji="💬"
            title="No hay comentarios"
            message="Aún no se han publicado comentarios en las recetas"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="container-custom">
        <BackButton />
        <div className="mb-8">
          <h1 className="text-4xl font-heading text-primary mb-2">Moderación de Comentarios</h1>
          <p className="text-neutral-gray-600">
            {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'} en total
          </p>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <div className="flex gap-4">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                    {getInitials(comment.usuario_nombre)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-neutral-gray-800">
                        {comment.usuario_nombre}
                      </p>
                      <p className="text-sm text-neutral-gray-500">
                        {formatRelativeDate(comment.fecha_creacion)}
                      </p>
                    </div>
                  </div>

                  <p className="text-neutral-gray-700 mb-3">{comment.comentario}</p>

                  {/* Recipe Info */}
                  <div className="bg-neutral-gray-50 p-3 rounded-lg mb-3 flex items-center justify-between">
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/recipes/${comment.receta_id}`)}
                    >
                      <span className="text-sm text-neutral-gray-600">En la receta:</span>
                      <span className="font-medium text-neutral-gray-800">
                        {comment.receta_nombre}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/recipes/${comment.receta_id}`)}
                    >
                      Ver Receta
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      loading={deleting === comment.id}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CommentModeration
