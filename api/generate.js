const pdfParse = require('pdf-parse');
const { formidable } = require('formidable');
const fs = require('fs');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);

    const name = fields.name?.[0] || '';
    const role = fields.role?.[0] || '';
    const company = fields.company?.[0] || '';
    const skills = fields.skills?.[0] || '';

    let resumeText = '';
    const resumeFile = files.resume?.[0];
    if (resumeFile) {
      const buffer = fs.readFileSync(resumeFile.filepath);
      const parsed = await pdfParse(buffer);
      resumeText = parsed.text.slice(0, 3000);
    }

    const prompt = `Write a professional, concise cover letter under 350 words.
Candidate name: ${name}
Job role: ${role}
Target company: ${company}
Key skills: ${skills}
${resumeText ? `Relevant resume content:\n${resumeText}` : ''}
Format the response as plain paragraphs, no markdown headers.`;

    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error('Gemini status:', geminiResponse.status);
      console.error('Gemini response:', errBody);
      throw new Error('gemini request failed');
    }

    const data = await geminiResponse.json();
    const letter = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!letter) {
      throw new Error('empty response from model');
    }

    res.status(200).json({ letter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'generation failed' });
  }
}
