using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using UseCaseGenerator.Shared.Models;
using System.Text.RegularExpressions;

namespace UseCaseGenerator.Server.Services;

public class DocumentService : IDocumentService
{
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(ILogger<DocumentService> logger)
    {
        _logger = logger;
    }

    public byte[] GenerateDocx(string htmlContent, UseCase useCase)
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

    private void AddFormDataSections(Body body, UseCase useCase)
    {
        // Use properties directly from UseCase model

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
            foreach (var field in useCase.EntityFields)
            {
                var fieldText = $"{field.Name} ({field.Type})";
                if (field.Length.HasValue) fieldText += $" - Longitud: {field.Length}";
                if (field.Mandatory) fieldText += " - Obligatorio";
                if (!string.IsNullOrEmpty(field.Description)) fieldText += $" - {field.Description}";
                AddBulletItem(body, fieldText);
            }
        }

        // Test Cases Section
        if (useCase.GenerateTestCase && useCase.TestSteps?.Any() == true)
        {
            AddSectionHeading(body, "CASOS DE PRUEBA", true);

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
                var preconditions = useCase.TestCasePreconditions.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                foreach (var condition in preconditions)
                {
                    AddBulletItem(body, condition.Trim());
                }
            }

            // Test Steps
            AddSubHeading(body, "Pasos de Prueba:");
            for (int i = 0; i < useCase.TestSteps.Count; i++)
            {
                var step = useCase.TestSteps[i];
                AddNumberedItem(body, $"{step.Number}. {step.Action}", true);
                
                if (!string.IsNullOrEmpty(step.InputData))
                    AddIndentedBullet(body, "Datos de Entrada", step.InputData);
                    
                if (!string.IsNullOrEmpty(step.ExpectedResult))
                    AddIndentedBullet(body, "Resultado Esperado", step.ExpectedResult);
                    
                if (!string.IsNullOrEmpty(step.Observations))
                    AddIndentedBullet(body, "Observaciones", step.Observations);
            }
        }
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

    private void AddParagraph(Body body, string text)
    {
        var para = body.AppendChild(new Paragraph());
        para.AppendChild(new ParagraphProperties()).AppendChild(new SpacingBetweenLines() { After = "120" });
        var run = para.AppendChild(new Run());
        run.AppendChild(new Text(text));
    }

    private void ApplyHeadingStyle(Run run, int fontSize, bool bold)
    {
        var runProps = run.AppendChild(new RunProperties());
        if (bold) runProps.AppendChild(new Bold());
        runProps.AppendChild(new FontSize() { Val = fontSize.ToString() });
        runProps.AppendChild(new Color() { Val = "0070C0" }); // ING Blue
        runProps.AppendChild(new RunFonts() { Ascii = "Segoe UI Semilight", HighAnsi = "Segoe UI Semilight" });
    }

    private void AddRevisionHistoryTable(Body body, UseCase useCase)
    {
        // Add revision history section with bullet format
        AddSectionHeading(body, "HISTORIA DE REVISIONES Y APROBACIONES", true);
        
        var today = DateTime.Now;
        var formattedDate = $"{today.Day}/{today.Month}/{today.Year}";
        
        AddBulletPoint(body, "Fecha", formattedDate);
        AddBulletPoint(body, "Acción", "Versión original");
        AddBulletPoint(body, "Responsable", "Sistema");
        AddBulletPoint(body, "Comentario", "Documento generado automáticamente");
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
            var preconditionsPara = new Paragraph();
            var preconditionsRun = preconditionsPara.AppendChild(new Run());
            preconditionsRun.AppendChild(new Text($"Precondiciones: {useCase.TestCasePreconditions}"));
            
            body.AppendChild(preconditionsPara);
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
        var testHeaders = new[] { "#", "Acción", "Datos de Entrada", "Resultado Esperado", "Observaciones" };
        
        foreach (var header in testHeaders)
        {
            var cell = testHeaderRow.AppendChild(new TableCell());
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
                step.Observations ?? ""
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
}