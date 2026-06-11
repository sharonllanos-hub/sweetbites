const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// GET /api/users/favorites - Obtener favoritos del usuario
router.get('/favorites', verifyToken, async (req, res) => {
    try {
        const [favorites] = await db.execute(`
            SELECT
                r.id, r.nombre, r.descripcion, r.categoria_id, r.dificultad,
                r.tiempo_preparacion, r.porciones, r.foto_principal,
                c.nombre as categoria_nombre, c.icono as categoria_icono, c.color as categoria_color,
                f.fecha_guardado,
                COALESCE(AVG(rat.puntuacion), 0) as calificacion_promedio,
                COUNT(DISTINCT rat.id) as total_valoraciones
            FROM favorites f
            JOIN recipes r ON f.receta_id = r.id
            LEFT JOIN categories c ON r.categoria_id = c.id
            LEFT JOIN ratings rat ON r.id = rat.receta_id
            WHERE f.usuario_id = ?
            GROUP BY r.id, c.id
            ORDER BY f.fecha_guardado DESC
        `, [req.user.id]);

        res.json({
            success: true,
            favorites
        });

    } catch (error) {
        console.error('Error al obtener favoritos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener favoritos'
        });
    }
});

// POST /api/users/favorites/:recipeId - Guardar receta en favoritos
router.post('/favorites/:recipeId', verifyToken, async (req, res) => {
    try {
        const { recipeId } = req.params;

        // Verificar si ya está en favoritos
        const [existing] = await db.execute(
            'SELECT id FROM favorites WHERE usuario_id = ? AND receta_id = ?',
            [req.user.id, recipeId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'La receta ya está en favoritos'
            });
        }

        // Agregar a favoritos
        await db.execute(
            'INSERT INTO favorites (usuario_id, receta_id, fecha_guardado) VALUES (?, ?, NOW())',
            [req.user.id, recipeId]
        );

        res.status(201).json({
            success: true,
            message: 'Receta agregada a favoritos'
        });

    } catch (error) {
        console.error('Error al guardar favorito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar en favoritos'
        });
    }
});

// DELETE /api/users/favorites/:recipeId - Quitar de favoritos
router.delete('/favorites/:recipeId', verifyToken, async (req, res) => {
    try {
        const { recipeId } = req.params;

        await db.execute(
            'DELETE FROM favorites WHERE usuario_id = ? AND receta_id = ?',
            [req.user.id, recipeId]
        );

        res.json({
            success: true,
            message: 'Receta eliminada de favoritos'
        });

    } catch (error) {
        console.error('Error al eliminar favorito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar de favoritos'
        });
    }
});

// GET /api/users/collections - Obtener colecciones del usuario
router.get('/collections', verifyToken, async (req, res) => {
    try {
        const [collections] = await db.execute(
            'SELECT * FROM collections WHERE usuario_id = ? ORDER BY fecha_creacion DESC',
            [req.user.id]
        );

        res.json({
            success: true,
            collections
        });

    } catch (error) {
        console.error('Error al obtener colecciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener colecciones'
        });
    }
});

// POST /api/users/collections - Crear nueva colección
router.post('/collections', verifyToken, async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la colección es obligatorio'
            });
        }

        const [result] = await db.execute(
            'INSERT INTO collections (usuario_id, nombre, descripcion, fecha_creacion) VALUES (?, ?, ?, NOW())',
            [req.user.id, nombre, descripcion || null]
        );

        res.status(201).json({
            success: true,
            message: 'Colección creada exitosamente',
            collectionId: result.insertId
        });

    } catch (error) {
        console.error('Error al crear colección:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear colección'
        });
    }
});

// GET /api/users/collections/:id - Obtener colección individual con sus recetas
router.get('/collections/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener información de la colección
        const [collections] = await db.execute(
            'SELECT * FROM collections WHERE id = ? AND usuario_id = ?',
            [id, req.user.id]
        );

        if (collections.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Colección no encontrada'
            });
        }

        const collection = collections[0];

        // Obtener recetas de la colección
        const [recipes] = await db.execute(`
            SELECT
                r.id, r.nombre, r.descripcion, r.categoria_id, r.dificultad,
                r.tiempo_preparacion, r.porciones, r.foto_principal,
                c.nombre as categoria_nombre, c.icono as categoria_icono, c.color as categoria_color,
                COALESCE(AVG(rat.puntuacion), 0) as calificacion_promedio,
                COUNT(DISTINCT rat.id) as total_valoraciones,
                COUNT(DISTINCT f.id) as total_favoritos
            FROM collection_recipes cr
            JOIN recipes r ON cr.receta_id = r.id
            LEFT JOIN categories c ON r.categoria_id = c.id
            LEFT JOIN ratings rat ON r.id = rat.receta_id
            LEFT JOIN favorites f ON r.id = f.receta_id
            WHERE cr.coleccion_id = ?
            GROUP BY r.id, c.id
            ORDER BY cr.fecha_agregado DESC
        `, [id]);

        collection.recipes = recipes;
        collection.total_recetas = recipes.length;

        res.json({
            success: true,
            collection
        });

    } catch (error) {
        console.error('Error al obtener colección:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener colección'
        });
    }
});

// DELETE /api/users/collections/:id - Eliminar colección
router.delete('/collections/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Primero eliminar todas las recetas de la colección
        await db.execute('DELETE FROM collection_recipes WHERE coleccion_id = ?', [id]);

        // Luego eliminar la colección
        await db.execute(
            'DELETE FROM collections WHERE id = ? AND usuario_id = ?',
            [id, req.user.id]
        );

        res.json({
            success: true,
            message: 'Colección eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar colección:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar colección'
        });
    }
});

// POST /api/users/collections/:id/recipes/:recipeId - Agregar receta a colección
router.post('/collections/:id/recipes/:recipeId', verifyToken, async (req, res) => {
    try {
        const { id, recipeId } = req.params;

        // Verificar que la colección pertenece al usuario
        const [collections] = await db.execute(
            'SELECT id FROM collections WHERE id = ? AND usuario_id = ?',
            [id, req.user.id]
        );

        if (collections.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Colección no encontrada'
            });
        }

        // Verificar que la receta no esté ya en la colección
        const [existing] = await db.execute(
            'SELECT id FROM collection_recipes WHERE coleccion_id = ? AND receta_id = ?',
            [id, recipeId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'La receta ya está en esta colección'
            });
        }

        // Agregar receta a la colección
        await db.execute(
            'INSERT INTO collection_recipes (coleccion_id, receta_id, fecha_agregado) VALUES (?, ?, NOW())',
            [id, recipeId]
        );

        res.json({
            success: true,
            message: 'Receta agregada a la colección'
        });

    } catch (error) {
        console.error('Error al agregar receta a colección:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar receta a colección'
        });
    }
});

// DELETE /api/users/collections/:id/recipes/:recipeId - Quitar receta de colección
router.delete('/collections/:id/recipes/:recipeId', verifyToken, async (req, res) => {
    try {
        const { id, recipeId } = req.params;

        // Verificar que la colección pertenece al usuario
        const [collections] = await db.execute(
            'SELECT id FROM collections WHERE id = ? AND usuario_id = ?',
            [id, req.user.id]
        );

        if (collections.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Colección no encontrada'
            });
        }

        // Eliminar receta de la colección
        await db.execute(
            'DELETE FROM collection_recipes WHERE coleccion_id = ? AND receta_id = ?',
            [id, recipeId]
        );

        res.json({
            success: true,
            message: 'Receta eliminada de la colección'
        });

    } catch (error) {
        console.error('Error al eliminar receta de colección:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar receta de colección'
        });
    }
});

// PUT /api/users/change-password - Cambiar contraseña del usuario autenticado
router.put('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validar campos
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere la contraseña actual y la nueva contraseña'
            });
        }

        // Validar longitud mínima de nueva contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Obtener usuario con contraseña
        const [users] = await db.execute(
            'SELECT id, password_hash FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];

        // Verificar contraseña actual
        const bcrypt = require('bcryptjs');
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña en la base de datos
        await db.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar la contraseña',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// ENDPOINTS PARA FUNCIONALIDADES PREMIUM
// ============================================

// POST /api/users/upgrade-premium - Simular upgrade a premium (GRATIS - proyecto académico)
router.post('/upgrade-premium', verifyToken, async (req, res) => {
  try {
    await db.execute(
      'UPDATE users SET plan = ?, fecha_premium = NOW() WHERE id = ?',
      ['premium', req.user.id]
    );

    res.json({
      success: true,
      message: 'Plan actualizado a Premium exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar plan'
    });
  }
});

// POST /api/users/profile/photo - Upload foto de perfil
const uploadProfile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + req.user.id;
      const ext = path.extname(file.originalname);
      cb(null, `profile-${uniqueSuffix}${ext}`);
    }
  }),
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
    }
  }
}).single('photo');

router.post('/profile/photo', verifyToken, (req, res) => {
  uploadProfile(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error al subir imagen'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    try {
      await db.execute(
        'UPDATE users SET foto_perfil = ? WHERE id = ?',
        [photoUrl, req.user.id]
      );

      res.json({
        success: true,
        message: 'Foto de perfil actualizada',
        photoUrl: photoUrl
      });
    } catch (error) {
      console.error('Error al actualizar foto en BD:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar foto de perfil'
      });
    }
  });
});

// PUT /api/users/profile/bio - Actualizar biografía
router.put('/profile/bio', verifyToken, async (req, res) => {
  try {
    const { bio } = req.body;

    if (!bio || bio.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'La biografía no puede estar vacía'
      });
    }

    await db.execute(
      'UPDATE users SET bio = ? WHERE id = ?',
      [bio, req.user.id]
    );

    res.json({
      success: true,
      message: 'Biografía actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar bio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar biografía'
    });
  }
});

// GET /api/users/profile - Obtener perfil completo (actualizado)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, nombre, email, telefono, rol, foto_perfil, bio, plan, fecha_registro FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
});

module.exports = router;
