# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server on port 9002 (not default 3000)
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm run typecheck` - Run TypeScript type checking

### AI Development
- `npm run genkit:dev` - Start Genkit development server for AI features (runs on port 3100)
- `npm run genkit:watch` - Start Genkit with file watching for development

### Testing and Quality
Always run `npm run typecheck` and `npm run lint` before committing changes to ensure code quality.

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI Integration**: Genkit with Google Gemini 2.0 Flash model
- **UI Components**: Radix UI primitives with custom styling

### Key Architectural Patterns

#### Multi-Tenant DCIM System
The application is a Data Center Infrastructure Management (DCIM) system with multi-tenant architecture:
- **Assets**: Servers, switches, patch panels, endpoints, PDUs, UPS units
- **Locations**: Floor plans with rack placement and U-space management
- **Connectivity**: Port-to-port connections for network and power tracing
- **AI Assistant**: Integrated AI for optimization and troubleshooting

#### Data Models
- **Assets**: Flexible schema system with type-specific custom fields (see `src/lib/asset-schemas.ts`)
- **Racks**: Visual rack management with U-space allocation
- **Ports**: Network and power port connectivity tracking
- **Locations**: Floor plan visualization and asset placement

#### Component Organization
- `src/components/ui/` - Base UI components from Shadcn
- `src/components/dashboard/` - Dashboard widgets and layout
- `src/components/floor-plan/` - Floor plan visualization components
- `src/components/racks/` - Rack management and visualization
- `src/components/[feature]/` - Feature-specific components

### Database Integration
- Uses Supabase with TypeScript types generated in `src/lib/database.types.ts`
- Client-side: `src/lib/supabase/client.ts`
- Server-side: `src/lib/supabase/server.ts`
- Path alias `@/*` maps to `src/*`

### AI Integration
- AI service configured in `src/ai/genkit.ts` using Google Gemini 2.0 Flash
- AI assistant widget integrated into dashboard
- Flows defined in `src/ai/flows/`

## Environment Setup

Required environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
GOOGLE_API_KEY="your_google_api_key_for_genkit"
```

## Development Notes

### Asset Schema System
- Asset types defined in `src/lib/asset-schemas.ts` with dynamic form generation
- Each asset type has custom fields stored as JSON in the database
- Forms automatically generated based on schema definitions

### Build Configuration
- TypeScript build errors are ignored (`ignoreBuildErrors: true`)
- ESLint errors are ignored during builds (`ignoreDuringBuilds: true`)
- This suggests the codebase may have existing type/lint issues

### Styling
- Uses Tailwind CSS with custom design system
- Dark mode enabled by default
- Custom fonts: Space Grotesk and Inter
- UI components follow Shadcn patterns

### Port Configuration
- Development server runs on port 9002 (not standard 3000)
- Genkit AI service runs on port 3100
- Ensure both ports are available when developing

### Key Files to Understand
- `src/lib/database.types.ts` - Database schema and types
- `src/lib/asset-schemas.ts` - Asset type definitions and custom fields
- `src/components/dashboard/AI_Assistant_Widget.tsx` - AI integration
- `src/app/layout.tsx` - Global layout and styling setup