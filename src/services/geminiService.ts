import { FlashcardDeck, GenerateDeckRequest } from '../types';

export const geminiService = {
  async generateFlashcards(params: GenerateDeckRequest): Promise<{ deck: FlashcardDeck }> {
    const response = await fetch('/api/generate-flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      let errMessage = 'Failed to generate flashcards from camera snap.';
      try {
        const errorData = await response.json();
        if (errorData.error) errMessage = errorData.error;
      } catch (e) {
        // ignore json parse error
      }
      throw new Error(errMessage);
    }

    const json = await response.json();
    const data = json.data;

    const newDeck: FlashcardDeck = {
      id: `deck_${Date.now()}`,
      title: data.deckTitle || 'Extracted Study Deck',
      subject: data.subject || 'General Study',
      summary: data.summary || 'Generated from image notes.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceImage: params.imageBase64,
      sourceType: 'camera',
      estimatedStudyTimeMinutes: data.estimatedStudyTimeMinutes || 15,
      tags: [data.subject || 'Study', 'Snap-AI', 'High-Yield'],
      masteryPercentage: 0,
      totalReviews: 0,
      cards: (data.cards || []).map((c: any, index: number) => ({
        id: c.id || `card_${Date.now()}_${index}`,
        front: c.front,
        back: c.back,
        hint: c.hint || '',
        coreConcept: c.coreConcept || 'Key Concept',
        keyFormulaOrTerm: c.keyFormulaOrTerm || '',
        sourceSnippet: c.sourceSnippet || '',
        difficulty: c.difficulty || 'medium',
        box: 1,
        reviewCount: 0,
        lapseCount: 0,
      })),
    };

    return { deck: newDeck };
  },

  async explainCard(cardFront: string, cardBack: string, subject: string, question?: string): Promise<string> {
    const response = await fetch('/api/explain-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardFront, cardBack, subject, question }),
    });

    if (!response.ok) {
      throw new Error('Failed to get explanation from AI.');
    }

    const data = await response.json();
    return data.explanation || 'No explanation generated.';
  },
};
