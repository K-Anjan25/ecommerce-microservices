import React from "react";
import { Box, CircularProgress, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { QuestionApi, QuestionItem } from "../../api/questionApi";
import EmptyState from "../EmptyState";
import { useI18n } from "../../features/i18n";
import { AppState } from "../../store";
import { useSelector } from "react-redux";
import { showError } from "../../utils/showError";
import { showSuccess } from "../../utils/showSuccess";

interface QuestionsProps {
  productId: string;
}

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";

/**
 * Amazon-style customer Q&A — the "Q&A" tab on the product page.
 * Anyone reads; signed-in customers ask; staff answers come from the
 * admin console and show with an official "Cartly Staff" badge.
 */
function Questions({ productId }: QuestionsProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [question, setQuestion] = React.useState("");

  const { data: user } = useSelector((state: AppState) => state.user);

  const { data, isLoading } = useQuery(
    ["products:questions", productId],
    () => QuestionApi.getQuestions(productId, 0, 20),
    { staleTime: 30 * 1000 }
  );

  const askMutation = useMutation(() => QuestionApi.askQuestion(productId, question.trim()), {
    onSuccess: () => {
      setQuestion("");
      showSuccess(t("qa.asked"));
      queryClient.invalidateQueries(["products:questions", productId]);
    },
    onError: () => showError(t("qa.askFailed")),
  });

  const canSubmit = question.trim().length >= 5 && !askMutation.isLoading;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    askMutation.mutate();
  };

  return (
    <Box>
      <div className="mb-6 border-b border-line pb-5">
        <p className="eyebrow">{t("qa.eyebrow")}</p>
        <h3 className="mt-1 font-heading text-xl font-extrabold tracking-tight text-ink">
          {t("qa.title")}
        </h3>
      </div>

      {/* Ask form — signed-in customers */}
      {user?.isLogedIn ? (
        <form onSubmit={handleSubmit} className="mb-7 flex items-end gap-3">
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            label={t("qa.placeholder")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            helperText={t("qa.helper")}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="primary-button inline-flex h-10 shrink-0 items-center gap-2 !px-5 disabled:opacity-50"
          >
            {askMutation.isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SendIcon sx={{ fontSize: 16 }} />
            )}
            {t("qa.ask")}
          </button>
        </form>
      ) : (
        <p className="mb-7 rounded-xl border border-line bg-brand-soft/30 px-4 py-3 text-xs font-semibold text-ink-soft">
          {t("qa.signInToAsk")}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <CircularProgress size={24} />
        </div>
      ) : !data?.content?.length ? (
        <EmptyState
          icon={<HelpOutlineOutlinedIcon fontSize="large" />}
          title={t("qa.emptyTitle")}
          subtitle={t("qa.emptySubtitle")}
        />
      ) : (
        <ul className="space-y-6">
          {data.content.map((item: QuestionItem) => (
            <li key={item.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[0.6875rem] font-black text-brand">
                  Q
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold leading-snug text-ink">{item.text}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {t("qa.askedBy")} {item.askedBy} · {formatDate(item.createdDate)}
                  </p>
                </div>
              </div>
              {item.answer ? (
                <div className="ml-9 flex items-start gap-3 border-l-2 border-brand-soft pl-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[0.6875rem] font-black text-white">
                    A
                  </span>
                  <div>
                    <p className="break-words text-sm leading-relaxed text-ink-soft">{item.answer}</p>
                    <p className="mt-1 text-xs font-semibold text-brand">
                      {t("qa.answeredBy")} {item.answeredBy}
                      {item.answeredAt ? ` · ${formatDate(item.answeredAt)}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="ml-9 text-xs font-semibold italic text-ink-muted">{t("qa.awaiting")}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}

export default Questions;
