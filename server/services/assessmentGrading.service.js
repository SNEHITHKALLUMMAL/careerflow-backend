/** Case/whitespace-insensitive comparison so "React" and " react " both match. */
export function normalizeAnswer(value) {
  return (value ?? '').toString().trim().toLowerCase();
}

/**
 * Grades a set of submitted answers against an assessment's questions.
 *
 * Coding questions are never auto-graded — see the module README for why
 * (safe sandboxed code execution isn't part of this build). Their answers
 * come back with isCorrect/marksAwarded set to null, pending manual review.
 *
 * @param {Array<{_id, marks, correctAnswer}>} questions - full question docs (with correctAnswer visible)
 * @param {Array<{questionId, response}>} submittedAnswers
 * @param {string} assessmentType
 * @returns {{ gradedAnswers: Array, totalScore: number, maxScore: number, hasPendingManualGrading: boolean }}
 */
export function gradeAnswers(questions, submittedAnswers, assessmentType) {
  const questionsById = new Map(questions.map((q) => [String(q._id), q]));
  let totalScore = 0;
  let hasPendingManualGrading = false;

  const gradedAnswers = submittedAnswers.map(({ questionId, response }) => {
    const question = questionsById.get(String(questionId));
    if (!question) {
      throw new Error(`Unknown question id: ${questionId}`);
    }

    if (assessmentType === 'coding') {
      hasPendingManualGrading = true;
      return { questionId, response: response ?? null, isCorrect: null, marksAwarded: null };
    }

    const isCorrect = normalizeAnswer(response) === normalizeAnswer(question.correctAnswer);
    const marksAwarded = isCorrect ? question.marks : 0;
    totalScore += marksAwarded;

    return { questionId, response: response ?? null, isCorrect, marksAwarded };
  });

  const maxScore = questions.reduce((sum, q) => sum + q.marks, 0);

  return { gradedAnswers, totalScore, maxScore, hasPendingManualGrading };
}

/** @returns {{ percentage: number, passed: boolean }} */
export function computeOutcome(totalScore, maxScore, passingScore) {
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  return { percentage, passed: percentage >= passingScore };
}

/**
 * Applies manual grading updates (for coding answers) to an existing set of
 * answers, capping each awarded mark at the question's max and recomputing totals.
 *
 * @param {Array} existingAnswers - attempt.answers (plain objects or subdocuments)
 * @param {Array<{_id, marks}>} questions
 * @param {Array<{questionId, marksAwarded}>} gradedItems
 */
export function applyManualGrading(existingAnswers, questions, gradedItems) {
  const questionsById = new Map(questions.map((q) => [String(q._id), q]));
  const answersById = new Map(existingAnswers.map((a) => [String(a.questionId), a]));

  for (const { questionId, marksAwarded } of gradedItems) {
    const answer = answersById.get(String(questionId));
    const question = questionsById.get(String(questionId));
    if (!answer) continue;

    const cap = question?.marks ?? marksAwarded;
    const capped = Math.max(0, Math.min(Number(marksAwarded), cap));
    answer.marksAwarded = capped;
    answer.isCorrect = capped > 0;
  }

  const totalScore = existingAnswers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
  return { answers: existingAnswers, totalScore };
}
