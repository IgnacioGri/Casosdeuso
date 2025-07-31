using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Server.Security;
using UseCaseGenerator.Shared.Models;
using UseCaseGenerator.Shared.DTOs;

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
    [RequestSizeLimit(10_485_760)] // 10MB limit
    public IActionResult GenerateDocx([FromBody] GenerateDocxRequest request)
    {
        try
        {
            // Validate request
            if (request == null)
            {
                return BadRequest("Request cannot be null");
            }
            
            // Validate content size
            InputValidator.ValidateContentSize(request.Content, 100000);
            
            // Sanitize file name to prevent path traversal
            var sanitizedFileName = InputValidator.SanitizeFileName(request.FileName);
            
            // Create UseCase from request data with sanitized values
            var useCase = new UseCase
            {
                Id = Guid.NewGuid().ToString(),
                ClientName = InputValidator.SanitizeText(request.FormData?.ClientName ?? "Cliente"),
                ProjectName = InputValidator.SanitizeText(request.FormData?.ProjectName ?? "Proyecto"),
                UseCaseName = InputValidator.SanitizeText(request.FormData?.UseCaseName ?? sanitizedFileName),
                UseCaseCode = InputValidator.SanitizeText(request.FormData?.UseCaseCode, 50),
                FileName = sanitizedFileName,
                Description = InputValidator.SanitizeText(request.FormData?.Description, 1000),
                UseCaseType = request.FormData?.UseCaseType ?? UseCaseType.Entity,
                BusinessRules = InputValidator.SanitizeText(request.FormData?.BusinessRules, 2000),
                SearchFilters = request.FormData?.SearchFilters ?? new List<string>(),
                ResultColumns = request.FormData?.ResultColumns ?? new List<string>(),
                EntityFields = request.FormData?.EntityFields ?? new List<EntityField>(),
                GenerateTestCase = request.FormData?.GenerateTestCase ?? false,
                TestCaseObjective = InputValidator.SanitizeText(request.FormData?.TestCaseObjective, 500),
                TestCasePreconditions = InputValidator.SanitizeText(request.FormData?.TestCasePreconditions, 500),
                TestSteps = request.FormData?.TestSteps ?? new List<TestStep>(),
                // FormData not stored in UseCase model
                CreatedAt = DateTime.UtcNow
            };

            var docxBytes = _documentService.GenerateDocx(request.Content, useCase);
            
            return File(docxBytes, 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"{sanitizedFileName}.docx");
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid input provided");
            return BadRequest(ex.Message);
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



public class ConvertToHtmlRequest
{
    public string Content { get; set; } = string.Empty;
}