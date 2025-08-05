# Use Case Generator Application

## Overview
This full-stack web application generates standardized use case documents using AI. It features a multi-step form for requirements collection and formats outputs into consistent, professional documents adhering to Microsoft-style formatting. The application supports robust error handling and includes a demo mode for testing without API keys. The project aims to provide a streamlined, AI-powered solution for producing high-quality, standardized documentation, enhancing efficiency and consistency in project development, with a vision to streamline project development processes and ensure consistency in documentation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application utilizes a modern full-stack .NET architecture, ensuring a clear separation of concerns.

### Frontend Architecture (Blazor WebAssembly)
- **Framework**: Blazor WebAssembly with .NET 8.
- **UI Library**: MudBlazor for Material Design.
- **State Management**: Built-in Blazor state management and local storage.
- **Styling**: Custom ING corporate colors, Segoe UI typography, and responsive design. UI enhancements include smart autocomplete, contextual tooltips, micro-interactions, and adaptive loading animations.

### Backend Architecture (ASP.NET Core)
- **Framework**: ASP.NET Core 8 Web API.
- **Language**: C#.
- **API Style**: RESTful API with JSON.
- **Database**: Entity Framework Core (in-memory default, PostgreSQL ready).
- **Security**: HttpClient Factory, input sanitization, robust validation, custom rate limiting, and HttpClient timeouts.

### Core Features
- **Multi-step Form System**: Progressive forms (9 steps for entity, 6 for others) with dynamic fields and client-side validation.
- **AI Integration Layer**: Abstracted `AIService` supports multiple AI providers with cascading fallback (Copilot → Gemini → OpenAI → Claude → Grok). **UPDATED 2025-01-06**: All models now use latest versions consistently in both React and Blazor: GPT-4o, Claude Sonnet 4-20250514, Gemini 2.5-flash, Grok 2-1212.
- **Document Generation**: AI-powered content generation with direct DOCX export. Sections generated directly from formData without HTML parsing. Entity cases include search/CRUD flows, API cases include error codes (400/401/500), Service cases include frequency/execution time fields.
- **Intelligent Validation**: **UPDATED 2025-01-06**: Verb infinitive validation now uses regex pattern `/^[a-záéíóúñ]+(ar|er|ir)$/` plus irregular verbs (ver, ser, ir). System recognizes any Spanish infinitive verb automatically. Removed unused hardcoded verb list.
- **Minute Analysis**: **UPDATED 2025-01-06**: Now extracts all fields specific to each use case type. Entity: filters/columns/fields. API: endpoint/method/request/response. Service: frequency/execution time/configuration paths/credentials.
- **Description Expansion**: Automatically expands descriptions < 50 words to 2 professional paragraphs using dedicated AI prompt.
- **Wireframe Generation**: HTML generation → Puppeteer screenshot → Sharp compression → DOCX embedding pipeline. Professional Microsoft-style tables with actual form data.
- **Test Case Generation**: AI creates intelligent test cases with objectives, preconditions, and professional step tables (Nº, Action, Input, Expected Result, Observations, Status).
- **File Naming Protection**: Comprehensive prevention of file extensions (.json, .docx, .xml) through prompt rules, regex cleaning, and post-processing validation.
- **API Section Enforcement**: Function `ensureApiSections` adds missing mandatory sections post-AI generation. **RESOLVED 2025-01-06**: Validation error fixed by adding service-oriented verbs (conciliar, ejecutar, monitorear, supervisar, automatizar) to validation logic.

## External Dependencies

### AI Services
- **OpenAI**: For GPT models.
- **Anthropic Claude**: An alternative AI provider.
- **X.AI Grok**: Another AI model option.
- **Google Gemini**: Google's AI service.

### Document Processing
- **Puppeteer**: Used for screenshotting HTML wireframes.
- **Sharp**: For image compression.
- **docx**: Library for Microsoft Word document generation.

### Utilities
- **date-fns**: Utilities for date formatting.