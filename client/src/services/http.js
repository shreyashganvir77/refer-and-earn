const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const errorCode = data?.errorCode;
    let msg = data?.error || `Request failed (${res.status})`;
    if (errorCode === 'PERSONAL_EMAIL_NOT_ALLOWED') msg = 'Personal email addresses are not allowed';
    else if (errorCode === 'INVALID_COMPANY_DOMAIN') msg = 'Please use your official company email for the selected company';
    else if (errorCode === 'INVALID_EMAIL') msg = 'Please enter a valid company email address';
    else if (errorCode === 'COMPANY_EMAIL_NOT_VERIFIED') msg = 'Company email must be verified before enabling referral provider';
    else if (errorCode === 'REFERRAL_NOT_COMPLETED') msg = 'Referral must be completed first';
    else if (errorCode === 'REVIEW_ALREADY_EXISTS') msg = 'You have already submitted a review for this provider';
    else if (errorCode === 'SUPPORT_TICKET_ALREADY_EXISTS') msg = 'A support ticket already exists for this referral';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.errorCode = errorCode;
    throw err;
  }

  return data;
}

