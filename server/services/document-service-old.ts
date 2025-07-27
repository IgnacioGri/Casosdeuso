import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, NumberFormat, VerticalAlign, ShadingType, ImageRun, Media } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentService {
  static async generateDocx(htmlContent: string, fileName: string, useCaseName: string = ''): Promise<Buffer> {
    // Convert HTML to docx structure
    const paragraphs = this.parseHtmlToParagraphs(htmlContent);
    
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
      // Fallback to text
      headerParagraphChildren = [new TextRun({
        text: "INGEMATICA - Documentación de casos de uso", 
        font: "Segoe UI Semilight",
        size: 24,
        color: "0070C0",
        bold: true
      })];
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
                children: headerParagraphChildren
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
      
      // Process content more carefully to preserve structure
      
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
      
      // Process remaining content by splitting into logical sections
      const elements = this.parseContentElements(cleanContent);
      result.push(...elements);
      
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

  private static parseContentElements(content: string): Paragraph[] {
    const result: Paragraph[] = [];
    
    // Use regex to find all elements including their indentation context
    const elementRegex = /(<[^>]+>[^<]*<\/[^>]+>|[^\r\n<]+)/g;
    const elements = content.match(elementRegex) || [];
    
    for (const element of elements) {
      const trimmed = element.trim();
      if (!trimmed) continue;
      
      const text = this.extractTextContent(trimmed);
      if (!text) continue;
      
      // Handle headings
      if (trimmed.match(/<h[1-4][^>]*>/i)) {
        const level = parseInt(trimmed.match(/<h([1-4])/i)?.[1] || '1');
        result.push(new Paragraph({
          heading: level === 1 ? HeadingLevel.HEADING_1 : 
                   level === 2 ? HeadingLevel.HEADING_2 :
                   level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
          spacing: { before: level > 1 ? 240 : 0, after: 200 },
          children: [new TextRun({
            text,
            bold: true,
            size: level === 1 ? 32 : level === 2 ? 28 : level === 3 ? 24 : 22,
            color: "0070C0",
            font: "Segoe UI Semilight"
          })]
        }));
        continue;
      }
      
      // Detect hierarchical list items based on actual HTML structure
      let indentLevel = 0;
      let isListItem = false;
      
      // Check for numbered patterns (1., 2., etc) 
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
      // Check if the original HTML had indentation (common pattern)
      else if (trimmed.includes('margin-left') || trimmed.includes('padding-left')) {
        const marginMatch = trimmed.match(/margin-left:\s*(\d+)/);
        const paddingMatch = trimmed.match(/padding-left:\s*(\d+)/);
        if (marginMatch || paddingMatch) {
          const pixels = parseInt(marginMatch?.[1] || paddingMatch?.[1] || '0');
          indentLevel = Math.min(1440, pixels * 0.75); // Convert pixels to reasonable indent
          isListItem = true;
        }
      }
      
      if (isListItem) {
        result.push(new Paragraph({
          indent: {
            left: indentLevel,
            hanging: 360 // Hanging indent for numbered lists
          },
          spacing: { after: 120 },
          children: [new TextRun({
            text,
            size: 22,
            font: "Segoe UI Semilight"
          })]
        }));
      } else {
        // Regular paragraph
        result.push(new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({
            text,
            size: 22,
            font: "Segoe UI Semilight"
          })]
        }));
      }
    }
    
    return result;
  }

  private static createListItem(text: string): Paragraph {
    // Word-compatible hierarchical list formatting to match HTML indentation
    let indentLevel = 0;
    let tabStops: any[] = [];
    
    // Detect hierarchical numbering patterns exactly like HTML shows
    if (text.match(/^\d+\.\d+\.\d+/)) {
      // Third level (like "1.2.3") - deepest indent
      indentLevel = 1440; // 1 inch
      tabStops = [{ position: 1440, leader: "none" }];
    } else if (text.match(/^\d+\.\d+/)) {
      // Second level (like "1.2") - medium indent  
      indentLevel = 1080; // 0.75 inch
      tabStops = [{ position: 1080, leader: "none" }];
    } else if (text.match(/^\d+\./)) {
      // First level (like "1.") - base indent
      indentLevel = 720; // 0.5 inch
      tabStops = [{ position: 720, leader: "none" }];
    } else if (text.match(/^[a-z]\./)) {
      // Letter sublevel (like "a.") - same as second level
      indentLevel = 1080; // 0.75 inch
      tabStops = [{ position: 1080, leader: "none" }];
    } else if (text.match(/^[ivx]+\./)) {
      // Roman numeral sublevel (like "i.") - deepest
      indentLevel = 1440; // 1 inch
      tabStops = [{ position: 1440, leader: "none" }];
    }
    
    return new Paragraph({
      indent: {
        left: indentLevel,
        hanging: 360 // Proper hanging indent for numbered lists
      },
      tabStops: tabStops,
      spacing: { after: 120 },
      alignment: AlignmentType.JUSTIFIED,
      children: [new TextRun({
        text: text,
        size: 22,
        font: "Segoe UI Semilight"
      })]
    });
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