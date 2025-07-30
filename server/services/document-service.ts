import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, NumberFormat, VerticalAlign, ShadingType, ImageRun, Media } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentService {
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
      // Clean the HTML content properly and remove duplicated history sections
      let cleanContent = htmlContent
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<!--.*?-->/gi, '')
        .replace(/<\/?(?:html|head|body|meta|link|title)[^>]*>/gi, '')
        .trim();
        
      // Remove all existing "HISTORIA DE REVISIONES Y APROBACIONES" content to avoid duplicates
      cleanContent = cleanContent.replace(/<h[1-6][^>]*>.*?HISTORIA DE REVISIONES Y APROBACIONES.*?<\/h[1-6]>/gi, '');
      cleanContent = cleanContent.replace(/<table[^>]*>[\s\S]*?HISTORIA DE REVISIONES[\s\S]*?<\/table>/gi, '');

      const result: (Paragraph | Table)[] = [];
      
      // Extract and process tables first
      const tableMatches = cleanContent.match(/<table[^>]*>.*?<\/table>/gi);
      if (tableMatches) {
        for (const tableHtml of tableMatches) {
          const table = this.parseHtmlTable(tableHtml);
          if (table) {
            result.push(table);
          }
        }
        // Remove processed tables from content
        for (const tableHtml of tableMatches) {
          cleanContent = cleanContent.replace(tableHtml, '');
        }
      }
      
      // Process remaining content by lines to preserve indentation
      const lines = cleanContent.split(/\n+/);
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        const text = this.extractTextContent(trimmed);
        if (!text) continue;
        
        // Handle headings - check if this line might be a title even without h tags
        if (trimmed.match(/<h1[^>]*>/i) || (text && text.match(/^(Gestionar|Crear|Administrar|Configurar).*/i) && !trimmed.match(/<[^>]+>/))) {
          result.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
            children: [new TextRun({
              text,
              bold: true,
              size: 32,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }));
        } else if (trimmed.match(/<h2[^>]*>/i) || (text && text.match(/^(Descripción|Flujo Principal|Reglas de Negocio|Requerimientos|Precondiciones|Postcondiciones|Boceto)/i))) {
          result.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({
              text,
              bold: true,
              size: 28,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }));
        } else if (trimmed.match(/<h3[^>]*>/i)) {
          result.push(new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({
              text,
              bold: true,
              size: 24,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }));
        } else if (trimmed.match(/<h4[^>]*>/i)) {
          result.push(new Paragraph({
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 120, after: 80 },
            children: [new TextRun({
              text,
              bold: true,
              size: 22,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }));
        } else {
          // Create hierarchical list items based on text patterns
          let indentLevel = 0;
          let isListItem = false;
          
          // Detect numbered patterns (1., 2., etc) 
          if (text.match(/^\d+\./)) {
            indentLevel = 720; // 0.5 inch for first level
            isListItem = true;
          }
          // Check for letter patterns (a., b., etc) - second level
          else if (text.match(/^[a-z]\./)) {
            indentLevel = 1080; // 0.75 inch for second level
            isListItem = true;
          }
          // Check for roman numeral patterns (i., ii., etc) - third level
          else if (text.match(/^[ivx]+\./)) {
            indentLevel = 1440; // 1 inch for third level
            isListItem = true;
          }
          
          if (isListItem) {
            result.push(new Paragraph({
              indent: {
                left: indentLevel,
                hanging: 360 // Hanging indent for numbered lists
              },
              spacing: { after: 120 },
              children: this.parseFormattedText(trimmed)
            }));
          } else {
            // Regular paragraph
            result.push(new Paragraph({
              spacing: { after: 120 },
              children: this.parseFormattedText(trimmed)
            }));
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error parsing HTML content:', error);
      const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      return [new Paragraph({
        children: [new TextRun({
          text: textContent,
          font: "Segoe UI Semilight",
          size: 22
        })]
      })];
    }
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