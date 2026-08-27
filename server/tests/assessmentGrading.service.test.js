import {
  normalizeAnswer,
  gradeAnswers,
  computeOutcome,
  applyManualGrading,
} from '../services/assessmentGrading.service.js';

const MCQ_QUESTIONS = [
  { _id: 'q1', marks: 5, correctAnswer: 'Paris' },
  { _id: 'q2', marks: 10, correctAnswer: 'O(log n)' },
  { _id: 'q3', marks: 5, correctAnswer: 'true' },
];

describe('normalizeAnswer', () => {
  it('trims whitespace and lowercases', () => {
    expect(normalizeAnswer('  Paris  ')).toBe('paris');
  });

  it('treats null/undefined as an empty string', () => {
    expect(normalizeAnswer(null)).toBe('');
    expect(normalizeAnswer(undefined)).toBe('');
  });
});

describe('gradeAnswers (mcq/quiz types)', () => {
  it('awards full marks for correct answers and zero for incorrect ones', () => {
    const submitted = [
      { questionId: 'q1', response: 'paris' }, // correct, different case
      { questionId: 'q2', response: 'O(n)' }, // wrong
      { questionId: 'q3', response: '  true  ' }, // correct, extra whitespace
    ];

    const { gradedAnswers, totalScore, maxScore, hasPendingManualGrading } = gradeAnswers(
      MCQ_QUESTIONS,
      submitted,
      'mcq'
    );

    expect(totalScore).toBe(10); // q1 (5) + q3 (5), q2 wrong
    expect(maxScore).toBe(20);
    expect(hasPendingManualGrading).toBe(false);
    expect(gradedAnswers.find((a) => a.questionId === 'q1').isCorrect).toBe(true);
    expect(gradedAnswers.find((a) => a.questionId === 'q2').isCorrect).toBe(false);
    expect(gradedAnswers.find((a) => a.questionId === 'q2').marksAwarded).toBe(0);
  });

  it('treats a missing/empty response as incorrect, not a crash', () => {
    const { gradedAnswers, totalScore } = gradeAnswers(
      MCQ_QUESTIONS,
      [{ questionId: 'q1', response: null }],
      'mcq'
    );
    expect(gradedAnswers[0].isCorrect).toBe(false);
    expect(totalScore).toBe(0);
  });

  it('throws for an answer referencing an unknown question id', () => {
    expect(() =>
      gradeAnswers(MCQ_QUESTIONS, [{ questionId: 'ghost', response: 'x' }], 'mcq')
    ).toThrow(/Unknown question id/);
  });
});

describe('gradeAnswers (coding type — never auto-graded)', () => {
  const CODING_QUESTIONS = [{ _id: 'c1', marks: 20, correctAnswer: null }];

  it('marks coding answers as pending, awards no marks, and flags hasPendingManualGrading', () => {
    const { gradedAnswers, totalScore, hasPendingManualGrading } = gradeAnswers(
      CODING_QUESTIONS,
      [{ questionId: 'c1', response: 'function solve() { return 42; }' }],
      'coding'
    );

    expect(hasPendingManualGrading).toBe(true);
    expect(totalScore).toBe(0);
    expect(gradedAnswers[0].isCorrect).toBeNull();
    expect(gradedAnswers[0].marksAwarded).toBeNull();
    expect(gradedAnswers[0].response).toContain('function solve');
  });
});

describe('computeOutcome', () => {
  it('computes percentage and pass/fail against the passing score', () => {
    expect(computeOutcome(15, 20, 40)).toEqual({ percentage: 75, passed: true });
    expect(computeOutcome(5, 20, 40)).toEqual({ percentage: 25, passed: false });
    expect(computeOutcome(8, 20, 40)).toEqual({ percentage: 40, passed: true }); // exactly at threshold
  });

  it('treats a zero maxScore as 0% rather than dividing by zero', () => {
    expect(computeOutcome(0, 0, 40)).toEqual({ percentage: 0, passed: false });
  });
});

describe('applyManualGrading', () => {
  it('applies grader-awarded marks and recomputes total score', () => {
    const existingAnswers = [
      { questionId: 'c1', response: 'code A', isCorrect: null, marksAwarded: null },
      { questionId: 'c2', response: 'code B', isCorrect: null, marksAwarded: null },
    ];
    const questions = [
      { _id: 'c1', marks: 20 },
      { _id: 'c2', marks: 15 },
    ];

    const { totalScore } = applyManualGrading(existingAnswers, questions, [
      { questionId: 'c1', marksAwarded: 18 },
      { questionId: 'c2', marksAwarded: 0 },
    ]);

    expect(totalScore).toBe(18);
    expect(existingAnswers[0].isCorrect).toBe(true);
    expect(existingAnswers[1].isCorrect).toBe(false);
  });

  it('caps awarded marks at the question maximum, even if the grader sends more', () => {
    const existingAnswers = [
      { questionId: 'c1', response: 'code', isCorrect: null, marksAwarded: null },
    ];
    const questions = [{ _id: 'c1', marks: 10 }];

    const { totalScore } = applyManualGrading(existingAnswers, questions, [
      { questionId: 'c1', marksAwarded: 999 },
    ]);

    expect(totalScore).toBe(10);
  });

  it('never allows negative marks', () => {
    const existingAnswers = [
      { questionId: 'c1', response: 'code', isCorrect: null, marksAwarded: null },
    ];
    const questions = [{ _id: 'c1', marks: 10 }];

    const { totalScore } = applyManualGrading(existingAnswers, questions, [
      { questionId: 'c1', marksAwarded: -5 },
    ]);

    expect(totalScore).toBe(0);
  });

  it('silently ignores grading for an answer that does not exist on the attempt', () => {
    const existingAnswers = [
      { questionId: 'c1', response: 'code', isCorrect: null, marksAwarded: null },
    ];
    const questions = [{ _id: 'c1', marks: 10 }];

    expect(() =>
      applyManualGrading(existingAnswers, questions, [{ questionId: 'ghost', marksAwarded: 5 }])
    ).not.toThrow();
  });
});
