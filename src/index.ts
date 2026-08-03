import { Hono } from 'hono';
import './config.ts'; // load env validation at startup
import { handleSubmitDialog } from './handlers/submitDialog.ts';
import { handleRegxurl } from './handlers/regxurl.ts';
import { handleTts } from './handlers/tts.ts';

const app = new Hono();

// POST /slash endpoint
app.post('/slash', async (c) => {
  const body = await c.req.json();

  // Handle SUBMIT_DIALOG request
  if (body.type === 'SUBMIT_DIALOG') {
    return handleSubmitDialog(c, body);
  }

  // Validate request type for SLASH_COMMAND
  if (body.type !== 'SLASH_COMMAND') {
    return c.json({ error: 'Invalid request type' }, 400);
  }

  const data = body.data;

  // Route to the appropriate command handler
  switch (data.command) {
    case '/regxurl':
      return handleRegxurl(c, data);
    case '/tts':
    default:
      return handleTts(c, data);
  }
});

// Get port from environment variable or use default
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3000', 10);

// Export for Bun server
export default {
  port: PORT,
  fetch: app.fetch
};
