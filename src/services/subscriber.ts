import { NIS_SUBSCRIBER_API_URL, NIS_API_TOKEN } from '../config.ts';
import type { NisApiResponse } from '../types.ts';

/**
 * Fetch subscriber data from NIS API based on phone number
 */
export async function fetchSubscriber(phone: string): Promise<NisApiResponse | null> {
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
