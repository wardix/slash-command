import type { Context } from 'hono';
import type { SlashCommandData, MessageResponse } from '../types.ts';
import { REGXURL_BASE_URL, REGXURL_AGENT_EID_MAP } from '../config.ts';
import { fetchEmployeeIdByEmail } from '../services/employee.ts';

/**
 * Handle /regxurl command — returns a MESSAGE with a registration URL
 */
export async function handleRegxurl(c: Context, data: SlashCommandData): Promise<Response> {
  if (!REGXURL_BASE_URL) {
    const response: MessageResponse = {
      type: 'MESSAGE',
      data: {
        command: data.command,
        inbox_id: data.inbox_id,
        agent_email: data.agent_email,
        channel_id: data.channel_id,
        customer_phone_number: data.customer_phone_number
      },
      text: 'Gagal membuat URL: REGXURL_BASE_URL belum dikonfigurasi'
    };
    return c.json(response);
  }

  // Resolve employee ID: first from static map, then fallback to NIS Employee API
  let eid = REGXURL_AGENT_EID_MAP[data.agent_email] || '';
  if (!eid) {
    console.error(`Warning: No employee ID mapping found for agent email: ${data.agent_email}, trying NIS Employee API`);
    const fetchedEid = await fetchEmployeeIdByEmail(data.agent_email);
    eid = fetchedEid || '';
    if (!eid) {
      console.error(`Warning: Employee ID not found via API for email: ${data.agent_email}`);
    }
  }

  const url = `${REGXURL_BASE_URL}?phone=${encodeURIComponent(data.customer_phone_number)}&eid=${encodeURIComponent(eid)}`;

  const response: MessageResponse = {
    type: 'MESSAGE',
    data: {
      command: data.command,
      inbox_id: data.inbox_id,
      agent_email: data.agent_email,
      channel_id: data.channel_id,
      customer_phone_number: data.customer_phone_number
    },
    text: url
  };
  return c.json(response);
}
