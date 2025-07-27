import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, NumberFormat, VerticalAlign, ShadingType } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentService {
  static async generateDocx(htmlContent: string, fileName: string, useCaseName: string = ''): Promise<Buffer> {
    // Convert HTML to docx structure
    const paragraphs = this.parseHtmlToParagraphs(htmlContent);
    
    // Add the mandatory history table at the end
    const historyTitle = new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: "HISTORIA DE REVISIONES Y APROBACIONES",
          bold: true,
          size: 32,
          color: "0070C0", // Blue color as specified
          font: "Segoe UI Semilight"
        })
      ]
    });
    
    const historyTable = this.createHistoryTable();
    paragraphs.push(historyTitle);
    paragraphs.push(historyTable);
    
    // Create header with Ingematica branding
    let headerContent: TextRun;
    try {
      const imagePath = path.join(process.cwd(), 'attached_assets', 'Encabezado_caso_de_uso.png');
      if (fs.existsSync(imagePath)) {
        // For now, use text until we resolve the image import issue
        headerContent = new TextRun({
          text: "INGEMATICA - Documentación de casos de uso",
          font: "Segoe UI Semilight",
          size: 24,
          color: "0070C0",
          bold: true
        });
      } else {
        headerContent = new TextRun({
          text: "INGEMATICA - Documentación de casos de uso",
          font: "Segoe UI Semilight",
          size: 24,
          color: "0070C0",
          bold: true
        });
      }
    } catch (error) {
      headerContent = new TextRun({
        text: "INGEMATICA - Documentación de casos de uso", 
        font: "Segoe UI Semilight",
        size: 24,
        color: "0070C0",
        bold: true
      });
    }
    
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [headerContent]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: "Página ",
                    font: "Segoe UI Semilight",
                    size: 20
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT]
                  }),
                  new TextRun({
                    text: " de ",
                    font: "Segoe UI Semilight",
                    size: 20
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES]
                  }),
                  new TextRun({
                    text: `${' '.repeat(50)}${useCaseName}`,
                    font: "Segoe UI Semilight",
                    size: 20
                  })
                ]
              })
            ]
          })
        },
        children: paragraphs
      }]
    });

    return await Packer.toBuffer(doc);
  }

  private static parseHtmlToParagraphs(htmlContent: string): (Paragraph | Table)[] {
    const result: (Paragraph | Table)[] = [];
    
    // Process content sequentially to maintain order
    const contentParts = htmlContent.split(/(<table[^>]*>.*?<\/table>)/gis);
    
    for (const part of contentParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      if (trimmed.match(/<table[^>]*>/i)) {
        // This is a table
        const table = this.parseHtmlTable(trimmed);
        if (table) {
          result.push(table);
        }
      } else {
        // This is regular content, process as before
        const elements = this.parseRegularContent(trimmed);
        result.push(...elements);
      }
    }
    
    return result;
  }

  private static parseRegularContent(content: string): Paragraph[] {
    const elements: Paragraph[] = [];
    
    // Clean content 
    const cleanContent = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split by major HTML tags while preserving structure
    const sections = cleanContent.split(/(<h[1-6][^>]*>.*?<\/h[1-6]>|<p[^>]*>.*?<\/p>|<li[^>]*>.*?<\/li>|<div[^>]*>.*?<\/div>)/gi)
      .filter(section => section.trim().length > 0);
    
    for (const section of sections) {
      const trimmed = section.trim();
      
      if (trimmed.match(/<h1[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
          elements.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text,
                bold: true,
                size: 32,
                color: "0070C0",
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
      } else if (trimmed.match(/<h2[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
          elements.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text,
                bold: true,
                size: 28,
                color: "0070C0",
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
      } else if (trimmed.match(/<h3[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
          elements.push(new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
              new TextRun({
                text,
                bold: true,
                size: 24,
                color: "0070C0",
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
      } else if (trimmed.match(/<h4[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
          elements.push(new Paragraph({
            heading: HeadingLevel.HEADING_4,
            children: [
              new TextRun({
                text,
                bold: true,
                size: 22,
                color: "0070C0",
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
      } else if (trimmed.match(/<li[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
          // Handle hierarchical numbering - improved based on feedback
          let bulletStyle = '• ';
          let indentLevel = 0;
          
          if (text.match(/^\d+\.\d+\.\d+/)) {
            // Third level (4.2.1)
            bulletStyle = '';
            indentLevel = 720; // 0.5 inch
          } else if (text.match(/^\d+\.\d+/)) {
            // Second level (4.2 Subflujo:)
            bulletStyle = '';
            indentLevel = 360; // 0.25 inch
          } else if (text.match(/^\d+\./)) {
            // First level (4.)
            bulletStyle = '';
            indentLevel = 0;
          } else if (text.match(/^[a-z]\./)) {
            bulletStyle = '';
            indentLevel = 360;
          } else if (text.match(/^[ivx]+\./)) {
            bulletStyle = '';
            indentLevel = 720;
          }
          
          elements.push(new Paragraph({
            indent: {
              left: indentLevel,
            },
            children: [
              new TextRun({
                text: bulletStyle + text,
                size: 22,
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
      } else if (trimmed.match(/<(p|div)[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text && text.length > 0) {
          elements.push(new Paragraph({
            children: [
              new TextRun({
                text,
                size: 22,
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
      } else if (!trimmed.match(/<[^>]+>/) && trimmed.length > 0) {
        // Plain text content (not HTML)
        elements.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: 22,
              font: "Segoe UI Semilight"
            })
          ]
        }));
      }
    }

    return elements;
  }

  private static extractTextContent(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
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
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: cellText,
                    bold: isHeader ? true : false,
                    font: "Segoe UI Semilight",
                    size: 20
                  })
                ]
              })
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
            },
            shading: isHeader ? {
              type: ShadingType.SOLID,
              color: "F5F5F5",
            } : undefined
          }));
        }

        if (cells.length > 0) {
          rows.push(new TableRow({ children: cells }));
        }
      }

      if (rows.length > 0) {
        return new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: rows
        });
      }

      return null;
    } catch (error) {
      console.error('Error parsing HTML table:', error);
      return null;
    }
  }
  
  private static createHistoryTable(): Table {
    const today = new Date().toLocaleDateString('es-ES');
    
    return new Table({
      width: {
        size: 2.17 * 1440, // Convert inches to twips (2.17 inches as specified)
        type: WidthType.DXA,
      },
      rows: [
        // Header row
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Fecha",
                      bold: true,
                      font: "Segoe UI Semilight",
                      size: 20
                    })
                  ]
                })
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Acción",
                      bold: true,
                      font: "Segoe UI Semilight",
                      size: 20
                    })
                  ]
                })
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Responsable",
                      bold: true,
                      font: "Segoe UI Semilight",
                      size: 20
                    })
                  ]
                })
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Comentario",
                      bold: true,
                      font: "Segoe UI Semilight",
                      size: 20
                    })
                  ]
                })
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              },
              width: {
                size: 40, // Larger width for comments column as specified
                type: WidthType.PERCENTAGE,
              }
            }),
          ],
        }),
        // Data row
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: today,
                      font: "Segoe UI Semilight",
                      size: 20
                    })
                  ]
                })
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: "Versión original",
                      font: "Segoe UI Semilight",
                      size: 20
                    })
                  ]
                })
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: "Sistema",
                      font: "Segoe UI Semilight",
                      size: 20
                    })
                  ]
                })
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: "Documento generado automáticamente",
                      font: "Segoe UI Semilight",
                      size: 20
                    })
                  ]
                })
              ],
              verticalAlign: VerticalAlign.CENTER,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "808080" },
              },
              width: {
                size: 40, // Larger width for comments column as specified
                type: WidthType.PERCENTAGE,
              }
            }),
          ],
        }),
      ],
    });
  }
}