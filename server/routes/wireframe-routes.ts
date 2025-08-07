import { Router } from 'express';
import { getScreenshotService } from '../services/screenshot-service';
import sharp from 'sharp';

// Since we're in the server, we need to define the template functions here
interface WireframeData {
  type: 'search' | 'form';
  title: string;
  filters?: string[];
  columns?: string[];
  fields?: Array<{
    name: string;
    type: string;
    mandatory?: boolean;
    length?: number;
  }>;
  useCaseType?: string; // Add use case type
}

function generateSearchWireframeHTML(data: WireframeData): string {
  const filters = data.filters || [];
  const columns = data.columns || [];
  const isReports = data.useCaseType === 'reports';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f4f6f9;
      margin: 0;
    }
    .header {
      background: #004b8d;
      color: white;
      padding: 12px 20px;
      font-size: 18px;
      font-weight: bold;
    }
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      color: #0078D4;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #0078D4;
    }
    .filters-panel {
      background: #1d4e89;
      color: white;
      padding: 20px;
      border-radius: 4px;
    }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .filter-group label {
      display: block;
      font-size: 13px;
      margin-bottom: 5px;
      font-weight: 500;
    }
    .filter-group input {
      width: 100%;
      padding: 8px;
      border: none;
      border-radius: 2px;
      font-size: 14px;
    }
    .buttons {
      display: flex;
      gap: 12px;
      margin-top: 15px;
    }
    .btn {
      padding: 8px 20px;
      border: none;
      border-radius: 2px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .btn-primary {
      background: #0078D4;
      color: white;
    }
    .btn-secondary {
      background: #666;
      color: white;
    }
    .btn-success {
      background: #107C10;
      color: white;
    }
    .btn-white {
      background: white;
      color: #333;
      border: 1px solid #ccc;
    }
    .btn-white:hover {
      background: #f5f5f5;
    }
    .results-panel {
      background: white;
      border-radius: 4px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .table th {
      background: #f0f0f0;
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #ddd;
    }
    .table td {
      padding: 10px 8px;
      border: 1px solid #ddd;
    }
    .table tr:hover {
      background: #f8f8f8;
    }
    .actions {
      display: flex;
      gap: 5px;
      justify-content: center;
    }
    .action-btn {
      padding: 5px 8px;
      font-size: 12px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: white;
      border: 1px solid #ddd;
    }
    .action-btn svg {
      width: 16px;
      height: 16px;
    }
    .action-btn:hover {
      background: #f5f5f5;
    }
    .pagination {
      display: flex;
      justify-content: center;
      gap: 5px;
      margin-top: 20px;
      padding: 15px;
    }
    .page-btn {
      padding: 6px 12px;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;
      font-size: 13px;
      border-radius: 2px;
    }
    .page-btn:hover {
      background: #f5f5f5;
    }
    .page-btn.active {
      background: #0078D4;
      color: white;
      border-color: #0078D4;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">${data.title}</div>
  
  <div class="container">
    <div class="section">
      <h2 class="section-title">Filtros de búsqueda</h2>
      <div class="filters-panel">
        <div class="filters-grid">
          ${filters.map(filter => `
            <div class="filter-group">
              <label>${filter}</label>
              <input type="text" placeholder="Ingrese ${filter.toLowerCase()}...">
            </div>
          `).join('')}
        </div>
        
        <div class="buttons">
          <button class="btn btn-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            Buscar
          </button>
          <button class="btn btn-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16l3.5-2.5 3.5 2.5L12 18.5 8.5 16z"/>
            </svg>
            Limpiar
          </button>
          ${isReports ? `
          <button class="btn btn-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,10V19L8,15.5L9.4,14.1L11,15.7V10H12M15,10V15.7L16.6,14.1L18,15.5L14,19V10H15Z"/>
            </svg>
            Excel
          </button>
          <button class="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M10,13H8V11H10V13M10,17H8V15H10V17M10,9H8V7H10V9M16,13H11V11H16V13M16,17H11V15H16V17M16,9H11V7H16V9Z"/>
            </svg>
            PDF
          </button>
          ` : `
          <button class="btn btn-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Agregar
          </button>
          `}
        </div>
      </div>
    </div>
    
    <div class="section results-panel">
      <h2 class="section-title">Resultados</h2>
      <table class="table">
        <thead>
          <tr>
            <th style="width: 150px; text-align: center;">Acciones</th>
            ${columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${[1, 2, 3, 4, 5].map(i => `
            <tr>
              <td>
                <div class="actions">
                  ${isReports ? `
                  <button class="action-btn view" title="Ver">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  </button>
                  <button class="action-btn download" title="Descargar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#107C10">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                  </button>
                  ` : `
                  <button class="action-btn edit" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                  <button class="action-btn view" title="Ver">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </button>
                  <button class="action-btn log" title="Bitácora">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16l3.5-2.5 3.5 2.5L12 18.5 8.5 16z"/>
                    </svg>
                  </button>
                  <button class="action-btn delete" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#D13438">
                      <path d="M18.3 5.71L12 12.01 5.7 5.71 4.29 7.12 10.59 13.42 4.29 19.72 5.7 21.13 12 14.83 18.3 21.13 19.71 19.72 13.41 13.42 19.71 7.12z"/>
                    </svg>
                  </button>
                  `}
                </div>
              </td>
              ${columns.map(() => `<td>Dato ${i}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="pagination">
        <button class="page-btn">«</button>
        <button class="page-btn active">1</button>
        <button class="page-btn">2</button>
        <button class="page-btn">3</button>
        <button class="page-btn">»</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateFormWireframeHTML(data: WireframeData): string {
  const fields = data.fields || [];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f2f4f8;
      margin: 0;
    }
    .header {
      background: #004b8d;
      color: white;
      padding: 12px 20px;
      font-size: 18px;
      font-weight: bold;
    }
    .container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .form-panel {
      background: white;
      border-radius: 4px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      color: #0078D4;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #0078D4;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 15px;
    }
    .form-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    .required {
      color: #D13438;
      font-weight: bold;
    }
    .form-input, .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 2px;
      font-size: 14px;
    }
    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #0078D4;
    }
    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }
    .metadata-section {
      background: #eef2f7;
      padding: 15px;
      border-radius: 4px;
      margin-top: 30px;
    }
    .metadata-title {
      font-size: 14px;
      font-weight: 600;
      color: #0078D4;
      margin-bottom: 10px;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      font-size: 13px;
    }
    .metadata-item {
      display: flex;
      gap: 8px;
    }
    .metadata-label {
      font-weight: 500;
      color: #666;
    }
    .buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 30px;
    }
    .btn {
      padding: 8px 24px;
      border: none;
      border-radius: 2px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-primary {
      background: #0078D4;
      color: white;
    }
    .btn-secondary {
      background: #666;
      color: white;
    }
    .btn-danger {
      background: #D13438;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">Alta / Edición de Entidad</div>
  
  <div class="container">
    <div class="form-panel">
      <div class="section">
        <h2 class="section-title">Datos Generales</h2>
        <div class="form-grid">
          ${fields.slice(0, Math.ceil(fields.length * 0.7)).map(field => {
            const inputType = field.type === 'NUMBER' ? 'number' : 
                            field.type === 'DATE' ? 'date' : 
                            field.type === 'BOOLEAN' ? 'checkbox' : 'text';
            
            if (field.type === 'BOOLEAN') {
              return `
                <div class="form-group">
                  <div class="form-checkbox">
                    <input type="checkbox" id="${field.name}">
                    <label for="${field.name}" class="form-label">${field.name}</label>
                  </div>
                </div>
              `;
            }
            
            return `
              <div class="form-group">
                <label class="form-label">
                  ${field.name} ${field.mandatory ? '<span class="required">*</span>' : ''}
                </label>
                <input 
                  type="${inputType}" 
                  class="form-input" 
                  ${field.length ? `maxlength="${field.length}"` : ''}
                  ${field.mandatory ? 'required' : ''}
                >
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${fields.length > 4 ? `
      <div class="section">
        <h2 class="section-title">Información Adicional</h2>
        <div class="form-grid">
          ${fields.slice(Math.ceil(fields.length * 0.7)).map(field => {
            const inputType = field.type === 'NUMBER' ? 'number' : 
                            field.type === 'DATE' ? 'date' : 
                            field.type === 'BOOLEAN' ? 'checkbox' : 'text';
            
            if (field.type === 'BOOLEAN') {
              return `
                <div class="form-group">
                  <div class="form-checkbox">
                    <input type="checkbox" id="${field.name}">
                    <label for="${field.name}" class="form-label">${field.name}</label>
                  </div>
                </div>
              `;
            }
            
            return `
              <div class="form-group">
                <label class="form-label">
                  ${field.name} ${field.mandatory ? '<span class="required">*</span>' : ''}
                </label>
                <input 
                  type="${inputType}" 
                  class="form-input" 
                  ${field.length ? `maxlength="${field.length}"` : ''}
                  ${field.mandatory ? 'required' : ''}
                >
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}
      
      <div class="metadata-section">
        <div class="metadata-title">Auditoría</div>
        <div class="metadata-grid">
          <div class="metadata-item">
            <span class="metadata-label">Fecha de alta:</span>
            <span>15/01/2025 10:30</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Usuario de alta:</span>
            <span>admin.sistema</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Fecha de modificación:</span>
            <span>15/01/2025 14:45</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Usuario de modificación:</span>
            <span>usuario.actual</span>
          </div>
        </div>
      </div>

      <div class="buttons">
        <button class="btn btn-danger">Cancelar</button>
        <button class="btn btn-primary">Aplicar</button>
        <button class="btn btn-primary">Guardar</button>
        <button class="btn btn-primary">Guardar y Agregar Nuevo</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const router = Router();

interface WireframeRequest {
  type: 'search' | 'form';
  title: string;
  filters?: string[];
  columns?: string[];
  fields?: Array<{
    name: string;
    type: string;
    mandatory?: boolean;
    length?: number;
  }>;
  useCaseType?: string; // Add use case type to request
}

router.post('/api/generate-wireframe', async (req, res) => {
  try {
    const data: WireframeRequest = req.body;
    const screenshotService = getScreenshotService();

    // Generate HTML based on type, pass the full data including useCaseType
    const html = data.type === 'search' 
      ? generateSearchWireframeHTML(data as WireframeData)
      : generateFormWireframeHTML(data as WireframeData);

    // Capture screenshot with smaller dimensions to reduce file size
    const imageBuffer = await screenshotService.captureHTMLAsImage({
      html,
      width: data.type === 'search' ? 1000 : 800,
      height: data.type === 'search' ? 600 : 800
    });

    // Compress image using Sharp to reduce size further
    const compressedBuffer = await sharp(imageBuffer)
      .png({ 
        quality: 70,
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .resize(data.type === 'search' ? 800 : 600, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toBuffer();

    // Convert to base64
    const base64Image = compressedBuffer.toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;

    res.json({
      success: true,
      imageUrl,
      type: data.type
    });
  } catch (error: any) {
    console.error('Error generating wireframe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate wireframe'
    });
  }
});

export default router;