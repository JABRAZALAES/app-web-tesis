const { dbGestionNovedades } = require('../config/db');

// CREATE - Crear un nuevo período académico
const crearPeriodo = async (req, res) => {
  try {
    const { nombre, fecha_inicio, fecha_fin } = req.body;

    // Validaciones básicas
    if (!nombre || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, fecha de inicio y fecha de fin son requeridos'
      });
    }

    // Validar que fecha_fin sea mayor que fecha_inicio
    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser mayor que la fecha de inicio'
      });
    }

    // Verificar si ya existe un período con el mismo nombre
    const [existentes] = await dbGestionNovedades.query(
      'SELECT id FROM periodos_academicos WHERE nombre = ?',
      [nombre]
    );

    if (existentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un período académico con ese nombre'
      });
    }

    // Insertar el nuevo período (solo los campos existentes)
    const [result] = await dbGestionNovedades.query(
      'INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin) VALUES (?, ?, ?)',
      [nombre, fecha_inicio, fecha_fin]
    );

    // Obtener el período creado
    const [nuevoPeriodo] = await dbGestionNovedades.query(
      'SELECT * FROM periodos_academicos WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Período académico creado exitosamente',
      data: nuevoPeriodo[0]
    });

  } catch (error) {
    console.error('Error al crear período académico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear período académico',
      error: error.message
    });
  }
};

  // READ - Obtener todos los períodos académicos
      const obtenerPeriodos = async (req, res) =>  {
        try {
          const [rows] = await dbGestionNovedades.query(`
            SELECT 
              id,
              nombre,
              fecha_inicio,
              fecha_fin,
              descripcion,
              CASE 
                WHEN CURDATE() BETWEEN fecha_inicio AND fecha_fin THEN 'Activo'
                WHEN CURDATE() < fecha_inicio THEN 'Futuro'
                ELSE 'Pasado'
              END AS estado_periodo,
              created_at,
              updated_at
            FROM periodos_academicos 
            ORDER BY fecha_inicio DESC
          `);

          res.json({
            success: true,
            data: rows,
            metadata: {
              total_periodos: rows.length,
              periodo_activo: rows.find(p => p.estado_periodo === 'Activo') || null,
              periodos_futuros: rows.filter(p => p.estado_periodo === 'Futuro').length,
              periodos_pasados: rows.filter(p => p.estado_periodo === 'Pasado').length
            }
          });

        } catch (error) {
          console.error('Error al obtener períodos académicos:', error);
          res.status(500).json({
            success: false,
            message: 'Error al obtener períodos académicos',
            error: error.message
          });
        }
      };

// READ - Obtener un período académico por ID
const obtenerPeriodoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID del período es requerido'
      });
    }

    const [rows] = await dbGestionNovedades.query(`
      SELECT 
        id,
        nombre,
        fecha_inicio,
        fecha_fin,
        descripcion,
        CASE 
          WHEN CURDATE() BETWEEN fecha_inicio AND fecha_fin THEN 'Activo'
          WHEN CURDATE() < fecha_inicio THEN 'Futuro'
          ELSE 'Pasado'
        END AS estado_periodo,
        created_at,
        updated_at
      FROM periodos_academicos 
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Período académico no encontrado'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Error al obtener período académico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener período académico',
      error: error.message
    });
  }
};

// UPDATE - Actualizar un período académico
const actualizarPeriodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fecha_inicio, fecha_fin, descripcion } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID del período es requerido'
      });
    }

    // Verificar que el período existe
    const [existe] = await dbGestionNovedades.query(
      'SELECT id FROM periodos_academicos WHERE id = ?',
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Período académico no encontrado'
      });
    }

    // Validaciones
    if (fecha_inicio && fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser mayor que la fecha de inicio'
      });
    }

    // Verificar que el nombre no esté duplicado (excluyendo el período actual)
    if (nombre) {
      const [duplicados] = await dbGestionNovedades.query(
        'SELECT id FROM periodos_academicos WHERE nombre = ? AND id != ?',
        [nombre, id]
      );

      if (duplicados.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro período académico con ese nombre'
        });
      }
    }

    // Construir la consulta de actualización dinámicamente
    const campos = [];
    const valores = [];

    if (nombre !== undefined) {
      campos.push('nombre = ?');
      valores.push(nombre);
    }
    if (fecha_inicio !== undefined) {
      campos.push('fecha_inicio = ?');
      valores.push(fecha_inicio);
    }
    if (fecha_fin !== undefined) {
      campos.push('fecha_fin = ?');
      valores.push(fecha_fin);
    }
    if (descripcion !== undefined) {
      campos.push('descripcion = ?');
      valores.push(descripcion);
    }

    if (campos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    campos.push('updated_at = NOW()');
    valores.push(id);

    // Actualizar el período
    await dbGestionNovedades.query(
      `UPDATE periodos_academicos SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );

    // Obtener el período actualizado
    const [periodoActualizado] = await dbGestionNovedades.query(
      'SELECT * FROM periodos_academicos WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Período académico actualizado exitosamente',
      data: periodoActualizado[0]
    });

  } catch (error) {
    console.error('Error al actualizar período académico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar período académico',
      error: error.message
    });
  }
};

// DELETE - Eliminar un período académico
const eliminarPeriodo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID del período es requerido'
      });
    }

    // Verificar que el período existe
    const [existe] = await dbGestionNovedades.query(
      'SELECT id, nombre FROM periodos_academicos WHERE id = ?',
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Período académico no encontrado'
      });
    }

    // Verificar si hay incidentes o objetos perdidos asociados
    const [incidentes] = await dbGestionNovedades.query(
      'SELECT COUNT(*) as total FROM incidentes WHERE periodo_academico_id = ?',
      [id]
    );

    const [objetos] = await dbGestionNovedades.query(
      'SELECT COUNT(*) as total FROM objetos_perdidos WHERE periodo_academico_id = ?',
      [id]
    );

    if (incidentes[0].total > 0 || objetos[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el período porque tiene ${incidentes[0].total} incidentes y ${objetos[0].total} objetos perdidos asociados`,
        data: {
          incidentes_asociados: incidentes[0].total,
          objetos_asociados: objetos[0].total
        }
      });
    }

    // Eliminar el período
    await dbGestionNovedades.query(
      'DELETE FROM periodos_academicos WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Período académico eliminado exitosamente',
      data: {
        id: id,
        nombre: existe[0].nombre
      }
    });

  } catch (error) {
    console.error('Error al eliminar período académico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar período académico',
      error: error.message
    });
  }
};

// Obtener período activo actual
const obtenerPeriodoActivo = async (req, res) => {
  try {
    const [rows] = await dbGestionNovedades.query(`
      SELECT 
        id,
        nombre,
        fecha_inicio,
        fecha_fin,
        descripcion,
        'Activo' AS estado_periodo,
        created_at,
        updated_at
      FROM periodos_academicos 
      WHERE CURDATE() BETWEEN fecha_inicio AND fecha_fin
      LIMIT 1
    `);

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: 'No hay período académico activo actualmente',
        data: null
      });
    }

    res.json({
      success: true,
      data: rows[0],
      metadata: {
        mensaje: 'Este es el período académico actual. Todas las estadísticas y rankings se calculan solo para este período.',
        reinicio_automatico: 'Las estadísticas se reinician automáticamente con cada nuevo período académico.'
      }
    });

  } catch (error) {
    console.error('Error al obtener período activo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener período activo',
      error: error.message
    });
  }
};

module.exports = {
  crearPeriodo,
  obtenerPeriodos,
  obtenerPeriodoPorId,
  actualizarPeriodo,
  eliminarPeriodo,
  obtenerPeriodoActivo
}; 