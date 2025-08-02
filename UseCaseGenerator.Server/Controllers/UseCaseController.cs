using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Server.Security;
using UseCaseGenerator.Shared.DTOs;
using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UseCaseController : ControllerBase
{
    private readonly IAIService _aiService;
    private readonly IUseCaseRepository _repository;
    private readonly ILogger<UseCaseController> _logger;

    public UseCaseController(IAIService aiService, IUseCaseRepository repository, ILogger<UseCaseController> logger)
    {
        _aiService = aiService;
        _repository = repository;
        _logger = logger;
    }

    [HttpPost("generate")]
    [RequestSizeLimit(10_485_760)] // 10MB limit
    public async Task<ActionResult<GenerateUseCaseResponse>> GenerateUseCase([FromBody] GenerateUseCaseRequest request)
    {
        try
        {
            // Validate request
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            if (request?.FormData == null)
            {
                return BadRequest("FormData is required");
            }
            
            // Sanitize input data
            request.FormData.ClientName = InputValidator.SanitizeText(request.FormData.ClientName);
            request.FormData.ProjectName = InputValidator.SanitizeText(request.FormData.ProjectName);
            request.FormData.UseCaseName = InputValidator.SanitizeText(request.FormData.UseCaseName);
            request.FormData.UseCaseCode = InputValidator.SanitizeText(request.FormData.UseCaseCode, 50);
            request.FormData.Description = InputValidator.SanitizeText(request.FormData.Description, 2000);
            request.FormData.BusinessRules = InputValidator.SanitizeText(request.FormData.BusinessRules, 5000);
            request.FormData.SpecialRequirements = InputValidator.SanitizeText(request.FormData.SpecialRequirements, 2000);
            
            var response = await _aiService.GenerateUseCaseAsync(request);
            
            if (response.Success && response.UseCase != null)
            {
                // Set GeneratedWireframes from AI response
                if (response.GeneratedWireframes != null)
                {
                    response.UseCase.GeneratedWireframes = response.GeneratedWireframes;
                }
                
                await _repository.CreateAsync(response.UseCase);
            }

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid input provided");
            return BadRequest(new GenerateUseCaseResponse
            {
                Success = false,
                Error = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating use case");
            return StatusCode(500, new GenerateUseCaseResponse
            {
                Success = false,
                Error = "Error interno del servidor"
            });
        }
    }



    [HttpPost("edit")]
    public async Task<ActionResult<string>> EditUseCase([FromBody] EditUseCaseRequest request)
    {
        try
        {
            var result = await _aiService.EditUseCaseAsync(request.Content, request.Instructions, request.AiModel);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error editing use case");
            return StatusCode(500, "Error interno del servidor");
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<UseCase>>> GetAllUseCases()
    {
        try
        {
            var useCases = await _repository.GetAllAsync();
            return Ok(useCases);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving use cases");
            return StatusCode(500, "Error interno del servidor");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UseCase>> GetUseCase(string id)
    {
        try
        {
            var useCase = await _repository.GetByIdAsync(id);
            if (useCase == null)
            {
                return NotFound();
            }

            return Ok(useCase);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving use case {Id}", id);
            return StatusCode(500, "Error interno del servidor");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUseCase(string id)
    {
        try
        {
            await _repository.DeleteAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting use case {Id}", id);
            return StatusCode(500, "Error interno del servidor");
        }
    }
}

public class EditUseCaseRequest
{
    public string Content { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public AIModel AiModel { get; set; } = AIModel.Demo;
}