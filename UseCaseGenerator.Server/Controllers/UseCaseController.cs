using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Services;
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
    public async Task<ActionResult<GenerateUseCaseResponse>> GenerateUseCase([FromBody] GenerateUseCaseRequest request)
    {
        try
        {
            var response = await _aiService.GenerateUseCaseAsync(request);
            
            if (response.Success && response.UseCase != null)
            {
                await _repository.CreateAsync(response.UseCase);
            }

            return Ok(response);
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