using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Shared.DTOs;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using DocumentFormat.OpenXml.Spreadsheet;
using System.Text;

namespace UseCaseGenerator.Server.Controllers;

[ApiController]
[Route("api/minute-analysis")]
public class MinuteAnalysisController : ControllerBase
{
    private readonly IMinuteAnalysisService _minuteAnalysisService;
    private readonly ILogger<MinuteAnalysisController> _logger;

    public MinuteAnalysisController(
        IMinuteAnalysisService minuteAnalysisService,
        ILogger<MinuteAnalysisController> logger)
    {
        _minuteAnalysisService = minuteAnalysisService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<MinuteAnalysisResponse>> AnalyzeMinute([FromBody] MinuteAnalysisRequest request)
    {
        try
        {
            var response = await _minuteAnalysisService.AnalyzeMinuteAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing minute");
            return StatusCode(500, new MinuteAnalysisResponse
            {
                Success = false,
                Error = "Error interno del servidor"
            });
        }
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadMinute(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No se ha proporcionado ningún archivo");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            string content = string.Empty;

            using var stream = file.OpenReadStream();

            switch (extension)
            {
                case ".txt":
                    using (var reader = new StreamReader(stream))
                    {
                        content = await reader.ReadToEndAsync();
                    }
                    break;

                case ".docx":
                    content = ExtractTextFromDocx(stream);
                    break;

                case ".xlsx":
                case ".xls":
                    content = ExtractTextFromExcel(stream);
                    break;

                case ".ppt":
                case ".pptx":
                    content = ExtractTextFromPowerPoint(stream);
                    break;

                default:
                    return BadRequest($"Tipo de archivo no soportado: {extension}");
            }

            return Ok(new { Content = content, FileName = file.FileName });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading minute file");
            return StatusCode(500, "Error al procesar el archivo");
        }
    }

    private string ExtractTextFromDocx(Stream stream)
    {
        var sb = new StringBuilder();
        using (var doc = WordprocessingDocument.Open(stream, false))
        {
            if (doc.MainDocumentPart != null)
            {
                var body = doc.MainDocumentPart.Document.Body;
                if (body != null)
                {
                    sb.AppendLine(body.InnerText);
                }
            }
        }
        return sb.ToString();
    }

    private string ExtractTextFromExcel(Stream stream)
    {
        var sb = new StringBuilder();
        using (var doc = SpreadsheetDocument.Open(stream, false))
        {
            if (doc.WorkbookPart != null)
            {
                var sheets = doc.WorkbookPart.Workbook.Descendants<Sheet>();
                foreach (var sheet in sheets)
                {
                    sb.AppendLine($"=== Hoja: {sheet.Name} ===");
                    var worksheetPart = (WorksheetPart)doc.WorkbookPart.GetPartById(sheet.Id!);
                    var sharedStringTable = doc.WorkbookPart.SharedStringTablePart?.SharedStringTable;
                    
                    var rows = worksheetPart.Worksheet.Descendants<Row>();
                    foreach (var row in rows)
                    {
                        var cells = row.Descendants<Cell>();
                        var rowText = new List<string>();
                        
                        foreach (var cell in cells)
                        {
                            var cellValue = GetCellValue(cell, sharedStringTable);
                            if (!string.IsNullOrWhiteSpace(cellValue))
                            {
                                rowText.Add(cellValue);
                            }
                        }
                        
                        if (rowText.Any())
                        {
                            sb.AppendLine(string.Join("\t", rowText));
                        }
                    }
                    sb.AppendLine();
                }
            }
        }
        return sb.ToString();
    }

    private string GetCellValue(Cell cell, SharedStringTable? sharedStringTable)
    {
        if (cell.CellValue == null) return string.Empty;
        
        var value = cell.CellValue.InnerText;
        if (cell.DataType?.Value == CellValues.SharedString && sharedStringTable != null)
        {
            return sharedStringTable.ElementAt(int.Parse(value)).InnerText;
        }
        return value;
    }

    private string ExtractTextFromPowerPoint(Stream stream)
    {
        var sb = new StringBuilder();
        using (var presentationDoc = PresentationDocument.Open(stream, false))
        {
            if (presentationDoc.PresentationPart == null) return sb.ToString();
            
            var presentation = presentationDoc.PresentationPart.Presentation;
            if (presentation?.SlideIdList == null) return sb.ToString();
            
            int slideNumber = 0;
            foreach (SlideId slideId in presentation.SlideIdList.Elements<SlideId>())
            {
                slideNumber++;
                var slidePart = (SlidePart)presentationDoc.PresentationPart.GetPartById(slideId.RelationshipId!);
                
                sb.AppendLine($"=== Diapositiva {slideNumber} ===");
                
                // Extract text from slide
                if (slidePart.Slide != null)
                {
                    var texts = slidePart.Slide.Descendants<DocumentFormat.OpenXml.Drawing.Text>();
                    foreach (var text in texts)
                    {
                        if (!string.IsNullOrWhiteSpace(text.Text))
                        {
                            sb.AppendLine(text.Text);
                        }
                    }
                }
                
                // Extract notes if available
                if (slidePart.NotesSlidePart != null)
                {
                    var notesTexts = slidePart.NotesSlidePart.NotesSlide?.Descendants<DocumentFormat.OpenXml.Drawing.Text>();
                    if (notesTexts != null && notesTexts.Any())
                    {
                        sb.AppendLine("Notas:");
                        foreach (var noteText in notesTexts)
                        {
                            if (!string.IsNullOrWhiteSpace(noteText.Text))
                            {
                                sb.AppendLine(noteText.Text);
                            }
                        }
                    }
                }
                
                sb.AppendLine();
            }
        }
        return sb.ToString();
    }
}