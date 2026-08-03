import type { Context } from 'hono';
import type { SlashCommandData, ParameterOption, MessageResponse, NisSubscriber } from '../types.ts';
import { fetchSubscriber } from '../services/subscriber.ts';

/**
 * Truncate string if longer than maxLength characters
 */
function truncateLabel(str: string, maxLength: number = 7): string {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
}

/**
 * Generate option label for a subscriber based on priority rules:
 * installation_address > domain > (empty)
 */
function getSubscriberLabel(sub: NisSubscriber): string {
  let servicePart = sub.service;
  let detailPart = '';

  if (sub.installation_address && sub.installation_address.trim() !== '') {
    detailPart = sub.installation_address;
  } else if (sub.domain && sub.domain.trim() !== '') {
    detailPart = sub.domain;
  }

  servicePart = truncateLabel(servicePart);
  detailPart = detailPart ? ` - ${truncateLabel(detailPart)}` : '';

  return `${servicePart}${detailPart}`;
}

/**
 * Handle /tts command — shows subscriber lookup and ticket creation form dialog
 */
export async function handleTts(c: Context, data: SlashCommandData): Promise<Response> {
  let subscriberOptions: ParameterOption[] = [];

  if (data.customer_phone_number) {
    const subscriberData = await fetchSubscriber(data.customer_phone_number);

    if (subscriberData && subscriberData.results.length > 0) {
      subscriberOptions = subscriberData.results.map((sub) => ({
        label: getSubscriberLabel(sub),
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

  const response = {
    type: 'SUBMIT_DIALOG',
    data: {
      command: data.command,
      inbox_id: data.inbox_id,
      agent_email: data.agent_email,
      channel_id: data.channel_id,
      customer_phone_number: data.customer_phone_number
    },
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
          value: '',
          placeholder: 'tidak bisa internet',
          required: true
        },
        {
          tag: 'textarea',
          name: 'comment',
          value: '',
          placeholder: '- pandu customer reboot ONT\n- lampu indikator ONT merah menyala',
          required: true
        }
      ]
    }
  };

  return c.json(response);
}
