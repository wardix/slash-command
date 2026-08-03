import { NIS_TICKET_API_URL, NIS_API_TOKEN } from '../config.ts';
import type { NisCreateTicketPayload, NisCreateTicketResponse } from '../types.ts';

/**
 * Create ticket in NIS API
 */
export async function createTicket(payload: NisCreateTicketPayload): Promise<NisCreateTicketResponse | null> {
  if (!NIS_TICKET_API_URL) {
    console.error('Error: NIS_TICKET_API_URL is not set');
    return null;
  }

  try {
    const response = await fetch(NIS_TICKET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${NIS_API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Failed to create ticket:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating ticket:', error);
    return null;
  }
}
