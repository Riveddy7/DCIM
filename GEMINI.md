# GEMINI.md - Guía del Proyecto DCIM SaaS para Agentes de Código

Este documento proporciona una descripción general estructurada del código base de DCIM SaaS para permitir que los agentes de IA realicen modificaciones y adiciones precisas e informadas.

## 1. Descripción General del Proyecto para Agentes

*   **Dominio:** Gestión de Infraestructura de Centros de Datos (DCIM).
*   **Propósito:** Una aplicación de Software como Servicio (SaaS) para ayudar a los usuarios a gestionar y visualizar sus activos de centros de datos, racks, ubicaciones, conectividad y capacidad.
*   **Arquitectura:**
    *   **Frontend:** Aplicación Next.js (React) usando TypeScript, Tailwind CSS y Shadcn UI.
    *   **Backend:** Supabase proporciona los servicios de backend, incluyendo una base de datos PostgreSQL, autenticación y funciones sin servidor.
    *   **Integración de IA:** Genkit con Google AI (modelos Gemini) para funciones de asistencia inteligente.
    *   **Estructura General:** Aplicación monolítica Next.js que interactúa con Supabase como un Backend-as-a-Service (BaaS).

## 2. Desglose de Módulos/Componentes Clave

*   **`src/app/` (Next.js App Router):**
    *   **Propósito:** Define las rutas de las páginas, los diseños y los componentes del servidor para diferentes secciones de la aplicación.
    *   **Estructura:** Los subdirectorios corresponden a las rutas de URL (p. ej., `src/app/dashboard/`, `src/app/assets/`, `src/app/racks/[id]/`).
    *   **Interfaces Clave:** Componentes de página (`page.tsx`), componentes de diseño (`layout.tsx`), acciones del servidor.
*   **`src/components/`:**
    *   **Propósito:** Componentes de React reutilizables.
    *   **Submódulos:**
        *   `ui/`: Elementos base de la interfaz de usuario (Button, Card, Dialog, etc.), en gran parte de Shadcn UI.
        *   `dashboard/`: Widgets para el panel principal (KPIs, enlace al Asistente de IA, lista de tareas).
        *   `floor-plan/`: Componentes para crear, ver e interactuar con los planos de planta (p. ej., `FloorPlanCanvas.tsx`, `RackItem.tsx`).
        *   `racks/`: Componentes para la visualización de racks (`RackVisualizer.tsx`), detalles de activos dentro de los racks (`AssetDetailPanel.tsx`) y formularios (`CreateRackForm.tsx`, `CreateAssetForm.tsx`).
        *   `ports/`: Componentes para gestionar puertos de activos y conexiones (`ConnectPortDialog.tsx`, `BulkPortGeneratorForm.tsx`).
        *   `locations/`: Componentes para gestionar ubicaciones (`CreateLocationForm.tsx`).
*   **`src/lib/`:**
    *   **Propósito:** Lógica central, definiciones de tipos, funciones de utilidad e integraciones de servicios externos.
    *   **Submódulos:**
        *   `supabase/client.ts` y `supabase/server.ts`: Instancias del cliente de Supabase para interacciones del lado del navegador y del servidor.
        *   `database.types.ts`: Tipos de TypeScript autogenerados para el esquema de la base de datos de Supabase. **Crucial para entender las estructuras de datos.**
        *   `asset-schemas.ts` y `device-schemas.ts`: Definen las estructuras de campos dinámicos para la columna JSONB `details` en la tabla `assets`.
        *   `utils.ts`: Funciones de utilidad generales (p. ej., `cn` para fusionar nombres de clase).
*   **`src/ai/`:**
    *   **Propósito:** Integración de funciones de IA usando Genkit.
    *   `genkit.ts`: Configura Genkit, plugins (p. ej., `@genkit-ai/googleai`) y el modelo de IA (p. ej., 'gemini-2.0-flash').
    *   `dev.ts`: Define los flujos y herramientas de Genkit para el desarrollo y la ejecución. La lógica de IA para funciones como el "Asistente de IA" reside aquí.
*   **`src/hooks/`:**
    *   **Propósito:** Hooks de React personalizados para la lógica de componentes compartidos (p. ej., `use-mobile.tsx`, `use-toast.ts`).
*   **`src/middleware.ts`:**
    *   **Propósito:** Maneja la lógica del middleware de Next.js, principalmente para la autenticación y protección de rutas usando Supabase Auth.

## 3. Modelos/Esquemas de Datos Centrales

Estos modelos se definen principalmente por el esquema de Supabase, con tipos disponibles en `src/lib/database.types.ts`.

*   **`tenants`**: Representa un cliente o un entorno aislado.
*   **`profiles`**: Perfiles de usuario, vinculados a los tenants.
*   **`plans`**: Planes de suscripción SaaS.
*   **`locations`**: Sitios físicos o áreas dentro de los sitios.
*   **`racks`**: Racks de equipos.
*   **`assets`**: Dispositivos y equipos. El campo `details` (jsonb) almacena atributos específicos del tipo, definidos en `src/lib/asset-schemas.ts`.
*   **`ports`**: Puntos de conexión de red, energía u otros en los activos.
*   **`connections`**: Enlaces entre dos puertos.
*   **`todos`**: Tareas simples para los usuarios.

**Consulte `src/lib/asset-schemas.ts` y `src/lib/device-schemas.ts` para la estructura detallada del objeto JSON `assets.details` para cada `asset_type`.**

## 4. Endpoints de API y Acceso a Datos

*   **Cliente de Supabase:** La interacción principal con los datos es a través del cliente de JavaScript de Supabase (`@supabase/ssr` y `@supabase/supabase-js`).
*   **Funciones de la Base de Datos de Supabase:** Funciones SQL predefinidas en el backend de Supabase para consultas complejas o lógica de negocio (p. ej., `get_location_details`, `get_racks_overview`).
*   **Rutas de API de Next.js / Acciones del Servidor:** La lógica del lado del servidor se maneja a menudo dentro de los Componentes de Servidor o Acciones del Servidor de Next.js.
*   **Flujos de Genkit:** Definidos en `src/ai/dev.ts`. Son secuencias de operaciones de IA que pueden ser invocadas desde el código del lado del servidor.

## 5. Decisiones Arquitectónicas/Restricciones Conocidas

*   **Multi-tenancy:** Los datos están estrictamente segregados por `tenant_id`.
*   **Atributos de Activos Dinámicos:** El campo JSONB `assets.details` y los esquemas en `asset-schemas.ts` permiten información flexible y específica del tipo de activo.
*   **Supabase como BaaS:** La aplicación depende en gran medida de Supabase para la base de datos, la autenticación y otros servicios de backend.
*   **Genkit para IA:** La lógica de IA está encapsulada dentro de los flujos de Genkit.
*   **Shadcn UI:** Los componentes de la interfaz de usuario se construyen con Shadcn UI.
*   **Enfoque en el Lado del Servidor con Next.js:** Aprovechamiento de las características del App Router de Next.js como los Componentes de Servidor y las Acciones del Servidor.

## 6. Estrategia de Pruebas

*   **Estado Actual:** No se encontraron archivos de pruebas automatizadas. El enfoque parece haber sido en las pruebas manuales y el desarrollo rápido.
*   **Recomendaciones para Agentes:** Al añadir nuevas características, se recomienda introducir pruebas unitarias (p. ej., con Jest/Vitest y React Testing Library).

## 7. Flujo de Despliegue (Alto Nivel)

*   La aplicación es un proyecto Next.js.
*   Está configurada para el despliegue en Firebase App Hosting (`apphosting.yaml`).
*   El proceso de construcción (`npm run build`) crea una aplicación Next.js optimizada.

---
**Instrucciones para el Agente:**
*   Asegúrese siempre de que `tenant_id` se aplique correctamente en las consultas a la base de datos.
*   Al trabajar con activos, consulte `src/lib/asset-schemas.ts` para la estructura del campo `details`.
*   Siga los patrones y convenciones de codificación existentes.
*   Actualice `database.types.ts` ejecutando la generación de tipos de la CLI de Supabase si realiza cambios en el esquema.
---
