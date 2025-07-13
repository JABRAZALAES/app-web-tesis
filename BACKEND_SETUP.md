# Configuración del Backend para Exportación

## Estructura del Backend

Tu backend debe tener la siguiente estructura para los servicios de exportación:

### 1. Rutas de Exportación

```javascript
// routes/exportRoutes.js
const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// Rutas para PDF
router.post('/incidentes-por-laboratorio/pdf', exportController.exportIncidentesPorLaboratorioPDF);
router.post('/incidentes-por-estado/pdf', exportController.exportIncidentesPorEstadoPDF);
router.post('/incidentes-por-periodo/pdf', exportController.exportIncidentesPorPeriodoPDF);
router.post('/incidentes-por-inconveniente/pdf', exportController.exportIncidentesPorInconvenientePDF);
router.post('/objetos-perdidos-por-laboratorio/pdf', exportController.exportObjetosPerdidosPorLaboratorioPDF);
router.post('/objetos-perdidos-por-estado/pdf', exportController.exportObjetosPerdidosPorEstadoPDF);
router.post('/reporte-completo/pdf', exportController.exportReporteCompletoPDF);
router.post('/dashboard-completo/pdf', exportController.exportDashboardCompletoPDF);
router.post('/graficos/pdf', exportController.exportGraficosPDF);

// Rutas para Excel
router.post('/incidentes-por-laboratorio/excel', exportController.exportIncidentesPorLaboratorioExcel);
router.post('/incidentes-por-estado/excel', exportController.exportIncidentesPorEstadoExcel);
router.post('/incidentes-por-periodo/excel', exportController.exportIncidentesPorPeriodoExcel);
router.post('/incidentes-por-inconveniente/excel', exportController.exportIncidentesPorInconvenienteExcel);
router.post('/objetos-perdidos-por-laboratorio/excel', exportController.exportObjetosPerdidosPorLaboratorioExcel);
router.post('/objetos-perdidos-por-estado/excel', exportController.exportObjetosPerdidosPorEstadoExcel);
router.post('/reporte-completo/excel', exportController.exportReporteCompletoExcel);
router.post('/graficos/excel', exportController.exportGraficosExcel);

// Ruta para descargar archivos
router.get('/download/:fileName', exportController.downloadFile);

module.exports = router;
```

### 2. Configuración del Servidor

```javascript
// app.js o server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/export', require('./routes/exportRoutes'));

// Crear carpeta uploads si no existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
```

### 3. Dependencias Necesarias

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pdfkit": "^0.13.0",
    "xlsx": "^0.18.5",
    "fs": "^0.0.1-security",
    "path": "^0.12.7"
  }
}
```

### 4. Instalación

```bash
npm install express cors pdfkit xlsx
```

### 5. Configuración CORS

Asegúrate de que el CORS esté configurado correctamente para permitir las peticiones desde tu frontend Angular:

```javascript
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));
```

### 6. Variables de Entorno

Crea un archivo `.env` en la raíz de tu proyecto backend:

```env
PORT=3000
NODE_ENV=development
```

### 7. Estructura de Carpetas

```
backend/
├── controllers/
│   └── exportController.js
├── services/
│   ├── pdfExportService.js
│   └── excelExportService.js
├── routes/
│   └── exportRoutes.js
├── uploads/
├── app.js
├── package.json
└── .env
```

### 8. Ejecutar el Backend

```bash
node app.js
# o
npm start
```

## Notas Importantes

1. **Puerto**: El backend debe estar corriendo en el puerto 3000 (o cambiar la URL en `environment.ts`)
2. **CORS**: Configurar correctamente para permitir peticiones desde Angular
3. **Carpeta uploads**: Debe existir y tener permisos de escritura
4. **Límites**: Configurar límites de tamaño para las peticiones JSON

## Pruebas

Para probar que el backend funciona:

```bash
curl -X POST http://localhost:3000/api/export/test \
  -H "Content-Type: application/json" \
  -d '{"data": [], "filtros": {}}'
```

## Troubleshooting

- **Error CORS**: Verificar configuración de CORS
- **Error 404**: Verificar que las rutas estén correctamente definidas
- **Error de permisos**: Verificar permisos de la carpeta uploads
- **Error de memoria**: Aumentar límites de memoria para archivos grandes 