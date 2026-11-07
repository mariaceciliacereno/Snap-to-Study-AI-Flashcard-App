import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckCircle2, XCircle, RotateCcw, Trophy, Award, ArrowRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FlashcardDeck } from '../types';

interface QuizModeProps {
  deck: FlashcardDeck;
  onClose: () => void;
  onStudyMode: () => void;
}

interface Question {
  cardId: string;
  question: string;
  correctAnswer: string;
  concept: string;
  options: string[];
}

export const QuizMode: React.FC<QuizModeProps> = ({ deck, onClose, onStudyMode }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Generate 4-choice questions from the deck cards
  const questions: Question[] = useMemo(() => {
    const cards = [...deck.cards];
    return cards.map((card, i) => {
      // Pick 3 distractors from other cards
      const otherAnswers = cards
        .filter((_, idx) => idx !== i)
        .map((c) => c.back);

      // Shuffle other answers
      const shuffledOthers = otherAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      // Combine correct and distractors and shuffle
      const allOptions = [card.back, ...shuffledOthers].sort(() => 0.5 - Math.random());

      return {
        cardId: card.id,
        question: card.front,
        correctAnswer: card.back,
        concept: card.coreConcept,
        options: allOptions,
      };
    });
  }, [deck]);

  const currentQ = questions[currentIdx];

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    if (opt === currentQ.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Bar */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between gap-4 py-2">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          title="Exit Quiz"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-xs font-bold text-white truncate max-w-xs">{deck.title} · Rapid Quiz</p>
          <p className="text-[11px] text-slate-400">
            Question {currentIdx + 1} of {questions.length}
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800/40 text-xs font-bold text-indigo-300">
          Score: {score}/{questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-2xl w-full mx-auto h-1.5 bg-slate-900 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Arena */}
      {!isFinished ? (
        <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col justify-center space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-800/40">
              {currentQ.concept}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* 4 Choices */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === currentQ.correctAnswer;

              let btnStyle = 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-200';
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-900/20';
                } else if (isSelected) {
                  btnStyle = 'bg-red-950/70 border-red-500 text-red-100';
                } else {
                  btnStyle = 'bg-slate-900/40 border-slate-800/50 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start justify-between gap-3 ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          {isAnswered && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <span>{currentIdx < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="flex-1 max-w-md w-full mx-auto flex flex-col items-center justify-center text-center p-6 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white">Quiz Complete!</h3>
            <p className="text-sm text-slate-400 mt-1">
              You scored <span className="font-bold text-white">{score}</span> out of{' '}
              <span className="font-bold text-white">{questions.length}</span> ({percentage}%)
            </p>
          </div>

          <div className="w-full bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Performance Level</span>
              <span className="font-bold text-indigo-400">
                {percentage >= 80 ? '🌟 Mastery' : percentage >= 60 ? '👍 Solid Foundation' : '🔄 Needs Review'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={() => {
                setCurrentIdx(0);
                setSelectedOption(null);
                setIsAnswered(false);
                setScore(0);
                setIsFinished(false);
              }}
              className="w-full py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
            >
              Retake Quiz
            </button>
            <button
              onClick={onStudyMode}
              className="w-full py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all"
            >
              Study Flashcards
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
