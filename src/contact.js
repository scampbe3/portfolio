const form = document.getElementById('contactForm');
const senderEmail = document.getElementById('senderEmail');
const messageTitle = document.getElementById('messageTitle');
const messageBody = document.getElementById('messageBody');
const formStatus = document.getElementById('formStatus');
const sendButton = form.querySelector('button[type="submit"]');

function setFormStatus(message, state = '') {
  formStatus.textContent = message;
  formStatus.dataset.state = state;
}

async function submitContactForm() {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      senderEmail: senderEmail.value,
      messageTitle: messageTitle.value,
      messageBody: messageBody.value,
    }),
  });

  const result = await response.json().catch(() => ({
    message: 'The server returned an unreadable response.',
  }));

  if (!response.ok || result.ok === false) {
    throw new Error(result.message || 'Message delivery failed.');
  }

  return result.message || 'Message sent. Thank you.';
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
