// Test script to generate a DOCX and check if footer appears
import { DocumentService } from './server/services/document-service.js';
import fs from 'fs/promises';

async function testFooter() {
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

  try {
    console.log('Generating test DOCX with footer...');
    const docxBuffer = await DocumentService.generateDirectFromFormData(testFormData, {
      testCaseObjective: testFormData.testCaseObjective,
      testCasePreconditions: testFormData.testCasePreconditions,
      testSteps: testFormData.testSteps
    });
    
    // Save the file
    await fs.writeFile('test-footer-output.docx', docxBuffer);
    console.log('✅ DOCX generated successfully! Check test-footer-output.docx');
    console.log('📄 The footer should show: "página X de Y" (left) and "BP001-Gestionar Información Cliente" (right)');
  } catch (error) {
    console.error('❌ Error generating DOCX:', error);
  }
}

testFooter();