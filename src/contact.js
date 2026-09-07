const form = document.getElementById('contactForm');
const senderEmail = document.getElementById('senderEmail');
const messageTitle = document.getElementById('messageTitle');
const messageBody = document.getElementById('messageBody');
const formStatus = document.getElementById('formStatus');
const sendButton = form.querySelector('button[type="submit"]');
const isGitHubPages = window.location.hostname.endsWith('.github.io');
const contactEndpoint = isGitHubPages
  ? 'https://formsubmit.co/ajax/campbell.t.stephen@gmail.com'
  : '/api/contact';

function setFormStatus(message, state = '') {
  formStatus.textContent = message;
  formStatus.dataset.state = state;
}

async function submitContactForm() {
  const payload = isGitHubPages
    ? {
        email: senderEmail.value,
        _replyto: senderEmail.value,
        _subject: messageTitle.value,
        message: messageBody.value,
        _template: 'table',
      }
    : {
        senderEmail: senderEmail.value,
        messageTitle: messageTitle.value,
        messageBody: messageBody.value,
      };

  const response = await fetch(contactEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json')
    ? await response.json()
    : {};

  if (!response.ok || result.ok === false || result.success === 'false') {
    throw new Error(result.message || 'Message delivery failed. Please try again.');
  }

  return 'Message sent. Thank you.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  sendButton.disabled = true;
  setFormStatus('Sending your note...', 'pending');

  try {
    const message = await submitContactForm();
    form.reset();
    setFormStatus(message, 'success');
  } catch (error) {
    setFormStatus(error.message, 'error');
  } finally {
    sendButton.disabled = false;
  }
});
