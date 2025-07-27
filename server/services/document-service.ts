import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';

export class DocumentService {
  static async generateDocx(htmlContent: string, fileName: string): Promise<Buffer> {
    // Convert HTML to docx structure
    const paragraphs = this.parseHtmlToParagraphs(htmlContent);
    
    const doc = new Document({
      sections: [{
        properties: {},
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
}
