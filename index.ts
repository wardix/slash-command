import { Hono } from 'hono';

// Type definitions
interface SlashCommandData {
  command: string;
  inbox_id: number;
  agent_email: string;
  channel_id: string;
  customer_phone_number: string;
}

interface SubmitDialogRequest {
  type: string;
  data: SlashCommandData;
}

interface ParameterOption {
  label: string;
  value: string;
}

interface Parameter {
  tag: 'select' | 'input' | 'textarea';
  name: string;
  required?: boolean | string;
  options?: ParameterOption[];
  type?: string; // for input fields
  value?: string;
  placeholder?: string;
}

interface Action {
  parameters: Parameter[];
}

interface SubmitDialogResponseData extends SlashCommandData {
  action: Action;
}

interface SubmitDialogResponse {
  type: string;
  data: SubmitDialogResponseData;
}

interface MessageResponse {
  type: string;
  data: SlashCommandData;
  text: string;
}

interface SubmitDialogValueParameter {
  name: string;
  value: string;
}

interface SubmitDialogRequestAction {
  parameters: SubmitDialogValueParameter[];
}

interface NisCreateTicketPayload {
  subscriber_id: string | number;
  type_id: string | number;
  status: string;
  subject: string;
  comment: string;
  inbox_id: number;
  agent_email: string;
  channel_id: string;
  customer_phone_number: string;
}

interface NisCreateTicketResponse {
  success?: boolean;
  ticket_id?: string | number;
  message?: string;
}

// Subscriber types from NIS API
interface NisSubscriber {
  subscriber_id: number;
  subscriber_name: string;
  domain: string;
  service: string;
  installation_address: string;
}

interface NisApiResponse {
  results: NisSubscriber[];
}

// Helper function to truncate string if longer than 10 characters
function truncateLabel(str: string, maxLength: number = 7): string {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
}

// Environment configuration - must be set via environment variables
const NIS_SUBSCRIBER_API_URL = process.env.NIS_SUBSCRIBER_API_URL;
const NIS_TICKET_API_URL = process.env.NIS_TICKET_API_URL;
const NIS_API_TOKEN = process.env.NIS_API_TOKEN;

// Response message for /reg command (read from env var)
const REG_RESPONSE_MESSAGE = process.env.REG_RESPONSE_MESSAGE || 'Registrasi berhasil';

// Validate required environment variables
if (!NIS_SUBSCRIBER_API_URL) {
  console.error('Error: NIS_SUBSCRIBER_API_URL environment variable is not set');
}
if (!NIS_TICKET_API_URL) {
  console.error('Error: NIS_TICKET_API_URL environment variable is not set');
}
if (!NIS_API_TOKEN) {
  console.error('Error: NIS_API_TOKEN environment variable is not set');
}

/**
 * Fetch subscriber data from NIS API based on phone number
 */
async function fetchSubscriber(phone: string): Promise<NisApiResponse | null> {
  try {
    const url = `${NIS_SUBSCRIBER_API_URL}?phone=${encodeURIComponent(phone)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${NIS_API_TOKEN}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch subscriber:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    return null;
  }
}

/**
 * Create ticket in NIS API
 */
async function createTicket(payload: NisCreateTicketPayload): Promise<NisCreateTicketResponse | null> {
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

const app = new Hono();

// POST /slash endpoint
app.post('/slash', async (c) => {
  const body = await c.req.json();

  // Handle SUBMIT_DIALOG request
  if (body.type === 'SUBMIT_DIALOG') {
    const data: SlashCommandData = body.data;
    const parameters: SubmitDialogValueParameter[] = body.action?.parameters || [];

    const paramMap = new Map<string, string>();
    for (const p of parameters) {
      paramMap.set(p.name, p.value);
    }

    const ticketPayload: NisCreateTicketPayload = {
      subscriber_id: paramMap.get('subscriber') || '',
      type_id: paramMap.get('type') || '',
      status: paramMap.get('status') || '',
      subject: paramMap.get('subject') || '',
      comment: paramMap.get('comment') || '',
      inbox_id: data.inbox_id,
      agent_email: data.agent_email,
      channel_id: data.channel_id,
      customer_phone_number: data.customer_phone_number
    };

    const ticketResult = await createTicket(ticketPayload);

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

  // Validate request type for SLASH_COMMAND
  if (body.type !== 'SLASH_COMMAND') {
    return c.json({ error: 'Invalid request type' }, 400);
  }

  const data = body.data;

  // Handle /reg command - return simple MESSAGE response
  if (data.command === '/reg') {
    const response: MessageResponse = {
      type: 'MESSAGE',
      data: {
        command: data.command,
        inbox_id: data.inbox_id,
        agent_email: data.agent_email,
        channel_id: data.channel_id,
        customer_phone_number: data.customer_phone_number
      },
      text: REG_RESPONSE_MESSAGE
    };
    return c.json(response);
  }

  // Fetch subscriber data from NIS API for /tts and other commands
  let subscriberOptions: ParameterOption[] = [];
  let subjectValue = '';
  let commentValue = '';

  if (data.customer_phone_number) {
    const subscriberData = await fetchSubscriber(data.customer_phone_number);

    if (subscriberData && subscriberData.results.length > 0) {
      // Helper function to generate label based on rules
      const getLabel = (sub: NisSubscriber): string => {
        let servicePart = sub.service;
        let detailPart = '';

        if (sub.installation_address && sub.installation_address.trim() !== '') {
          // If installation address exists, use it as detail
          detailPart = sub.installation_address;
        } else if (sub.domain && sub.domain.trim() !== '') {
          // Otherwise, if domain exists, use it as detail
          detailPart = sub.domain;
        }

        // Truncate parts longer than 10 characters
        servicePart = truncateLabel(servicePart);
        detailPart = detailPart ? ` - ${truncateLabel(detailPart)}` : '';

        return `${servicePart}${detailPart}`;
      };

      // Create options for select dropdown with all subscribers
      subscriberOptions = subscriberData.results.map((sub) => ({
        label: getLabel(sub),
        value: String(sub.subscriber_id)
      }));
    }
  }

  // If no subscriber found, return MESSAGE response
  if (subscriberOptions.length === 0) {
    const response: MessageResponse = {
      type: 'MESSAGE',
      data: {
        command: data.command,
        inbox_id: data.inbox_id,
        agent_email: data.agent_email,
        channel_id: data.channel_id,
        customer_phone_number: data.customer_phone_number
      },
      text: 'no subscriber found'
    };
    return c.json(response);
  }

  // Build the response based on /tts command
  const response: SubmitDialogResponse = {
    type: 'SUBMIT_DIALOG',
    data: {
      command: data.command,
      inbox_id: data.inbox_id,
      agent_email: data.agent_email,
      channel_id: data.channel_id,
      customer_phone_number: data.customer_phone_number,
      action: {
        parameters: [
          {
            tag: 'select',
            name: 'subscriber',
            required: true,
            options: subscriberOptions
          },
          {
            tag: 'select',
            name: 'type',
            required: true,
            options: [
              { label: 'Request', value: '1' },
              { label: 'Incident', value: '2' },
              { label: 'Eskalasi', value: '10' }
            ]
          },
          {
            tag: 'select',
            name: 'status',
            required: true,
            options: [
              { label: 'Open', value: 'Open' },
              { label: 'Solved', value: 'Call' }
            ]
          },
          {
            tag: 'input',
            type: 'text',
            name: 'subject',
            value: subjectValue,
            placeholder: 'tidak bisa internet',
            required: true
          },
          {
            tag: 'textarea',
            name: 'comment',
            value: commentValue,
            placeholder: '- pandu customer reboot ONT\n- lampu indikator ONT merah menyala',
            required: true
          }
        ]
      }
    }
  };

  return c.json(response);
});

// Get port from environment variable or use default
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3000', 10);

// Export for Bun server
export default {
  port: PORT,
  fetch: app.fetch
};