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