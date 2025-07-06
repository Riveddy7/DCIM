/**
 * @fileOverview A conversational AI assistant flow for the DCIM dashboard.
 *
 * - askAssistant - A function that takes a user query and tenant ID to get a helpful response.
 * - AssistantInput - The input type for the askAssistant function.
 * - AssistantOutput - The return type for the askAssistant function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const AssistantInputSchema = z.object({
  query: z.string().describe('The question the user is asking.'),
  tenantId: z.string().uuid().describe('The ID of the tenant to provide data for.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s answer.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

export async function askAssistant(
  input: AssistantInput
): Promise<AssistantOutput> {
  return assistantFlow(input);
}

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const supabase = createClient();
    const { query, tenantId } = input;

    // 1. Fetch more detailed data points in parallel
    const [
      racksOverviewRes,
      unassignedAssetsCountRes,
      portsStatsRes,
    ] = await Promise.all([
      supabase.rpc('get_racks_overview', { tenant_id_param: tenantId }),
      supabase.from('assets').select('*', { count: 'exact', head: true }).is('rack_id', null).eq('tenant_id', tenantId),
      supabase.rpc('get_network_ports_stats', { tenant_id_param: tenantId }),
    ]);

    // 2. Format the fetched data into a comprehensive context string
    const racksOverview = racksOverviewRes.data || [];
    const unassignedAssets = unassignedAssetsCountRes.count ?? 0;

    let networkPortsStats = 'No disponible.';
    if (portsStatsRes.data && portsStatsRes.data.length > 0) {
      const stats = portsStatsRes.data[0];
      networkPortsStats = `${stats.used_ports} usados de ${stats.total_ports} puertos totales.`;
    }

    const racksDetailString = racksOverview.map(rack => {
        const totalU = rack.total_u || 0;
        const occupiedU = rack.occupied_u || 0;
        const availableU = totalU - occupiedU;
        return `- Rack '${rack.name}' (${rack.location_name}): ${totalU}U total, ${occupiedU}U usados, ${availableU}U disponibles.`;
    }).join('\n');

    const context = `
### Resumen General
- Total de Racks: ${racksOverview.length}
- Activos Sin Asignar a un Rack: ${unassignedAssets}
- Uso de Puertos de Red: ${networkPortsStats}

### Detalle de Ocupación de Racks
${racksDetailString || 'No hay racks para mostrar.'}
`;

    // 3. Generate a response using the new detailed context and Spanish prompt
    const response = await ai.generate({
      prompt: `Eres un asistente de DCIM (Data Center Infrastructure Management) para una plataforma llamada Zionary. Eres servicial, conciso y DEBES responder siempre en español.
Tu función es analizar los datos en tiempo real del centro de datos del usuario para responder a sus preguntas con precisión.
Utiliza los datos para hacer recomendaciones, calcular la disponibilidad y ofrecer información útil. Por ejemplo, si te preguntan dónde instalar un nuevo equipo, recomienda el rack con más unidades (U) disponibles.
Si la pregunta no está relacionada con la gestión de centros de datos o los datos proporcionados, declina amablemente la respuesta en español.

Aquí está la información actual del centro de datos:
${context}

Pregunta del usuario:
${query}
`,
    });

    return { response: response.text || "Lo siento, no pude generar una respuesta." };
  }
);
