# Use Case Generator Application

## Overview
This full-stack web application generates standardized use case documents using AI. It features a multi-step form for requirements collection and formats outputs into consistent, professional documents adhering to Microsoft-style formatting. The application supports robust error handling and includes a demo mode for testing without API keys. The project aims to provide a streamlined, AI-powered solution for producing high-quality, standardized documentation, enhancing efficiency and consistency in project development, with a vision to streamline project development processes and ensure consistency in documentation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application utilizes a modern full-stack JavaScript/TypeScript architecture with React frontend and Express backend.

### Recent Changes (2025-01-09)
- **Architecture Migration**: Migrated from Blazor/.NET to Node.js/React/Express stack
- **Deployment Configuration**: Fixed deployment issues for Replit Autoscale
  - Server configured to use dynamic PORT environment variable allocation (respects platform-assigned ports)
  - Host binding set to "0.0.0.0" for all interfaces accessibility
  - Production build tested and verified working
  - Build outputs to `dist/` directory with static assets in `dist/public/`
  - Deployment scripts configured in package.json (`build` and `start` commands)

### Frontend Architecture (React/Vite)
- **Framework**: React 18 with TypeScript and Vite build system
- **UI Library**: Shadcn/UI components with Tailwind CSS
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom design tokens and responsive design

### Backend Architecture (Express/Node.js)
- **Framework**: Express.js with TypeScript
- **Database**: Drizzle ORM with PostgreSQL support, in-memory storage for development
- **API Style**: RESTful API with JSON responses
- **Security**: CORS configuration, input validation with Zod schemas
- **Deployment**: Configured for Replit Autoscale with dynamic port allocation

### Core Features
- **Multi-step Form System**: Progressive forms (10 steps for entity, 9 for reports, 7 for API/service) with dynamic fields and client-side validation.
- **AI Integration Layer**: Abstracted `AIService` supports multiple AI providers with cascading fallback (Copilot → Gemini → OpenAI → Claude → Grok). **UPDATED 2025-01-06**: All models now use latest versions consistently in both React and Blazor: GPT-4o, Claude Sonnet 4-20250514, Gemini 2.5-flash, Grok 2-1212.
- **Document Generation**: AI-powered content generation with direct DOCX export. Sections generated directly from formData without HTML parsing. Entity cases include search/CRUD flows, API cases include error codes (400/401/500), Service cases include frequency/execution time fields. **NEW 2025-01-09**: Reports type generates read-only documentation with export functionality.
- **Reports Type (NEW 2025-01-09)**: New use case type for read-only data scenarios. Features search filters, result columns, and export configuration (formats, limits, grouping, aggregation). Workflow: filters → columns → export config → business rules → wireframes (search-only). No entity fields or CRUD operations.
- **Intelligent Validation**: **UPDATED 2025-01-06**: Verb infinitive validation now uses regex pattern `/^[a-záéíóúñ]+(ar|er|ir)$/` plus irregular verbs (ver, ser, ir). System recognizes any Spanish infinitive verb automatically. Removed unused hardcoded verb list.
- **Minute Analysis**: **UPDATED 2025-01-06**: Now extracts all fields specific to each use case type. Entity: filters/columns/fields. API: endpoint/method/request/response. Service: frequency/execution time/configuration paths/credentials. Reports: filters/columns/export formats/limits.
- **Description Expansion**: Automatically expands descriptions < 50 words to 2 professional paragraphs using dedicated AI prompt.
- **Wireframe Generation**: HTML generation → Puppeteer screenshot → Sharp compression → DOCX embedding pipeline. Professional Microsoft-style tables with actual form data. Reports type generates search-only interface with specific actions: "Ver"/"Descargar" instead of CRUD operations, "Excel"/"PDF" export buttons instead of "Agregar". Form wireframe hidden for reports type.
- **Test Case Generation**: AI creates intelligent test cases with objectives, preconditions, and professional step tables (Nº, Action, Input, Expected Result, Observations, Status). Incorporates user feedback through suggestions system.
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