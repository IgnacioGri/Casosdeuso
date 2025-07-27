import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, NumberFormat, VerticalAlign, ShadingType, ImageRun } from 'docx';
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
    
    // Create header with image
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
    const elements: (Paragraph | Table)[] = [];
    
    // Improved HTML parsing to handle more content
    const lines = htmlContent.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('<h1')) {
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
      } else if (trimmed.startsWith('<h2')) {
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
      } else if (trimmed.startsWith('<h3')) {
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
      } else if (trimmed.startsWith('<h4')) {
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
      } else if (trimmed.startsWith('<p') || trimmed.startsWith('<div')) {
        const text = this.extractTextContent(trimmed);
        if (text) {
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
      } else if (trimmed.startsWith('<li')) {
        const text = this.extractTextContent(trimmed);
        if (text) {
          elements.push(new Paragraph({
            children: [
              new TextRun({
                text: `• ${text}`,
                size: 22,
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
      } else if (trimmed.startsWith('<ol') || trimmed.startsWith('<ul')) {
        // Skip list containers
        continue;
      } else if (trimmed.startsWith('<table')) {
        // Create the revision table
        const table = new Table({
          width: {
            size: 2.17 * 1440, // Convert inches to twips
            type: WidthType.DXA,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "Fecha", alignment: AlignmentType.CENTER })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                  }
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Acción", alignment: AlignmentType.CENTER })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                  }
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Responsable", alignment: AlignmentType.CENTER })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                  }
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Comentario", alignment: AlignmentType.CENTER })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                  }
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "26/7/2025" })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                  }
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Versión original" })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                  }
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Sistema" })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                  }
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Documento generado automáticamente" })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
                  }
                }),
              ],
            }),
          ],
        });
        elements.push(table);
      } else if (trimmed && !trimmed.startsWith('<') && !trimmed.startsWith('</')) {
        // Plain text content that might have been missed
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
