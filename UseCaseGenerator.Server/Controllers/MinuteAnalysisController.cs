using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Shared.DTOs;

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

            using var reader = new StreamReader(file.OpenReadStream());
            var content = await reader.ReadToEndAsync();

            return Ok(new { Content = content, FileName = file.FileName });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading minute file");
            return StatusCode(500, "Error al procesar el archivo");
        }
    }
}