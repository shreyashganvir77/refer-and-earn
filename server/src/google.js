const { OAuth2Client } = require('google-auth-library');

function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is required');
  }
  return clientId;
}

const oauthClient = new OAuth2Client(getGoogleClientId());

async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    const err = new Error('idToken is required');
    err.statusCode = 400;
    throw err;
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken,
    requiredAudience: getGoogleClientId(),
  });

  const payload = ticket.getPayload();
  if (!payload) {
    const err = new Error('Invalid Google token payload');
    err.statusCode = 401;
    throw err;
  }

  // Payload docs: https://developers.google.com/identity/sign-in/web/backend-auth
  const email = payload.email;
  const fullName = payload.name || payload.given_name || 'User';
  const emailVerified = payload.email_verified;
  const googleUserId = payload.sub;

  if (!email || !emailVerified) {
    const err = new Error('Google account email must be verified');
    err.statusCode = 401;
    throw err;
  }

  return { email, fullName, googleUserId };
}

module.exports = { verifyGoogleIdToken };

