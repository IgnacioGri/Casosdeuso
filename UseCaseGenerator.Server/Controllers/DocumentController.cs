using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IUseCaseRepository _repository;
    private readonly ILogger<DocumentController> _logger;

    public DocumentController(
        IDocumentService documentService, 
        IUseCaseRepository repository,
        ILogger<DocumentController> logger)
    {
        _documentService = documentService;
        _repository = repository;
        _logger = logger;
    }

    [HttpPost("docx")]
    public async Task<IActionResult> GenerateDocx([FromBody] GenerateDocxRequest request)
    {
        try
        {
            // Create a mock UseCase for document generation
            var useCase = new UseCase
            {
                Id = Guid.NewGuid().ToString(),
                ClientName = "Cliente",
                ProjectName = "Proyecto",
                UseCaseName = request.FileName,
                CreatedAt = DateTime.UtcNow
            };

            var docxBytes = _documentService.GenerateDocx(request.Content, useCase);
            
            return File(docxBytes, 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"{request.FileName}.docx");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating DOCX document");
            return StatusCode(500, "Error interno del servidor");
        }
    }

    [HttpPost("html")]
    public IActionResult ConvertToHtml([FromBody] ConvertToHtmlRequest request)
    {
        try
        {
            var htmlContent = _documentService.ConvertToHtml(request.Content);
            return Ok(new { Content = htmlContent });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting to HTML");
            return StatusCode(500, "Error interno del servidor");
        }
    }

    [HttpGet("download/{useCaseId}")]
    public async Task<IActionResult> DownloadUseCase(string useCaseId, [FromQuery] string format = "docx")
    {
        try
        {
            var useCase = await _repository.GetByIdAsync(useCaseId);
            if (useCase == null)
            {
                return NotFound();
            }

            if (format.ToLower() == "docx")
            {
                var docxBytes = _documentService.GenerateDocx(useCase.GeneratedContent ?? "", useCase);
                return File(docxBytes, 
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    $"{useCase.FileName}.docx");
            }
            else
            {
                var htmlContent = _documentService.ConvertToHtml(useCase.GeneratedContent ?? "");
                return Content(htmlContent, "text/html");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading use case {UseCaseId}", useCaseId);
            return StatusCode(500, "Error interno del servidor");
        }
    }
}

public class GenerateDocxRequest
{
    public string Content { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

public class ConvertToHtmlRequest
{
    public string Content { get; set; } = string.Empty;
}