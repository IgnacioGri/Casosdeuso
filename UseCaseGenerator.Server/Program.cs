using Microsoft.EntityFrameworkCore;
using UseCaseGenerator.Server.Data;
using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Server.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
var useInMemoryDb = builder.Configuration.GetValue<bool>("UseInMemoryDatabase", true);
if (useInMemoryDb)
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseInMemoryDatabase("UseCaseGeneratorDb"));
}

// HttpClient Factory configuration with timeouts
builder.Services.AddHttpClient("Anthropic", client =>
{
    client.BaseAddress = new Uri("https://api.anthropic.com/");
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
});

builder.Services.AddHttpClient("Grok", client =>
{
    client.BaseAddress = new Uri("https://api.x.ai/v1/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient("Gemini", client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient("Copilot", client =>
{
    client.BaseAddress = new Uri("https://api.copilot.microsoft.com/v1/");
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("User-Agent", "UseCaseGenerator");
});

// Custom Services
builder.Services.AddScoped<IAIService, AIService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IMinuteAnalysisService, MinuteAnalysisService>();
builder.Services.AddScoped<IIntelligentTestCaseService, IntelligentTestCaseService>();
builder.Services.AddScoped<IUseCaseRepository, UseCaseRepository>();

// CORS for Blazor WebAssembly
builder.Services.AddCors(options =>
{
    options.AddPolicy("BlazorWasmPolicy", policy =>
    {
        policy.WithOrigins("https://localhost:7001", "http://localhost:5001")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}
app.UseStaticFiles();

// Add rate limiting middleware
app.UseRateLimiting();

app.UseRouting();
app.UseCors("BlazorWasmPolicy");
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
}

app.Run();