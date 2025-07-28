# Use Case Generator Application

## Overview

This is a full-stack web application built for generating standardized use case documents. The application provides a multi-step form interface for collecting use case requirements and uses AI services to generate properly formatted documentation. It's designed to help teams create consistent, professional use case documents with Microsoft-style formatting.

The application now features robust error handling and can operate without API keys in demo mode, making it accessible for testing and evaluation without requiring immediate setup of external AI services.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Updated: 27/7/2025)

✓ Fixed application startup issues when API keys are missing
✓ Implemented lazy loading of AI service clients to prevent errors
✓ Added proper error handling for missing API configurations
✓ Ensured demo mode works independently of external services
✓ Fixed form validation issues in steps 2 and 4 with verb infinitives
✓ Added AI response cleaning to remove explanatory text and CSS blocks
✓ Configured OpenAI and Gemini APIs for professional content generation
✓ Updated business rules to match comprehensive specification document
✓ Enhanced prompt engineering for strict AI compliance
✓ Improved document parsing for better Word export quality
✓ Implemented strict file name validation (2 letters + 3 numbers + descriptive name)
✓ Added type-specific form fields (API endpoints, Service configurations)
✓ Enhanced content generation with multi-level numbered lists (1, a, i)
✓ Integrated professional Word export with Ingematica header branding
✓ Added mandatory "Historia de Revisiones y Aprobaciones" table
✓ Configured Segoe UI Semilight font and specific blue colors for documents
✓ Enhanced AI prompts with stronger rejection of explanatory text (January 27, 2025)
✓ Added dynamic wireframe descriptions fields with add/remove functionality
✓ Implemented multiple alternative flows support for error scenarios
✓ Fixed document download button functionality with proper export API calls
✓ Updated form structure to support expandable wireframe and flow arrays
✓ Unified AI prompts between initial generation and editing functions (January 27, 2025)
✓ Enhanced content cleaning patterns to remove all explanatory text from AI responses
✓ Added HTML download functionality alongside existing DOCX export option
✓ Fixed document generation consistency across all AI operations
✓ Added premium client example auto-complete button for complex use case demonstration
✓ Implemented "Gestionar Clientes Premium" example with comprehensive banking scenario
✓ Complete rewrite of DOCX generation service to fix indentation and duplication issues (January 27, 2025)
✓ Fixed hierarchical list indentation to match HTML preview structure (1., a., i. levels)
✓ Eliminated duplicate "HISTORIA DE REVISIONES Y APROBACIONES" tables in exported documents
✓ Improved HTML parsing with line-by-line processing to preserve structure
✓ Implemented revolutionary "AI Assist" functionality for individual field improvements (January 27, 2025)
✓ Created AIAssistButton component with React Query integration and real-time field enhancement
✓ Added field-specific improvement rules based on ING specifications for professional content quality
✓ Integrated AI Assist buttons into key form fields: client name, project name, use case code, use case name, file name, description, and search filters
✓ Enhanced form UX with intelligent content suggestions and automatic format corrections
✓ Implemented revolutionary text-to-list conversion system for structured data entry (January 27, 2025)
✓ Added superior text fields in Steps 5-7 allowing users to describe requirements in natural language
✓ Enhanced AI Assist to automatically convert free-form text into structured lists (filters, columns, entity fields)
✓ Improved UX with larger, resizable text areas and comprehensive field coverage across all form steps
✓ Added intelligent JSON parsing for entity fields with fallback to simple text processing
✓ Completed AI Assist coverage in Step 8 with all missing buttons added (January 27, 2025)
✓ Implemented AI assistance for wireframe descriptions, alternative flows, business rules, and special requirements
✓ Added comprehensive field-specific improvement rules for all Step 8 field types
✓ Enhanced demo mode with realistic examples for all new AI-assisted fields
✓ Expanded Step 8 fields to large textareas for better free-text input and AI transformation visibility
✓ Added top and bottom navigation buttons for improved user experience across all form steps
✓ Fixed critical AI Assist functionality that was returning original values instead of improvements (January 27, 2025)
✓ Enhanced getDemoFieldImprovement method to detect placeholder text and generate professional replacements
✓ Added intelligent field recognition for descriptions, client names, and project names with meaningful improvements
✓ Implemented placeholder text detection for automatic replacement of generic content with ING-compliant examples
✓ Fixed AI Assist text-to-list conversion for search filters with intelligent Spanish text parsing (January 27, 2025)
✓ Added text-to-list conversion for result columns with pattern recognition for column descriptions
✓ Enhanced form data types with filtersDescription and columnsDescription fields for improved UX
✓ Implemented intelligent extraction of filter and column names from natural language descriptions
✓ Implemented crucial separation: AI only for field improvements, document generation always uses formatting-only mode (January 27, 2025)
✓ Modified final "Generate Document" button to always apply styles/formatting without AI, regardless of selected model
✓ Clarified system architecture: AI Assist for individual fields, pure formatting for final document output
✓ Redesigned AI model selector with professional Radix UI components, unique icons and themed colors (January 27, 2025)
✓ Enhanced Step 1 layout with centered design and clear explanation of AI configuration purpose
✓ Removed unnecessary AI Assist buttons from Step 3 basic information fields (client name, project name, use case code)
✓ Removed AI Assist buttons from Step 4 structured fields (use case name, file name) keeping only description field
✓ Streamlined form UX by limiting AI assistance to complex descriptive fields where it adds genuine value
✓ Preserved validation rules for structured fields while simplifying interface design
✓ Successfully integrated new Gemini API key with real-time AI field improvements (January 27, 2025)
✓ Enhanced AI Assist system to use real Gemini API for regular fields while maintaining specialized text-to-list processing
✓ Fixed entity fields description AI Assist to properly convert natural language into structured JSON field definitions
✓ Added fieldsDescription field support with controlled textarea input for better form state management
✓ Completed comprehensive AI Assist coverage across all form steps with intelligent API routing
✓ Enhanced entity fields AI Assist with intelligent text analysis and professional field generation (January 27, 2025)
✓ Implemented dual feedback system: structured textarea formatting and automatic field creation
✓ Added comprehensive field pattern recognition for names, contacts, dates, IDs, status, and addresses
✓ Enhanced text parsing to extract field types, mandatory/optional status, and length constraints
✓ Created fallback system using intelligent analysis when AI APIs are unavailable or return errors
✓ Fixed critical systemic issue where AI Assist fields were returning fixed demo content instead of analyzing user input (January 27, 2025)
✓ Completed comprehensive audit and replacement of all fixed demo responses with intelligent text analysis functions
✓ Enhanced wireframe descriptions, alternative flows, business rules, and special requirements with smart content processing
✓ Implemented pattern recognition for professional formatting, structure addition, and context enhancement across all field types
✓ Ensured all AI Assist buttons now provide genuine value through intelligent user input analysis rather than placeholder content
✓ Fixed critical formatting issues in AI Assist system with enhanced text cleaning and professional formatting (January 27, 2025)
✓ Resolved duplicated numbering bug in specialRequirements and businessRules fields
✓ Implemented comprehensive text cleaning to remove quotes, extra whitespace, and unwanted characters
✓ Enhanced professional formatting with proper capitalization, punctuation, and structure across all field types
✓ Added intelligent pattern recognition to ensure consistent numbering and proper sentence structure
✓ Implemented comprehensive ING compliance improvements with priority features (January 27, 2025)
✓ Added dynamic prompts based on use case type (entidad/api/proceso) with specific rules for each
✓ Enhanced entity fields with auto-inclusion of mandatory ING compliance fields (fechaAlta, usuarioAlta, fechaModificacion, usuarioModificacion)
✓ Integrated ING minuta context directly in all AI prompts with professional formatting requirements
✓ Added development mode logging for complete transparency of AI prompts and responses
✓ Enhanced wireframe descriptions with ING-specific UI elements and paginado standards
✓ Implemented multi-level numbered lists (1-a-i) with proper indentation for all structured fields
✓ Fixed critical AI Assist function routing issue preventing specialized field processing in demo mode (January 27, 2025)
✓ Corrected business rules, wireframes, alternative flows, and special requirements AI Assist functionality 
✓ Resolved demo mode bypassing intelligent field processors by reordering function execution logic
✓ Enhanced business rules with proper numbered list formatting (1., 2., 3.) and professional capitalization
✓ Verified all specialized field types now process correctly in both AI and demo modes
✓ Implemented comprehensive multi-level numbered lists (1-a-i) with intelligent content analysis (January 27, 2025)
✓ Enhanced business rules and special requirements with automatic sub-item generation based on keyword detection
✓ Added intelligent pattern recognition for DNI validation, integration requirements, and technical specifications
✓ Created generateMultiLevelList function with ING-compliant formatting and professional sub-item suggestions
✓ Implemented comprehensive AI provider specialization system (January 27, 2025)
✓ Created buildProviderSpecificPrompt function with optimized prompts for OpenAI, Claude, Grok, and Gemini
✓ Enhanced each AI model with provider-specific instruction patterns for maximum effectiveness
✓ Added structured prompts tailored to each AI's strengths (step-by-step for OpenAI, contextual for Claude, direct for Grok, JSON-like for Gemini)
✓ Implemented comprehensive help system with HelpButton component for all form steps (January 27, 2025)
✓ Created detailed step-by-step instructions explaining ING minuta compliance requirements in user-friendly language
✓ Added AI Assist usage explanations for applicable steps with clear instructions on how to leverage AI functionality
✓ Replaced legacy ContextualHelp component with new comprehensive help system covering all 9 form steps
✓ Integrated help dialogs with specific guidance for each use case type (entidad, api, proceso) and field-specific instructions
✓ Streamlined AI Assist system by removing individual buttons from list items (January 28, 2025)
✓ Removed individual AI Assist buttons from filters, columns, entity fields, wireframes, and alternative flows
✓ Maintained only the main AI Assist functionality for text-to-list conversion in each step's description field
✓ Simplified UX by focusing AI assistance on the primary conversion functions rather than individual item improvements
✓ Updated form styling to remove unnecessary padding that was reserved for removed AI buttons
✓ Updated help button design to show only "?" icon without text for cleaner interface
✓ Revised help content to reflect streamlined AI Assist system without individual element buttons
✓ Added AI Assist buttons for wireframes and alternative flows description fields (January 28, 2025)
✓ Implemented wireframesDescription and alternativeFlowsDescription fields with dedicated AI processing
✓ Enhanced AI service with generateIntelligentWireframesDescription and generateIntelligentAlternativeFlowsDescription functions
✓ Added comprehensive schema support for new description fields with proper database column definitions

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON communication
- **Development Setup**: Custom Vite integration for development server

### Styling and Design System
- **CSS Framework**: Tailwind CSS with custom Microsoft-inspired design tokens
- **Component Library**: Shadcn/ui components built on Radix UI primitives
- **Theme**: Microsoft-style color scheme with CSS custom properties
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts

## Key Components

### Use Case Form System
- **Multi-step Form**: Progressive form with 9 steps for entity use cases, 6 for others
- **Form Validation**: Zod schemas for type-safe validation
- **Dynamic Fields**: Addable/removable lists for filters, columns, and entity fields
- **Form State Management**: Custom hook (`useUseCaseForm`) for form state coordination

### AI Integration Layer
- **Multi-Provider Support**: Supports OpenAI, Claude (Anthropic), Grok (X.AI), and Gemini
- **Service Abstraction**: `AIService` class abstracts different AI provider APIs
- **Demo Mode**: Built-in demo content generation for testing without API calls
- **Error Handling**: Comprehensive error handling for API failures

### Document Generation
- **Content Generation**: AI-powered generation of structured use case documents
- **Document Export**: Support for HTML preview and DOCX export
- **Template System**: Predefined templates following Microsoft documentation standards
- **Live Preview**: Real-time preview of generated content with Microsoft-style formatting

### Data Management
- **In-Memory Storage**: `MemStorage` class for development/demo purposes
- **Database Ready**: Drizzle ORM configuration for PostgreSQL (ready for production)
- **Type Safety**: Full TypeScript coverage with Zod schemas for runtime validation

## Data Flow

1. **Form Input**: User fills out multi-step form with use case details
2. **Validation**: Client-side validation using Zod schemas
3. **API Request**: Form data sent to backend generation endpoint
4. **AI Processing**: Backend calls selected AI service with structured prompt
5. **Content Generation**: AI generates formatted use case document
6. **Storage**: Generated content stored (currently in-memory)
7. **Preview**: Formatted content displayed in Microsoft-style preview
8. **Export**: Optional export to DOCX format

## External Dependencies

### AI Services
- **OpenAI**: GPT models for content generation
- **Anthropic Claude**: Alternative AI provider
- **X.AI Grok**: Additional AI model option
- **Google Gemini**: Google's AI service integration

### Development Tools
- **Vite**: Build tool and development server
- **ESBuild**: Production bundling
- **PostCSS**: CSS processing with Autoprefixer
- **TypeScript**: Type checking and compilation

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management

### Document Processing
- **docx**: Microsoft Word document generation
- **date-fns**: Date formatting utilities

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite-powered development server with HMR
- **Replit Integration**: Custom Replit-specific plugins and configuration
- **Environment Variables**: Support for AI API keys and database connections
- **Error Handling**: Runtime error overlay for development

### Production Build
- **Client Build**: Vite builds React app to `dist/public`
- **Server Build**: ESBuild bundles Node.js server to `dist/index.js`
- **Static Assets**: Client assets served from Express server
- **Single Command**: `npm run build` handles both client and server builds

### Database Strategy
- **Development**: In-memory storage for quick setup and testing
- **Production Ready**: Drizzle ORM with PostgreSQL schema defined
- **Migration Support**: Database migration system ready for deployment
- **Connection Management**: Environment-based database URL configuration

### Scalability Considerations
- **Stateless Design**: Server designed to be stateless for horizontal scaling
- **API Rate Limiting**: Ready for implementation of AI service rate limiting
- **Caching**: Structure supports Redis integration for session management
- **Load Balancing**: Express server compatible with standard load balancers

The application is designed to be easily deployable on various platforms including Replit, with clear separation of concerns and modular architecture that supports both rapid development and production scaling.