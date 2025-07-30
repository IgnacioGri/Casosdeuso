using Microsoft.EntityFrameworkCore;
using UseCaseGenerator.Server.Data;
using UseCaseGenerator.Server.Services;

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
}

app.UseHttpsRedirection();
app.UseCors("BlazorWasmPolicy");
app.UseAuthorization();
app.MapControllers();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
}

app.Run();