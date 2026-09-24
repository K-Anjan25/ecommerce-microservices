import { api } from "./client";

export interface QuestionItem {
  id: string;
  text: string;
  askedBy: string;
  createdDate?: string;
  answer?: string | null;
  answeredBy?: string | null;
  answeredAt?: string | null;
  productId: string;
}

// Public endpoint — renders on the product page.
const getQuestions = async (productId: string, page = 0, size = 10) => {
  const { data } = await api.get<{ content: QuestionItem[]; totalElements?: number }>(
    "/v1/questions",
    { params: { productId, page, size } }
  );

  return data;
};

// Requires authentication (customer asks a question).
const askQuestion = async (productId: string, text: string) => {
  const { data } = await api.post<QuestionItem>("/v1/questions", { productId, text });

  return data;
};

// Admin only — staff answer, shown publicly under the question.
const answerQuestion = async (id: string, answer: string) => {
  const { data } = await api.put<QuestionItem>(`/v1/questions/${id}/answer`, { answer });

  return data;
};

// Admin only — moderation.
const deleteQuestion = async (id: string) => {
  await api.delete(`/v1/questions/${id}`);
};

// Admin only — paged list across the catalog.
const getAllQuestions = async (page = 0, size = 20) => {
  const { data } = await api.get<{ content: QuestionItem[]; totalSize?: number; totalElements?: number }>(
    "/v1/questions/all",
    { params: { page, size } }
  );

  return data;
};

export const QuestionApi = {
  getQuestions,
  askQuestion,
  answerQuestion,
  deleteQuestion,
  getAllQuestions,
};
