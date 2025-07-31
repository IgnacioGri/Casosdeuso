using System.Collections.Concurrent;

namespace UseCaseGenerator.Server.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly ConcurrentDictionary<string, List<DateTime>> _requestTimes = new();
    private readonly int _maxRequests = 100; // Max requests per window
    private readonly TimeSpan _timeWindow = TimeSpan.FromMinutes(1); // Time window

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientId = GetClientId(context);
        
        if (IsRateLimitExceeded(clientId))
        {
            _logger.LogWarning("Rate limit exceeded for client: {ClientId}", clientId);
            context.Response.StatusCode = 429; // Too Many Requests
            await context.Response.WriteAsync("Rate limit exceeded. Try again later.");
            return;
        }

        await _next(context);
    }

    private string GetClientId(HttpContext context)
    {
        // Try to get client IP
        var ip = context.Connection.RemoteIpAddress?.ToString();
        
        // Fallback to a header if behind proxy
        if (string.IsNullOrEmpty(ip))
        {
            ip = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
        }
        
        return ip ?? "unknown";
    }

    private bool IsRateLimitExceeded(string clientId)
    {
        var now = DateTime.UtcNow;
        
        _requestTimes.AddOrUpdate(clientId,
            new List<DateTime> { now },
            (key, times) =>
            {
                // Remove old entries outside the time window
                times.RemoveAll(t => now - t > _timeWindow);
                times.Add(now);
                return times;
            });

        var requestCount = _requestTimes[clientId].Count;
        return requestCount > _maxRequests;
    }
}

public static class RateLimitingMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RateLimitingMiddleware>();
    }
}