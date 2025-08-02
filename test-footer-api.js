// Test the DOCX generation through the API
const testFormData = {
  useCaseName: "BP001-Gestionar Información Cliente",
  clientName: "Banco ING", 
  projectName: "Sistema de Gestión",
  useCaseCode: "BP001",
  projectDate: "02/02/2025",
  systemName: "SGC",
  actors: "Administrador, Usuario",
  description: "Este caso de uso permite gestionar la información de los clientes del banco.",
  useCaseType: "entity",
  entityName: "Cliente",
  entityFields: [
    { name: "ID", type: "número", length: "10", mandatory: true },
    { name: "Nombre", type: "texto", length: "100", mandatory: true },
    { name: "Email", type: "texto", length: "255", mandatory: true }
  ],
  mainFlow: "1. El usuario accede al módulo\n2. Selecciona la opción de gestión\n3. Completa los datos",
  businessRules: ["Validar formato de email", "El ID debe ser único"],
  specialRequirements: ["Acceso SSL", "Auditoría de cambios"],
  preconditions: "Usuario autenticado",
  postconditions: "Datos guardados correctamente",
  generateTestCase: true,
  testCaseObjective: "Verificar funcionamiento completo",
  testCasePreconditions: "Sistema disponible",
  testSteps: [
    {
      action: "Acceder al sistema",
      inputData: "Usuario y contraseña",
      expectedResult: "Acceso exitoso",
      observations: "N/A"
    }
  ]
};

async function testFooterViaAPI() {
  try {
    console.log('Testing DOCX generation with footer via API...');
    
    const response = await fetch('http://localhost:5000/api/export-docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: "Test content", // Required but not used
        formData: testFormData,
        fileName: 'test-footer',
        useCaseName: testFormData.useCaseName
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }

    const blob = await response.blob();
    const fs = require('fs');
    const buffer = await blob.arrayBuffer();
    
    fs.writeFileSync('test-footer-api.docx', Buffer.from(buffer));
    console.log('✅ DOCX generated successfully! Check test-footer-api.docx');
    console.log('📄 The footer should show:');
    console.log('   - Left: "página X de Y"');
    console.log('   - Right: "BP001-Gestionar Información Cliente"');
    console.log('\nOpen the file in Microsoft Word to verify the footer appears correctly.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFooterViaAPI();