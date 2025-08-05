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
}

function generateSearchWireframeHTML(data: WireframeData): string {
  const filters = data.filters || [];
  const columns = data.columns || [];

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
    }
    .action-btn svg {
      width: 16px;
      height: 16px;
    }
    .action-btn.edit {
      background: #0078D4;
      color: white;
    }
    .action-btn.delete {
      background: #D13438;
      color: white;
    }
    .action-btn.view {
      background: #008272;
      color: white;
    }
    .action-btn.log {
      background: #666;
      color: white;
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
          <button class="btn btn-white">🔍 Buscar</button>
          <button class="btn btn-white">🕒 Limpiar</button>
          <button class="btn btn-white">✚ Agregar</button>
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
                  <button class="action-btn view" title="Ver">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  </button>
                  <button class="action-btn edit" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                  <button class="action-btn log" title="Bitácora">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M13 12h7v1.5h-7zm0-2.5h7V11h-7zm0 5h7V16h-7zM21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15h-9V6h9v13z"/>
                    </svg>
                  </button>
                  <button class="action-btn delete" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </td>
              ${columns.map(() => `<td>Dato ejemplo ${i}</td>`).join('')}
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
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
        <button class="btn btn-secondary">Cancelar</button>
        <button class="btn btn-primary">Aceptar</button>
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
}

router.post('/api/generate-wireframe', async (req, res) => {
  try {
    const data: WireframeRequest = req.body;
    const screenshotService = getScreenshotService();

    // Generate HTML based on type
    const html = data.type === 'search' 
      ? generateSearchWireframeHTML(data)
      : generateFormWireframeHTML(data);

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