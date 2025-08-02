using Microsoft.AspNetCore.Mvc;
using UseCaseGenerator.Server.Security;

namespace UseCaseGenerator.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HeaderImageController : ControllerBase
{
    private readonly ILogger<HeaderImageController> _logger;
    private readonly string _uploadsPath;

    public HeaderImageController(ILogger<HeaderImageController> logger)
    {
        _logger = logger;
        _uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        
        // Ensure uploads directory exists
        if (!Directory.Exists(_uploadsPath))
        {
            Directory.CreateDirectory(_uploadsPath);
        }
    }

    [HttpPost("upload")]
    [RequestSizeLimit(5_242_880)] // 5MB limit
    public async Task<IActionResult> UploadHeaderImage(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No se ha proporcionado ningún archivo");
            }

            // Validate file size
            if (file.Length > 5_242_880) // 5MB
            {
                return BadRequest("El archivo es demasiado grande. Máximo 5MB.");
            }

            // Validate file type
            if (!file.ContentType.StartsWith("image/"))
            {
                return BadRequest("Solo se permiten archivos de imagen.");
            }

            // Generate unique filename
            var fileName = $"header_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(_uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation($"Header image uploaded: {fileName}");
            
            return Ok(new { 
                fileName = fileName,
                filePath = filePath,
                message = "Imagen de cabecera subida correctamente"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading header image");
            return StatusCode(500, "Error al procesar la imagen");
        }
    }

    [HttpDelete("{fileName}")]
    public IActionResult DeleteHeaderImage(string fileName)
    {
        try
        {
            // Sanitize filename to prevent path traversal
            var sanitizedFileName = InputValidator.SanitizeFileName(fileName);
            var filePath = Path.Combine(_uploadsPath, sanitizedFileName);

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
                _logger.LogInformation($"Header image deleted: {sanitizedFileName}");
                return Ok(new { message = "Imagen eliminada correctamente" });
            }

            return NotFound("Imagen no encontrada");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting header image");
            return StatusCode(500, "Error al eliminar la imagen");
        }
    }
}