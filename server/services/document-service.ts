import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, NumberFormat, VerticalAlign, ShadingType, ImageRun, TabStopType, TabStopPosition, LevelFormat, AlignmentType as NumberingAlignment, convertInchesToTwip } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
// Removed image-size due to compatibility issues
import { SpellChecker } from './spell-checker';

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
  static async generateDirectFromFormData(formData: any, testCases?: TestCase[], customHeaderImage?: string, aiGeneratedContent?: string): Promise<Buffer> {
    // Create numbering configurations for native lists
    const multiLevelNumberingReference = "multilevel";
    const bulletNumberingReference = "bullet";
    const simpleNumberingReference = "simple";
    
    // Logo path for the header table - use the new Ingematica logo
    const logoPath = path.join(process.cwd(), 'attached_assets', 'image_1754501839527.png');
    
    // Fallback logos if main doesn't exist
    let logoImageData: Buffer | null = null;
    if (fs.existsSync(logoPath)) {
      logoImageData = fs.readFileSync(logoPath);
    } else {
      const fallbackLogos = ['Logo.png', 'company-logo.png', 'ingematica-logo-full.png'];
      for (const fallback of fallbackLogos) {
        const fallbackPath = path.join(process.cwd(), 'attached_assets', fallback);
        if (fs.existsSync(fallbackPath)) {
          logoImageData = fs.readFileSync(fallbackPath);
          break;
        }
      }
    }
    
    const doc = new Document({
      numbering: {
        config: [
          // Multilevel numbering (1, a, i)
          {
            reference: multiLevelNumberingReference,
            levels: [
              {
                level: 0,
                format: LevelFormat.DECIMAL,
                text: "%1.",
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.25) },
                  },
                },
              },
              {
                level: 1,
                format: LevelFormat.LOWER_LETTER,
                text: "%2.",
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                  },
                },
              },
              {
                level: 2,
                format: LevelFormat.LOWER_ROMAN,
                text: "%3.",
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: convertInchesToTwip(0.75), hanging: convertInchesToTwip(0.25) },
                  },
                },
              },
            ],
          },
          // Bullet list
          {
            reference: bulletNumberingReference,
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: "•",
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.25) },
                  },
                },
              },
            ],
          },
          // Simple numbered list
          {
            reference: simpleNumberingReference,
            levels: [
              {
                level: 0,
                format: LevelFormat.DECIMAL,
                text: "%1.",
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.25) },
                  },
                },
              },
            ],
          },
        ],
      },
      sections: [{
        children: [
          // Title - Code + Use case name in uppercase
          new Paragraph({
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
            alignment: AlignmentType.LEFT,
            children: [new TextRun({
              text: `${formData.useCaseCode || ''} ${formData.useCaseName || "CASO DE USO"}`.toUpperCase(),
              bold: true,
              size: 34, // 17pt in Word (17 * 2 = 34)
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }),
          
          // Project Information Section
          this.createStyledHeading("Información del Proyecto"),
          new Paragraph({
            numbering: {
              reference: bulletNumberingReference,
              level: 0
            },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "Cliente: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.clientName || '', font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            numbering: {
              reference: bulletNumberingReference,
              level: 0
            },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "Proyecto: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.projectName || '', font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            numbering: {
              reference: bulletNumberingReference,
              level: 0
            },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "Código: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.useCaseCode || '', font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            numbering: {
              reference: bulletNumberingReference,
              level: 0
            },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "Archivo: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.fileName || '', font: "Segoe UI Semilight" })
            ]
          }),
          
          // Use Case Description Section
          this.createStyledHeading("Descripción del Caso de Uso"),
          new Paragraph({
            numbering: {
              reference: bulletNumberingReference,
              level: 0
            },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "Nombre: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: SpellChecker.correctAccents(formData.useCaseName || ''), font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            numbering: {
              reference: bulletNumberingReference,
              level: 0
            },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "Tipo: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.useCaseType === 'entity' ? 'Gestión de Entidades' : formData.useCaseType || '', font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            numbering: {
              reference: bulletNumberingReference,
              level: 0
            },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "Descripción: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: SpellChecker.correctAccents(formData.description || ''), font: "Segoe UI Semilight" })
            ]
          }),
          
          // Add remaining sections based on form data (includes test cases)
          ...this.addFormDataSections(formData, aiGeneratedContent, {
            multiLevel: multiLevelNumberingReference,
            bullet: bulletNumberingReference,
            simple: simpleNumberingReference
          }),
          
          // History table
          ...this.createHistorySection()
        ],
        headers: {
          default: new Header({
            children: [
              // Create header table instead of image
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  left: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  right: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" }
                },
                rows: [
                  new TableRow({
                    height: { value: 500, rule: "exact" },
                    children: [
                      // Logo cell (spans 2 rows)
                      new TableCell({
                        rowSpan: 2,
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: {
                          top: 60,
                          bottom: 60,
                          left: 120,
                          right: 120
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: logoImageData ? [
                              new ImageRun({
                                type: "png",
                                data: logoImageData,
                                transformation: {
                                  width: 160,  // Width adjusted to fit in cell
                                  height: 64   // Height calculated to preserve 199:80 aspect ratio (160 * 80/199 = 64)
                                }
                              })
                            ] : [
                              new TextRun({
                                text: "INGEMATICA",
                                bold: true,
                                size: 24,
                                color: "006BB6",
                                font: "Segoe UI"
                              })
                            ]
                          })
                        ]
                      }),
                      // "Documento de Casos de Uso" cell
                      new TableCell({
                        width: { size: 75, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "Documento de Casos de Uso",
                                bold: true,
                                size: 28,  // 14pt in Word
                                color: "000000",  // Black text instead of blue
                                font: "Segoe UI"
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  }),
                  new TableRow({
                    height: { value: 700, rule: "exact" },
                    children: [
                      // Project name cell
                      new TableCell({
                        width: { size: 75, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: formData.projectName || "Proyecto",
                                bold: true,
                                size: 26,  // 13pt in Word
                                color: "000000",  // Pure black for consistency
                                font: "Segoe UI Semilight"
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              // Add spacing after header table
              new Paragraph({
                spacing: { after: 240 },
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
  
  private static addFormDataSections(formData: any, aiGeneratedContent?: string, numberingRefs?: { multiLevel: string, bullet: string, simple: string }): (Paragraph | Table)[] {
    const sections: (Paragraph | Table)[] = [];
    
    // Get numbering references or use defaults
    const multiLevelNumberingReference = numberingRefs?.multiLevel || "multilevel";
    const bulletNumberingReference = numberingRefs?.bullet || "bullet";
    const simpleNumberingReference = numberingRefs?.simple || "simple";
    
    // For API use cases, generate sections for API endpoints
    if (formData.useCaseType === 'api') {
      console.log('📄 Generating API sections directly from formData');
      
      // FLUJO PRINCIPAL DE EVENTOS - Generate directly like entity type
      sections.push(this.createStyledHeading("FLUJO PRINCIPAL DE EVENTOS"));
      
      // 1. Request initiation
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: `El cliente realiza una petición HTTP ${formData.httpMethod || 'POST'} al endpoint ${formData.apiEndpoint || formData.endpoint || '/api/endpoint'}`,
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Add request format details if available
      if (formData.requestFormat || formData.requestExample) {
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: 60 },
          children: [new TextRun({
            text: "Formato de solicitud:",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 576 },
          children: [new TextRun({
            text: formData.requestFormat || formData.requestExample || "JSON con los parámetros requeridos",
            font: "Segoe UI Semilight"
          })]
        }));
      }
      
      // 2. Validation
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "El sistema valida los datos de entrada",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 60 },
        children: [new TextRun({
          text: "Validación de estructura del mensaje",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Validación de datos obligatorios",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // 3. Processing
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "El sistema procesa la solicitud",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 60 },
        children: [new TextRun({
          text: "Ejecuta la lógica de negocio correspondiente",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Registra la operación en el log de auditoría",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // 4. Response
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "El sistema retorna la respuesta",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Add response format details if available
      if (formData.responseFormat || formData.responseExample) {
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: 60 },
          children: [new TextRun({
            text: "Formato de respuesta:",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 120 },
          indent: { left: 576 },
          children: [new TextRun({
            text: formData.responseFormat || formData.responseExample || "JSON con el resultado de la operación",
            font: "Segoe UI Semilight"
          })]
        }));
      }
      
      // FLUJOS ALTERNATIVOS - Generate directly like entity type
      sections.push(this.createStyledHeading("FLUJOS ALTERNATIVOS"));
      
      // Generate error handling flows
      const errorCodes = formData.errorCodes || ['400', '401', '403', '404', '500'];
      
      errorCodes.forEach((code: string, index: number) => {
        const errorDescription = 
          code === '400' ? 'Solicitud incorrecta - datos de entrada inválidos' :
          code === '401' ? 'No autorizado - credenciales inválidas o expiradas' :
          code === '403' ? 'Prohibido - sin permisos suficientes para la operación' :
          code === '404' ? 'No encontrado - el recurso solicitado no existe' :
          code === '500' ? 'Error interno del servidor - problema en el procesamiento' :
          `Error ${code} - error en la aplicación`;
        
        sections.push(new Paragraph({
          numbering: {
            reference: simpleNumberingReference,
            level: 0
          },
          spacing: { after: 80 },
          children: [new TextRun({
            text: `Error ${code}: ${errorDescription}`,
            bold: true,
            font: "Segoe UI Semilight"
          })]
        }));
        
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: 60 },
          children: [new TextRun({
            text: `El sistema detecta un error de tipo ${code}`,
            font: "Segoe UI Semilight"
          })]
        }));
        
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: 60 },
          children: [new TextRun({
            text: "Se registra el error en el log del sistema",
            font: "Segoe UI Semilight"
          })]
        }));
        
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: index === errorCodes.length - 1 ? 120 : 80 },
          children: [new TextRun({
            text: `Se retorna el código de error ${code} con el mensaje correspondiente`,
            font: "Segoe UI Semilight"
          })]
        }));
      });
      
      // Add Business Rules for API/Service
      if (formData.businessRules) {
        sections.push(this.createStyledHeading("Reglas de Negocio"));
        let rules: string[] = [];
        if (typeof formData.businessRules === 'string') {
          rules = formData.businessRules.split('\n').filter((r: string) => r.trim());
        } else if (Array.isArray(formData.businessRules)) {
          rules = formData.businessRules.filter((r: any) => r && r.toString().trim());
        }
        
        rules.forEach((rule: string, index: number) => {
          sections.push(new Paragraph({
            numbering: {
              reference: simpleNumberingReference,
              level: 0
            },
            spacing: { after: 80 },
            children: [new TextRun({
              text: rule.toString().trim(),
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // Add Special Requirements for API/Service
      if (formData.specialRequirements) {
        sections.push(this.createStyledHeading("Requerimientos Especiales"));
        let requirements: string[] = [];
        if (typeof formData.specialRequirements === 'string') {
          requirements = formData.specialRequirements.split('\n').filter((r: string) => r.trim());
        } else if (Array.isArray(formData.specialRequirements)) {
          requirements = formData.specialRequirements.filter((r: any) => r && r.toString().trim());
        } else {
          requirements = [String(formData.specialRequirements)];
        }
        
        requirements.forEach((req: string, index: number) => {
          sections.push(new Paragraph({
            numbering: {
              reference: simpleNumberingReference,
              level: 0
            },
            spacing: { after: 80 },
            children: [new TextRun({
              text: req.toString().trim(),
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // Add Preconditions for API/Service
      sections.push(this.createStyledHeading("Precondiciones"));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({
          text: formData.preconditions || "El cliente debe tener credenciales válidas de autenticación API y los permisos necesarios para acceder al endpoint.",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Add Postconditions for API/Service
      sections.push(this.createStyledHeading("Postcondiciones"));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({
          text: formData.postconditions || "La operación se completa exitosamente y se registra en el log de auditoría del sistema.",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Return early for API to skip entity-specific sections
      return sections;
    }
    
    // For Service/Process use cases, generate sections with frequency and execution details
    if (formData.useCaseType === 'service') {
      console.log('📄 Generating Service/Process sections directly from formData');
      
      // FLUJO PRINCIPAL DE EVENTOS - Include frequency and execution time
      sections.push(this.createStyledHeading("FLUJO PRINCIPAL DE EVENTOS"));
      
      // 1. Service execution schedule
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: `El servicio se ejecuta ${formData.serviceFrequency || 'Diariamente'} a las ${formData.executionTime || '02:00 AM'}`,
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Add details about the execution frequency
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 60 },
        children: [new TextRun({
          text: `Frecuencia de ejecución: ${formData.serviceFrequency || 'Cada 24 horas'}`,
          font: "Segoe UI Semilight"
        })]
      }));
      
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: `Hora programada: ${formData.executionTime || '02:00 AM (configuración estándar)'}`,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // 2. Process initialization
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "El proceso inicia automáticamente según la programación establecida",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Check if it processes files
      if (formData.configurationPaths) {
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: 60 },
          children: [new TextRun({
            text: "Captura archivos desde rutas configurables:",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 576 },
          children: [new TextRun({
            text: formData.configurationPaths || "Las rutas deben ser configurables en el sistema",
            font: "Segoe UI Semilight"
          })]
        }));
      }
      
      // Check if it calls web services
      if (formData.webServiceCredentials) {
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: 60 },
          children: [new TextRun({
            text: "Conecta con web services externos:",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 576 },
          children: [new TextRun({
            text: formData.webServiceCredentials || "Usuario, clave y URL deben ser configurables",
            font: "Segoe UI Semilight"
          })]
        }));
      }
      
      // 3. Data processing
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "El sistema procesa los datos según las reglas de negocio",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 60 },
        children: [new TextRun({
          text: "Valida la integridad de los datos",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 60 },
        children: [new TextRun({
          text: "Aplica las transformaciones necesarias",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Registra el progreso en el log de auditoría",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // 4. Results generation
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "El proceso genera los resultados y notificaciones",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 60 },
        children: [new TextRun({
          text: "Genera archivos de salida o actualiza base de datos",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 120 },
        children: [new TextRun({
          text: "Envía notificaciones de finalización",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // FLUJOS ALTERNATIVOS - Error handling for service processes
      sections.push(this.createStyledHeading("FLUJOS ALTERNATIVOS"));
      
      // 1. File not found error
      sections.push(new Paragraph({
        numbering: {
          reference: simpleNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Error en captura de archivos",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 60 },
        children: [new TextRun({
          text: "El sistema no encuentra archivos en la ruta configurada",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Se registra el error y se notifica al administrador",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // 2. Web service connection error
      sections.push(new Paragraph({
        numbering: {
          reference: simpleNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Error de conexión con web service",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 60 },
        children: [new TextRun({
          text: "Falla la conexión con el servicio externo",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Se intenta reconectar según política de reintentos",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // 3. Processing error
      sections.push(new Paragraph({
        numbering: {
          reference: simpleNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Error en procesamiento de datos",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 60 },
        children: [new TextRun({
          text: "Se detecta inconsistencia en los datos",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 120 },
        children: [new TextRun({
          text: "Se genera reporte de errores y se detiene el proceso",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Add Business Rules for Service
      if (formData.businessRules) {
        sections.push(this.createStyledHeading("Reglas de Negocio"));
        let rules: string[] = [];
        if (typeof formData.businessRules === 'string') {
          rules = formData.businessRules.split('\n').filter((r: string) => r.trim());
        } else if (Array.isArray(formData.businessRules)) {
          rules = formData.businessRules.filter((r: any) => r && r.toString().trim());
        }
        
        rules.forEach((rule: string, index: number) => {
          sections.push(new Paragraph({
            numbering: {
              reference: simpleNumberingReference,
              level: 0
            },
            spacing: { after: 80 },
            children: [new TextRun({
              text: rule.toString().trim(),
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // Add Special Requirements for Service - Include configurable paths and credentials
      sections.push(this.createStyledHeading("Requerimientos Especiales"));
      
      // Always add configuration requirements for services
      const serviceRequirements: string[] = [];
      
      if (formData.configurationPaths) {
        serviceRequirements.push("Las rutas de captura de archivos deben ser configurables");
      }
      
      if (formData.webServiceCredentials) {
        serviceRequirements.push("El usuario, clave y URL del web service deben ser configurables");
      }
      
      // Add frequency configuration requirement
      serviceRequirements.push("La frecuencia y hora de ejecución deben ser configurables");
      
      // Add any additional requirements from formData
      if (formData.specialRequirements) {
        let additionalReqs: string[] = [];
        if (typeof formData.specialRequirements === 'string') {
          additionalReqs = formData.specialRequirements.split('\n').filter((r: string) => r.trim());
        } else if (Array.isArray(formData.specialRequirements)) {
          additionalReqs = formData.specialRequirements.filter((r: any) => r && r.toString().trim());
        }
        serviceRequirements.push(...additionalReqs);
      }
      
      serviceRequirements.forEach((req: string, index: number) => {
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 288 },
          children: [new TextRun({
            text: `${index + 1}. ${req}`,
            font: "Segoe UI Semilight"
          })]
        }));
      });
      
      // Add Preconditions for Service
      sections.push(this.createStyledHeading("Precondiciones"));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({
          text: formData.preconditions || "El servicio debe estar configurado correctamente con las credenciales y rutas necesarias para su ejecución automática.",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Add Postconditions for Service
      sections.push(this.createStyledHeading("Postcondiciones"));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({
          text: formData.postconditions || "El proceso se completa exitosamente y genera los archivos de salida o actualizaciones correspondientes, registrando toda la actividad en el log.",
          font: "Segoe UI Semilight"
        })]
      }));
      
      // Return early for Service to skip entity-specific sections
      return sections;
    }
    
    // Main Flow (Flujo Principal) - for entity use cases
    if (formData.useCaseType === 'entity') {
      sections.push(this.createStyledHeading("Flujo Principal de Eventos"));
      
      // 1. Add search functionality
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Buscar datos de la entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // a. Search filters with roman numerals
      if (formData.searchFilters && formData.searchFilters.length > 0) {
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: 60 },
          children: [new TextRun({
            text: "Filtros de búsqueda disponibles:",
            font: "Segoe UI Semilight"
          })]
        }));
        
        formData.searchFilters.forEach((filter: string, index: number) => {
          sections.push(new Paragraph({
            numbering: {
              reference: multiLevelNumberingReference,
              level: 2
            },
            spacing: { after: 40 },
            children: [new TextRun({
              text: SpellChecker.correctAccents(filter),
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // b. Result columns with roman numerals
      if (formData.resultColumns && formData.resultColumns.length > 0) {
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: 60, before: 60 },
          children: [new TextRun({
            text: "Columnas del resultado de búsqueda:",
            font: "Segoe UI Semilight"
          })]
        }));
        
        formData.resultColumns.forEach((column: string, index: number) => {
          sections.push(new Paragraph({
            numbering: {
              reference: multiLevelNumberingReference,
              level: 2
            },
            spacing: { after: 40 },
            children: [new TextRun({
              text: SpellChecker.correctAccents(column),
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // 2. Add create functionality
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 0
        },
        spacing: { after: 80, before: 80 },
        children: [new TextRun({
          text: "Agregar una nueva entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      
      // a. Entity fields with roman numerals
      if (formData.entityFields && formData.entityFields.length > 0) {
        sections.push(new Paragraph({
          numbering: {
            reference: multiLevelNumberingReference,
            level: 1
          },
          spacing: { after: 60 },
          children: [new TextRun({
            text: "Datos de la entidad:",
            font: "Segoe UI Semilight"
          })]
        }));
        
        formData.entityFields.forEach((field: any, index: number) => {
          sections.push(new Paragraph({
            numbering: {
              reference: multiLevelNumberingReference,
              level: 2
            },
            spacing: { after: 40 },
            children: [new TextRun({
              text: `${SpellChecker.correctAccents(field.name)} (${field.type}${field.length ? `, ${field.length}` : ''}${field.mandatory ? ', obligatorio' : ', opcional'})${field.description ? ` - ${SpellChecker.correctAccents(field.description)}` : ''}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      
      // b. Auto-registration
      sections.push(new Paragraph({
        numbering: {
          reference: multiLevelNumberingReference,
          level: 1
        },
        spacing: { after: 120, before: 60 },
        children: [new TextRun({
          text: "Al agregar se registra automáticamente la fecha y usuario de alta",
          font: "Segoe UI Semilight"
        })]
      }));
    }
    
    
    // Alternative Flows (Flujos Alternativos) - for entity use cases
    if (formData.useCaseType === 'entity') {
      sections.push(this.createStyledHeading("Flujos Alternativos"));
      
      // 1. Modify or update entity
      sections.push(new Paragraph({
        numbering: {
          reference: simpleNumberingReference,
          level: 0
        },
        spacing: { after: 80 },
        children: [new TextRun({
          text: "Modificar o actualizar una entidad",
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
    
    // Wireframes Section - Add generated wireframe images if they exist
    if (formData.generateWireframes && formData.generatedWireframes) {
      sections.push(this.createStyledHeading("BOCETOS GRÁFICOS DE INTERFAZ DE USUARIO"));
      
      // Add search wireframe if it exists
      if (formData.generatedWireframes.searchWireframe) {
        sections.push(new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({
            text: "Wireframe 1: Interfaz de Búsqueda",
            bold: true,
            size: 24,
            color: "0070C0",
            font: "Segoe UI Semilight"
          })]
        }));
        
        try {
          // Handle both base64 data URLs and file paths
          let imageData: Buffer;
          const searchWireframePath = formData.generatedWireframes.searchWireframe;
          
          if (searchWireframePath.startsWith('data:image/')) {
            // Extract base64 data from data URL
            const base64Data = searchWireframePath.split(',')[1];
            imageData = Buffer.from(base64Data, 'base64');
          } else {
            // Handle file path
            let filePath = searchWireframePath;
            if (filePath.startsWith('/')) {
              filePath = filePath.substring(1);
            }
            const fullPath = path.join(process.cwd(), filePath);
            
            if (fs.existsSync(fullPath)) {
              imageData = fs.readFileSync(fullPath);
            } else {
              throw new Error(`File not found: ${fullPath}`);
            }
          }
          
          // Calculate dimensions based on search wireframe aspect ratio (800x600 compressed from 1000x600)
          // Original aspect ratio is roughly 4:3, so use 450x338 (maintains 4:3 ratio)
          const searchWidth = 450;
          const searchHeight = 338;
          
          sections.push(new Paragraph({
            spacing: { after: 120 },
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: "png",
                data: imageData,
                transformation: {
                  width: searchWidth,
                  height: searchHeight
                }
              })
            ]
          }));
        } catch (error) {
          console.error('Error loading search wireframe:', error);
        }
      }
      
      // Add form wireframe if it exists
      if (formData.generatedWireframes.formWireframe) {
        sections.push(new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({
            text: "Wireframe 2: Formulario de Gestión",
            bold: true,
            size: 24,
            color: "0070C0",
            font: "Segoe UI Semilight"
          })]
        }));
        
        try {
          // Handle both base64 data URLs and file paths
          let imageData: Buffer;
          const formWireframePath = formData.generatedWireframes.formWireframe;
          
          if (formWireframePath.startsWith('data:image/')) {
            // Extract base64 data from data URL
            const base64Data = formWireframePath.split(',')[1];
            imageData = Buffer.from(base64Data, 'base64');
          } else {
            // Handle file path
            let filePath = formWireframePath;
            if (filePath.startsWith('/')) {
              filePath = filePath.substring(1);
            }
            const fullPath = path.join(process.cwd(), filePath);
            
            if (fs.existsSync(fullPath)) {
              imageData = fs.readFileSync(fullPath);
            } else {
              throw new Error(`File not found: ${fullPath}`);
            }
          }
          
          // Calculate dimensions based on form wireframe aspect ratio (600x800 compressed from 800x800)
          // Original aspect ratio is 1:1 (square), but compressed to maintain readability
          // Use same width as search but taller height to preserve form content
          const formWidth = 450;
          const formHeight = 450; // Square aspect ratio for form wireframes
          
          sections.push(new Paragraph({
            spacing: { after: 120 },
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: "png",
                data: imageData,
                transformation: {
                  width: formWidth,
                  height: formHeight
                }
              })
            ]
          }));
        } catch (error) {
          console.error('Error loading form wireframe:', error);
        }
      }
    }
    
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
            text: SpellChecker.correctAccents(String(formData.testCaseObjective || '')),
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
                text: SpellChecker.correctAccents(formattedText),
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
      
      // Test Cases Steps as bulleted list
      formData.testSteps.forEach((testStep: any, index: number) => {
        // Main bullet with step number
        sections.push(new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 120, after: 60 },
          children: [new TextRun({
            text: `Paso ${testStep.number || index + 1}`,
            bold: true,
            font: "Segoe UI Semilight",
            size: 22
          })]
        }));
        
        // Sub-bullets for each detail
        if (testStep.action) {
          sections.push(new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: "Acción: ",
                bold: true,
                font: "Segoe UI Semilight"
              }),
              new TextRun({
                text: SpellChecker.correctAccents(testStep.action),
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
        
        if (testStep.inputData) {
          sections.push(new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: "Datos de entrada: ",
                bold: true,
                font: "Segoe UI Semilight"
              }),
              new TextRun({
                text: SpellChecker.correctAccents(testStep.inputData),
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
        
        if (testStep.expectedResult) {
          sections.push(new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: "Resultado esperado: ",
                bold: true,
                font: "Segoe UI Semilight"
              }),
              new TextRun({
                text: SpellChecker.correctAccents(testStep.expectedResult),
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
        
        if (testStep.observations) {
          sections.push(new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: "Observaciones: ",
                bold: true,
                font: "Segoe UI Semilight"
              }),
              new TextRun({
                text: testStep.observations,
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
        
        // Estado - always show
        sections.push(new Paragraph({
          bullet: { level: 1 },
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: "Estado: ",
              bold: true,
              font: "Segoe UI Semilight"
            }),
            new TextRun({
              text: "Pendiente",
              font: "Segoe UI Semilight"
            })
          ]
        }));
      });
    }
    
    return sections;
  }
  
  private static parseHtmlContent(html: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    // Simple HTML parsing - extract text content
    // Remove HTML tags but preserve structure
    const cleanText = html
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<strong>/gi, '')
      .replace(/<\/strong>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
    
    // Split by newlines and create paragraphs
    const lines = cleanText.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        paragraphs.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: trimmedLine.startsWith('•') ? 288 : 0 },
          children: [new TextRun({
            text: SpellChecker.correctAccents(trimmedLine),
            font: "Segoe UI Semilight"
          })]
        }));
      }
    });
    
    return paragraphs;
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