const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Aplicar middlewares a todas las rutas de admin
router.use(verifyToken, verifyAdmin);

// ========== ESTADÍSTICAS ==========

// GET /api/admin/stats - Obtener estadísticas del dashboard
router.get('/stats', async (req, res) => {
    try {
        // Total de usuarios
        const [totalUsuariosResult] = await db.execute(
            'SELECT COUNT(*) as total FROM users'
        );
        const totalUsuarios = totalUsuariosResult[0].total;

        // Total de recetas
        const [totalRecetasResult] = await db.execute(
            "SELECT COUNT(*) as total FROM recipes WHERE estado = 'publicada'"
        );
        const totalRecetas = totalRecetasResult[0].total;

        // Recetas pendientes
        const [pendientesResult] = await db.execute(
            "SELECT COUNT(*) as total FROM recipes WHERE estado = 'pendiente'"
        );
        const recetasPendientes = pendientesResult[0].total;

        // Total de comentarios
        const [totalComentariosResult] = await db.execute(
            'SELECT COUNT(*) as total FROM comments'
        );
        const totalComentarios = totalComentariosResult[0].total;

        // Usuarios nuevos este mes
        const [usuariosNuevosMesResult] = await db.execute(
            'SELECT COUNT(*) as total FROM users WHERE MONTH(fecha_registro) = MONTH(CURRENT_DATE) AND YEAR(fecha_registro) = YEAR(CURRENT_DATE)'
        );
        const usuariosNuevosEsteMes = usuariosNuevosMesResult[0].total;

        // Recetas publicadas esta semana
        const [recetasSemanaResult] = await db.execute(
            "SELECT COUNT(*) as total FROM recipes WHERE estado = 'publicada' AND fecha_creacion >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)"
        );
        const recetasPublicadasEstaSemana = recetasSemanaResult[0].total;

        res.json({
            success: true,
            stats: {
                totalUsuarios,
                totalRecetas,
                recetasPendientes,
                totalComentarios,
                usuariosNuevosEsteMes,
                recetasPublicadasEstaSemana
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

// GET /api/admin/recent-users - Obtener usuarios recientes para dashboard
router.get('/recent-users', async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT id, nombre, email, rol, fecha_registro
            FROM users
            ORDER BY fecha_registro DESC
            LIMIT 5
        `);

        res.json({ success: true, users });
    } catch (error) {
        console.error('Error al obtener usuarios recientes:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// GET /api/admin/pending-recipes-summary - Obtener recetas pendientes para dashboard
router.get('/pending-recipes-summary', async (req, res) => {
    try {
        const [recipes] = await db.execute(`
            SELECT
                r.id,
                r.nombre,
                r.categoria_id,
                c.icono as categoria_icono,
                c.color as categoria_color,
                u.nombre as autor_nombre,
                r.fecha_creacion
            FROM recipes r
            LEFT JOIN categories c ON r.categoria_id = c.id
            LEFT JOIN users u ON r.autor_id = u.id
            WHERE r.estado = 'pendiente'
            ORDER BY r.fecha_creacion DESC
            LIMIT 5
        `);

        res.json({ success: true, recipes });
    } catch (error) {
        console.error('Error al obtener recetas pendientes:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ========== GESTIÓN DE USUARIOS ==========

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', async (req, res) => {
    try {
        const { search = '', rol = '', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT
                id, nombre, email, telefono, rol, foto_perfil, fecha_registro,
                (SELECT COUNT(*) FROM recipes WHERE autor_id = users.id) as total_recetas,
                (SELECT COUNT(*) FROM comments WHERE usuario_id = users.id) as total_comentarios
            FROM users
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (nombre LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (rol) {
            query += ' AND rol = ?';
            params.push(rol);
        }

        query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await db.execute(query, params);

        // Obtener total para paginación
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const countParams = [];

        if (search) {
            countQuery += ' AND (nombre LIKE ? OR email LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (rol) {
            countQuery += ' AND rol = ?';
            countParams.push(rol);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
});

// PUT /api/admin/users/:id/role - Cambiar rol de usuario
router.put('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;

        // Validar rol (solo usuario y admin)
        if (!['usuario', 'admin'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Solo se permiten: usuario, admin'
            });
        }

        // Evitar que el admin se quite a sí mismo el rol de admin
        if (parseInt(id) === req.user.id && rol !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'No puedes cambiar tu propio rol de administrador'
            });
        }

        await db.execute(
            'UPDATE users SET rol = ? WHERE id = ?',
            [rol, id]
        );

        res.json({
            success: true,
            message: 'Rol actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar rol'
        });
    }
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Evitar que el admin se elimine a sí mismo
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
            });
        }

        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario'
        });
    }
});

// ========== GESTIÓN DE RECETAS ==========

// GET /api/admin/recipes - Listar todas las recetas con filtros
router.get('/recipes', async (req, res) => {
    try {
        const { search = '', categoria = '', estado = '', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT
                r.id,
                r.nombre,
                r.descripcion,
                r.categoria_id,
                r.estado,
                r.estado_rechazo as razon_rechazo,
                r.tiempo_preparacion,
                r.foto_principal,
                r.fecha_creacion,
                c.nombre as categoria_nombre,
                c.icono as categoria_icono,
                c.color as categoria_color,
                u.nombre as autor_nombre,
                u.email as autor_email,
                COALESCE(AVG(rat.puntuacion), 0) as calificacion_promedio,
                COUNT(DISTINCT rat.id) as total_valoraciones
            FROM recipes r
            LEFT JOIN categories c ON r.categoria_id = c.id
            LEFT JOIN users u ON r.autor_id = u.id
            LEFT JOIN ratings rat ON r.id = rat.receta_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (r.nombre LIKE ? OR u.nombre LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (categoria) {
            query += ' AND r.categoria_id = ?';
            params.push(categoria);
        }

        if (estado) {
            query += ' AND r.estado = ?';
            params.push(estado);
        }

        query += ' GROUP BY r.id, c.id, u.id ORDER BY r.fecha_creacion DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [recipes] = await db.execute(query, params);

        // Obtener total
        let countQuery = `
            SELECT COUNT(DISTINCT r.id) as total
            FROM recipes r
            LEFT JOIN users u ON r.autor_id = u.id
            WHERE 1=1
        `;
        const countParams = [];

        if (search) {
            countQuery += ' AND (r.nombre LIKE ? OR u.nombre LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (categoria) {
            countQuery += ' AND r.categoria_id = ?';
            countParams.push(categoria);
        }

        if (estado) {
            countQuery += ' AND r.estado = ?';
            countParams.push(estado);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            recipes,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener recetas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recetas'
        });
    }
});

// GET /api/admin/recipes/pending - Listar recetas pendientes de aprobación
router.get('/recipes/pending', async (req, res) => {
    try {
        const [recipes] = await db.execute(`
            SELECT
                r.*,
                u.nombre as autor_nombre,
                u.email as autor_email
            FROM recipes r
            LEFT JOIN users u ON r.autor_id = u.id
            WHERE r.estado = 'pendiente'
            ORDER BY r.fecha_creacion DESC
        `);

        // Obtener ingredientes y pasos para cada receta
        for (let recipe of recipes) {
            const [ingredients] = await db.execute(
                'SELECT * FROM ingredients WHERE receta_id = ? ORDER BY id',
                [recipe.id]
            );

            const [steps] = await db.execute(
                'SELECT * FROM steps WHERE receta_id = ? ORDER BY numero_paso',
                [recipe.id]
            );

            recipe.ingredients = ingredients;
            recipe.steps = steps;
        }

        res.json({
            success: true,
            recipes
        });

    } catch (error) {
        console.error('Error al obtener recetas pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recetas pendientes'
        });
    }
});

// PUT /api/admin/recipes/:id/approve - Aprobar receta
router.put('/recipes/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute(
            "UPDATE recipes SET estado = 'publicada', estado_rechazo = NULL WHERE id = ?",
            [id]
        );

        // Opcional: crear notificación para el usuario
        const [recipe] = await db.execute(
            'SELECT autor_id, nombre FROM recipes WHERE id = ?',
            [id]
        );

        if (recipe.length > 0) {
            await db.execute(
                `INSERT INTO notifications (usuario_id, tipo, titulo, mensaje, enlace, fecha_creacion)
                 VALUES (?, 'receta_aprobada', 'Receta aprobada', ?, ?, NOW())`,
                [
                    recipe[0].autor_id,
                    `Tu receta "${recipe[0].nombre}" ha sido aprobada y publicada.`,
                    `/recipes/${id}`
                ]
            );
        }

        res.json({
            success: true,
            message: 'Receta aprobada exitosamente'
        });

    } catch (error) {
        console.error('Error al aprobar receta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aprobar receta'
        });
    }
});

// PUT /api/admin/recipes/:id/toggle-active - Activar/Desactivar receta
router.put('/recipes/:id/toggle-active', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener estado actual
        const [recipe] = await db.execute(
            'SELECT activo, nombre FROM recipes WHERE id = ?',
            [id]
        );

        if (recipe.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Receta no encontrada'
            });
        }

        const nuevoEstado = !recipe[0].activo;

        await db.execute(
            'UPDATE recipes SET activo = ? WHERE id = ?',
            [nuevoEstado, id]
        );

        res.json({
            success: true,
            message: nuevoEstado ? 'Receta activada exitosamente' : 'Receta desactivada exitosamente',
            activo: nuevoEstado
        });

    } catch (error) {
        console.error('Error al cambiar estado de receta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado de receta'
        });
    }
});

// PUT /api/admin/recipes/:id/reject - Rechazar receta
router.put('/recipes/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo || motivo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Debes proporcionar un motivo de rechazo'
            });
        }

        await db.execute(
            "UPDATE recipes SET estado = 'rechazada', estado_rechazo = ? WHERE id = ?",
            [motivo, id]
        );

        // Opcional: crear notificación para el usuario
        const [recipe] = await db.execute(
            'SELECT autor_id, nombre FROM recipes WHERE id = ?',
            [id]
        );

        if (recipe.length > 0) {
            await db.execute(
                `INSERT INTO notifications (usuario_id, tipo, titulo, mensaje, enlace, fecha_creacion)
                 VALUES (?, 'receta_rechazada', 'Receta rechazada', ?, ?, NOW())`,
                [
                    recipe[0].autor_id,
                    `Tu receta "${recipe[0].nombre}" ha sido rechazada. Motivo: ${motivo}`,
                    `/recipes/${id}`
                ]
            );
        }

        res.json({
            success: true,
            message: 'Receta rechazada exitosamente'
        });

    } catch (error) {
        console.error('Error al rechazar receta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al rechazar receta'
        });
    }
});

// DELETE /api/admin/recipes/:id - Eliminar receta completamente
router.delete('/recipes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Eliminar en cascada: ingredientes, pasos, favoritos, ratings, comentarios, colecciones
        await db.execute('DELETE FROM ingredients WHERE receta_id = ?', [id]);
        await db.execute('DELETE FROM steps WHERE receta_id = ?', [id]);
        await db.execute('DELETE FROM favorites WHERE receta_id = ?', [id]);
        await db.execute('DELETE FROM ratings WHERE receta_id = ?', [id]);
        await db.execute('DELETE FROM comments WHERE receta_id = ?', [id]);
        await db.execute('DELETE FROM collection_recipes WHERE receta_id = ?', [id]);
        // Nota: No podemos eliminar notificaciones por receta_id ya que ahora usan enlace
        // Las notificaciones se conservarán aunque la receta sea eliminada

        // Finalmente eliminar la receta
        await db.execute('DELETE FROM recipes WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Receta eliminada correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar receta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar receta'
        });
    }
});

// ========== MODERACIÓN DE COMENTARIOS ==========

// GET /api/admin/comments - Listar todos los comentarios (moderación)
router.get('/comments', async (req, res) => {
    try {
        const { search = '', recipeId = '', page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT
                c.id, c.comentario, c.fecha,
                u.id as usuario_id, u.nombre as usuario_nombre, u.email as usuario_email,
                r.id as receta_id, r.nombre as receta_nombre
            FROM comments c
            LEFT JOIN users u ON c.usuario_id = u.id
            LEFT JOIN recipes r ON c.receta_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (c.comentario LIKE ? OR u.nombre LIKE ? OR r.nombre LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (recipeId) {
            query += ' AND c.receta_id = ?';
            params.push(recipeId);
        }

        query += ' ORDER BY c.fecha DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [comments] = await db.execute(query, params);

        // Obtener total
        let countQuery = 'SELECT COUNT(*) as total FROM comments c LEFT JOIN users u ON c.usuario_id = u.id LEFT JOIN recipes r ON c.receta_id = r.id WHERE 1=1';
        const countParams = [];

        if (search) {
            countQuery += ' AND (c.comentario LIKE ? OR u.nombre LIKE ? OR r.nombre LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (recipeId) {
            countQuery += ' AND c.receta_id = ?';
            countParams.push(recipeId);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            comments,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener comentarios'
        });
    }
});

// DELETE /api/admin/comments/:id - Eliminar comentario (moderación)
router.delete('/comments/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute('DELETE FROM comments WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Comentario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar comentario'
        });
    }
});

// ========== GESTIÓN DE RECETAS ESPECIALES ==========

// PUT /api/admin/recipes/:id/set-week - Marcar/Desmarcar como receta de la semana
router.put('/recipes/:id/set-week', async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body; // true para marcar, false para desmarcar

        if (active) {
            // Primero desmarcar todas las recetas de la semana
            await db.execute('UPDATE recipes SET receta_semana = FALSE');

            // Marcar solo esta como receta de la semana
            await db.execute('UPDATE recipes SET receta_semana = TRUE WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Receta marcada como receta de la semana'
            });
        } else {
            // Solo desmarcar esta receta
            await db.execute('UPDATE recipes SET receta_semana = FALSE WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Receta desmarcada como receta de la semana'
            });
        }

    } catch (error) {
        console.error('Error al actualizar receta de la semana:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar receta de la semana'
        });
    }
});

// PUT /api/admin/recipes/:id/set-featured - Marcar/Desmarcar como destacada
router.put('/recipes/:id/set-featured', async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body; // true para marcar, false para desmarcar

        await db.execute(
            'UPDATE recipes SET destacada = ? WHERE id = ?',
            [active, id]
        );

        res.json({
            success: true,
            message: active ? 'Receta marcada como destacada' : 'Receta desmarcada como destacada'
        });

    } catch (error) {
        console.error('Error al actualizar receta destacada:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar receta destacada'
        });
    }
});

// PUT /api/admin/recipes/:id/edit - Editar receta completa (admin)
router.put('/recipes/:id/edit', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            categoria_id,
            dificultad,
            tiempo_preparacion,
            porciones,
            temporada,
            dieta_especial
        } = req.body;

        // Construir query dinámicamente según los campos enviados
        const updates = [];
        const values = [];

        if (nombre !== undefined) {
            updates.push('nombre = ?');
            values.push(nombre);
        }
        if (descripcion !== undefined) {
            updates.push('descripcion = ?');
            values.push(descripcion);
        }
        if (categoria_id !== undefined) {
            updates.push('categoria_id = ?');
            values.push(categoria_id);
        }
        if (dificultad !== undefined) {
            updates.push('dificultad = ?');
            values.push(dificultad);
        }
        if (tiempo_preparacion !== undefined) {
            updates.push('tiempo_preparacion = ?');
            values.push(tiempo_preparacion);
        }
        if (porciones !== undefined) {
            updates.push('porciones = ?');
            values.push(porciones);
        }
        if (temporada !== undefined) {
            updates.push('temporada = ?');
            values.push(temporada);
        }
        if (dieta_especial !== undefined) {
            updates.push('dieta_especial = ?');
            values.push(dieta_especial);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }

        values.push(id);

        await db.execute(
            `UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Receta actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar receta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar receta'
        });
    }
});

module.exports = router;
