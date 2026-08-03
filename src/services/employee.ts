import { NIS_EMPLOYEE_API_URL, NIS_API_TOKEN } from '../config.ts';
import type { NisEmployee } from '../types.ts';

/**
 * Fetch employee data from NIS API based on email
 * Returns employee_id string or null if not found / API error
 */
export async function fetchEmployeeIdByEmail(email: string): Promise<string | null> {
  if (!NIS_EMPLOYEE_API_URL) {
    console.error('Error: NIS_EMPLOYEE_API_URL is not set');
    return null;
  }

  try {
    const url = `${NIS_EMPLOYEE_API_URL}?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${NIS_API_TOKEN}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch employee:', response.status);
      return null;
    }

    const data: NisEmployee = await response.json();
    return data.employee_id || null;
  } catch (error) {
    console.error('Error fetching employee:', error);
    return null;
  }
}
