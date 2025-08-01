import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, NumberFormat, VerticalAlign, ShadingType, ImageRun, TabStopType, TabStopPosition } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

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
  static async generateDirectFromFormData(formData: any, testCases?: TestCase[]): Promise<Buffer> {
    const headerImagePath = path.join(process.cwd(), 'attached_assets', 'Encabezado_1753600608270.png');
    
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
              fs.existsSync(headerImagePath) ? new Paragraph({
                children: [
                  new ImageRun({
                    type: "png",
                    data: fs.readFileSync(headerImagePath),
                    transformation: { width: 600, height: 100 }  // Ajustado para nueva imagen ING
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
            // Determine indentation level based on leading spaces
            const leadingSpaces = line.length - line.trimStart().length;
            const indentLevel = Math.floor(leadingSpaces / 2) * 288; // 288 twips = 0.2 inch per level
            
            sections.push(new Paragraph({
              spacing: { after: 40 },
              indent: { left: indentLevel },
              children: [new TextRun({
                text: line.trim(),
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
  /**
   * @deprecated This method converts HTML to DOCX and should not be used anymore.
   * Use generateDirectFromFormData instead which generates DOCX directly without HTML conversion.
   * This method is kept only for backward compatibility and will be removed in future versions.
   */
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
      const newImagePath = path.join(process.cwd(), 'attached_assets', 'image_1754002431086.png');
      const fallbackImagePath1 = path.join(process.cwd(), 'attached_assets', 'Encabezado_1753600608270.png');
      const fallbackImagePath2 = path.join(process.cwd(), 'attached_assets', 'Encabezado_caso_de_uso.png');
      
      let imagePath = newImagePath;
      if (!fs.existsSync(newImagePath)) {
        if (fs.existsSync(fallbackImagePath1)) {
          imagePath = fallbackImagePath1;
        } else if (fs.existsSync(fallbackImagePath2)) {
          imagePath = fallbackImagePath2;
        }
      }
      
      if (fs.existsSync(imagePath)) {
        console.log('Loading header image from:', imagePath);
        const imageBuffer = fs.readFileSync(imagePath);
        try {
          headerImage = new ImageRun({
            type: "png",
            data: imageBuffer,
            transformation: {
              width: 600,  // Ancho estándar
              height: 100  // Alto proporcional para nueva imagen ING
            }
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

    // Create document with static footer text as test
    const footerParagraph = new Paragraph({
      children: [
        new TextRun({
          text: "Página 1 de 1 - Test Footer",
          size: 20
        })
      ]
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
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
        footers: {
          default: new Footer({
            children: [footerParagraph]
          })
        },
        children: paragraphs
      }]
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
    
    let headingLevel: any;
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
      // Debug: Log the table being parsed
      console.log('🔍 Parsing HTML table:');
      
      // Check if this is the Historia de Revisiones table
      if (htmlTable.includes('HISTORIA DE REVISIONES')) {
        console.log('⚠️ Found Historia de Revisiones table in HTML - this should not be parsed, it will be added separately');
        return null; // Don't parse this table from HTML, it will be added at the end
      }
      
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

      const preconditionsContent = new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: preconditions,
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