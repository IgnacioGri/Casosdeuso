using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageController : ControllerBase
{
    private readonly AIService _aiService;
    private readonly ILogger<ImageController> _logger;

    public ImageController(AIService aiService, ILogger<ImageController> logger)
    {
        _aiService = aiService;
        _logger = logger;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateImage([FromBody] ImageGenerationRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Prompt))
            {
                return BadRequest(new ImageGenerationResponse
                {
                    Success = false,
                    Error = "Prompt is required for image generation"
                });
            }

            var result = await _aiService.GenerateImageAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in image generation endpoint");
            return StatusCode(500, new ImageGenerationResponse
            {
                Success = false,
                Error = "Failed to generate image"
            });
        }
    }
}