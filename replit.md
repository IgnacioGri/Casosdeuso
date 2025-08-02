# Use Case Generator Application

## Overview

This is a full-stack web application designed to generate standardized use case documents using AI services. The application provides a multi-step form for collecting requirements and then formats the output into consistent, professional documents, adhering to Microsoft-style formatting. Initially developed with JavaScript/TypeScript + React + Node.js, it has been successfully migrated to C# + Blazor WebAssembly + ASP.NET Core while retaining all original functionality. The system includes robust error handling and a demo mode that operates without requiring API keys, facilitating easy testing and evaluation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application employs a modern full-stack .NET architecture, ensuring a clear separation of concerns:

### Frontend Architecture (Blazor WebAssembly)
- **Framework**: Blazor WebAssembly with .NET 8.
- **UI Library**: MudBlazor component library for Material Design principles.
- **State Management**: Built-in Blazor state management complemented by local storage.
- **Styling**: Custom ING corporate colors, Segoe UI typography, and responsive design via MudBlazor's grid system.

### Backend Architecture (ASP.NET Core)
- **Framework**: ASP.NET Core 8 Web API.
- **Language**: C#.
- **API Style**: RESTful API utilizing JSON for communication.
- **Database**: Entity Framework Core, configured for an in-memory database by default, with readiness for PostgreSQL.
- **Security**: Implemented `HttpClient Factory` for memory leak prevention, comprehensive input sanitization (XSS, path traversal), robust validation in controllers (request size limits), custom rate limiting (100 requests/minute), and 30-second timeouts for all HttpClients.
- **Code Quality**: All server-side build warnings resolved. Clean build with 0 errors and 0 warnings on server components.

### Core Features
- **Multi-step Form System**: Progressive form with 9 steps for entity use cases and 6 for others, featuring dynamic fields and client-side validation.
- **AI Integration Layer**: Supports multiple AI providers (OpenAI, Claude, Grok, Gemini) via an abstracted `AIService`, including a demo mode for testing without API keys.
- **Document Generation**: AI-powered content generation with direct DOCX export, utilizing predefined templates with Microsoft-style formatting.
- **Test Case Integration**: Intelligent test case generation fully integrated into the document generation process, appearing in DOCX export with professional table formatting. Enhanced error handling with fallback test step generation when AI responses are incomplete.
- **Data Management**: Primarily uses in-memory storage for development and demo purposes, with a defined architecture for PostgreSQL integration using Drizzle ORM for production.

### Recent Updates (February 2, 2025) - Performance Optimizations
- **Gemini Model Optimization**: Changed from `gemini-2.5-pro` to `gemini-2.5-flash` for 3-6x faster generation
- **Token Limits Added**: Limited responses to 8000 tokens for use cases, 2000 for test cases
- **Enhanced Progress Indicators**: Added real-time status updates during generation process
- **Temperature Optimization**: Reduced to 0.3 for more consistent and faster responses

### Recent Updates (February 2, 2025) - Complete System Synchronization
- **HTML Preview Completely Removed**: Eliminated all preview functionality from BOTH React AND C# systems
  - React: Removed ~300 lines including EnhancedDocumentPreview component
  - C#: Removed ResultDialog, ExportHtml method, and showResultDialog state
  - Both systems now generate and download DOCX directly in one step
  - Simplified architecture: no intermediate HTML generation or preview state
  - Preview removal justified: HTML never matched exact DOCX format, served no purpose
  - Both systems now have identical behavior: click "Generar y Descargar" → immediate DOCX download
- **DOCX Export Architecture Fix**: Resolved fundamental issue where system was incorrectly using legacy HTML-to-DOCX conversion
  - Both React and C# systems now ALWAYS use direct formData-to-DOCX generation method
  - HTML conversion methods marked as deprecated with clear documentation
  - All DOCX endpoints now require and validate formData presence
  - Added Result Dialog in Blazor Generator.razor to display generated content with export options
  - Updated Blazor DocumentService to pass formData when exporting DOCX
  - Ensures consistent professional ING corporate formatting across both systems
- **Complete Functional Parity Achieved**: Both React and C# systems now identical in all aspects
  - Fixed footer format: "página X de Y" (lowercase) with Segoe UI Semilight font in both systems
  - Implemented AddEntityFieldsTable in C# matching React's professional table format
  - Verified AI provider cascading order: Copilot → Gemini → OpenAI → Claude → Grok
  - Confirmed all table formats use ING corporate blue header (#DEEAF6)
  - Both systems ready for local deployment with identical user experience

### Recent Updates (February 2, 2025)
- **Enhanced AI Description Generation**: Improved AI prompts to generate detailed descriptions (1-2 paragraphs minimum) for better use case quality
- **Hierarchical Flow Format**: Updated C# DocumentService to match TypeScript implementation with proper hierarchical numbering (1/a/i format)
- **Added Preconditions/Postconditions**: Added preconditions and postconditions sections for entity use cases in C# system with default values
- **Test Cases Table Format**: Updated C# test cases section to use professional table format matching TypeScript implementation
- **Added Helper Methods**: Added ToRomanNumeral helper method to C# system for consistent hierarchical numbering
- **Styled Headings**: Implemented AddStyledHeading method in C# with ING corporate blue borders matching TypeScript design
- **Consistent Formatting**: Both systems now generate identical DOCX documents with synchronized formatting and structure

### Recent Updates (January 31, 2025)
- **Enhanced Intelligent Test Case Parsing**: Improved JSON parsing logic to handle various AI response formats more robustly
- **Fallback Test Step Generation**: Added automatic fallback test step generation when AI doesn't provide complete test steps
- **Better Error Logging**: Enhanced logging for intelligent test case generation to help diagnose integration issues
- **Test Case Export Integration**: Ensured intelligent test cases are properly included in DOCX exports
- **Cascading AI Provider Fallback**: Implemented automatic fallback mechanism that tries multiple AI providers in sequence if one fails - applies to ALL AI models, not just demo
- **Demo Mode Restored**: When "demo" is selected, system now uses pre-loaded data without calling any AI APIs - provides instant response with example content
- **Consistent Error Handling**: Both TypeScript and C# systems now have identical cascading fallback logic and error messages in Spanish
- **DOCX Export Fix**: Fixed type validation error in DOCX export where testCasePreconditions could be non-string values (arrays/objects from AI responses)
- **UI Improvements**: Updated progress indicator with correct step names and smaller icons (w-8 h-8) for better visual balance with 11 steps
- **Help Content Updates**: Refreshed help button content to match current form structure with accurate step descriptions and AI Assist availability
- **Progress Indicator Corrections**: Fixed step naming confusion - Step 9 is now "Config Pruebas" (decision), Step 10 is "Pruebas" (test cases), Step 11 is "Generar" (final generation)
- **C# Blazor Sync**: Created EnhancedProgressIndicator.razor and HelpButton.razor components to match React functionality exactly
- **DOCX Header Fix**: Corrected header image aspect ratio (height from 80 to 60 pixels) to prevent vertical stretching in both React and C# systems
- **Page Numbering**: Added "Página X de Y" footer to DOCX exports following ING minute standards in both systems
- **Entity Fields Table Format**: Converted entity fields display from list to table format for better readability based on company owner feedback
- **Historia de Revisiones Table**: Implemented native DOCX table for revision history with professional ING styling (light blue header #DEEAF6)
- **Professional Heading Styles**: Added corporate ING heading style with blue borders (bottom and left), uppercase text, and proper spacing
- **Test Cases Table Format**: Converted test cases from paragraph format to professional table with columns: #, Acción, Datos de entrada, Resultado esperado, Observaciones, Estado (P/F)

## External Dependencies

### AI Services
- **OpenAI**: Utilized for GPT models.
- **Anthropic Claude**: An alternative AI provider.
- **X.AI Grok**: Another AI model option.
- **Google Gemini**: Google's AI service.

### Document Processing
- **docx**: Library for Microsoft Word document generation.
- **date-fns**: Utilities for date formatting.