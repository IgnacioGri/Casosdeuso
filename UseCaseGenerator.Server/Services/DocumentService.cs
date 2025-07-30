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
        try
        {
            using var ms = new MemoryStream();
            using (var document = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document))
            {
                var mainPart = document.AddMainDocumentPart();
                mainPart.Document = new Document();
                var body = mainPart.Document.AppendChild(new Body());

                // Add header with ING branding
                AddHeader(body, useCase);

                // Convert HTML to Word paragraphs
                ConvertHtmlToWord(htmlContent, body);

                // Add test cases if they exist (before revision history)
                AddTestCasesToDocument(body, useCase);

                // Add revision history table
                AddRevisionHistoryTable(body, useCase);

                mainPart.Document.Save();
            }

            return ms.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating DOCX document");
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

    private void AddRevisionHistoryTable(Body body, UseCase useCase)
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