import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, NumberFormat, VerticalAlign, ShadingType, ImageRun } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  action: string;
  inputData: string;
  expectedResult: string;
  observations: string;
}

export class DocumentService {
  // Generate DOCX directly from form data - no HTML conversion needed
  static async generateDirectFromFormData(formData: any, testCases?: TestCase[]): Promise<Buffer> {
    const headerImagePath = path.join(process.cwd(), 'attached_assets', 'Encabezado_1753600608270.png');
    
    const doc = new Document({
      sections: [{
        children: [
          // Title
          new Paragraph({
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
            alignment: AlignmentType.LEFT,
            children: [new TextRun({
              text: "ESPECIFICACIÓN DE CASO DE USO",
              bold: true,
              size: 48,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }),
          
          // Project Information Section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({
              text: "Información del Proyecto",
              bold: true,
              size: 28,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "• Cliente: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.clientName || '', font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "• Proyecto: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.projectName || '', font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "• Código: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.useCaseCode || '', font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "• Archivo: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.fileName || '', font: "Segoe UI Semilight" })
            ]
          }),
          
          // Use Case Description Section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({
              text: "Descripción del Caso de Uso",
              bold: true,
              size: 28,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "• Nombre: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.useCaseName || '', font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "• Tipo: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.useCaseType === 'entity' ? 'Gestión de Entidades' : formData.useCaseType || '', font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "• Descripción: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.description || '', font: "Segoe UI Semilight" })
            ]
          }),
          
          // Add remaining sections based on form data (includes test cases)
          ...this.addFormDataSections(formData),
          
          // History table
          ...this.createHistorySection()
        ],
        headers: {
          default: new Header({
            children: [
              fs.existsSync(headerImagePath) ? new Paragraph({
                children: [
                  new ImageRun({
                    data: fs.readFileSync(headerImagePath),
                    transformation: { width: 580, height: 120 }
                  })
                ]
              }) : new Paragraph({
                children: [new TextRun({
                  text: "ING Bank",
                  bold: true,
                  size: 28,
                  color: "FF6600"
                })]
              })
            ]
          })
        }
      }]
    });
    
    return await Packer.toBuffer(doc);
  }
  
  private static addFormDataSections(formData: any): Paragraph[] {
    const sections: Paragraph[] = [];
    
    // Business Rules
    if (formData.businessRules) {
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({
          text: "Reglas de Negocio",
          bold: true,
          size: 28,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Handle both string and array formats
      let rules: string[] = [];
      if (typeof formData.businessRules === 'string') {
        rules = formData.businessRules.split('\n').filter((r: string) => r.trim());
      } else if (Array.isArray(formData.businessRules)) {
        rules = formData.businessRules.filter((r: any) => r && r.toString().trim());
      }
      
      rules.forEach((rule: string, index: number) => {
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 720 },
          children: [new TextRun({
            text: `${index + 1}. ${rule.toString().trim()}`,
            font: "Segoe UI Semilight"
          })]
        }));
      });
    }
    
    // Search Filters (for entity use cases)
    if (formData.searchFilters && formData.searchFilters.length > 0) {
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({
          text: "Filtros de Búsqueda",
          bold: true,
          size: 28,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })]
      }));
      
      formData.searchFilters.forEach((filter: string) => {
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 720 },
          children: [
            new TextRun({ text: "• ", font: "Segoe UI Semilight" }),
            new TextRun({ text: filter, font: "Segoe UI Semilight" })
          ]
        }));
      });
    }
    
    // Result Columns (for entity use cases)
    if (formData.resultColumns && formData.resultColumns.length > 0) {
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({
          text: "Columnas de Resultado",
          bold: true,
          size: 28,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })]
      }));
      
      formData.resultColumns.forEach((column: string) => {
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 720 },
          children: [
            new TextRun({ text: "• ", font: "Segoe UI Semilight" }),
            new TextRun({ text: column, font: "Segoe UI Semilight" })
          ]
        }));
      });
    }
    
    // Entity Fields (for entity use cases)
    if (formData.entityFields && formData.entityFields.length > 0) {
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({
          text: "Campos de Entidad",
          bold: true,
          size: 28,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })]
      }));
      
      formData.entityFields.forEach((field: any) => {
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 720 },
          children: [
            new TextRun({ text: "• ", font: "Segoe UI Semilight" }),
            new TextRun({ text: `${field.name} (${field.type})`, bold: true, font: "Segoe UI Semilight" }),
            new TextRun({ text: field.length ? ` - Longitud: ${field.length}` : '', font: "Segoe UI Semilight" }),
            new TextRun({ text: field.mandatory ? ' - Obligatorio' : '', font: "Segoe UI Semilight" }),
            new TextRun({ text: field.description ? ` - ${field.description}` : '', font: "Segoe UI Semilight" })
          ]
        }));
      });
    }
    
    // Test Cases Section - Just another form section
    if (formData.generateTestCase && formData.testSteps && formData.testSteps.length > 0) {
      // Test Cases header
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 120 },
        children: [new TextRun({
          text: "CASOS DE PRUEBA",
          bold: true,
          size: 28,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Objective
      if (formData.testCaseObjective) {
        sections.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 120, after: 80 },
          children: [new TextRun({
            text: "Objetivo:",
            bold: true,
            size: 24,
            color: "0070C0",
            font: "Segoe UI Semilight"
          })]
        }));
        
        sections.push(new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({
            text: formData.testCaseObjective,
            font: "Segoe UI Semilight"
          })]
        }));
      }
      
      // Preconditions
      if (formData.testCasePreconditions) {
        sections.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 120, after: 80 },
          children: [new TextRun({
            text: "Precondiciones:",
            bold: true,
            size: 24,
            color: "0070C0",
            font: "Segoe UI Semilight"
          })]
        }));
        
        const preconditions = formData.testCasePreconditions.split('\n').filter((p: string) => p.trim());
        preconditions.forEach((condition: string) => {
          sections.push(new Paragraph({
            spacing: { after: 80 },
            indent: { left: 720 },
            children: [
              new TextRun({ text: "• ", font: "Segoe UI Semilight" }),
              new TextRun({ text: condition.trim(), font: "Segoe UI Semilight" })
            ]
          }));
        });
      }
      
      // Test Steps
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 120, after: 80 },
        children: [new TextRun({
          text: "Pasos de Prueba:",
          bold: true,
          size: 24,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Test steps as a numbered list
      formData.testSteps.forEach((testStep: any, index: number) => {
        sections.push(new Paragraph({
          spacing: { after: 120, before: 80 },
          children: [new TextRun({
            text: `${testStep.number || index + 1}. ${testStep.action || ''}`,
            bold: true,
            font: "Segoe UI Semilight"
          })]
        }));
        
        if (testStep.inputData) {
          sections.push(new Paragraph({
            spacing: { after: 80 },
            indent: { left: 720 },
            children: [
              new TextRun({ text: "• Datos de Entrada: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: testStep.inputData, font: "Segoe UI Semilight" })
            ]
          }));
        }
        
        if (testStep.expectedResult) {
          sections.push(new Paragraph({
            spacing: { after: 80 },
            indent: { left: 720 },
            children: [
              new TextRun({ text: "• Resultado Esperado: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: testStep.expectedResult, font: "Segoe UI Semilight" })
            ]
          }));
        }
        
        if (testStep.observations) {
          sections.push(new Paragraph({
            spacing: { after: 80 },
            indent: { left: 720 },
            children: [
              new TextRun({ text: "• Observaciones: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: testStep.observations, font: "Segoe UI Semilight" })
            ]
          }));
        }
      });
    }
    
    return sections;
  }
  
  private static createHistorySection(): Paragraph[] {
    const today = new Date();
    const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 120 },
        children: [new TextRun({
          text: "HISTORIA DE REVISIONES Y APROBACIONES",
          bold: true,
          size: 28,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "• Fecha: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: formattedDate, font: "Segoe UI Semilight" })
        ]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "• Acción: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: "Versión original", font: "Segoe UI Semilight" })
        ]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "• Responsable: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: "Sistema", font: "Segoe UI Semilight" })
        ]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "• Comentario: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: "Documento generado automáticamente", font: "Segoe UI Semilight" })
        ]
      })
    ];
  }
  
  private static formatTestCases(testCases: TestCase[], useCaseName: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Test Cases header
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 120 },
      children: [new TextRun({
        text: "CASOS DE PRUEBA",
        bold: true,
        size: 28,
        color: "0070C0",
        font: "Segoe UI Semilight"
      })]
    }));
    
    // Objective
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 120, after: 80 },
      children: [new TextRun({
        text: "Objetivo:",
        bold: true,
        size: 24,
        color: "0070C0",
        font: "Segoe UI Semilight"
      })]
    }));
    
    paragraphs.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({
        text: `Verificar el funcionamiento completo de la gestión de entidades: ${useCaseName}`,
        font: "Segoe UI Semilight"
      })]
    }));
    
    // Preconditions
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 120, after: 80 },
      children: [new TextRun({
        text: "Precondiciones:",
        bold: true,
        size: 24,
        color: "0070C0",
        font: "Segoe UI Semilight"
      })]
    }));
    
    const preconditions = [
      "Usuario autenticado en el sistema",
      "Permisos de acceso configurados correctamente",
      "Sistema operativo y base de datos disponibles",
      "Conexión de red estable",
      "Datos de prueba disponibles en la base de datos",
      "Validaciones de negocio configuradas"
    ];
    
    preconditions.forEach(condition => {
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [
          new TextRun({ text: "• ", font: "Segoe UI Semilight" }),
          new TextRun({ text: condition, font: "Segoe UI Semilight" })
        ]
      }));
    });
    
    // Test Steps
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 120, after: 80 },
      children: [new TextRun({
        text: "Pasos de Prueba:",
        bold: true,
        size: 24,
        color: "0070C0",
        font: "Segoe UI Semilight"
      })]
    }));
    
    // Test steps as a numbered list
    testCases.forEach((testCase, index) => {
      paragraphs.push(new Paragraph({
        spacing: { after: 120, before: 80 },
        children: [new TextRun({
          text: `${index + 1}. ${testCase.action}`,
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [
          new TextRun({ text: "• Datos de Entrada: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: testCase.inputData, font: "Segoe UI Semilight" })
        ]
      }));
      
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [
          new TextRun({ text: "• Resultado Esperado: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: testCase.expectedResult, font: "Segoe UI Semilight" })
        ]
      }));
      
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [
          new TextRun({ text: "• Observaciones: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: testCase.observations, font: "Segoe UI Semilight" })
        ]
      }));
    });
    
    return paragraphs;
  }
  static async generateDocx(htmlContent: string, fileName: string, useCaseName: string = '', testCaseData?: any): Promise<Buffer> {
    // Convert HTML to docx structure
    const paragraphs = this.parseHtmlToParagraphs(htmlContent);
    
    // Add test cases section before history table if test cases exist
    if (testCaseData && testCaseData.generateTestCase && (testCaseData.testSteps?.length > 0 || testCaseData.testCaseObjective || testCaseData.testCasePreconditions)) {
      this.addTestCasesToDocument(paragraphs, testCaseData);
    }
    
    // Always add the mandatory history table at the end
    const historyTitle = new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: "HISTORIA DE REVISIONES Y APROBACIONES",
          bold: true,
          size: 32,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })
      ]
    });
    
    const historyTable = this.createHistoryTable();
    paragraphs.push(historyTitle);
    paragraphs.push(historyTable);
    
    // Create header with Ingematica image
    let headerImage: ImageRun | null = null;
    let headerParagraphChildren: (TextRun | ImageRun)[] = [];
    
    try {
      // Try to use the new uploaded header image first
      const newImagePath = path.join(process.cwd(), 'attached_assets', 'Encabezado_1753600608270.png');
      const fallbackImagePath = path.join(process.cwd(), 'attached_assets', 'Encabezado_caso_de_uso.png');
      
      let imagePath = newImagePath;
      if (!fs.existsSync(newImagePath) && fs.existsSync(fallbackImagePath)) {
        imagePath = fallbackImagePath;
      }
      
      if (fs.existsSync(imagePath)) {
        console.log('Loading header image from:', imagePath);
        const imageBuffer = fs.readFileSync(imagePath);
        try {
          headerImage = new ImageRun({
            data: imageBuffer,
            transformation: {
              width: 600,  // Adjusted width for header  
              height: 80   // Adjusted height for header
            },
            type: "png"
          });
        } catch (imageError) {
          console.error('Error creating ImageRun:', imageError);
          // Use text fallback if image creation fails
          headerParagraphChildren = [new TextRun({
            text: "INGEMATICA - Documentación de casos de uso",
            font: "Segoe UI Semilight",
            size: 24,
            color: "0070C0",
            bold: true
          })];
        }
        if (headerImage) headerParagraphChildren = [headerImage];
      } else {
        // Fallback to text if no image found
        headerParagraphChildren = [new TextRun({
          text: "INGEMATICA - Documentación de casos de uso",
          font: "Segoe UI Semilight",
          size: 24,
          color: "0070C0",
          bold: true
        })];
      }
    } catch (error) {
      console.error('Error loading header image:', error);
      // Use text fallback
      headerParagraphChildren = [new TextRun({
        text: "INGEMATICA - Documentación de casos de uso",
        font: "Segoe UI Semilight",
        size: 24,
        color: "0070C0",
        bold: true
      })];
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: headerParagraphChildren
                })
              ]
            })
          },
          children: paragraphs,
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch = 1440 twips
                right: 1440,
                bottom: 1440,
                left: 1440,
              }
            }
          }
        }
      ]
    });

    return await Packer.toBuffer(doc);
  }

  private static parseHtmlToParagraphs(htmlContent: string): (Paragraph | Table)[] {
    try {
      const result: (Paragraph | Table)[] = [];
      
      // Clean HTML content
      let cleanContent = htmlContent
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<!--.*?-->/gi, '')
        .replace(/<\/?(?:html|head|body|meta|link|title)[^>]*>/gi, '')
        .trim();
        
      // CRITICAL: Remove ONLY the duplicate plain text version of test cases that appears before the table version
      // The structured version with the table should be preserved
      const duplicateTestPattern = /CASOS DE PRUEBA\s*Objetivo:\s*Verificar[^<]*?Pasos de Prueba:\s*(?=Historial de Revisiones|CASOS DE PRUEBA|<)/gi;
      cleanContent = cleanContent.replace(duplicateTestPattern, '');
      
      // Now parse the cleaned content sequentially
      this.parseContentSequentially(cleanContent, result);
      
      return result;
    } catch (error) {
      console.error('Error parsing HTML content:', error);
      return [new Paragraph({ children: [new TextRun({ text: "Error parsing document content" })] })];
    }
  }

  private static parseContentSequentially(content: string, result: (Paragraph | Table)[]): void {
    // DEBUG: First let's find ALL tables to make sure they're being detected
    const allTables = content.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
    console.log('DEBUG: Found tables:', allTables?.length || 0);
    if (allTables) {
      allTables.forEach((table, i) => {
        console.log(`Table ${i + 1} preview:`, table.substring(0, 100) + '...');
      });
    }
    
    // Process content by finding elements in order they appear
    let currentIndex = 0;
    const elements: { type: string, content: string, index: number, level?: number }[] = [];
    
    // Find all headings
    const headingRegex = /<(h[1-6])[^>]*>.*?<\/\1>/gi;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1].charAt(1));
      elements.push({
        type: 'heading',
        content: match[0],
        index: match.index,
        level
      });
    }
    
    // Find all tables
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    while ((match = tableRegex.exec(content)) !== null) {
      elements.push({
        type: 'table',
        content: match[0],
        index: match.index
      });
    }
    
    // Find all lists
    const listRegex = /<(ul|ol)[^>]*>[\s\S]*?<\/\1>/gi;
    while ((match = listRegex.exec(content)) !== null) {
      elements.push({
        type: 'list',
        content: match[0],
        index: match.index
      });
    }
    
    // Sort elements by their position in the content
    elements.sort((a, b) => a.index - b.index);
    
    // Process each element
    for (const element of elements) {
      if (element.type === 'heading') {
        result.push(this.createHeading(element.content, element.level!));
      } else if (element.type === 'table') {
        const table = this.parseHtmlTable(element.content);
        if (table) {
          console.log('DEBUG: Successfully parsed table');
          result.push(table);
        } else {
          console.log('DEBUG: Failed to parse table:', element.content.substring(0, 100));
        }
      } else if (element.type === 'list') {
        const listItems = this.parseHtmlList(element.content);
        result.push(...listItems);
      }
    }
    
    // Process any remaining text content between elements
    let lastIndex = 0;
    for (const element of elements) {
      if (element.index > lastIndex) {
        const textBetween = content.substring(lastIndex, element.index);
        this.processTextContent(textBetween, result);
      }
      lastIndex = element.index + element.content.length;
    }
    
    // Process any remaining content after the last element
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      this.processTextContent(remainingText, result);
    }
  }

  private static processTextContent(textContent: string, result: (Paragraph | Table)[]): void {
    const cleanText = this.extractTextContent(textContent);
    if (cleanText && cleanText.trim().length > 0) {
      result.push(this.createParagraph(cleanText));
    }
  }

  // Removed old unused functions

  private static createHeading(htmlContent: string, level: number): Paragraph {
    const text = this.extractTextContent(htmlContent);
    
    let headingLevel: HeadingLevel;
    let fontSize: number;
    let spacingBefore: number;
    let spacingAfter: number;
    
    switch (level) {
      case 1:
        headingLevel = HeadingLevel.HEADING_1;
        fontSize = 32;
        spacingBefore = 0;
        spacingAfter = 200;
        break;
      case 2:
        headingLevel = HeadingLevel.HEADING_2;
        fontSize = 28;
        spacingBefore = 240;
        spacingAfter = 120;
        break;
      case 3:
        headingLevel = HeadingLevel.HEADING_3;
        fontSize = 24;
        spacingBefore = 200;
        spacingAfter = 100;
        break;
      default:
        headingLevel = HeadingLevel.HEADING_4;
        fontSize = 22;
        spacingBefore = 120;
        spacingAfter = 80;
    }
    
    return new Paragraph({
      heading: headingLevel,
      spacing: { before: spacingBefore, after: spacingAfter },
      children: [new TextRun({
        text,
        bold: true,
        size: fontSize,
        color: "0070C0",
        font: "Segoe UI Semilight"
      })]
    });
  }

  private static parseHtmlList(htmlContent: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Extract list items
    const listItemRegex = /<li[^>]*>(.*?)<\/li>/gi;
    let match;
    
    while ((match = listItemRegex.exec(htmlContent)) !== null) {
      const text = this.extractTextContent(match[1]);
      if (text && text.trim()) {
        paragraphs.push(new Paragraph({
          indent: { left: 720 }, // 0.5 inch indent
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "• ", font: "Segoe UI Semilight" }),
            new TextRun({ text: text.trim(), font: "Segoe UI Semilight" })
          ]
        }));
      }
    }
    
    return paragraphs;
  }

  private static createParagraph(text: string): Paragraph {
    // Check if it's a list item pattern
    if (text.match(/^•\s*/)) {
      return new Paragraph({
        indent: { left: 720 },
        spacing: { after: 80 },
        children: [new TextRun({ text, font: "Segoe UI Semilight" })]
      });
    }
    
    return new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text, font: "Segoe UI Semilight" })]
    });
  }

  private static extractTextContent(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private static parseFormattedText(html: string): TextRun[] {
    const textRuns: TextRun[] = [];
    
    // Handle bold formatting by parsing <strong> and <b> tags
    if (html.includes('<strong>') || html.includes('<b>')) {
      // Split by bold tags to create separate text runs
      const parts = html.split(/(<\/?(?:strong|b)[^>]*>)/gi);
      let isBold = false;
      
      for (const part of parts) {
        if (part.match(/<(?:strong|b)[^>]*>/i)) {
          isBold = true;
        } else if (part.match(/<\/(?:strong|b)>/i)) {
          isBold = false;
        } else if (part.trim()) {
          const text = this.extractTextContent(part);
          if (text) {
            textRuns.push(new TextRun({
              text,
              bold: isBold,
              size: 22,
              font: "Segoe UI Semilight"
            }));
          }
        }
      }
    } else {
      // No formatting, single text run
      const text = this.extractTextContent(html);
      if (text) {
        textRuns.push(new TextRun({
          text,
          size: 22,
          font: "Segoe UI Semilight"
        }));
      }
    }
    
    return textRuns.length > 0 ? textRuns : [new TextRun({
      text: this.extractTextContent(html),
      size: 22,
      font: "Segoe UI Semilight"
    })];
  }

  private static parseHtmlTable(htmlTable: string): Table | null {
    try {
      // Extract table rows
      const rowMatches = htmlTable.match(/<tr[^>]*>.*?<\/tr>/gi);
      if (!rowMatches) return null;

      const rows: TableRow[] = [];

      for (const rowHtml of rowMatches) {
        // Extract cells (both td and th)
        const cellMatches = rowHtml.match(/<t[hd][^>]*>.*?<\/t[hd]>/gi);
        if (!cellMatches) continue;

        const cells: TableCell[] = [];
        
        for (const cellHtml of cellMatches) {
          const cellText = this.extractTextContent(cellHtml);
          const isHeader = cellHtml.match(/<th[^>]*>/i);
          
          cells.push(new TableCell({
            children: [
              new Paragraph({
                children: isHeader ? [new TextRun({
                  text: cellText,
                  bold: true,
                  font: "Segoe UI Semilight",
                  size: 20
                })] : [new TextRun({
                  text: this.extractTextContent(cellHtml),
                  font: "Segoe UI Semilight", 
                  size: 20
                })]
              })
            ],
            shading: isHeader ? {
              fill: "D9E2F3" // Light blue background for headers
            } : undefined,
            width: {
              size: 20,
              type: WidthType.PERCENTAGE
            }
          }));
        }

        if (cells.length > 0) {
          rows.push(new TableRow({
            children: cells
          }));
        }
      }

      if (rows.length === 0) return null;

      return new Table({
        rows: rows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "666666" }
        }
      });
    } catch (error) {
      console.error('Error parsing HTML table:', error);
      return null;
    }
  }

  private static createHistoryTable(): Table {
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Fecha", bold: true, font: "Segoe UI Semilight", size: 20 })]
              })],
              shading: { fill: "D9E2F3" }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Acción", bold: true, font: "Segoe UI Semilight", size: 20 })]
              })],
              shading: { fill: "D9E2F3" }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Responsable", bold: true, font: "Segoe UI Semilight", size: 20 })]
              })],
              shading: { fill: "D9E2F3" }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Comentario", bold: true, font: "Segoe UI Semilight", size: 20 })]
              })],
              shading: { fill: "D9E2F3" }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "27/7/2025", font: "Segoe UI Semilight", size: 20 })]
              })]
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Versión original", font: "Segoe UI Semilight", size: 20 })]
              })]
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Sistema", font: "Segoe UI Semilight", size: 20 })]
              })]
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Documento generado automáticamente", font: "Segoe UI Semilight", size: 20 })]
              })]
            })
          ]
        })
      ],
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "666666" }
      }
    });
  }

  private static addTestCasesToDocument(paragraphs: (Paragraph | Table)[], testCaseData: any): void {
    // Add test cases title
    const testCaseTitle = new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: "CASOS DE PRUEBA",
          bold: true,
          size: 28,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })
      ]
    });
    paragraphs.push(testCaseTitle);

    // Add objective if provided
    if (testCaseData.testCaseObjective) {
      const objectiveTitle = new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: "Objetivo:",
            bold: true,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(objectiveTitle);

      const objectiveContent = new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: testCaseData.testCaseObjective,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(objectiveContent);
    }

    // Add preconditions if provided
    if (testCaseData.testCasePreconditions) {
      const preconditionsTitle = new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: "Precondiciones:",
            bold: true,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(preconditionsTitle);

      const preconditionsContent = new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: testCaseData.testCasePreconditions,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(preconditionsContent);
    }

    // Add test steps table if provided
    if (testCaseData.testSteps && testCaseData.testSteps.length > 0) {
      const testStepsTitle = new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: "Pasos de Prueba:",
            bold: true,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(testStepsTitle);

      // Create test steps table
      const testStepsTable = this.createTestCaseTable(testCaseData.testSteps);
      paragraphs.push(testStepsTable);
    }
  }

  private static createTestCaseTable(testSteps: any[]): Table {
    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "#", 
              bold: true, 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: "F2F2F2" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Acción", 
              bold: true, 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: "F2F2F2" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Datos de Entrada", 
              bold: true, 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 22, type: WidthType.PERCENTAGE },
          shading: { fill: "F2F2F2" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Resultado Esperado", 
              bold: true, 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: "F2F2F2" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Observaciones", 
              bold: true, 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: "F2F2F2" },
          borders: this.getTableBorders()
        })
      ]
    });

    const dataRows = testSteps.map(step => new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.number?.toString() || "", 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.action || "", 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.inputData || "", 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.expectedResult || "", 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.observations || "", 
              size: 20, 
              font: "Segoe UI Semilight" 
            })]
          })],
          borders: this.getTableBorders()
        })
      ]
    }));

    return new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });
  }

  private static getTableBorders() {
    return {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
    };
  }
}