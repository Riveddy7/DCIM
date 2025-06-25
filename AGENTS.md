# AGENTS.md - DCIM SaaS Project Guide for Code Agents

This document provides a structured overview of the DCIM SaaS codebase to enable AI agents to make precise and informed modifications and additions.

## 1. Project Overview for Agents

*   **Domain:** Data Center Infrastructure Management (DCIM).
*   **Purpose:** A Software-as-a-Service (SaaS) application to help users manage and visualize their data center assets, racks, locations, connectivity, and capacity.
*   **Architecture:**
    *   **Frontend:** Next.js (React) application using TypeScript, Tailwind CSS, and Shadcn UI.
    *   **Backend:** Supabase provides the backend services, including a PostgreSQL database, authentication, and serverless functions.
    *   **AI Integration:** Genkit with Google AI (Gemini models) for intelligent assistance features.
    *   **Overall Structure:** Monolithic Next.js application interacting with Supabase as a Backend-as-a-Service (BaaS).

## 2. Key Modules/Components Breakdown

*   **`src/app/` (Next.js App Router):**
    *   **Purpose:** Defines page routes, layouts, and server components for different sections of the application.
    *   **Structure:** Subdirectories correspond to URL paths (e.g., `src/app/dashboard/`, `src/app/assets/`, `src/app/racks/[id]/`).
    *   **Key Interfaces:** Page components (`page.tsx`), layout components (`layout.tsx`), server actions.
*   **`src/components/`:**
    *   **Purpose:** Reusable React components.
    *   **Sub-modules:**
        *   `ui/`: Base UI elements (Button, Card, Dialog, etc.), largely from Shadcn UI.
        *   `dashboard/`: Widgets for the main dashboard (KPIs, AI Assistant link, To-Do list).
        *   `floor-plan/`: Components for creating, viewing, and interacting with floor plans (e.g., `FloorPlanCanvas.tsx`, `RackItem.tsx`).
        *   `racks/`: Components for rack visualization (`RackVisualizer.tsx`), asset details within racks (`AssetDetailPanel.tsx`), and forms (`CreateRackForm.tsx`, `CreateAssetForm.tsx`).
        *   `assets/` (Implicit): Forms and views for asset management are often co-located within rack or page components (e.g. `CreateAssetForm.tsx` in `src/components/racks/`).
        *   `ports/`: Components for managing asset ports and connections (`ConnectPortDialog.tsx`, `BulkPortGeneratorForm.tsx`).
        *   `locations/`: Components for managing locations (`CreateLocationForm.tsx`).
*   **`src/lib/`:**
    *   **Purpose:** Core logic, type definitions, utility functions, and external service integrations.
    *   **Sub-modules:**
        *   `supabase/client.ts` & `supabase/server.ts`: Supabase client instances for browser and server-side interactions.
        *   `database.types.ts`: Auto-generated TypeScript types for the Supabase database schema. **Crucial for understanding data structures.**
        *   `asset-schemas.ts` & `device-schemas.ts`: Define the dynamic field structures for the `details` JSONB column in the `assets` table.
        *   `utils.ts`: General utility functions (e.g., `cn` for class name merging).
*   **`src/ai/`:**
    *   **Purpose:** AI feature integration using Genkit.
    *   `genkit.ts`: Configures Genkit, plugins (e.g., `@genkit-ai/googleai`), and the AI model (e.g., 'gemini-2.0-flash').
    *   `dev.ts`: (Likely) Defines Genkit flows and tools for development and execution. AI logic for features like the "AI Assistant" resides here.
*   **`src/hooks/`:**
    *   **Purpose:** Custom React hooks for shared component logic (e.g., `use-mobile.tsx`, `use-toast.ts`).
*   **`src/middleware.ts`:**
    *   **Purpose:** Handles Next.js middleware logic, primarily for authentication and route protection using Supabase Auth.

## 3. Core Data Models/Schemas

These models are primarily defined by the Supabase schema, with types available in `src/lib/database.types.ts`.

*   **`tenants`**: Represents a customer or isolated environment.
    *   `id` (uuid, PK)
    *   `name` (text)
    *   `plan_id` (uuid, FK to `plans`)
*   **`profiles`**: User profiles, linked to tenants.
    *   `id` (uuid, PK, FK to `auth.users`)
    *   `tenant_id` (uuid, FK to `tenants`)
    *   `full_name` (text)
    *   `role` (text, e.g., 'admin', 'editor', 'viewer')
*   **`plans`**: SaaS subscription plans.
    *   `id` (uuid, PK)
    *   `name` (text)
    *   `asset_limit`, `rack_limit`, `user_limit` (numeric)
    *   `price` (numeric)
    *   `enabled_features` (array of text)
*   **`locations`**: Physical sites or areas within sites.
    *   `id` (uuid, PK)
    *   `tenant_id` (uuid, FK to `tenants`)
    *   `parent_location_id` (uuid, FK to `locations`, self-referencing for hierarchy)
    *   `name` (text)
    *   `description` (text)
    *   `floor_plan_image_url` (text)
    *   `grid_columns`, `grid_rows` (integer, for floor plan grid)
*   **`racks`**: Equipment racks.
    *   `id` (uuid, PK)
    *   `tenant_id` (uuid, FK to `tenants`)
    *   `location_id` (uuid, FK to `locations`)
    *   `name` (text)
    *   `total_u` (integer, total rack units)
    *   `pos_x`, `pos_y` (numeric, position on floor plan)
    *   `notes` (text)
*   **`assets`**: Devices and equipment.
    *   `id` (uuid, PK)
    *   `tenant_id` (uuid, FK to `tenants`)
    *   `rack_id` (uuid, FK to `racks`, nullable if not in a rack)
    *   `location_id` (uuid, FK to `locations`, for assets not in racks or for broader context)
    *   `name` (text)
    *   `asset_type` (text, e.g., "SERVER", "SWITCH". Keys from `assetSchemas` in `src/lib/asset-schemas.ts`)
    *   `status` (text, e.g., "ACTIVE", "MAINTENANCE")
    *   `start_u` (integer, position within rack)
    *   `size_u` (integer, height in rack units)
    *   `details` (jsonb): Stores type-specific attributes. **The structure of this JSON is defined in `src/lib/asset-schemas.ts` and `src/lib/device-schemas.ts` based on `asset_type`.**
*   **`ports`**: Network, power, or other connection points on assets.
    *   `id` (uuid, PK)
    *   `tenant_id` (uuid, FK to `tenants`)
    *   `asset_id` (uuid, FK to `assets`)
    *   `name` (text, e.g., "eth0", "Port 1", "PSU1")
    *   `port_type` (text, e.g., "RJ45_CAT6", "SFP+", "IEC_C13")
*   **`connections`**: Links between two ports.
    *   `id` (uuid, PK)
    *   `tenant_id` (uuid, FK to `tenants`)
    *   `port_a_id` (uuid, FK to `ports`)
    *   `port_b_id` (uuid, FK to `ports`)
    *   `details` (jsonb, e.g., cable type, color)
*   **`todos`**: Simple to-do items for users.
    *   `id` (uuid, PK)
    *   `user_id` (uuid, FK to `auth.users`)
    *   `text` (text)
    *   `is_completed` (boolean)

**Refer to `src/lib/asset-schemas.ts` and `src/lib/device-schemas.ts` for the detailed structure of the `assets.details` JSON object for each `asset_type`.**

## 4. API Endpoints & Data Access

*   **Supabase Client:** Primary data interaction is via the Supabase JavaScript client (`@supabase/ssr` and `@supabase/supabase-js`).
    *   CRUD operations on tables (select, insert, update, delete).
    *   Authentication methods (`signInWithPassword`, `signUp`, `signOut`, `getSession`).
    *   Calling PostgreSQL functions via `supabase.rpc('function_name', { args })`.
*   **Supabase Database Functions:** Pre-defined SQL functions in the Supabase backend for complex queries or business logic.
    *   Examples (from `database.types.ts`):
        *   `get_location_details(location_id_param)`
        *   `get_racks_overview(tenant_id_param)`
        *   `get_network_ports_stats(tenant_id_param)`
        *   `get_paginated_assets(...)`
*   **Next.js API Routes / Server Actions:**
    *   Server-side logic, including data fetching and mutations, is often handled within Next.js Server Components or Server Actions.
    *   The `@genkit-ai/next` plugin might expose Genkit flows as API routes (e.g., under `/api/genkit/*`). Check `src/app/api/` if present.
*   **Genkit Flows:**
    *   Defined in `src/ai/dev.ts` (or similar). These are sequences of AI operations (e.g., calling Gemini model, data processing).
    *   Can be invoked from server-side code (Server Actions, API routes) or potentially directly if exposed as endpoints.

## 5. Important Utilities/Helpers

*   **`src/lib/utils.ts`:** Contains utility functions like `cn` for merging Tailwind CSS classes.
*   **`src/lib/supabase/client.ts`:** Provides a browser-compatible Supabase client instance.
*   **`src/lib/supabase/server.ts`:** Provides a Supabase client instance for server-side operations (Server Components, Route Handlers, Server Actions).
*   **`src/hooks/*`:** Custom React hooks for state management and side effects (e.g., `use-toast` for notifications, `use-mobile` for responsive checks).
*   **`src/lib/asset-schemas.ts` & `src/lib/device-schemas.ts`:**
    *   `assetSchemas`: Object defining form fields and properties for different asset types.
    *   `getAssetTypeOptions()`: Helper to get asset types for dropdowns.
    *   Similar structure for `deviceSchemas`.

## 6. Known Architectural Decisions/Constraints

*   **Multi-tenancy:** Data is strictly segregated by `tenant_id`. All queries and mutations must account for this.
*   **Dynamic Asset Attributes:** The `assets.details` JSONB field and the schemas in `asset-schemas.ts` allow for flexible, type-specific asset information without altering the main table structure frequently. Modifications to asset types or their fields involve updating these schema files.
*   **Supabase as BaaS:** The application relies heavily on Supabase for database, auth, and potentially other backend services. Understanding Supabase client libraries and concepts is key.
*   **Genkit for AI:** AI logic is encapsulated within Genkit flows. Changes to AI behavior will likely involve modifying files in `src/ai/`.
*   **Shadcn UI:** UI components are built using Shadcn UI, which relies on Radix UI primitives and Tailwind CSS. Customization involves Tailwind classes and potentially modifying component structure.
*   **Server-Side Focus with Next.js:** Leveraging Next.js App Router features like Server Components and Server Actions for data fetching and mutations.

## 7. Testing Strategy Overview

*   **Current State:**
    *   No automated test files (e.g., `*.test.ts`, `*.spec.ts`) were found in the repository as of the last analysis.
    *   The current focus appears to have been on manual testing and rapid development.
*   **Recommendations for Agents:**
    *   When adding new features or modifying existing critical logic, it is highly recommended to introduce unit tests (e.g., using Jest/Vitest with React Testing Library for components, or for utility functions).
    *   Consider adding integration tests for Supabase interactions, especially for complex database functions or Row Level Security (RLS) policies if they become intricate.
    *   End-to-end tests (e.g., using Playwright or Cypress) could be considered for critical user flows as the application matures.

## 8. Deployment Flow (High-Level)

*   The application is a Next.js project.
*   It is configured for deployment on Firebase App Hosting, as indicated by `apphosting.yaml`.
*   The build process (`npm run build`) creates an optimized Next.js application.
*   Deployment likely involves pushing the code to a Git repository connected to Firebase App Hosting or using Firebase CLI commands.

---
**Agent Instructions:**
*   Always ensure `tenant_id` is correctly applied in database queries.
*   When working with assets, refer to `src/lib/asset-schemas.ts` for the `details` field structure.
*   Follow existing coding patterns and conventions found within the modules you are modifying.
*   Update `database.types.ts` by running Supabase CLI type generation if you make schema changes (though direct schema changes should be rare and managed via Supabase migrations).
---
