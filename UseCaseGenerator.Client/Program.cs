using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using UseCaseGenerator.Client;
using UseCaseGenerator.Client.Services;
using MudBlazor.Services;
using Blazored.LocalStorage;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// HTTP Client configuration
builder.Services.AddScoped(sp => new HttpClient 
{ 
    BaseAddress = new Uri(builder.Configuration["ApiBaseUrl"] ?? "https://localhost:7000/") 
});

// MudBlazor UI Components
builder.Services.AddMudServices();

// Local Storage
builder.Services.AddBlazoredLocalStorage();

// Custom Services
builder.Services.AddScoped<IUseCaseService, UseCaseService>();
builder.Services.AddScoped<IAIAssistService, AIAssistService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IFormStateService, FormStateService>();

// IJSRuntime is automatically available in Blazor WASM

await builder.Build().RunAsync();