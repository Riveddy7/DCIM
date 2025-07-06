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

    // 1. Fetch all relevant data points in parallel
    const [
      racksCountRes,
      assetsCountRes,
      unassignedAssetsCountRes,
      fullestRackRes,
      portsStatsRes,
    ] = await Promise.all([
      supabase.from('racks').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('assets').select('*', { count: 'exact', head: true }).is('rack_id', null).eq('tenant_id', tenantId),
      supabase.rpc('get_fullest_rack', { tenant_id_param: tenantId }),
      supabase.rpc('get_network_ports_stats', { tenant_id_param: tenantId }),
    ]);

    // 2. Format the fetched data into a context string
    const totalRacks = racksCountRes.count ?? 0;
    const totalAssets = assetsCountRes.count ?? 0;
    const unassignedAssets = unassignedAssetsCountRes.count ?? 0;

    let fullestRackInfo = 'N/A';
    if (fullestRackRes.data && fullestRackRes.data.length > 0) {
      const rack = fullestRackRes.data[0];
      fullestRackInfo = `${rack.name} at ${Number(rack.occupancy_percentage).toFixed(1)}% capacity`;
    }

    let networkPortsStats = 'N/A';
    if (portsStatsRes.data && portsStatsRes.data.length > 0) {
      const stats = portsStatsRes.data[0];
      networkPortsStats = `${stats.used_ports} used out of ${stats.total_ports} total ports.`;
    }

    const context = `
- Total Racks: ${totalRacks}
- Total Assets: ${totalAssets}
- Unassigned Assets: ${unassignedAssets}
- Fullest Rack: ${fullestRackInfo}
- Network Ports: ${networkPortsStats}
`;

    // 3. Generate a response using the data as context
    const { output } = await ai.generate({
      prompt: `You are a helpful and concise DCIM assistant for a platform called Zionary.
Given the following real-time data about the user's data center, answer their question.
If the question is unrelated to data centers or the provided data, politely decline to answer.

Data Snapshot:
${context}

User's Question:
${query}
`,
    });

    return { response: output || "I'm sorry, I couldn't generate a response." };
  }
);
