// NIS API configuration
export const NIS_SUBSCRIBER_API_URL = process.env.NIS_SUBSCRIBER_API_URL;
export const NIS_TICKET_API_URL = process.env.NIS_TICKET_API_URL;
export const NIS_API_TOKEN = process.env.NIS_API_TOKEN;
export const NIS_EMPLOYEE_API_URL = process.env.NIS_EMPLOYEE_API_URL;

// /regxurl command configuration
export const REGXURL_BASE_URL = process.env.REGXURL_BASE_URL;

// Mapping agent_email -> employee id, stored as JSON string in env var
// Example: {"wardi@nusa.net.id":"12345","other@nusa.net.id":"67890"}
export let REGXURL_AGENT_EID_MAP: Record<string, string> = {};
try {
  const rawMap = process.env.REGXURL_AGENT_EID_MAP;
  if (rawMap) {
    REGXURL_AGENT_EID_MAP = JSON.parse(rawMap);
  } else {
    console.error('Warning: REGXURL_AGENT_EID_MAP environment variable is not set');
  }
} catch {
  console.error('Error: REGXURL_AGENT_EID_MAP is not valid JSON');
}

// Validate required environment variables at startup
if (!NIS_SUBSCRIBER_API_URL) {
  console.error('Error: NIS_SUBSCRIBER_API_URL environment variable is not set');
}
if (!NIS_TICKET_API_URL) {
  console.error('Error: NIS_TICKET_API_URL environment variable is not set');
}
if (!NIS_API_TOKEN) {
  console.error('Error: NIS_API_TOKEN environment variable is not set');
}
if (!NIS_EMPLOYEE_API_URL) {
  console.error('Error: NIS_EMPLOYEE_API_URL environment variable is not set');
}
if (!REGXURL_BASE_URL) {
  console.error('Error: REGXURL_BASE_URL environment variable is not set');
}
