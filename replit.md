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
- **AI Integration Layer**: Abstracted `AIService` supports multiple AI providers, including a demo mode, with a cascading fallback mechanism (Copilot → Gemini → OpenAI → Claude → Grok).
- **Document Generation**: AI-powered content generation with direct DOCX export using predefined Microsoft-style templates. Includes full wireframe embedding and AI-driven test case generation with professional table formatting. Ensures consistent corporate branding and specific document formatting.
- **Data Management**: In-memory storage for development, with architecture defined for PostgreSQL integration.
- **Prompt Synchronization & Optimization**: AI prompts are optimized for structured content generation, ensuring detailed descriptions, hierarchical formatting, and consistent field properties across both frontend and backend. Prompts include explicit format requirements and content cleaning.
- **Performance Optimizations**: Utilizes `gemini-2.5-flash` for faster generation, increased token limits for various processes, enhanced progress indicators, and standardized temperature.
- **Dynamic Wireframe Generation**: Generates professional, data-driven HTML-based wireframes instantly, using actual form data (filters, columns, fields), with Microsoft enterprise styling. Wireframes are embedded as images in DOCX documents with correct dimensions.
- **System Synchronization**: Both frontend and backend systems maintain functional and UI parity.
- **Description Expansion**: Automatically expands short descriptions using a dedicated AI prompt to meet minimum length requirements.
- **API Use Case Structure**: Enforces mandatory sections and detailed JSON examples for API use cases to match minute requirements. Includes specific "FLUJO PRINCIPAL DE EVENTOS" and "FLUJOS ALTERNATIVOS" sections with detailed request/response examples and error handling (400, 401/403, 500 codes).
- **File Naming Protection**: Comprehensive prevention system for AI-generated inappropriate file extensions. Both document generation and minute analysis include explicit prompt rules, regex cleaning patterns, and post-processing validation to eliminate .json, .docx, .xml, and other extensions from fileName fields.

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