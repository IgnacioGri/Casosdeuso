using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Server.Controllers;

[ApiController]
[Route("api/intelligent-test-cases")]
public class IntelligentTestCaseController : ControllerBase
{
    private readonly IIntelligentTestCaseService _intelligentTestCaseService;
    private readonly ILogger<IntelligentTestCaseController> _logger;

    public IntelligentTestCaseController(
        IIntelligentTestCaseService intelligentTestCaseService,
        ILogger<IntelligentTestCaseController> logger)
    {
        _intelligentTestCaseService = intelligentTestCaseService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<IntelligentTestCaseResponse>> GenerateTestCases([FromBody] IntelligentTestCaseRequest request)
    {
        try
        {
            var response = await _intelligentTestCaseService.GenerateTestCasesAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating intelligent test cases");
            return StatusCode(500, new IntelligentTestCaseResponse
            {
                Success = false,
                Error = "Error interno del servidor"
            });
        }
    }

    [HttpPost("analyze")]
    public async Task<ActionResult<IntelligentTestCaseResponse>> AnalyzeForTestCases([FromBody] AnalyzeForTestCasesRequest request)
    {
        try
        {
            var intelligentRequest = new IntelligentTestCaseRequest
            {
                FormData = request.FormData,
                AiModel = request.AiModel
            };

            var response = await _intelligentTestCaseService.GenerateTestCasesAsync(intelligentRequest);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing for test cases");
            return StatusCode(500, new IntelligentTestCaseResponse
            {
                Success = false,
                Error = "Error interno del servidor"
            });
        }
    }
}

public class AnalyzeForTestCasesRequest
{
    public UseCaseFormData FormData { get; set; } = new();
    public Shared.Models.AIModel AiModel { get; set; } = Shared.Models.AIModel.Demo;
}