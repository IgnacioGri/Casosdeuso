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
- **Document Generation**: AI-powered content generation with support for HTML preview and DOCX export, utilizing predefined templates and live preview with Microsoft-style formatting.
- **Test Case Integration**: Intelligent test case generation fully integrated into the document generation process, appearing in both HTML preview and DOCX export with professional table formatting.
- **Data Management**: Primarily uses in-memory storage for development and demo purposes, with a defined architecture for PostgreSQL integration using Drizzle ORM for production.

## External Dependencies

### AI Services
- **OpenAI**: Utilized for GPT models.
- **Anthropic Claude**: An alternative AI provider.
- **X.AI Grok**: Another AI model option.
- **Google Gemini**: Google's AI service.

### Document Processing
- **docx**: Library for Microsoft Word document generation.
- **date-fns**: Utilities for date formatting.