import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!hostname) {
    throw new Error(
      'REPLIT_CONNECTORS_HOSTNAME env var is not set — cannot reach the Replit Connectors service to authenticate with Google Sheets.',
    );
  }

  if (!xReplitToken) {
    throw new Error(
      'Replit identity token not found (REPL_IDENTITY or WEB_REPL_RENEWAL must be set) — cannot authenticate the Google Sheets connector.',
    );
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings) {
    throw new Error(
      'Google Sheets connector is not connected. Open Replit\'s Integrations panel and connect the "google-sheet" connector.',
    );
  }

  if (!accessToken) {
    throw new Error(
      'Google Sheets connector is connected but did not return an access token. Try disconnecting and reconnecting it in Replit\'s Integrations panel.',
    );
  }

  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}
