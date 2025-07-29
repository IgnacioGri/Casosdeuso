using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Server.Controllers;

[ApiController]
[Route("api/ai-assist")]
public class AIAssistController : ControllerBase
{
    private readonly IAIService _aiService;
    private readonly ILogger<AIAssistController> _logger;

    public AIAssistController(IAIService aiService, ILogger<AIAssistController> logger)
    {
        _aiService = aiService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<AIAssistResponse>> ImproveField([FromBody] AIAssistRequest request)
    {
        try
        {
            var response = await _aiService.ImproveFieldAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error improving field {FieldName}", request.FieldName);
            return StatusCode(500, new AIAssistResponse
            {
                Success = false,
                Error = "Error interno del servidor"
            });
        }
    }
}