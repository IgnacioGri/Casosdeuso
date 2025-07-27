import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, NumberFormat, VerticalAlign, ShadingType, ImageRun, Media } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentService {
  static async generateDocx(htmlContent: string, fileName: string, useCaseName: string = ''): Promise<Buffer> {
    // Convert HTML to docx structure
    const paragraphs = this.parseHtmlToParagraphs(htmlContent);
    
    // Add the mandatory history table at the end (only if not already present)
    const htmlContentLower = htmlContent.toLowerCase();
    const hasHistoryTitle = htmlContentLower.includes("historia de revisiones") || 
                           htmlContentLower.includes("historia de revisiones y aprobaciones");
    
    if (!hasHistoryTitle) {
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
    }
    
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
        
      // Remove duplicate "HISTORIA DE REVISIONES Y APROBACIONES" titles from HTML
      const historyPattern = /<h[1-6][^>]*>.*?HISTORIA DE REVISIONES Y APROBACIONES.*?<\/h[1-6]>/gi;
      const historyMatches = cleanContent.match(historyPattern);
      if (historyMatches && historyMatches.length > 1) {
        // Keep only the first occurrence, remove the rest
        for (let i = 1; i < historyMatches.length; i++) {
          cleanContent = cleanContent.replace(historyMatches[i], '');
        }
      }

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
    
    // Split content into logical blocks, preserving structure
    const blocks = content.split(/(<h[1-6][^>]*>.*?<\/h[1-6]>|<p[^>]*>.*?<\/p>|<ul[^>]*>.*?<\/ul>|<ol[^>]*>.*?<\/ol>|<li[^>]*>.*?<\/li>|<div[^>]*>.*?<\/div>)/gi)
      .filter(block => block.trim().length > 0);
    
    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      
      if (trimmed.match(/<h1[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
          result.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }, // Add spacing after headings
            children: [new TextRun({
              text,
              bold: true,
              size: 32,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }));
        }
      } else if (trimmed.match(/<h2[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
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
        }
      } else if (trimmed.match(/<h3[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
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
        }
      } else if (trimmed.match(/<h4[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
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
        }
      } else if (trimmed.match(/<(ul|ol)[^>]*>/i)) {
        // Process lists
        const listItems = trimmed.match(/<li[^>]*>.*?<\/li>/gi);
        if (listItems) {
          for (const item of listItems) {
            const text = this.extractTextContent(item);
            if (text) {
              result.push(this.createListItem(text));
            }
          }
        }
      } else if (trimmed.match(/<li[^>]*>/i)) {
        const text = this.extractTextContent(trimmed);
        if (text) {
          result.push(this.createListItem(text));
        }
      } else if (trimmed.match(/<p[^>]*>/i) || (!trimmed.match(/<[^>]+>/) && trimmed.length > 0)) {
        const text = this.extractTextContent(trimmed);
        if (text && text.length > 0) {
          result.push(new Paragraph({
            spacing: { after: 120 }, // Add spacing between paragraphs
            children: [new TextRun({
              text,
              size: 22,
              font: "Segoe UI Semilight"
            })]
          }));
        }
      }
    }
    
    return result;
  }

  private static createListItem(text: string): Paragraph {
    // Enhanced list item formatting with better indentation for Word compatibility
    let indentLevel = 0;
    let bulletPoint = '• ';
    
    // Detect hierarchical numbering patterns and apply proper Word-style indentation
    if (text.match(/^\d+\.\d+\.\d+/)) {
      indentLevel = 1080; // 0.75 inch for third level
      bulletPoint = '';
    } else if (text.match(/^\d+\.\d+/)) {
      indentLevel = 720; // 0.5 inch for second level  
      bulletPoint = '';
    } else if (text.match(/^\d+\./)) {
      indentLevel = 360; // 0.25 inch for first level
      bulletPoint = '';
    } else if (text.match(/^[a-z]\./)) {
      indentLevel = 720; // 0.5 inch for letter items
      bulletPoint = '';
    } else if (text.match(/^[ivx]+\./)) {
      indentLevel = 1080; // 0.75 inch for roman numerals
      bulletPoint = '';
    }
    
    return new Paragraph({
      indent: {
        left: indentLevel,
        firstLine: indentLevel > 0 ? -200 : 0 // Better hanging indent for Word
      },
      spacing: { after: 100 },
      alignment: AlignmentType.LEFT,
      children: [new TextRun({
        text: bulletPoint + text,
        size: 22,
        font: "Segoe UI Semilight"
      })]
    });
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
      } else {
        // Handle all other content as simple paragraphs
        const text = this.extractTextContent(trimmed);
        if (text && text.length > 0) {
          // Check for list items based on text patterns
          let indentLevel = 0;
          if (text.match(/^\d+\.\d+\.\d+/)) indentLevel = 720;
          else if (text.match(/^\d+\.\d+/)) indentLevel = 360;
          else if (text.match(/^[a-z]\./)) indentLevel = 360;
          else if (text.match(/^[ivx]+\./)) indentLevel = 720;
          
          elements.push(new Paragraph({
            indent: indentLevel > 0 ? { left: indentLevel } : undefined,
            children: [new TextRun({
              text,
              size: 22,
              font: "Segoe UI Semilight"
            })]
          }));
        }
      }
    }

    return elements;
  }

  private static extractTextContent(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
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