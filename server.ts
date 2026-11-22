import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const VALID_STYLES = new Set([
  'definition',
  'identification',
  'conceptual',
  'explanation',
  'fact',
  'application',
]);

interface AnalyzeImageInput {
  mimeType: string;
  data: string;
}

interface GeneratedCardRaw {
  cardNumber?: number;
  question?: string;
  answer?: string;
  questionStyle?: string;
  sourceGrounding?: string;
}

interface GeneratedAnalysisRaw {
  isReadable?: boolean;
  readabilityWarning?: string;
  subject?: string;
  topic?: string;
  extractedSummary?: string;
  unclearSections?: string[];
  flashcards?: GeneratedCardRaw[];
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze-notes', async (req: Request, res: Response) => {
    try {
      const body = req.body as { images?: AnalyzeImageInput[] };
      const images = Array.isArray(body?.images) ? body.images : [];

      if (images.length === 0 || images.length > 6) {
        return res.status(400).json({
          error: 'Please provide between 1 and 6 study note images (JPG or PNG).',
        });
      }

      const parts: Array<
        | { inlineData: { mimeType: string; data: string } }
        | { text: string }
      > = [];

      for (const img of images) {
        if (
          !img ||
          typeof img.mimeType !== 'string' ||
          typeof img.data !== 'string'
        ) {
          return res.status(400).json({
            error: 'Each uploaded image must include a valid mimeType and base64 data.',
          });
        }

        const normalizedMime = img.mimeType.toLowerCase() === 'image/jpg'
          ? 'image/jpeg'
          : img.mimeType.toLowerCase();

        if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
          return res.status(400).json({
            error: 'Unsupported image format. Please use JPG, JPEG, or PNG images.',
          });
        }

        const cleanBase64 = img.data.replace(/^data:[^;]+;base64,/, '').trim();
        if (!cleanBase64 || cleanBase64.length > 15_000_000) {
          return res.status(400).json({
            error: 'Image data is empty or exceeds the maximum supported size.',
          });
        }

        parts.push({
          inlineData: {
            mimeType: normalizedMime,
            data: cleanBase64,
          },
        });
      }

      parts.push({
        text: `Analyze ${images.length === 1 ? 'this study material image' : `these ${images.length} study material pages combined into one cohesive study topic`}. Extract the readable text, automatically identify the academic Subject and Topic, check image clarity/readability, and generate exactly 20 distinct, accurate flashcards.`,
      });

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction: `You are an expert educational content analyst and flashcard author for Snap-to-Study AI.
Your task is to analyze one or more photographed/uploaded pages of textbook content, lecture slides, printed handouts, or handwritten notes.

CRITICAL ACCURACY & GROUNDING RULES:
1. Use the uploaded image(s) as your PRIMARY source of truth.
2. NEVER invent definitions, formulas, dates, or facts that contradict or are unsupported by the source material.
3. Preserve important technical terms, symbols, and proper terminology exactly as appropriate for the subject.
4. If the image is too blurry, dark, blank, obstructed, or lacks readable study text, set "isReadable" to false, explain clearly in "readabilityWarning" why it could not be read reliably so the student knows to retake the photo, and return an empty "flashcards" array.
5. If parts of the image are partially cut off or hard to decipher, set "isReadable" to true (if enough study material is legible), list the unclear portions in "unclearSections", and note any caveat in "readabilityWarning".
6. Automatically detect the broad academic "subject" (e.g., "Science", "Information Technology", "Mathematics", "History", "Literature", "Economics", "Psychology", "Medicine") and specific "topic" (e.g., "Photosynthesis", "Computer Programming", "Cell Division", "Database Management").
7. When "isReadable" is true, generate EXACTLY 20 non-duplicate flashcards (cardNumber 1 through 20).
8. Use clear, student-friendly language with concise yet complete answers.
9. Mix question styles across the 20 cards: "definition", "identification", "conceptual", "explanation", "fact", and "application".
10. For each card's "sourceGrounding": use "direct" if the answer is directly stated in the uploaded notes; use "ai_clarification" if you added brief supporting clarification to make a terse note understandable without inventing unsupported facts.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isReadable: {
                type: Type.BOOLEAN,
                description: 'True if the uploaded study notes are legible enough to generate accurate flashcards.',
              },
              readabilityWarning: {
                type: Type.STRING,
                description: 'Empty string if clear; otherwise a helpful warning about blurriness, lighting, or cut-off text.',
              },
              subject: {
                type: Type.STRING,
                description: 'Detected broad academic subject (e.g. Science, Information Technology, Mathematics).',
              },
              topic: {
                type: Type.STRING,
                description: 'Detected specific study topic (e.g. Photosynthesis, Computer Programming).',
              },
              extractedSummary: {
                type: Type.STRING,
                description: 'Concise 2-3 sentence summary of the recognized notes.',
              },
              unclearSections: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Any parts of the notes that were partially illegible or cut off.',
              },
              flashcards: {
                type: Type.ARRAY,
                description: 'Exactly 20 distinct question-and-answer flashcards when isReadable is true.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cardNumber: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    questionStyle: {
                      type: Type.STRING,
                      description: 'One of: definition, identification, conceptual, explanation, fact, application',
                    },
                    sourceGrounding: {
                      type: Type.STRING,
                      description: 'One of: direct, ai_clarification',
                    },
                  },
                  required: [
                    'cardNumber',
                    'question',
                    'answer',
                    'questionStyle',
                    'sourceGrounding',
                  ],
                },
              },
            },
            required: [
              'isReadable',
              'readabilityWarning',
              'subject',
              'topic',
              'extractedSummary',
              'unclearSections',
              'flashcards',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      let parsed: GeneratedAnalysisRaw;
      try {
        parsed = JSON.parse(rawText) as GeneratedAnalysisRaw;
      } catch {
        return res.status(502).json({
          error: 'The AI returned an unexpected response format. Please try scanning again.',
        });
      }

      const isReadable = Boolean(parsed.isReadable);
      const readabilityWarning = String(parsed.readabilityWarning ?? '').slice(0, 500);
      const subject = String(parsed.subject ?? 'General Studies').trim().slice(0, 80) || 'General Studies';
      const topic = String(parsed.topic ?? 'Study Notes').trim().slice(0, 140) || 'Study Notes';
      const extractedSummary = String(parsed.extractedSummary ?? '').trim().slice(0, 2000);
      const unclearSections = Array.isArray(parsed.unclearSections)
        ? parsed.unclearSections.map((s) => String(s).trim()).filter(Boolean).slice(0, 10)
        : [];

      const rawCards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
      const flashcards = rawCards
        .filter((c) => c && typeof c.question === 'string' && typeof c.answer === 'string')
        .slice(0, 20)
        .map((c, idx) => {
          const styleRaw = String(c.questionStyle ?? 'conceptual').toLowerCase();
          const questionStyle = VALID_STYLES.has(styleRaw) ? styleRaw : 'conceptual';
          const groundingRaw = String(c.sourceGrounding ?? 'direct').toLowerCase();
          const sourceGrounding = groundingRaw === 'ai_clarification' ? 'ai_clarification' : 'direct';

          return {
            cardNumber: idx + 1,
            question: String(c.question).trim().slice(0, 1000),
            answer: String(c.answer).trim().slice(0, 2000),
            questionStyle,
            sourceGrounding,
          };
        });

      return res.json({
        isReadable,
        readabilityWarning,
        subject,
        topic,
        extractedSummary,
        unclearSections,
        flashcards,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze study notes.';
      console.error('Error in /api/analyze-notes:', error);

      if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
        return res.status(403).json({
          error: 'Gemini API key is missing or invalid. Please check Settings > Secrets.',
        });
      }
      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        return res.status(429).json({
          error: 'Gemini API rate limit reached. Please wait a moment and try again.',
        });
      }
      return res.status(500).json({
        error: 'Unable to process the study image right now. Please try again.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Snap-to-Study AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
