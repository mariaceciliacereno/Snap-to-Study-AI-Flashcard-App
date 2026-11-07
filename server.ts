import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support large image payloads from camera snaps
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment. Please configure it in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'SnapStudy AI Backend' });
});

// Flashcard Generation API from Camera / Photo
app.post('/api/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      count = 20,
      studyFocus = 'balanced',
      subjectHint = '',
      difficulty = 'standard',
      customInstructions = '',
    } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 image data is required.' });
      return;
    }

    const ai = getAiClient();

    // Clean base64 data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const targetCount = Math.min(Math.max(Number(count) || 20, 5), 30);

    const promptText = `
You are the world's best educational study assistant and cognitive science specialist.
Analyze this photo of a textbook page, lecture slide, or handwritten study notes.
Extract all key concepts, definitions, formulas, theories, historical facts, or mechanisms with 100% academic accuracy.

Target Deck Parameters:
- Number of flashcards: ${targetCount} high-yield, self-contained cards
- Study Focus: ${studyFocus} (e.g. key definitions, exam q&a, formulas, cloze concepts)
- Subject hint: ${subjectHint || 'Auto-detect subject'}
- Target difficulty: ${difficulty}
${customInstructions ? `- Extra instructions from student: ${customInstructions}` : ''}

Strict Quality Rules:
1. FRONT OF CARD: Must be engaging, clear, and unambiguous (e.g., "What is the primary role of ATP Synthase in cellular respiration?", "Define: Le Chatelier's Principle", "Compare Mitosis vs. Meiosis").
2. BACK OF CARD: Clear, concise, bite-sized answer (2-4 sentences max). Highlight core takeaways so the student can test themselves effectively in spaced repetition.
3. HINT: A helpful mnemonic, keyword, or memory hook to trigger recall.
4. SOURCE SNIPPET: Quote the specific sentence or phrase visible in the image from which this card was synthesized, to allow instant verification of accuracy.
5. CORE CONCEPT & FORMULA: Tag the specific sub-topic or formula if applicable.
6. DIFFICULTY: Rate each card as 'easy', 'medium', or 'hard'.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction: `You are SnapStudy AI, an elite educational extraction engine. You extract structured flashcard study decks from images of textbooks, messy student notes, diagrams, and worksheets with flawless accuracy. Always return valid JSON conforming to the requested schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: {
              type: Type.STRING,
              description: 'A punchy, descriptive title for this flashcard deck (e.g., "Cellular Respiration & Krebs Cycle", "Linear Algebra: Eigenvalues").',
            },
            subject: {
              type: Type.STRING,
              description: 'The academic field (e.g. Biology, Chemistry, Physics, History, Medicine, Computer Science, Law, Mathematics, Literature, Economics).',
            },
            summary: {
              type: Type.STRING,
              description: 'A 2-sentence executive summary of the page/notes photographed.',
            },
            estimatedStudyTimeMinutes: {
              type: Type.INTEGER,
              description: 'Estimated minutes to master this deck with spaced repetition.',
            },
            cards: {
              type: Type.ARRAY,
              description: 'The list of generated flashcards.',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique card identifier like card_1' },
                  front: { type: Type.STRING, description: 'Question, prompt, or term on the front' },
                  back: { type: Type.STRING, description: 'Direct, clear answer or explanation on the back' },
                  hint: { type: Type.STRING, description: 'Memory hook, mnemonic, or clue' },
                  coreConcept: { type: Type.STRING, description: 'The underlying concept or taxonomy node' },
                  keyFormulaOrTerm: { type: Type.STRING, description: 'Key equation or Latin/technical term if relevant, or empty string' },
                  sourceSnippet: { type: Type.STRING, description: 'Verbatim or near-verbatim quote from the photo for accuracy audit' },
                  difficulty: { type: Type.STRING, description: 'easy, medium, or hard' },
                },
                required: ['id', 'front', 'back', 'hint', 'coreConcept', 'sourceSnippet', 'difficulty'],
              },
            },
          },
          required: ['deckTitle', 'subject', 'summary', 'estimatedStudyTimeMinutes', 'cards'],
        },
      },
    });

    const text = response.text || '{}';
    const parsedData = JSON.parse(text);

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error generating flashcards with Gemini:', error);
    res.status(500).json({
      error: error.message || 'Failed to extract flashcards from image.',
    });
  }
});

// Deepen or explain a specific flashcard
app.post('/api/explain-card', async (req: Request, res: Response) => {
  try {
    const { cardFront, cardBack, subject, question } = req.body;
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `
Subject: ${subject || 'General'}
Card Front: ${cardFront}
Card Back: ${cardBack}

Student Question / Request: ${question || 'Explain this concept intuitively with a real-world analogy and common exam traps to avoid.'}
      `,
      config: {
        systemInstruction: `You are an encouraging, world-class professor. Provide a concise, vivid breakdown with an intuitive mental model, real-world analogy, and a "Common Exam Pitfall" tip. Keep output formatted in clean Markdown.`,
      },
    });

    res.json({
      success: true,
      explanation: response.text,
    });
  } catch (error: any) {
    console.error('Error explaining card:', error);
    res.status(500).json({ error: error.message || 'Failed to generate explanation.' });
  }
});

// Setup dev server with Vite or production static serve
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SnapStudy AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
