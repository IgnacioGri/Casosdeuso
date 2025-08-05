import { Router } from 'express';
import { getScreenshotService } from '../services/screenshot-service';

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
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: #0078D4;
      color: white;
      padding: 16px 24px;
      font-size: 20px;
      font-weight: 600;
    }
    .search-panel {
      padding: 24px;
      border-bottom: 1px solid #e0e0e0;
    }
    .search-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #0078D4;
    }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-label {
      min-width: 120px;
      font-size: 14px;
      color: #666;
    }
    .filter-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 2px;
      font-size: 14px;
    }
    .buttons {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
    .btn {
      padding: 8px 20px;
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
      background: #e0e0e0;
      color: #333;
    }
    .btn-success {
      background: #107C10;
      color: white;
    }
    .results-panel {
      padding: 24px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .table th {
      background: #f8f8f8;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e0e0e0;
      color: #333;
    }
    .table td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .table tr:hover {
      background: #f5f5f5;
    }
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    .icon-btn {
      padding: 6px 12px;
      font-size: 12px;
      border: 1px solid #d0d0d0;
      background: white;
      cursor: pointer;
      border-radius: 2px;
      color: #666;
    }
    .icon-btn:hover {
      background: #f0f0f0;
    }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 20px;
      padding: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .page-btn {
      padding: 6px 12px;
      border: 1px solid #d0d0d0;
      background: white;
      cursor: pointer;
      border-radius: 2px;
      font-size: 14px;
    }
    .page-btn.active {
      background: #0078D4;
      color: white;
      border-color: #0078D4;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">${data.title}</div>
    
    <div class="search-panel">
      <div class="search-title">Filtros de Búsqueda</div>
      <div class="filters-grid">
        ${filters.map(filter => `
          <div class="filter-group">
            <label class="filter-label">${filter}:</label>
            <input type="text" class="filter-input" placeholder="Ingrese ${filter.toLowerCase()}">
          </div>
        `).join('')}
      </div>
      <div class="buttons">
        <button class="btn btn-primary">🔍 Buscar</button>
        <button class="btn btn-secondary">🗑️ Limpiar</button>
        <button class="btn btn-success">➕ Agregar</button>
      </div>
    </div>
    
    <div class="results-panel">
      <table class="table">
        <thead>
          <tr>
            ${columns.map(col => `<th>${col}</th>`).join('')}
            <th style="width: 120px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${[1, 2, 3, 4, 5].map(i => `
            <tr>
              ${columns.map(() => `<td>Dato ejemplo ${i}</td>`).join('')}
              <td>
                <div class="action-buttons">
                  <button class="icon-btn">✏️ Editar</button>
                  <button class="icon-btn">🗑️ Eliminar</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="pagination">
        <button class="page-btn">⬅️</button>
        <button class="page-btn active">1</button>
        <button class="page-btn">2</button>
        <button class="page-btn">3</button>
        <button class="page-btn">4</button>
        <button class="page-btn">5</button>
        <button class="page-btn">➡️</button>
        <span style="margin-left: 20px; color: #666; font-size: 14px;">Página 1 de 5</span>
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
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: #0078D4;
      color: white;
      padding: 16px 24px;
      font-size: 20px;
      font-weight: 600;
    }
    .form-content {
      padding: 24px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group.full-width {
      grid-column: span 2;
    }
    .form-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    .required {
      color: #D13438;
    }
    .form-input {
      padding: 8px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 2px;
      font-size: 14px;
    }
    .form-select {
      padding: 8px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 2px;
      font-size: 14px;
      background: white;
    }
    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }
    .metadata-section {
      background: #f8f8f8;
      padding: 16px;
      margin: 24px 0;
      border-radius: 2px;
    }
    .metadata-title {
      font-size: 14px;
      font-weight: 600;
      color: #0078D4;
      margin-bottom: 12px;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
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
      padding: 20px 24px;
      border-top: 1px solid #e0e0e0;
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
      background: #e0e0e0;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">${data.title}</div>
    
    <div class="form-content">
      <div class="form-grid">
        ${fields.map(field => {
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
                ${field.name}
                ${field.mandatory ? '<span class="required">*</span>' : ''}
              </label>
              <input 
                type="${inputType}" 
                class="form-input" 
                placeholder="${field.length ? `Máximo ${field.length} caracteres` : ''}"
              >
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="metadata-section">
        <div class="metadata-title">Información de Auditoría</div>
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
    </div>
    
    <div class="buttons">
      <button class="btn btn-secondary">❌ Cancelar</button>
      <button class="btn btn-primary">✅ Aceptar</button>
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

    // Capture screenshot
    const imageBuffer = await screenshotService.captureHTMLAsImage({
      html,
      width: data.type === 'search' ? 1200 : 900,
      height: data.type === 'search' ? 800 : 1000
    });

    // Convert to base64
    const base64Image = imageBuffer.toString('base64');
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