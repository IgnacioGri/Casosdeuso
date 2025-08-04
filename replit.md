# Use Case Generator Application

## Overview
This full-stack web application generates standardized use case documents using AI. It features a multi-step form for requirements collection and formats outputs into consistent, professional documents adhering to Microsoft-style formatting. The application supports robust error handling and includes a demo mode for testing without API keys. The project aims to provide a streamlined, AI-powered solution for producing high-quality, standardized documentation, enhancing efficiency and consistency in project development.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)
- **[CRITICAL FIX]** Enhanced wireframe generation with dynamic data: Replaced hardcoded generic wireframes with data-driven generation using actual user form data (filters, columns, fields).
- **New Functions Added**: Implemented `generateEntitySearchWireframe()`, `generateCompleteEntityWireframes()`, `generateServiceWireframe()`, and `generateCompleteServiceWireframes()` in both TypeScript and C# systems.
- **User Feedback Integration**: Wireframes now use specific form data instead of generic placeholders like "Apellido", "DNI", "Segmento".
- **Enhanced AI Assistance**: Improved field enhancement capabilities with context-aware wireframe generation for all use case types (entity, API, process).
- **UI Enhancements**: Added smart autocomplete with contextual suggestions, informative tooltips with Ingematica styling, and professional micro-interactions for better user experience.
- **Animation Fixes**: Changed inappropriate animations - minute analysis from 'float' to 'pulse' and test generation from 'bounce' to 'spin' for more professional appearance.
- **UI Enhancement Components Created**: Built 4 new Blazor components to match TypeScript UI features: `SmartAutocomplete.razor`, `ContextualTooltip.razor`, `MicroInteractions.razor`, and `AdaptiveLoading.razor`.
- **Component Integration Progress**: Successfully integrated UI enhancements across key components:
  - BasicInfoStep: Added SmartAutocomplete for project name with intelligent suggestions and ContextualTooltip for field guidance
  - FiltersColumnsStep: Integrated SmartAutocomplete for both filters and columns with context-aware suggestions
  - MinuteAnalysis: Replaced MudProgressCircular with AdaptiveLoading using professional pulse animation
  - TestCasesStep: Updated to use AdaptiveLoading with spin animation for test generation
  - EntityFieldsStep: Implemented AdaptiveLoading with pulse animation for field generation
- **Minute Analysis Animation Update**: Modified both React and Blazor versions to replace progress step list with "Pensando..." button animation featuring violet pulse effect (#6b5b95) and animated dots that cycle through "..." → "...." → "....." → "......" every 400ms
- **[CRITICAL FIX]** Fixed null reference errors in SmartAutocomplete components: Both React and Blazor versions now properly handle null values in input fields, preventing crashes when minute analysis returns null values for fields like clientName or projectName
- **[CRITICAL FIX]** Enhanced description expansion prompts: After client feedback showing descriptions weren't expanding to required 2 paragraphs (150+ words), reinforced AI instructions with warning emojis (⚠️), explicit word count requirements per paragraph (75+ words each), and specific examples of the problem (e.g., "Mostrar proveedores"). Updated both React and Blazor systems with identical enhanced prompts.
- **[CRITICAL FIX]** Implemented automatic description expansion: Added a pre-processing step that detects short descriptions (<50 words) and expands them using a dedicated AI prompt before generating the full document. This ensures descriptions always meet the 2-paragraph requirement regardless of the AI model's response to the main prompt. Implemented in both React and Blazor systems.
- **[CRITICAL FIX COMPLETED]** Fixed description expansion flow: The server was successfully expanding descriptions but the client wasn't updating the form or DOCX with the expanded text. Fixed by:
  - React: Updated mutation to capture expandedDescription from response and update both form state and DOCX export data
  - Blazor: Added ExpandedDescription property to response DTO and updated Generator.razor to handle it
  - Both systems now properly display expanded descriptions in UI and generate DOCX with full 2-paragraph content
- **[CRITICAL FIX]** Fixed test case table formatting issue: Tables were getting cut off when containing extensive text. Fixed by:
  - React: Changed table width to 100% and all column widths from fixed DXA units to percentages (5%, 25%, 20%, 25%, 18%, 7%)
  - Blazor: Updated table to use percentage-based widths matching React system
  - Tables now properly expand rows vertically when text is long instead of cutting off content
- **[ENHANCEMENT]** Converted test case tables to bullet/sub-bullet format for improved readability:
  - React: Replaced table structure with bullet points using document library's bullet property
  - Blazor: Replaced AddTestCasesTable with AddTestCasesList using NumberingProperties for bullets
  - Format: Each test step becomes a main bullet with "Paso X" followed by sub-bullets for Acción, Datos de entrada, Resultado esperado, Observaciones, and Estado
  - Both systems maintain identical formatting and structure for consistency
- **[CRITICAL SYNC]** AI assist prompts now generate bullet-formatted content across both systems:
  - React: Updated getFieldRules(), generateIntelligentBusinessRules(), and generateIntelligentSpecialRequirements() to output bullet format (•) instead of numbered lists
  - Blazor: Updated GetFieldRules() with bullet formatting rules for businessRules, specialRequirements, testCaseObjective, and testCasePreconditions fields
  - Enhanced with warning emojis (⚠️) and explicit format requirements to ensure AI compliance
  - Both systems now generate consistent bullet-point content that matches BulletTextarea component behavior
  - Improved user experience: AI suggestions automatically match the expected format in forms

## System Architecture
The application utilizes a modern full-stack .NET architecture, ensuring a clear separation of concerns.

### Frontend Architecture (Blazor WebAssembly)
- **Framework**: Blazor WebAssembly with .NET 8.
- **UI Library**: MudBlazor for Material Design.
- **State Management**: Built-in Blazor state management and local storage.
- **Styling**: Custom ING corporate colors, Segoe UI typography, and responsive design.

### Backend Architecture (ASP.NET Core)
- **Framework**: ASP.NET Core 8 Web API.
- **Language**: C#.
- **API Style**: RESTful API with JSON.
- **Database**: Entity Framework Core (in-memory default, PostgreSQL ready).
- **Security**: HttpClient Factory, input sanitization, robust validation, custom rate limiting (100 requests/minute), and 30-second HttpClient timeouts.
- **Code Quality**: 0 errors and 0 warnings on server components.

### Core Features
- **Multi-step Form System**: Progressive forms (9 steps for entity, 6 for others) with dynamic fields and client-side validation.
- **AI Integration Layer**: Abstracted `AIService` supports OpenAI, Claude, Grok, and Gemini, including a demo mode.
- **Document Generation**: AI-powered content generation with direct DOCX export using predefined Microsoft-style templates. Includes full wireframe embedding in "BOCETOS GRÁFICOS DE INTERFAZ DE USUARIO" section.
- **Test Case Integration**: AI-driven test case generation integrated into DOCX export with professional table formatting. Includes fallback generation for incomplete AI responses.
- **Data Management**: In-memory storage for development, with architecture defined for PostgreSQL integration.
- **Prompt Synchronization & Optimization**: AI prompts are optimized for structured content generation, ensuring detailed descriptions, hierarchical formatting, and consistent field properties. Both systems (C# and previous React) use identical enhanced prompts.
- **Performance Optimizations**: Utilizes `gemini-2.5-flash` for faster generation, increased token limits (16000 for docs, 12000 for test cases, 10000 for minute analysis, 4000 for fields), enhanced progress indicators, and standardized temperature (0.3).
- **DOCX Formatting Consistency**: Ensures consistent corporate branding with specific header images (600x79 pixels), "página X de Y" footers, professional table formats (ING corporate blue header #DEEAF6), and corporate heading styles with blue borders.
- **AI Provider Fallback**: Implements an automatic cascading fallback mechanism: Copilot → Gemini → OpenAI → Claude → Grok.
- **Dynamic Wireframe Generation**: Enhanced wireframe generation using actual form data (filters, columns, fields) instead of hardcoded generic values. Implements data-driven wireframes for entity, API, and process use cases with complete CRUD functionality.
- **System Synchronization**: Both frontend and backend systems maintain functional and UI parity, including the removal of HTML preview functionality for direct DOCX download, and removal of help buttons.

## External Dependencies

### AI Services
- **OpenAI**: For GPT models.
- **Anthropic Claude**: An alternative AI provider.
- **X.AI Grok**: Another AI model option.
- **Google Gemini**: Google's AI service.

### Document Processing
- **docx**: Library for Microsoft Word document generation.
- **date-fns**: Utilities for date formatting.