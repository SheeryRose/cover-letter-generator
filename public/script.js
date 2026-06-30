const letterForm = document.getElementById('letterForm');
const candidateName = document.getElementById('candidateName');
const jobRole = document.getElementById('jobRole');
const company = document.getElementById('company');
const skills = document.getElementById('skills');
const resumeInput = document.getElementById('resume');
const generateBtn = document.getElementById('generateBtn');
const status = document.getElementById('status');
const resultBox = document.getElementById('resultBox');
const letterOutput = document.getElementById('letterOutput');
const copyBtn = document.getElementById('copyBtn');

function buildFallbackLetter(data) {
  return `Dear Hiring Manager at ${data.company},

I am ${data.name}, and I am writing to express my interest in the ${data.role} position at ${data.company}. My background includes ${data.skills}, and I believe this makes me a strong fit for the role.

I would welcome the chance to discuss how my experience could contribute to your team.

Sincerely,
${data.name}`;
}

function setStatus(message) {
  status.textContent = message;
}

function markdownToHtml(text) {
  return text
    .split(/\n{2,}/)
    .map(block => {
      const formatted = block
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      return `<p>${formatted}</p>`;
    })
    .join('');
}

function renderLetter(text) {
  letterOutput.innerHTML = markdownToHtml(text);
  resultBox.hidden = false;
}

letterForm.addEventListener('submit', async e => {
  e.preventDefault();
  setStatus('');

  const data = {
    name: candidateName.value.trim(),
    role: jobRole.value.trim(),
    company: company.value.trim(),
    skills: skills.value.trim()
  };

  if (!data.name || !data.role || !data.company || !data.skills) {
    setStatus('Please fill out every field.');
    return;
  }

  generateBtn.disabled = true;
  setStatus('Generating...');

  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('role', data.role);
    formData.append('company', data.company);
    formData.append('skills', data.skills);

    if (resumeInput.files[0]) {
      formData.append('resume', resumeInput.files[0]);
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('generation failed');
    }

    const result = await response.json();
    renderLetter(result.letter);
  } catch (err) {
    renderLetter(buildFallbackLetter(data));
    setStatus('Could not reach the AI service, showing a basic draft instead.');
  } finally {
    generateBtn.disabled = false;
    if (status.textContent === 'Generating...') {
      setStatus('');
    }
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(letterOutput.innerText).then(() => {
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
    }, 1500);
  });
});