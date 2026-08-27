import { getGeminiModel } from '../config/gemini.js';
import { AIUsageLog } from '../models/AIUsageLog.model.js';
import { Chat } from '../models/Chat.model.js';
import { Student } from '../models/Student.model.js';
import { ApiError } from '../utils/ApiError.js';
import { extractJson, summarizeProfile } from '../utils/aiHelpers.js';

const MAX_CHAT_HISTORY = 20;

// A hanging provider call shouldn't hold a request open forever — cap it.
const GEMINI_TIMEOUT_MS = 30_000;
// Conservative character cap (rough proxy for tokens) — protects both cost
// and abuse; every feature already builds a bounded prompt, so a legitimate
// request should never come close to this.
const MAX_PROMPT_CHARS = 12_000;
// AIUsageLog is diagnostic, not a full transcript store — cap what's recorded
// so a single huge response can't bloat the log collection unbounded.
const MAX_LOGGED_RESPONSE_CHARS = 20_000;
const MAX_ATTEMPTS = 2; // the call itself + one retry, transient failures only

export function isQuotaError(err) {
  const status = err?.status ?? err?.response?.status;
  const message = (err.message || '').toLowerCase();
  return status === 429 || message.includes('quota') || message.includes('rate limit');
}

/** Retry only genuinely transient failures — never quota errors (won't succeed) or 4xx client errors (won't succeed either). */
export function isRetryable(err) {
  if (isQuotaError(err)) return false;
  const status = err?.status ?? err?.response?.status;
  if (status && status >= 400 && status < 500) return false;
  return true;
}

async function callGeminiOnce(model, { systemInstruction, userPrompt }) {
  const result = await model.generateContent(
    { contents: [{ role: 'user', parts: [{ text: userPrompt }] }], systemInstruction },
    { timeout: GEMINI_TIMEOUT_MS }
  );
  return result.response.text();
}

/**
 * Every Gemini call in the app goes through this function, which is also the single
 * choke point that writes AIUsageLog entries — this is what will power the Super
 * Admin "AI Usage" dashboard without extra bookkeeping anywhere else.
 */
async function callGemini({ userId, feature, systemInstruction, userPrompt }) {
  if (userPrompt.length > MAX_PROMPT_CHARS) {
    throw ApiError.badRequest('Your request is too long. Please shorten it and try again.');
  }

  const model = getGeminiModel();
  let text;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      text = await callGeminiOnce(model, { systemInstruction, userPrompt });
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      if (attempt >= MAX_ATTEMPTS || !isRetryable(err)) break;
    }
  }

  if (lastError) {
    await AIUsageLog.create({
      userId,
      feature,
      status: 'error',
      promptChars: userPrompt.length,
      errorMessage: (lastError.message || 'Unknown error').slice(0, 500),
    });
    if (isQuotaError(lastError)) {
      throw ApiError.tooManyRequests(
        'The AI service is currently at capacity. Please try again in a few minutes.'
      );
    }
    throw ApiError.internal('The AI service is temporarily unavailable. Please try again shortly.');
  }

  await AIUsageLog.create({
    userId,
    feature,
    status: 'success',
    promptChars: userPrompt.length,
    responseChars: Math.min(text.length, MAX_LOGGED_RESPONSE_CHARS),
  });

  return text;
}

async function callGeminiForJson(args) {
  const text = await callGemini(args);
  return extractJson(text);
}

async function getStudentContext(userId) {
  const student = await Student.findOne({ userId });
  if (!student) {
    throw ApiError.badRequest('Complete your student profile before using AI features.');
  }
  return student;
}

export async function skillGapAnalysis(userId, targetRole) {
  const profile = summarizeProfile(await getStudentContext(userId));

  return callGeminiForJson({
    userId,
    feature: 'skill_gap',
    systemInstruction:
      'You are a career advisor for IT students. Respond ONLY with valid JSON (no markdown, no ' +
      'commentary) matching exactly this shape: {"targetRole": string, "matchedSkills": string[], ' +
      '"missingSkills": [{"skill": string, "importance": "high"|"medium"|"low"}], ' +
      '"overallReadinessPercent": number}',
    userPrompt: `Target role: ${targetRole}\n\nStudent profile:\n${profile}\n\nAnalyze the skill gap between this student's current profile and the target role.`,
  });
}

export async function careerRecommendation(userId) {
  const profile = summarizeProfile(await getStudentContext(userId));

  return callGeminiForJson({
    userId,
    feature: 'career_recommendation',
    systemInstruction:
      'You are a career advisor for IT students. Respond ONLY with valid JSON matching exactly: ' +
      '{"recommendations": [{"role": string, "matchReason": string, "matchScore": number}]}. ' +
      'Give 3 to 5 recommendations, matchScore from 0 to 100.',
    userPrompt: `Student profile:\n${profile}\n\nRecommend suitable IT career paths for this student.`,
  });
}

export async function learningRoadmap(userId, goal) {
  const profile = summarizeProfile(await getStudentContext(userId));

  return callGeminiForJson({
    userId,
    feature: 'learning_roadmap',
    systemInstruction:
      'You are a career advisor for IT students. Respond ONLY with valid JSON matching exactly: ' +
      '{"title": string, "steps": [{"order": number, "title": string, "description": string, ' +
      '"estimatedWeeks": number, "resources": string[]}]}. Provide 4 to 8 steps.',
    userPrompt: `Goal: ${goal}\n\nStudent profile:\n${profile}\n\nBuild a learning roadmap to reach this goal from the student's current level.`,
  });
}

/**
 * Advisory suggestions derived from the student's structured profile — not the parsed
 * resume text, since resume parsing is a Resume module (Phase 11) capability that
 * doesn't exist yet. This does not write to the Resume record; it's independent,
 * on-demand advice. The Resume module's future ATS pipeline owns persisted
 * grammar/keyword suggestions on the Resume document itself.
 */
export async function resumeSuggestions(userId) {
  const profile = summarizeProfile(await getStudentContext(userId));

  return callGeminiForJson({
    userId,
    feature: 'resume_suggestions',
    systemInstruction:
      'You are a resume advisor for IT students. Respond ONLY with valid JSON matching exactly: ' +
      '{"strengths": string[], "gapsToAddress": string[], "keywordSuggestions": string[]}',
    userPrompt: `Student profile:\n${profile}\n\nGive resume-strengthening advice based on this profile.`,
  });
}

export async function technologyRecommendation(userId, interest) {
  const profile = summarizeProfile(await getStudentContext(userId));

  return callGeminiForJson({
    userId,
    feature: 'technology_recommendation',
    systemInstruction:
      'You are a career advisor for IT students. Respond ONLY with valid JSON matching exactly: ' +
      '{"recommendations": [{"technology": string, "reason": string, "priority": "high"|"medium"|"low"}]}',
    userPrompt: `Area of interest: ${interest}\n\nStudent profile:\n${profile}\n\nRecommend technologies or tools this student should learn next.`,
  });
}

export async function interviewQuestions(userId, targetRole, difficulty = 'medium') {
  return callGeminiForJson({
    userId,
    feature: 'interview_questions',
    systemInstruction:
      'You are a technical interviewer. Respond ONLY with valid JSON matching exactly: ' +
      '{"questions": [{"question": string, "category": string, "difficulty": string}]}. ' +
      'Provide 5 to 8 questions.',
    userPrompt: `Target role: ${targetRole}\nDifficulty: ${difficulty}\n\nGenerate interview questions for this role.`,
  });
}

export async function salaryEstimation(userId, { role, location, experienceYears = 0 }) {
  const result = await callGeminiForJson({
    userId,
    feature: 'salary_estimation',
    systemInstruction:
      'You are a compensation research assistant. Respond ONLY with valid JSON matching exactly: ' +
      '{"role": string, "location": string, "estimatedRange": {"min": number, "max": number, "currency": string}}. ' +
      'Give a realistic general estimate based on public salary knowledge.',
    userPrompt: `Role: ${role}\nLocation: ${location}\nExperience: ${experienceYears} years\n\nEstimate a salary range.`,
  });

  return {
    ...result,
    disclaimer:
      'This is an AI-generated estimate for guidance only, not a guarantee or offer. Actual compensation varies by company, so verify against current listings.',
  };
}

export async function careerChatbot(userId, { chatId, message }) {
  let chat;
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, userId, chatType: 'ai_chatbot' });
    if (!chat) throw ApiError.notFound('Chat not found.');
  } else {
    chat = await Chat.create({ userId, chatType: 'ai_chatbot', messages: [] });
  }

  chat.messages.push({ sender: 'user', content: message });

  const student = await Student.findOne({ userId });
  const context = student ? summarizeProfile(student) : 'No profile on file yet.';
  const history = chat.messages
    .slice(-MAX_CHAT_HISTORY)
    .map((m) => `${m.sender}: ${m.content}`)
    .join('\n');

  const reply = await callGemini({
    userId,
    feature: 'chatbot',
    systemInstruction: `You are CareerFlow's career guidance chatbot for IT students. Be concise, encouraging, and practical.\n\nStudent context:\n${context}`,
    userPrompt: `${history}\nassistant:`,
  });

  chat.messages.push({ sender: 'assistant', content: reply });
  await chat.save();

  return { chatId: chat._id, reply };
}

export async function startMockInterview(userId, targetRole) {
  const chat = await Chat.create({
    userId,
    chatType: 'mock_interview',
    metadata: { targetRole },
    messages: [],
  });

  const question = await callGemini({
    userId,
    feature: 'mock_interview',
    systemInstruction: `You are conducting a mock interview for the role of ${targetRole}. Ask one interview question at a time. Keep it concise — question only, no preamble.`,
    userPrompt: 'Ask the opening interview question.',
  });

  chat.messages.push({ sender: 'assistant', content: question });
  await chat.save();

  return { chatId: chat._id, question };
}

export async function continueMockInterview(userId, { chatId, answer }) {
  const chat = await Chat.findOne({ _id: chatId, userId, chatType: 'mock_interview' });
  if (!chat) throw ApiError.notFound('Mock interview session not found.');

  chat.messages.push({ sender: 'user', content: answer });
  const targetRole = chat.metadata?.targetRole || 'the target role';
  const history = chat.messages
    .slice(-MAX_CHAT_HISTORY)
    .map((m) => `${m.sender}: ${m.content}`)
    .join('\n');

  const reply = await callGemini({
    userId,
    feature: 'mock_interview',
    systemInstruction: `You are conducting a mock interview for the role of ${targetRole}. Give brief, constructive feedback on the candidate's last answer (2-3 sentences), then ask the next question. Keep the whole reply concise.`,
    userPrompt: `${history}\nassistant:`,
  });

  chat.messages.push({ sender: 'assistant', content: reply });
  await chat.save();

  return { chatId: chat._id, reply };
}
