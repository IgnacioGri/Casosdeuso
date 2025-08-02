using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using UseCaseGenerator.Shared.Models;
using System.Text.RegularExpressions;
using A = DocumentFormat.OpenXml.Drawing;
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;

namespace UseCaseGenerator.Server.Services;

public class DocumentService : IDocumentService
{
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(ILogger<DocumentService> logger)
    {
        _logger = logger;
    }

    public byte[] GenerateDocx(string htmlContent, UseCase useCase, string? customHeaderImage = null)
    {
        // Generate directly from UseCase properties
        return GenerateDocxFromFormData(useCase);
    }
    
    private byte[] GenerateDocxFromFormData(UseCase useCase)
    {
        try
        {
            using var ms = new MemoryStream();
            using (var document = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document))
            {
                var mainPart = document.AddMainDocumentPart();
                mainPart.Document = new Document();
                
                // Add header with ING logo or custom image
                AddHeaderWithImage(mainPart, customHeaderImage);
                
                // Add footer with page numbering
                AddFooterWithPageNumbers(mainPart, useCase);
                
                var body = mainPart.Document.AppendChild(new Body());

                // Title
                var titlePara = body.AppendChild(new Paragraph());
                var titleRun = titlePara.AppendChild(new Run());
                titleRun.AppendChild(new Text("ESPECIFICACIÓN DE CASO DE USO"));
                ApplyHeadingStyle(titleRun, 48, true);

                // Project Information Section
                AddSectionHeading(body, "Información del Proyecto");
                AddBulletPoint(body, "Cliente", useCase.ClientName);
                AddBulletPoint(body, "Proyecto", useCase.ProjectName);
                AddBulletPoint(body, "Código", useCase.UseCaseCode);
                AddBulletPoint(body, "Archivo", useCase.FileName);

                // Use Case Description Section
                AddSectionHeading(body, "Descripción del Caso de Uso");
                AddBulletPoint(body, "Nombre", useCase.UseCaseName);
                AddBulletPoint(body, "Tipo", useCase.UseCaseType == UseCaseType.Entity ? "Gestión de Entidades" : useCase.UseCaseType.ToString());
                AddBulletPoint(body, "Descripción", useCase.Description);

                // Add remaining sections based on form data
                AddFormDataSections(body, useCase);

                // Add revision history table
                AddRevisionHistoryTable(body, useCase);
                
                // Add section properties at the END to link header and footer
                var sectionProps = new SectionProperties();
                var headerReference = new HeaderReference() { Type = HeaderFooterValues.Default, Id = "headerId1" };
                var footerReference = new FooterReference() { Type = HeaderFooterValues.Default, Id = "footerId1" };
                sectionProps.Append(headerReference);
                sectionProps.Append(footerReference);
                
                // Add page margins with header margin from top (0.6 cm = 340 DOCX units)
                sectionProps.Append(new PageMargin() 
                { 
                    Top = 1440,      // 1 inch = 1440 DOCX units
                    Right = 1440, 
                    Bottom = 1440, 
                    Left = 1440,
                    Header = 340     // 0.6 cm = 340 DOCX units (1 cm = 567 DOCX units)
                });
                
                // IMPORTANT: Section properties must be the last element in the body
                body.Append(sectionProps);

                mainPart.Document.Save();
            }

            return ms.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating DOCX from form data");
            throw;
        }
    }

    public string ConvertToHtml(string content)
    {
        // Convert any markdown or other formats to clean HTML
        return content;
    }

    private void AddHeader(Body body, UseCase useCase)
    {
        // Add ING-style header
        var headerPara = new Paragraph();
        var headerRun = headerPara.AppendChild(new Run());
        headerRun.AppendChild(new Text($"CASO DE USO: {useCase.UseCaseName}"));
        
        var headerProps = headerRun.AppendChild(new RunProperties());
        headerProps.AppendChild(new Bold());
        headerProps.AppendChild(new FontSize() { Val = "24" });
        headerProps.AppendChild(new Color() { Val = "0070C0" }); // ING Blue

        body.AppendChild(headerPara);
    }

    private void ConvertHtmlToWord(string htmlContent, Body body)
    {
        // Simple HTML to Word conversion
        // This is a basic implementation - the full version would handle complex HTML
        var lines = htmlContent.Split('\n');
        
        foreach (var line in lines)
        {
            var cleanLine = Regex.Replace(line, "<[^>]+>", "").Trim();
            if (!string.IsNullOrEmpty(cleanLine))
            {
                var para = new Paragraph();
                var run = para.AppendChild(new Run());
                run.AppendChild(new Text(cleanLine));
                body.AppendChild(para);
            }
        }
    }

    private string ToRomanNumeral(int number)
    {
        var romanNumerals = new[] 
        { 
            "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
            "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx"
        };
        return number > 0 && number <= 20 ? romanNumerals[number - 1] : number.ToString();
    }

    private void AddFormDataSections(Body body, UseCase useCase)
    {
        // Use properties directly from UseCase model

        // Main Flow (Flujo Principal) - for entity use cases
        if (useCase.UseCaseType == "entity")
        {
            // Use styled heading for consistency
            AddStyledHeading(body, "FLUJO PRINCIPAL DE EVENTOS");
            
            // 1. Buscar datos de la entidad
            var searchPara = body.AppendChild(new Paragraph());
            var searchParaProps = searchPara.AppendChild(new ParagraphProperties());
            searchParaProps.AppendChild(new SpacingBetweenLines() { After = "80" });
            var searchRun = searchPara.AppendChild(new Run());
            searchRun.AppendChild(new Text("1. Buscar datos de la entidad"));
            var searchRunProps = searchRun.AppendChild(new RunProperties());
            searchRunProps.AppendChild(new Bold());
            searchRunProps.AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
            
            if (useCase.SearchFilters?.Any() == true)
            {
                var para = body.AppendChild(new Paragraph());
                var paraProps = para.AppendChild(new ParagraphProperties());
                paraProps.AppendChild(new SpacingBetweenLines() { After = "60" });
                paraProps.AppendChild(new Indentation() { Left = "288" }); // 0.2 inch = 288 twips
                var run = para.AppendChild(new Run());
                run.AppendChild(new Text($"a. Filtros de búsqueda disponibles: {string.Join(", ", useCase.SearchFilters)}"));
                run.AppendChild(new RunProperties()).AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
            }
            
            if (useCase.ResultColumns?.Any() == true)
            {
                var para = body.AppendChild(new Paragraph());
                var paraProps = para.AppendChild(new ParagraphProperties());
                paraProps.AppendChild(new SpacingBetweenLines() { After = "120" });
                paraProps.AppendChild(new Indentation() { Left = "288" }); // 0.2 inch
                var run = para.AppendChild(new Run());
                run.AppendChild(new Text($"b. Columnas del resultado de búsqueda: {string.Join(", ", useCase.ResultColumns)}"));
                run.AppendChild(new RunProperties()).AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
            }
            
            // 2. Agregar una nueva entidad
            var createPara = body.AppendChild(new Paragraph());
            var createParaProps = createPara.AppendChild(new ParagraphProperties());
            createParaProps.AppendChild(new SpacingBetweenLines() { Before = "80", After = "80" });
            var createRun = createPara.AppendChild(new Run());
            createRun.AppendChild(new Text("2. Agregar una nueva entidad"));
            var createRunProps = createRun.AppendChild(new RunProperties());
            createRunProps.AppendChild(new Bold());
            createRunProps.AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
            
            if (useCase.EntityFields?.Any() == true)
            {
                // a. Datos de la entidad
                var fieldsHeaderPara = body.AppendChild(new Paragraph());
                var fieldsHeaderProps = fieldsHeaderPara.AppendChild(new ParagraphProperties());
                fieldsHeaderProps.AppendChild(new SpacingBetweenLines() { After = "60" });
                fieldsHeaderProps.AppendChild(new Indentation() { Left = "288" });
                var fieldsHeaderRun = fieldsHeaderPara.AppendChild(new Run());
                fieldsHeaderRun.AppendChild(new Text("a. Datos de la entidad:"));
                fieldsHeaderRun.AppendChild(new RunProperties()).AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });

                // Roman numeral fields listing
                int fieldIndex = 0;
                foreach (var field in useCase.EntityFields)
                {
                    var fieldPara = body.AppendChild(new Paragraph());
                    var fieldProps = fieldPara.AppendChild(new ParagraphProperties());
                    fieldProps.AppendChild(new SpacingBetweenLines() { After = "40" });
                    fieldProps.AppendChild(new Indentation() { Left = "576" }); // 0.4 inch for roman numerals
                    var fieldRun = fieldPara.AppendChild(new Run());
                    var fieldText = $"{ToRomanNumeral(++fieldIndex)}. {field.Name} ({field.Type}{(field.Length.HasValue ? $", {field.Length}" : "")}{(field.Mandatory ? ", obligatorio" : ", opcional")})";
                    if (!string.IsNullOrEmpty(field.Description))
                        fieldText += $" - {field.Description}";
                    fieldRun.AppendChild(new Text(fieldText));
                    fieldRun.AppendChild(new RunProperties()).AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
                }
            }
            
            // b. Auto-registration
            var auditPara = body.AppendChild(new Paragraph());
            var auditParaProps = auditPara.AppendChild(new ParagraphProperties());
            auditParaProps.AppendChild(new SpacingBetweenLines() { After = "120", Before = "60" });
            auditParaProps.AppendChild(new Indentation() { Left = "288" });
            var auditRun = auditPara.AppendChild(new Run());
            auditRun.AppendChild(new Text("b. Al agregar se registra automáticamente la fecha y usuario de alta"));
            auditRun.AppendChild(new RunProperties()).AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        }

        // Business Rules
        if (!string.IsNullOrEmpty(useCase.BusinessRules))
        {
            AddSectionHeading(body, "Reglas de Negocio");
            var rules = useCase.BusinessRules.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            for (int i = 0; i < rules.Length; i++)
            {
                AddNumberedItem(body, $"{i + 1}. {rules[i].Trim()}");
            }
        }

        // Search Filters (for entity use cases)
        if (useCase.SearchFilters?.Any() == true)
        {
            AddSectionHeading(body, "Filtros de Búsqueda");
            foreach (var filter in useCase.SearchFilters)
            {
                AddBulletItem(body, filter);
            }
        }

        // Result Columns (for entity use cases)
        if (useCase.ResultColumns?.Any() == true)
        {
            AddSectionHeading(body, "Columnas de Resultado");
            foreach (var column in useCase.ResultColumns)
            {
                AddBulletItem(body, column);
            }
        }

        // Entity Fields (for entity use cases)
        if (useCase.EntityFields?.Any() == true)
        {
            AddSectionHeading(body, "Campos de Entidad");
            AddEntityFieldsTable(body, useCase.EntityFields);
        }
        
        // Special Requirements
        if (!string.IsNullOrEmpty(useCase.SpecialRequirements))
        {
            AddSectionHeading(body, "Requerimientos Especiales");
            AddParagraph(body, useCase.SpecialRequirements);
        }

        // Preconditions (for entity use cases)
        if (useCase.UseCaseType == "entity")
        {
            AddStyledHeading(body, "PRECONDICIONES");
            var preconditionsText = useCase.Preconditions ?? "El usuario debe estar autenticado en el sistema y tener los permisos necesarios para acceder a este caso de uso.";
            AddParagraph(body, preconditionsText);
        }

        // Postconditions (for entity use cases)
        if (useCase.UseCaseType == "entity")
        {
            AddStyledHeading(body, "POSTCONDICIONES");
            var postconditionsText = useCase.Postconditions ?? "Los datos de la entidad quedan actualizados en el sistema y se registra la auditoría correspondiente.";
            AddParagraph(body, postconditionsText);
        }

        // Wireframes Section - Add generated wireframe images if they exist
        if (useCase.GenerateWireframes && useCase.GeneratedWireframes != null)
        {
            AddStyledHeading(body, "BOCETOS GRÁFICOS DE INTERFAZ DE USUARIO");
            
            // Add search wireframe if it exists
            if (!string.IsNullOrEmpty(useCase.GeneratedWireframes.SearchWireframe))
            {
                var wireframeTitlePara1 = body.AppendChild(new Paragraph());
                var wireframeTitleProps1 = wireframeTitlePara1.AppendChild(new ParagraphProperties());
                wireframeTitleProps1.AppendChild(new SpacingBetweenLines() { Before = "120", After = "60" });
                var wireframeTitleRun1 = wireframeTitlePara1.AppendChild(new Run());
                var wireframeTitleRunProps1 = wireframeTitleRun1.AppendChild(new RunProperties());
                wireframeTitleRunProps1.AppendChild(new Bold());
                wireframeTitleRunProps1.AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
                wireframeTitleRunProps1.AppendChild(new Color() { Val = "0070C0" });
                wireframeTitleRunProps1.AppendChild(new FontSize() { Val = "24" });
                wireframeTitleRun1.AppendChild(new Text("Wireframe 1: Interfaz de Búsqueda"));
                
                // Try to add the search wireframe image
                try
                {
                    var searchWireframePath = useCase.GeneratedWireframes.SearchWireframe;
                    if (searchWireframePath.StartsWith("/"))
                        searchWireframePath = searchWireframePath.Substring(1);
                    
                    var searchImagePath = Path.Combine(Directory.GetCurrentDirectory(), searchWireframePath);
                    if (File.Exists(searchImagePath))
                    {
                        AddWireframeImage(body, mainPart, searchImagePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error loading search wireframe");
                }
            }
            
            // Add form wireframe if it exists
            if (!string.IsNullOrEmpty(useCase.GeneratedWireframes.FormWireframe))
            {
                var wireframeTitlePara2 = body.AppendChild(new Paragraph());
                var wireframeTitleProps2 = wireframeTitlePara2.AppendChild(new ParagraphProperties());
                wireframeTitleProps2.AppendChild(new SpacingBetweenLines() { Before = "120", After = "60" });
                var wireframeTitleRun2 = wireframeTitlePara2.AppendChild(new Run());
                var wireframeTitleRunProps2 = wireframeTitleRun2.AppendChild(new RunProperties());
                wireframeTitleRunProps2.AppendChild(new Bold());
                wireframeTitleRunProps2.AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
                wireframeTitleRunProps2.AppendChild(new Color() { Val = "0070C0" });
                wireframeTitleRunProps2.AppendChild(new FontSize() { Val = "24" });
                wireframeTitleRun2.AppendChild(new Text("Wireframe 2: Formulario de Gestión"));
                
                // Try to add the form wireframe image
                try
                {
                    var formWireframePath = useCase.GeneratedWireframes.FormWireframe;
                    if (formWireframePath.StartsWith("/"))
                        formWireframePath = formWireframePath.Substring(1);
                    
                    var formImagePath = Path.Combine(Directory.GetCurrentDirectory(), formWireframePath);
                    if (File.Exists(formImagePath))
                    {
                        AddWireframeImage(body, mainPart, formImagePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error loading form wireframe");
                }
            }
        }

        // Test Cases Section
        if (useCase.GenerateTestCase && useCase.TestSteps?.Any() == true)
        {
            AddStyledHeading(body, "CASOS DE PRUEBA");

            // Objective
            if (!string.IsNullOrEmpty(useCase.TestCaseObjective))
            {
                AddSubHeading(body, "Objetivo:");
                AddParagraph(body, useCase.TestCaseObjective);
            }

            // Preconditions
            if (!string.IsNullOrEmpty(useCase.TestCasePreconditions))
            {
                AddSubHeading(body, "Precondiciones:");
                AddParagraph(body, useCase.TestCasePreconditions);
            }

            // Test Steps Table
            AddSubHeading(body, "Pasos de Prueba:");
            AddTestCasesTable(body, useCase.TestSteps);
        }
    }

    private void AddStyledHeading(Body body, string text)
    {
        var para = body.AppendChild(new Paragraph());
        var paraProps = para.AppendChild(new ParagraphProperties());
        
        // Add borders - blue bottom and left
        var paraBorders = new ParagraphBorders();
        paraBorders.Append(new BottomBorder() { Val = BorderValues.Single, Color = "006BB6", Size = 8, Space = 1 });
        paraBorders.Append(new LeftBorder() { Val = BorderValues.Single, Color = "006BB6", Size = 8, Space = 1 });
        paraProps.Append(paraBorders);
        
        // Add spacing
        paraProps.Append(new SpacingBetweenLines() { Before = "240", After = "240" });
        paraProps.Append(new Indentation() { Left = "120" }); // 0.21 cm
        paraProps.Append(new KeepNext());
        paraProps.Append(new KeepLines());
        
        var run = para.AppendChild(new Run());
        var runProps = run.AppendChild(new RunProperties());
        runProps.Append(new Bold());
        runProps.Append(new FontSize() { Val = "24" }); // 12pt
        runProps.Append(new Color() { Val = "006BB6" }); // ING Blue
        runProps.Append(new RunFonts() { Ascii = "Segoe UI", HighAnsi = "Segoe UI" });
        run.AppendChild(new Text(text.ToUpper())); // Convert to uppercase
    }
    
    private void AddSectionHeading(Body body, string text, bool isLarge = false)
    {
        var para = body.AppendChild(new Paragraph());
        para.AppendChild(new ParagraphProperties()).AppendChild(new SpacingBetweenLines() 
        { 
            Before = isLarge ? "400" : "240", 
            After = "120" 
        });
        
        var run = para.AppendChild(new Run());
        run.AppendChild(new Text(text));
        ApplyHeadingStyle(run, isLarge ? 28 : 28, true);
    }

    private void AddSubHeading(Body body, string text)
    {
        var para = body.AppendChild(new Paragraph());
        para.AppendChild(new ParagraphProperties()).AppendChild(new SpacingBetweenLines() 
        { 
            Before = "120", 
            After = "80" 
        });
        
        var run = para.AppendChild(new Run());
        run.AppendChild(new Text(text));
        ApplyHeadingStyle(run, 24, true);
    }

    private void AddBulletPoint(Body body, string label, string value)
    {
        var para = body.AppendChild(new Paragraph());
        para.AppendChild(new ParagraphProperties()).AppendChild(new SpacingBetweenLines() { After = "120" });
        
        var run = para.AppendChild(new Run());
        run.AppendChild(new Text("• "));
        
        var boldRun = para.AppendChild(new Run());
        boldRun.AppendChild(new Text($"{label}: "));
        boldRun.AppendChild(new RunProperties()).AppendChild(new Bold());
        
        var valueRun = para.AppendChild(new Run());
        valueRun.AppendChild(new Text(value ?? ""));
    }

    private void AddBulletItem(Body body, string text)
    {
        var para = body.AppendChild(new Paragraph());
        var paraProps = para.AppendChild(new ParagraphProperties());
        paraProps.AppendChild(new SpacingBetweenLines() { After = "80" });
        paraProps.AppendChild(new Indentation() { Left = "720" });
        
        var run = para.AppendChild(new Run());
        run.AppendChild(new Text($"• {text}"));
    }

    private void AddNumberedItem(Body body, string text, bool bold = false)
    {
        var para = body.AppendChild(new Paragraph());
        var paraProps = para.AppendChild(new ParagraphProperties());
        paraProps.AppendChild(new SpacingBetweenLines() { Before = bold ? "80" : "0", After = bold ? "120" : "80" });
        paraProps.AppendChild(new Indentation() { Left = "720" });
        
        var run = para.AppendChild(new Run());
        run.AppendChild(new Text(text));
        if (bold)
        {
            run.AppendChild(new RunProperties()).AppendChild(new Bold());
        }
    }

    private void AddIndentedBullet(Body body, string label, string value)
    {
        var para = body.AppendChild(new Paragraph());
        var paraProps = para.AppendChild(new ParagraphProperties());
        paraProps.AppendChild(new SpacingBetweenLines() { After = "80" });
        paraProps.AppendChild(new Indentation() { Left = "1440" }); // Double indent
        
        var run = para.AppendChild(new Run());
        run.AppendChild(new Text("• "));
        
        var boldRun = para.AppendChild(new Run());
        boldRun.AppendChild(new Text($"{label}: "));
        boldRun.AppendChild(new RunProperties()).AppendChild(new Bold());
        
        var valueRun = para.AppendChild(new Run());
        valueRun.AppendChild(new Text(value));
    }

    private void AddParagraph(Body body, string text, bool bold = false)
    {
        var para = body.AppendChild(new Paragraph());
        para.AppendChild(new ParagraphProperties()).AppendChild(new SpacingBetweenLines() { After = "120" });
        var run = para.AppendChild(new Run());
        run.AppendChild(new Text(text));
        if (bold)
        {
            run.AppendChild(new RunProperties()).AppendChild(new Bold());
        }
    }

    private void ApplyHeadingStyle(Run run, int fontSize, bool bold)
    {
        var runProps = run.AppendChild(new RunProperties());
        if (bold) runProps.AppendChild(new Bold());
        runProps.AppendChild(new FontSize() { Val = fontSize.ToString() });
        runProps.AppendChild(new Color() { Val = "0070C0" }); // ING Blue
        runProps.AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
    }

    private void AddTestCasesTable(Body body, List<TestStep> testSteps)
    {
        var table = new Table();
        
        // Table properties
        var tblPr = new TableProperties();
        tblPr.Append(new TableWidth() { Width = "9800", Type = TableWidthUnitValues.Dxa });
        tblPr.Append(new TableBorders(
            new TopBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new BottomBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new LeftBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new RightBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new InsideHorizontalBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new InsideVerticalBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 }
        ));
        table.Append(tblPr);
        
        // Header row
        var headerRow = new TableRow();
        
        // # column
        var cell1 = new TableCell();
        cell1.Append(new TableCellProperties(
            new TableCellWidth() { Width = "600", Type = TableWidthUnitValues.Dxa },
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        var para1 = new Paragraph();
        var paraProps1 = new ParagraphProperties();
        paraProps1.Append(new Justification() { Val = JustificationValues.Center });
        para1.Append(paraProps1);
        var run1 = new Run();
        var runProps1 = new RunProperties();
        runProps1.Append(new Bold());
        runProps1.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        run1.Append(runProps1);
        run1.Append(new Text("#"));
        para1.Append(run1);
        cell1.Append(para1);
        headerRow.Append(cell1);
        
        // Acción column
        var cell2 = CreateHeaderCell("Acción", "2500");
        headerRow.Append(cell2);
        
        // Datos de entrada column
        var cell3 = CreateHeaderCell("Datos de entrada", "2000");
        headerRow.Append(cell3);
        
        // Resultado esperado column
        var cell4 = CreateHeaderCell("Resultado esperado", "2500");
        headerRow.Append(cell4);
        
        // Observaciones column
        var cell5 = CreateHeaderCell("Observaciones", "1500");
        headerRow.Append(cell5);
        
        // Estado (P/F) column
        var cell6 = CreateHeaderCell("Estado\n(P/F)", "700");
        headerRow.Append(cell6);
        
        table.Append(headerRow);
        
        // Data rows
        foreach (var step in testSteps)
        {
            var row = new TableRow();
            
            // # cell
            row.Append(CreateDataCell(step.Number.ToString(), "600", true));
            
            // Acción cell
            row.Append(CreateDataCell(step.Action, "2500"));
            
            // Datos de entrada cell
            row.Append(CreateDataCell(step.InputData, "2000"));
            
            // Resultado esperado cell
            row.Append(CreateDataCell(step.ExpectedResult, "2500"));
            
            // Observaciones cell
            row.Append(CreateDataCell(step.Observations, "1500"));
            
            // Estado cell
            row.Append(CreateDataCell("Pendiente", "700", true));
            
            table.Append(row);
        }
        
        body.Append(table);
        
        // Add spacing after table
        var spacingPara = new Paragraph();
        var spacingProps = new ParagraphProperties();
        spacingProps.Append(new SpacingBetweenLines() { After = "240" });
        spacingPara.Append(spacingProps);
        body.Append(spacingPara);
    }
    
    private TableCell CreateHeaderCell(string text, string width)
    {
        var cell = new TableCell();
        cell.Append(new TableCellProperties(
            new TableCellWidth() { Width = width, Type = TableWidthUnitValues.Dxa },
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        
        var para = new Paragraph();
        var paraProps = new ParagraphProperties();
        paraProps.Append(new Justification() { Val = JustificationValues.Center });
        para.Append(paraProps);
        
        var run = new Run();
        var runProps = new RunProperties();
        runProps.Append(new Bold());
        runProps.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        run.Append(runProps);
        run.Append(new Text(text));
        para.Append(run);
        cell.Append(para);
        
        return cell;
    }
    
    private TableCell CreateDataCell(string text, string width, bool center = false)
    {
        var cell = new TableCell();
        cell.Append(new TableCellProperties(
            new TableCellWidth() { Width = width, Type = TableWidthUnitValues.Dxa }
        ));
        
        var para = new Paragraph();
        if (center)
        {
            var paraProps = new ParagraphProperties();
            paraProps.Append(new Justification() { Val = JustificationValues.Center });
            para.Append(paraProps);
        }
        
        var run = new Run();
        var runProps = new RunProperties();
        runProps.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        run.Append(runProps);
        run.Append(new Text(text ?? ""));
        para.Append(run);
        cell.Append(para);
        
        return cell;
    }

    private void AddEntityFieldsTable(Body body, List<EntityField> entityFields)
    {
        var table = new Table();
        
        // Table properties
        var tblPr = new TableProperties();
        tblPr.Append(new TableWidth() { Width = "9800", Type = TableWidthUnitValues.Dxa });
        tblPr.Append(new TableBorders(
            new TopBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new BottomBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new LeftBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new RightBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new InsideHorizontalBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 },
            new InsideVerticalBorder() { Val = BorderValues.Single, Color = "999999", Size = 4 }
        ));
        table.Append(tblPr);
        
        // Header row
        var headerRow = new TableRow();
        
        // Nombre column
        var nameCell = new TableCell();
        nameCell.Append(new TableCellProperties(
            new TableCellWidth() { Width = "2500", Type = TableWidthUnitValues.Dxa },
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        var namePara = new Paragraph();
        var nameParaProps = new ParagraphProperties();
        nameParaProps.Append(new Justification() { Val = JustificationValues.Center });
        namePara.Append(nameParaProps);
        var nameRun = new Run();
        var nameRunProps = new RunProperties();
        nameRunProps.Append(new Bold());
        nameRunProps.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        nameRun.Append(nameRunProps);
        nameRun.Append(new Text("Nombre"));
        namePara.Append(nameRun);
        nameCell.Append(namePara);
        headerRow.Append(nameCell);
        
        // Tipo column
        var typeCell = new TableCell();
        typeCell.Append(new TableCellProperties(
            new TableCellWidth() { Width = "1500", Type = TableWidthUnitValues.Dxa },
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        typeCell.Append(new Paragraph(new Run(new RunProperties(new Bold()), new Text("Tipo")))
        {
            ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
        });
        headerRow.Append(typeCell);
        
        // Longitud column
        var lengthCell = new TableCell();
        lengthCell.Append(new TableCellProperties(
            new TableCellWidth() { Width = "1200", Type = TableWidthUnitValues.Dxa },
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        lengthCell.Append(new Paragraph(new Run(new RunProperties(new Bold()), new Text("Longitud")))
        {
            ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
        });
        headerRow.Append(lengthCell);
        
        // Obligatorio column
        var mandatoryCell = new TableCell();
        mandatoryCell.Append(new TableCellProperties(
            new TableCellWidth() { Width = "1300", Type = TableWidthUnitValues.Dxa },
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        mandatoryCell.Append(new Paragraph(new Run(new RunProperties(new Bold()), new Text("Obligatorio")))
        {
            ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
        });
        headerRow.Append(mandatoryCell);
        
        // Descripción column
        var descCell = new TableCell();
        descCell.Append(new TableCellProperties(
            new TableCellWidth() { Width = "3300", Type = TableWidthUnitValues.Dxa },
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        descCell.Append(new Paragraph(new Run(new RunProperties(new Bold()), new Text("Descripción")))
        {
            ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
        });
        headerRow.Append(descCell);
        
        table.Append(headerRow);
        
        // Data rows
        foreach (var field in entityFields)
        {
            var dataRow = new TableRow();
            
            // Name
            dataRow.Append(new TableCell(new Paragraph(new Run(new Text(field.Name ?? "")))));
            
            // Type
            dataRow.Append(new TableCell(new Paragraph(new Run(new Text(field.Type ?? "")))));
            
            // Length
            dataRow.Append(new TableCell(new Paragraph(new Run(new Text(field.Length?.ToString() ?? "-")))
            {
                ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
            }));
            
            // Mandatory
            dataRow.Append(new TableCell(new Paragraph(new Run(new Text(field.Mandatory ? "Sí" : "No")))
            {
                ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
            }));
            
            // Description
            dataRow.Append(new TableCell(new Paragraph(new Run(new Text(field.Description ?? "")))));
            
            table.Append(dataRow);
        }
        
        body.Append(table);
        
        // Add spacing after table
        body.Append(new Paragraph() { ParagraphProperties = new ParagraphProperties(new SpacingBetweenLines() { After = "240" }) });
    }

    private void AddRevisionHistoryTable(Body body, UseCase useCase)
    {
        // Add revision history section heading
        AddSectionHeading(body, "HISTORIA DE REVISIONES Y APROBACIONES", true);
        
        var today = DateTime.Now;
        var formattedDate = $"{today.Day}/{today.Month}/{today.Year}";
        
        // Create table with 4 columns
        var table = new Table();
        
        // Table properties
        var tableProps = table.AppendChild(new TableProperties());
        tableProps.AppendChild(new TableBorders(
            new TopBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new BottomBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new LeftBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new RightBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new InsideHorizontalBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new InsideVerticalBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 }
        ));
        tableProps.AppendChild(new TableWidth() { Width = "100%", Type = TableWidthUnitValues.Pct });
        
        // Header row
        var headerRow = new TableRow();
        
        // Fecha column
        var fechaCell = new TableCell();
        fechaCell.Append(new TableCellProperties(
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        fechaCell.Append(new Paragraph(new Run(new RunProperties(new Bold()), new Text("Fecha")))
        {
            ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
        });
        headerRow.Append(fechaCell);
        
        // Acción column
        var accionCell = new TableCell();
        accionCell.Append(new TableCellProperties(
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        accionCell.Append(new Paragraph(new Run(new RunProperties(new Bold()), new Text("Acción")))
        {
            ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
        });
        headerRow.Append(accionCell);
        
        // Responsable column
        var responsableCell = new TableCell();
        responsableCell.Append(new TableCellProperties(
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        responsableCell.Append(new Paragraph(new Run(new RunProperties(new Bold()), new Text("Responsable")))
        {
            ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
        });
        headerRow.Append(responsableCell);
        
        // Comentario column
        var comentarioCell = new TableCell();
        comentarioCell.Append(new TableCellProperties(
            new Shading() { Val = ShadingPatternValues.Clear, Fill = "DEEAF6" }
        ));
        comentarioCell.Append(new Paragraph(new Run(new RunProperties(new Bold()), new Text("Comentario")))
        {
            ParagraphProperties = new ParagraphProperties(new Justification() { Val = JustificationValues.Center })
        });
        headerRow.Append(comentarioCell);
        
        table.Append(headerRow);
        
        // Data row
        var dataRow = new TableRow();
        dataRow.Append(new TableCell(new Paragraph(new Run(new Text(formattedDate)))));
        dataRow.Append(new TableCell(new Paragraph(new Run(new Text("Creación")))));
        dataRow.Append(new TableCell(new Paragraph(new Run(new Text("Sistema")))));
        dataRow.Append(new TableCell(new Paragraph(new Run(new Text("Versión original")))));
        
        table.Append(dataRow);
        
        body.Append(table);
        
        // Add spacing after table
        body.Append(new Paragraph() { ParagraphProperties = new ParagraphProperties(new SpacingBetweenLines() { After = "240" }) });
    }
    
    private void AddRevisionHistoryTableOld(Body body, UseCase useCase)
    {
        // Add the mandatory revision history table
        var table = new Table();
        
        // Table properties
        var tableProps = table.AppendChild(new TableProperties());
        tableProps.AppendChild(new TableBorders(
            new TopBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new BottomBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new LeftBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new RightBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new InsideHorizontalBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new InsideVerticalBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 }
        ));

        // Header row
        var headerRow = table.AppendChild(new TableRow());
        var headers = new[] { "Fecha", "Versión", "Descripción", "Autor" };
        
        foreach (var header in headers)
        {
            var cell = headerRow.AppendChild(new TableCell());
            var para = cell.AppendChild(new Paragraph());
            var run = para.AppendChild(new Run());
            run.AppendChild(new Text(header));
            
            var runProps = run.AppendChild(new RunProperties());
            runProps.AppendChild(new Bold());
        }

        // Data row
        var dataRow = table.AppendChild(new TableRow());
        var values = new[] 
        { 
            useCase.CreatedAt.ToString("dd/MM/yyyy"), 
            "1.0", 
            "Versión inicial del caso de uso", 
            "Sistema Generador IA" 
        };
        
        foreach (var value in values)
        {
            var cell = dataRow.AppendChild(new TableCell());
            var para = cell.AppendChild(new Paragraph());
            var run = para.AppendChild(new Run());
            run.AppendChild(new Text(value));
        }

        body.AppendChild(table);
    }

    private void AddTestCasesToDocument(Body body, UseCase useCase)
    {
        // Only add test cases if they exist and have been generated
        if (!useCase.GenerateTestCase || useCase.TestSteps == null || !useCase.TestSteps.Any())
        {
            return;
        }

        // Add section header for test cases
        var testCaseHeaderPara = new Paragraph();
        var testCaseHeaderRun = testCaseHeaderPara.AppendChild(new Run());
        testCaseHeaderRun.AppendChild(new Text("CASOS DE PRUEBA"));
        
        var testCaseHeaderProps = testCaseHeaderRun.AppendChild(new RunProperties());
        testCaseHeaderProps.AppendChild(new Bold());
        testCaseHeaderProps.AppendChild(new FontSize() { Val = "20" });
        testCaseHeaderProps.AppendChild(new Color() { Val = "0070C0" }); // ING Blue

        body.AppendChild(testCaseHeaderPara);

        // Add objective if exists
        if (!string.IsNullOrEmpty(useCase.TestCaseObjective))
        {
            var objectivePara = new Paragraph();
            var objectiveRun = objectivePara.AppendChild(new Run());
            objectiveRun.AppendChild(new Text($"Objetivo: {useCase.TestCaseObjective}"));
            
            var objectiveProps = objectiveRun.AppendChild(new RunProperties());
            objectiveProps.AppendChild(new Bold());
            
            body.AppendChild(objectivePara);
        }

        // Add preconditions if exists
        if (!string.IsNullOrEmpty(useCase.TestCasePreconditions))
        {
            // Add preconditions heading
            var preconditionsHeadingPara = new Paragraph();
            var preconditionsHeadingRun = preconditionsHeadingPara.AppendChild(new Run());
            preconditionsHeadingRun.AppendChild(new Text("Precondiciones:"));
            
            var preconditionsHeadingProps = preconditionsHeadingRun.AppendChild(new RunProperties());
            preconditionsHeadingProps.AppendChild(new Bold());
            
            body.AppendChild(preconditionsHeadingPara);
            
            // Parse structured preconditions
            var preconditionsText = useCase.TestCasePreconditions.ToString();
            var lines = preconditionsText.Split('\n').Where(line => !string.IsNullOrWhiteSpace(line)).ToArray();
            
            if (lines.Length > 0)
            {
                string currentCategory = "";
                
                foreach (var line in lines)
                {
                    var trimmedLine = line.Trim();
                    
                    // Check if it's a category header (ends with ':')
                    if (trimmedLine.EndsWith(":") && !trimmedLine.StartsWith("•") && !trimmedLine.StartsWith("-"))
                    {
                        currentCategory = trimmedLine;
                        
                        // Add category heading
                        var categoryPara = new Paragraph();
                        var categoryRun = categoryPara.AppendChild(new Run());
                        categoryRun.AppendChild(new Text(currentCategory));
                        
                        var categoryProps = categoryRun.AppendChild(new RunProperties());
                        categoryProps.AppendChild(new Bold());
                        categoryProps.AppendChild(new FontSize() { Val = "18" });
                        categoryProps.AppendChild(new Color() { Val = "0070C0" });
                        
                        body.AppendChild(categoryPara);
                    }
                    else if (trimmedLine.StartsWith("•") || trimmedLine.StartsWith("-"))
                    {
                        // It's a bullet point
                        var content = System.Text.RegularExpressions.Regex.Replace(trimmedLine, @"^[•\-]\s*", "").Trim();
                        if (!string.IsNullOrEmpty(content))
                        {
                            AddBulletPoint(body, "", content);
                        }
                    }
                    else if (!string.IsNullOrEmpty(trimmedLine))
                    {
                        // Regular line without bullet - add as a bullet point if within a category
                        if (!string.IsNullOrEmpty(currentCategory))
                        {
                            AddBulletPoint(body, "", trimmedLine);
                        }
                        else
                        {
                            // Just add as regular paragraph if no category
                            var contentPara = new Paragraph();
                            var contentRun = contentPara.AppendChild(new Run());
                            contentRun.AppendChild(new Text(trimmedLine));
                            body.AppendChild(contentPara);
                        }
                    }
                }
            }
            else
            {
                // Fallback for single line preconditions
                var contentPara = new Paragraph();
                var contentRun = contentPara.AppendChild(new Run());
                contentRun.AppendChild(new Text(preconditionsText));
                body.AppendChild(contentPara);
            }
        }

        // Create test steps table
        var testTable = new Table();
        
        // Table properties
        var testTableProps = testTable.AppendChild(new TableProperties());
        testTableProps.AppendChild(new TableBorders(
            new TopBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new BottomBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new LeftBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new RightBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new InsideHorizontalBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 },
            new InsideVerticalBorder() { Val = new EnumValue<BorderValues>(BorderValues.Single), Size = 12 }
        ));

        // Header row for test steps
        var testHeaderRow = testTable.AppendChild(new TableRow());
        var testHeaders = new[] { "#", "Acción", "Datos de Entrada", "Resultado Esperado", "Observaciones", "Estado (P/F)" };
        
        // Add shading to header row
        var headerRowProps = testHeaderRow.AppendChild(new TableRowProperties());
        
        foreach (var header in testHeaders)
        {
            var cell = testHeaderRow.AppendChild(new TableCell());
            
            // Add shading to header cells
            var cellProps = cell.AppendChild(new TableCellProperties());
            cellProps.AppendChild(new Shading() { Val = ShadingPatternValues.Clear, Color = "auto", Fill = "DEEAF6" });
            
            var para = cell.AppendChild(new Paragraph());
            var run = para.AppendChild(new Run());
            run.AppendChild(new Text(header));
            
            var runProps = run.AppendChild(new RunProperties());
            runProps.AppendChild(new Bold());
        }

        // Add test steps
        foreach (var step in useCase.TestSteps)
        {
            var stepRow = testTable.AppendChild(new TableRow());
            var stepValues = new[] 
            { 
                step.Number.ToString(),
                step.Action ?? "",
                step.InputData ?? "",
                step.ExpectedResult ?? "",
                step.Observations ?? "",
                "Pendiente"  // Estado (P/F) - Default to "Pendiente"
            };
            
            foreach (var value in stepValues)
            {
                var cell = stepRow.AppendChild(new TableCell());
                var para = cell.AppendChild(new Paragraph());
                var run = para.AppendChild(new Run());
                run.AppendChild(new Text(value));
            }
        }

        body.AppendChild(testTable);

        // Add spacing before revision history
        var spacingPara = new Paragraph();
        body.AppendChild(spacingPara);
    }
    
    private void AddHeaderWithImage(MainDocumentPart mainPart, string? customHeaderImage = null)
    {
        var headerPart = mainPart.AddNewPart<HeaderPart>("headerId1");
        
        var header = new Header();
        var paragraph = new Paragraph();
        var paragraphProperties = new ParagraphProperties();
        paragraphProperties.Append(new Justification() { Val = JustificationValues.Center });
        paragraph.Append(paragraphProperties);
        
        // Try to add custom header image first, then fallback to default images
        string? imagePath = null;
        byte[]? imageData = null;
        
        // Handle custom header image (base64 data URL)
        if (!string.IsNullOrEmpty(customHeaderImage) && customHeaderImage.StartsWith("data:image/"))
        {
            try
            {
                var base64Data = customHeaderImage.Substring(customHeaderImage.IndexOf(',') + 1);
                imageData = Convert.FromBase64String(base64Data);
                _logger.LogInformation("Using custom header image from base64 data");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to decode custom header image, using fallback");
            }
        }
        
        // Fallback to default images if no custom image or custom image failed
        if (imageData == null)
        {
            var officialHeaderPath = Path.Combine(Directory.GetCurrentDirectory(), "official-ingematica-header.png");
            var companyLogoPath = Path.Combine(Directory.GetCurrentDirectory(), "company-logo.png");
            var fallbackPath1 = Path.Combine(Directory.GetCurrentDirectory(), "attached_assets", "image_1754002431086.png");
            var fallbackPath2 = Path.Combine(Directory.GetCurrentDirectory(), "attached_assets", "Encabezado_1753600608270.png");
            var fallbackPath3 = Path.Combine(Directory.GetCurrentDirectory(), "attached_assets", "Encabezado_caso_de_uso.png");
            
            if (File.Exists(officialHeaderPath))
                imagePath = officialHeaderPath;
            else if (File.Exists(companyLogoPath))
                imagePath = companyLogoPath;
            else if (File.Exists(fallbackPath1))
                imagePath = fallbackPath1;
            else if (File.Exists(fallbackPath2))
                imagePath = fallbackPath2;
            else if (File.Exists(fallbackPath3))
                imagePath = fallbackPath3;
        }
        
        // Add image to header
        if (imageData != null || !string.IsNullOrEmpty(imagePath))
        {
            try
            {
                var imagePart = headerPart.AddImagePart(ImagePartType.Png);
                
                // Calculate flexible dimensions based on actual image
                long width = 6000000L;
                long height = 1000000L;
                
                if (!string.IsNullOrEmpty(imagePath))
                {
                    try
                    {
                        using (var image = System.Drawing.Image.FromFile(imagePath))
                        {
                            // Compensate for 1.5x scaling factor in DOCX library
                            // Target: 900x120, divided by 1.5 = 600x80
                            // 1 pixel = 9525 EMUs
                            width = 600L * 9525L;  // 5715000 EMUs
                            height = 80L * 9525L;  // 762000 EMUs
                        }
                    }
                    catch
                    {
                        // Fall back to default if image reading fails
                        _logger.LogWarning("Could not read image dimensions, using defaults");
                    }
                }
                
                if (imageData != null)
                {
                    // Use custom header image data
                    using (var stream = new MemoryStream(imageData))
                    {
                        imagePart.FeedData(stream);
                    }
                }
                else if (!string.IsNullOrEmpty(imagePath))
                {
                    // Use file from path
                    using (var stream = new FileStream(imagePath, FileMode.Open))
                    {
                        imagePart.FeedData(stream);
                    }
                }
                
                var run = new Run();
                var drawing = CreateImageDrawing(headerPart.GetIdOfPart(imagePart), width, height);
                run.Append(drawing);
                paragraph.Append(run);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not add header image, using text fallback");
                AddTextHeader(paragraph);
            }
        }
        else
        {
            AddTextHeader(paragraph);
        }
        
        header.Append(paragraph);
        
        // Add spacing paragraph after header
        var spacingPara = new Paragraph();
        spacingPara.Append(new ParagraphProperties());
        header.Append(spacingPara);
        
        headerPart.Header = header;
        headerPart.Header.Save();
    }
    
    private void AddTextHeader(Paragraph paragraph)
    {
        var run = new Run();
        var runProperties = new RunProperties();
        runProperties.Append(new Bold());
        runProperties.Append(new FontSize() { Val = "24" });
        runProperties.Append(new Color() { Val = "0070C0" });
        run.Append(runProperties);
        run.Append(new Text("INGEMATICA - Documentación de casos de uso"));
        paragraph.Append(run);
    }
    
    private Drawing CreateImageDrawing(string relationshipId, long width, long height)
    {
        return new Drawing(
            new DW.Inline(
                new DW.Extent() { Cx = width, Cy = height },
                new DW.EffectExtent() { LeftEdge = 0L, TopEdge = 0L, RightEdge = 0L, BottomEdge = 0L },
                new DW.DocProperties() { Id = 1U, Name = "Header Image" },
                new DW.NonVisualGraphicFrameDrawingProperties(
                    new A.GraphicFrameLocks() { NoChangeAspect = true }),
                new A.Graphic(
                    new A.GraphicData(
                        new PIC.Picture(
                            new PIC.NonVisualPictureProperties(
                                new PIC.NonVisualDrawingProperties() { Id = 0U, Name = "Header.png" },
                                new PIC.NonVisualPictureDrawingProperties()),
                            new PIC.BlipFill(
                                new A.Blip() { Embed = relationshipId },
                                new A.Stretch(new A.FillRectangle())),
                            new PIC.ShapeProperties(
                                new A.Transform2D(
                                    new A.Offset() { X = 0L, Y = 0L },
                                    new A.Extents() { Cx = width, Cy = height }),
                                new A.PresetGeometry(new A.AdjustValueList()) { Preset = A.ShapeTypeValues.Rectangle }))
                    ) { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" })
            ) { DistanceFromTop = 0U, DistanceFromBottom = 0U, DistanceFromLeft = 0U, DistanceFromRight = 0U });
    }
    
    private void AddWireframeImage(Body body, MainDocumentPart mainPart, string imagePath)
    {
        // Create a paragraph for the image
        var imagePara = body.AppendChild(new Paragraph());
        var imageParaProps = imagePara.AppendChild(new ParagraphProperties());
        imageParaProps.AppendChild(new SpacingBetweenLines() { After = "120" });
        imageParaProps.AppendChild(new Justification() { Val = JustificationValues.Center });
        
        // Add the image
        using (FileStream stream = new FileStream(imagePath, FileMode.Open))
        {
            var imagePart = mainPart.AddImagePart(ImagePartType.Png);
            imagePart.FeedData(stream);
            
            // Add the image to the document
            var run = imagePara.AppendChild(new Run());
            var drawing = CreateImageDrawing(mainPart.GetIdOfPart(imagePart), 4320000L, 3240000L); // 450x338 px at 96 DPI
            run.AppendChild(drawing);
        }
    }
    
    private void AddFooterWithPageNumbers(MainDocumentPart mainPart, UseCase useCase)
    {
        var footerPart = mainPart.AddNewPart<FooterPart>("footerId1");
        
        var footer = new Footer();
        var paragraph = new Paragraph();
        var paragraphProperties = new ParagraphProperties();
        
        // Usar tabulación para alinear a derecha el nombre del caso de uso
        var tabs = new Tabs();
        tabs.Append(new TabStop() { Val = TabStopValues.Right, Position = 9360 }); // Margen derecho
        paragraphProperties.Append(tabs);
        paragraph.Append(paragraphProperties);
        
        // Número de página a la izquierda
        var run1 = new Run();
        var runProps1 = new RunProperties();
        runProps1.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        runProps1.Append(new FontSize() { Val = "18" }); // 9pt
        run1.Append(runProps1);
        run1.Append(new Text("página ")); // minúscula como en React
        paragraph.Append(run1);
        
        var run2 = new Run();
        var runProps2 = new RunProperties();
        runProps2.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        runProps2.Append(new FontSize() { Val = "18" });
        run2.Append(runProps2);
        run2.Append(new FieldChar() { FieldCharType = FieldCharValues.Begin });
        paragraph.Append(run2);
        
        var run3 = new Run();
        var runProps3 = new RunProperties();
        runProps3.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        runProps3.Append(new FontSize() { Val = "18" });
        run3.Append(runProps3);
        run3.Append(new FieldCode(" PAGE "));
        paragraph.Append(run3);
        
        var run4 = new Run();
        var runProps4 = new RunProperties();
        runProps4.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        runProps4.Append(new FontSize() { Val = "18" });
        run4.Append(runProps4);
        run4.Append(new FieldChar() { FieldCharType = FieldCharValues.End });
        paragraph.Append(run4);
        
        var run5 = new Run();
        var runProps5 = new RunProperties();
        runProps5.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        runProps5.Append(new FontSize() { Val = "18" });
        run5.Append(runProps5);
        run5.Append(new Text(" de "));
        paragraph.Append(run5);
        
        var run6 = new Run();
        var runProps6 = new RunProperties();
        runProps6.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        runProps6.Append(new FontSize() { Val = "18" });
        run6.Append(runProps6);
        run6.Append(new FieldChar() { FieldCharType = FieldCharValues.Begin });
        paragraph.Append(run6);
        
        var run7 = new Run();
        var runProps7 = new RunProperties();
        runProps7.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        runProps7.Append(new FontSize() { Val = "18" });
        run7.Append(runProps7);
        run7.Append(new FieldCode(" NUMPAGES "));
        paragraph.Append(run7);
        
        var run8 = new Run();
        var runProps8 = new RunProperties();
        runProps8.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        runProps8.Append(new FontSize() { Val = "18" });
        run8.Append(runProps8);
        run8.Append(new FieldChar() { FieldCharType = FieldCharValues.End });
        paragraph.Append(run8);
        
        // Tabulación y nombre del caso de uso a la derecha
        var run9 = new Run();
        var runProps9 = new RunProperties();
        runProps9.Append(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
        runProps9.Append(new FontSize() { Val = "18" });
        run9.Append(runProps9);
        run9.Append(new TabChar());
        run9.Append(new Text(useCase?.UseCaseName ?? "Caso de Uso"));
        paragraph.Append(run9);
        
        footer.Append(paragraph);
        footerPart.Footer = footer;
        footerPart.Footer.Save();
    }
}