import type { Context } from 'hono';
import type {
  SlashCommandData,
  SubmitDialogValueParameter,
  MessageResponse
} from '../types.ts';
import { createTicket } from '../services/ticket.ts';

/**
 * Handle SUBMIT_DIALOG request — creates a ticket via NIS API
 */
export async function handleSubmitDialog(c: Context, body: any): Promise<Response> {
  const data: SlashCommandData = body.data;
  const parameters: SubmitDialogValueParameter[] = body.action?.parameters || [];

  const paramMap = new Map<string, string>();
  for (const p of parameters) {
    paramMap.set(p.name, p.value);
  }

  const ticketResult = await createTicket({
    subscriber_id: paramMap.get('subscriber') || '',
    type_id: paramMap.get('type') || '',
    status: paramMap.get('status') || '',
    subject: paramMap.get('subject') || '',
    comment: paramMap.get('comment') || '',
    inbox_id: data.inbox_id,
    agent_email: data.agent_email,
    channel_id: data.channel_id,
    customer_phone_number: data.customer_phone_number
  });

  let responseText = 'Gagal membuat tiket';
  if (ticketResult && ticketResult.ticket_id) {
    responseText = `Tiket berhasil dibuat: #${ticketResult.ticket_id}`;
  } else if (ticketResult && ticketResult.message) {
    responseText = `Gagal membuat tiket: ${ticketResult.message}`;
  }

  const response: MessageResponse = {
    type: 'MESSAGE',
    data: {
      command: data.command,
      inbox_id: data.inbox_id,
      agent_email: data.agent_email,
      channel_id: data.channel_id,
      customer_phone_number: data.customer_phone_number
    },
    text: responseText
  };

  return c.json(response);
}
