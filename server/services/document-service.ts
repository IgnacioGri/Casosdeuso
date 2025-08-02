import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, NumberFormat, VerticalAlign, ShadingType, ImageRun, TabStopType, TabStopPosition } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import sizeOf from 'image-size';

interface TestCase {
  action: string;
  inputData: string;
  expectedResult: string;
  observations: string;
}

export class DocumentService {
  // Helper method to create styled heading with borders
  private static createStyledHeading(text: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 240 },
      indent: { left: 120 }, // 0.21 cm
      keepNext: true,
      keepLines: true,
      border: {
        bottom: {
          color: "006BB6",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 8 // 1pt
        },
        left: {
          color: "006BB6",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 8 // 1pt
        }
      },
      children: [new TextRun({
        text: text.toUpperCase(), // Simulating small caps with uppercase
        bold: true,
        size: 24, // 12pt
        color: "006BB6",
        font: "Segoe UI"
      })]
    });
  }

  // Generate DOCX directly from form data - no HTML conversion needed
  static async generateDirectFromFormData(formData: any, testCases?: TestCase[], customHeaderImage?: string): Promise<Buffer> {
    // Use custom header image if provided, otherwise use official Ingematica header
    let headerImagePath = path.join(process.cwd(), 'attached_assets', 'official-ingematica-header.png');
    
    // Fallback to older headers if official header doesn't exist
    if (!fs.existsSync(headerImagePath)) {
      headerImagePath = path.join(process.cwd(), 'attached_assets', 'Encabezado_1753600608270.png');
    }
    
    if (customHeaderImage) {
      // If customHeaderImage is a URL path like /attached_assets/header-xxx.png, convert to file path
      if (customHeaderImage.startsWith('/attached_assets/')) {
        const filename = customHeaderImage.replace('/attached_assets/', '');
        headerImagePath = path.join(process.cwd(), 'attached_assets', filename);
      }
    }
    
    const doc = new Document({
      sections: [{
        children: [
          // Title - Use case name in uppercase
          new Paragraph({
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
            alignment: AlignmentType.LEFT,
            children: [new TextRun({
              text: (formData.useCaseName || "CASO DE USO").toUpperCase(),
              bold: true,
              size: 48,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }),
          
          // Project Information Section
          this.createStyledHeading("Información del Proyecto"),
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
          this.createStyledHeading("Descripción del Caso de Uso"),
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
              fs.existsSync(headerImagePath) ? (() => {
                try {
                  // Get actual image dimensions
                  const dimensions = sizeOf(headerImagePath);
                  const imageWidth = dimensions.width || 600;
                  const imageHeight = dimensions.height || 100;
                  
                  // Calculate proportional scaling to fit page width
                  // Page width is typically 595 pixels (Letter size at 72 DPI)
                  const maxWidth = 550; // Leave some margin
                  const scale = Math.min(1, maxWidth / imageWidth);
                  const scaledWidth = Math.floor(imageWidth * scale);
                  const scaledHeight = Math.floor(imageHeight * scale);
                  
                  return new Paragraph({
                    children: [
                      new ImageRun({
                        type: "png",
                        data: fs.readFileSync(headerImagePath) as Buffer,
                        transformation: { width: scaledWidth, height: scaledHeight }
                      })
                    ]
                  });
                } catch (error) {
                  console.log('Error reading image dimensions, using default size:', error);
                  // Fallback to default dimensions if image-size fails
                  return new Paragraph({
                    children: [
                      new ImageRun({
                        type: "png",
                        data: fs.readFileSync(headerImagePath) as Buffer,
                        transformation: { width: 550, height: 50 } // Default 11:1 ratio
                      })
                    ]
                  });
                }
              })() : new Paragraph({
                children: [new TextRun({
                  text: "INGEMATICA - Documentación de casos de uso",
                  bold: true,
                  size: 28,
                  color: "0070C0"
                })]
              }),
              // Add spacing after header
              new Paragraph({
                spacing: { after: 240 }, // Add space after header
                children: []
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "página ",
                    font: "Segoe UI Semilight",
                    size: 18
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Segoe UI Semilight",
                    size: 18
                  }),
                  new TextRun({
                    text: " de ",
                    font: "Segoe UI Semilight",
                    size: 18
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: "Segoe UI Semilight",
                    size: 18
                  }),
                  new TextRun({
                    text: "\t" + (formData.useCaseName || "CASO DE USO"),  // Tab + use case name
                    font: "Segoe UI Semilight", 
                    size: 18
                  })
                ],
                tabStops: [{
                  type: TabStopType.RIGHT,
                  position: 9360  // Use specific position like C# version
                }]
              })
            ]
          })
        },
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch = 1440 DOCX units
              right: 1440,
              bottom: 1440,
              left: 1440,
              header: 340   // 0.6 cm = 340 DOCX units (1 cm = 567 DOCX units)
            }
          }
        }
      }]
    });
    
    return await Packer.toBuffer(doc);
  }
  
  private static addFormDataSections(formData: any): (Paragraph | Table)[] {
    const sections: (Paragraph | Table)[] = [];
    
    // Main Flow (Flujo Principal) - for entity use cases
    if (formData.useCaseType === 'entity') {
      sections.push(this.createStyledHeading("Flujo Principal de Eventos"));
      
      // 1. Add search functionality
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "1. Buscar datos de la entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // a. Search filters with roman numerals
      if (formData.searchFilters && formData.searchFilters.length > 0) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 }, // 0.2 inch = 288 twips
          children: [new TextRun({
            text: "a. Filtros de búsqueda disponibles:",
            font: "Segoe UI Semilight"
          })]
        }));
        
        formData.searchFilters.forEach((filter: string, index: number) => {
          sections.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 576 }, // 0.4 inch = 576 twips (additional 0.2)
            children: [new TextRun({
              text: `${this.toRomanNumeral(index + 1)}. ${filter}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // b. Result columns with roman numerals
      if (formData.resultColumns && formData.resultColumns.length > 0) {
        sections.push(new Paragraph({
          spacing: { after: 60, before: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "b. Columnas del resultado de búsqueda:",
            font: "Segoe UI Semilight"
          })]
        }));
        
        formData.resultColumns.forEach((column: string, index: number) => {
          sections.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 576 },
            children: [new TextRun({
              text: `${this.toRomanNumeral(index + 1)}. ${column}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // 2. Add create functionality
      sections.push(new Paragraph({
        spacing: { after: 80, before: 80 },
        children: [new TextRun({
          text: "2. Agregar una nueva entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // a. Entity fields with roman numerals
      if (formData.entityFields && formData.entityFields.length > 0) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "a. Datos de la entidad:",
            font: "Segoe UI Semilight"
          })]
        }));
        
        formData.entityFields.forEach((field: any, index: number) => {
          sections.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 576 },
            children: [new TextRun({
              text: `${this.toRomanNumeral(index + 1)}. ${field.name} (${field.type}${field.length ? `, ${field.length}` : ''}${field.mandatory ? ', obligatorio' : ', opcional'})${field.description ? ` - ${field.description}` : ''}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // b. Auto-registration
      sections.push(new Paragraph({
        spacing: { after: 120, before: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Al agregar se registra automáticamente la fecha y usuario de alta",
          font: "Segoe UI Semilight"
        })]
      }));
    }
    
    
    // Alternative Flows (Flujos Alternativos) - for entity use cases
    if (formData.useCaseType === 'entity') {
      sections.push(this.createStyledHeading("Flujos Alternativos"));
      
      // 1. Modify or update entity
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "1. Modificar o actualizar una entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // a. Entity data
      if (formData.entityFields && formData.entityFields.length > 0) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "a. Datos de la entidad a modificar:",
            font: "Segoe UI Semilight"
          })]
        }));
        
        formData.entityFields.forEach((field: any, index: number) => {
          sections.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 576 },
            children: [new TextRun({
              text: `${this.toRomanNumeral(index + 1)}. ${field.name} (${field.type}${field.length ? `, ${field.length}` : ''}${field.mandatory ? ', obligatorio' : ', opcional'})`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // b. Show identifier
      sections.push(new Paragraph({
        spacing: { after: 60, before: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Mostrar el identificador único de la entidad",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // c. Show creation data
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "c. Mostrar la fecha y el usuario de alta originales",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // d. Register modification
      sections.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "d. Al modificar se registra automáticamente la fecha y usuario de modificación",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // 2. Delete entity
      sections.push(new Paragraph({
        spacing: { after: 80, before: 80 },
        children: [new TextRun({
          text: "2. Eliminar una entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      sections.push(new Paragraph({
        spacing: { after: 120 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "a. Verificar que la entidad no tenga relaciones con otras entidades antes de eliminar",
          font: "Segoe UI Semilight"
        })]
      }));
    }
    
    // Business Rules
    if (formData.businessRules) {
      sections.push(this.createStyledHeading("Reglas de Negocio"));
      
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
          indent: { left: 288 },
          children: [new TextRun({
            text: `${index + 1}. ${rule.toString().trim()}`,
            font: "Segoe UI Semilight"
          })]
        }));
      });
    }
    
    // Special Requirements
    if (formData.specialRequirements) {
      sections.push(this.createStyledHeading("Requerimientos Especiales"));
      
      // Handle both string and array formats
      let requirements: string[] = [];
      if (typeof formData.specialRequirements === 'string') {
        requirements = formData.specialRequirements.split('\n').filter((r: string) => r.trim());
      } else if (Array.isArray(formData.specialRequirements)) {
        requirements = formData.specialRequirements.filter((r: any) => r && r.toString().trim());
      } else {
        // If it's an object or other type, convert to string
        requirements = [String(formData.specialRequirements)];
      }
      
      requirements.forEach((req: string, index: number) => {
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 288 },
          children: [new TextRun({
            text: `${index + 1}. ${req.toString().trim()}`,
            font: "Segoe UI Semilight"
          })]
        }));
      });
    }
    
    // Preconditions
    sections.push(this.createStyledHeading("Precondiciones"));
    sections.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({
        text: formData.preconditions || "El usuario debe estar autenticado en el sistema y tener los permisos necesarios para acceder a este caso de uso.",
        font: "Segoe UI Semilight"
      })]
    }));
    
    // Postconditions
    sections.push(this.createStyledHeading("Postcondiciones"));
    sections.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({
        text: formData.postconditions || "Los datos de la entidad quedan actualizados en el sistema y se registra la auditoría correspondiente.",
        font: "Segoe UI Semilight"
      })]
    }));
    
    // Test Cases Section (now at the correct position after preconditions/postconditions)
    if (formData.generateTestCase && formData.testSteps && formData.testSteps.length > 0) {
      sections.push(this.createStyledHeading("CASOS DE PRUEBA"));
      
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
            text: String(formData.testCaseObjective || ''),
            font: "Segoe UI Semilight"
          })]
        }));
      }
      
      // Test Case Preconditions
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
        
        const preconditionsText = String(formData.testCasePreconditions || '');
        const lines = preconditionsText.split('\n');
        
        lines.forEach((line: string) => {
          if (line.trim()) {
            // Determine the level based on the pattern (1., a., i., etc.)
            const trimmedLine = line.trim();
            let indentLevel = 0;
            let formattedText = trimmedLine;
            
            // Check for numbered items (1., 2., etc.)
            if (/^\d+\./.test(trimmedLine)) {
              indentLevel = 0;
            }
            // Check for lettered items (a., b., etc.)
            else if (/^[a-z]\./.test(trimmedLine)) {
              indentLevel = 432; // 0.3 inch
            }
            // Check for roman numerals (i., ii., etc.)
            else if (/^[ivx]+\./.test(trimmedLine)) {
              indentLevel = 864; // 0.6 inch
            }
            // Check for leading spaces to determine indentation
            else {
              const leadingSpaces = line.length - line.trimStart().length;
              indentLevel = Math.floor(leadingSpaces / 3) * 288; // 288 twips = 0.2 inch per 3 spaces
            }
            
            sections.push(new Paragraph({
              spacing: { after: 40 },
              indent: { left: indentLevel },
              children: [new TextRun({
                text: formattedText,
                font: "Segoe UI Semilight"
              })]
            }));
          }
        });
        
        // Add extra spacing after preconditions
        sections.push(new Paragraph({
          spacing: { after: 80 }
        }));
      }
      
      // Test Steps Table
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
      
      const testStepsTable = new Table({
        rows: [
          // Header row
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: "#",
                    bold: true,
                    font: "Segoe UI Semilight"
                  })]
                })],
                shading: { fill: "DEEAF6" },
                width: { size: 600, type: WidthType.DXA }
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: "Acción",
                    bold: true,
                    font: "Segoe UI Semilight"
                  })]
                })],
                shading: { fill: "DEEAF6" },
                width: { size: 2500, type: WidthType.DXA }
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: "Datos de entrada",
                    bold: true,
                    font: "Segoe UI Semilight"
                  })]
                })],
                shading: { fill: "DEEAF6" },
                width: { size: 2000, type: WidthType.DXA }
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: "Resultado esperado",
                    bold: true,
                    font: "Segoe UI Semilight"
                  })]
                })],
                shading: { fill: "DEEAF6" },
                width: { size: 2500, type: WidthType.DXA }
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: "Observaciones",
                    bold: true,
                    font: "Segoe UI Semilight"
                  })]
                })],
                shading: { fill: "DEEAF6" },
                width: { size: 1500, type: WidthType.DXA }
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: "Estado\n(P/F)",
                    bold: true,
                    font: "Segoe UI Semilight"
                  })]
                })],
                shading: { fill: "DEEAF6" },
                width: { size: 700, type: WidthType.DXA }
              })
            ]
          }),
          // Data rows
          ...formData.testSteps.map((testStep: any, index: number) => 
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                      text: String(testStep.number || index + 1),
                      font: "Segoe UI Semilight"
                    })]
                  })],
                  width: { size: 600, type: WidthType.DXA }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: testStep.action || '',
                      font: "Segoe UI Semilight"
                    })]
                  })],
                  width: { size: 2500, type: WidthType.DXA }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: testStep.inputData || '',
                      font: "Segoe UI Semilight"
                    })]
                  })],
                  width: { size: 2000, type: WidthType.DXA }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: testStep.expectedResult || '',
                      font: "Segoe UI Semilight"
                    })]
                  })],
                  width: { size: 2500, type: WidthType.DXA }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: testStep.observations || '',
                      font: "Segoe UI Semilight"
                    })]
                  })],
                  width: { size: 1500, type: WidthType.DXA }
                }),
                new TableCell({
                  children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                      text: "Pendiente",
                      font: "Segoe UI Semilight"
                    })]
                  })],
                  width: { size: 700, type: WidthType.DXA }
                })
              ]
            })
          )
        ],
        width: {
          size: 9800,
          type: WidthType.DXA
        },
        margins: {
          top: 72,
          bottom: 72,
          right: 72,
          left: 72
        }
      });
      
      sections.push(testStepsTable);
    }
    
    return sections;
  }
  
  private static toRomanNumeral(num: number): string {
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 
                           'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'];
    return romanNumerals[num - 1] || num.toString();
  }
  
  private static createHistorySection(): (Paragraph | Table)[] {
    const today = new Date();
    const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    
    const elements: (Paragraph | Table)[] = [];
    
    // Header
    elements.push(this.createStyledHeading("HISTORIA DE REVISIONES Y APROBACIONES"));
    
    // Table with revision history
    const table = new Table({
      rows: [
        // Header row
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "Fecha",
                  bold: true,
                  font: "Segoe UI Semilight"
                })]
              })],
              shading: { fill: "DEEAF6" },
              width: { size: 2000, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "Acción",
                  bold: true,
                  font: "Segoe UI Semilight"
                })]
              })],
              shading: { fill: "DEEAF6" },
              width: { size: 2000, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "Responsable",
                  bold: true,
                  font: "Segoe UI Semilight"
                })]
              })],
              shading: { fill: "DEEAF6" },
              width: { size: 2500, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "Comentario",
                  bold: true,
                  font: "Segoe UI Semilight"
                })]
              })],
              shading: { fill: "DEEAF6" },
              width: { size: 4500, type: WidthType.DXA }
            })
          ]
        }),
        // Data row
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: formattedDate,
                  font: "Segoe UI Semilight"
                })]
              })],
              width: { size: 2000, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: "Creación",
                  font: "Segoe UI Semilight"
                })]
              })],
              width: { size: 2000, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: "Sistema",
                  font: "Segoe UI Semilight"
                })]
              })],
              width: { size: 2500, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: "Versión original",
                  font: "Segoe UI Semilight"
                })]
              })],
              width: { size: 4500, type: WidthType.DXA }
            })
          ]
        })
      ],
      width: {
        size: 9500,
        type: WidthType.DXA
      },
      margins: {
        top: 72,  // 0.05 inches in twips
        bottom: 72,
        right: 72,
        left: 72
      }
    });
    
    elements.push(table);
    
    // Add empty paragraph after table for spacing
    elements.push(new Paragraph({
      spacing: { after: 240 },
      children: []
    }));
    
    return elements;
  }
  
  private static formatTestCases(testCases: TestCase[], useCaseName: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Test Cases header
    paragraphs.push(this.createStyledHeading("CASOS DE PRUEBA"));
    
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

    // Add objective if provided (handle both formats)
    const objective = testCaseData.testCaseObjective || testCaseData.objective;
    if (objective) {
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
            text: objective,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(objectiveContent);
    }

    // Add preconditions if provided (handle both formats)
    const preconditions = testCaseData.testCasePreconditions || testCaseData.preconditions;
    if (preconditions) {
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

      // Process and format preconditions properly
      const formattedPreconditions = this.formatPreconditionsForDocx(preconditions);
      if (typeof formattedPreconditions === 'string') {
        const preconditionsContent = new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: formattedPreconditions,
              size: 22,
              font: "Segoe UI Semilight"
            })
          ]
        });
        paragraphs.push(preconditionsContent);
      } else {
        // If formatted as paragraphs array, add them directly
        paragraphs.push(...formattedPreconditions);
      }
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

  private static formatPreconditionsForDocx(preconditions: any): string | Paragraph[] {
    // If preconditions is already well-formatted with hierarchical numbering, return it
    if (typeof preconditions === 'string' && /^\d+\./.test(preconditions.trim())) {
      return preconditions;
    }

    // Clean up badly formatted preconditions
    if (typeof preconditions === 'string') {
      const lines = preconditions.split('\n');
      const cleanedLines: string[] = [];
      let currentSection = '';
      let sectionNumber = 1;
      let itemLetter = 'a';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and double bullets
        if (!trimmedLine || trimmedLine.startsWith('• •')) {
          continue;
        }
        
        // Check if it's a section header
        if (trimmedLine.startsWith('•') && trimmedLine.endsWith(':')) {
          currentSection = trimmedLine.replace(/^•\s*/, '').replace(/:$/, '');
          cleanedLines.push(`${sectionNumber}. ${currentSection}`);
          sectionNumber++;
          itemLetter = 'a';
        }
        // Handle sub-items
        else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
          let text = trimmedLine.replace(/^[-•]\s*/, '');
          
          // Clean up JSON objects and [object Object]
          text = text.replace(/\[object Object\]/g, '')
            .replace(/\{[^}]+\}/g, (match) => {
              try {
                const obj = JSON.parse(match);
                if (obj.requirement) return obj.requirement;
                if (obj.requisito) return obj.requisito;
                if (obj.user) return obj.user;
                if (obj.description) return obj.description;
                return '';
              } catch {
                return '';
              }
            })
            .trim();
          
          if (text) {
            cleanedLines.push(`   ${itemLetter}. ${text}`);
            itemLetter = String.fromCharCode(itemLetter.charCodeAt(0) + 1);
          }
        }
      }
      
      if (cleanedLines.length > 0) {
        return cleanedLines.join('\n');
      }
    }
    
    // Default preconditions if parsing fails
    return `1. Usuarios de prueba
   a. Usuario con perfil autorizado con permisos completos
   b. Usuario con permisos limitados
   c. Usuario sin acceso al módulo
   
2. Datos de prueba
   a. Registros válidos que cumplen con todas las validaciones
   b. Registros inválidos para pruebas de validación
   
3. Infraestructura y configuración
   a. Sistema desplegado en ambiente de pruebas
   b. Base de datos con datos de prueba precargados
   c. Servicios externos configurados o simulados`;
  }

  private static createTestCaseTable(testSteps: any[]): Table {
    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "#", 
              bold: true, 
              size: 18, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 5, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Acción", 
              bold: true, 
              size: 18, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Datos de entrada", 
              bold: true, 
              size: 18, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Resultado esperado", 
              bold: true, 
              size: 18, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 22, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Observaciones", 
              bold: true, 
              size: 18, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Estado\n(P/F)", 
              bold: true, 
              size: 18, 
              font: "Segoe UI Semilight" 
            })]
          })],
          width: { size: 7, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        })
      ],
      tableHeader: true
    });

    const dataRows = testSteps.map(step => new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.number?.toString() || "", 
              size: 18, 
              font: "Segoe UI Semilight" 
            })],
            alignment: AlignmentType.CENTER
          })],
          borders: this.getTableBorders(),
          width: { size: 5, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.action || "", 
              size: 18, 
              font: "Segoe UI Semilight" 
            })],
            spacing: { after: 120 }
          })],
          borders: this.getTableBorders(),
          width: { size: 20, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.inputData || "", 
              size: 18, 
              font: "Segoe UI Semilight" 
            })],
            spacing: { after: 120 }
          })],
          borders: this.getTableBorders(),
          width: { size: 18, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.expectedResult || "", 
              size: 18, 
              font: "Segoe UI Semilight" 
            })],
            spacing: { after: 120 }
          })],
          borders: this.getTableBorders(),
          width: { size: 22, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: step.observations || "", 
              size: 18, 
              font: "Segoe UI Semilight" 
            })],
            spacing: { after: 120 }
          })],
          borders: this.getTableBorders(),
          width: { size: 18, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ 
              text: "Pendiente", 
              size: 18, 
              font: "Segoe UI Semilight" 
            })],
            alignment: AlignmentType.CENTER
          })],
          borders: this.getTableBorders(),
          width: { size: 7, type: WidthType.PERCENTAGE }
        })
      ]
    }));

    return new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },

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

  private static getTableBorders() {
    return {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
    };
  }
}