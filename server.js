require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');

const app = express();
const upload = multer();

app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

app.post('/api/generate', upload.single('resume'), async (req, res) => {
  try {
    const { name, role, company, skills } = req.body;

    let resumeText = '';
    if (req.file) {
      const parsed = await pdfParse(req.file.buffer);
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

    res.json({ letter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'generation failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});