import {
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LoadingButton from "@mui/lab/LoadingButton";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { QuestionApi, QuestionItem } from "../../../api/questionApi";
import EmptyState from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import { showError } from "../../../utils/showError";
import { showSuccess } from "../../../utils/showSuccess";
import { formatDate } from "../../../utils/date";

const PAGE_SIZE = 20;

const errorMessage = (e: unknown): string => {
  const response = (e as { response?: { data?: { message?: string } | string } })?.response?.data;
  if (typeof response === "string") return response;
  return response?.message ?? "Something went wrong — please try again.";
};

/**
 * Customer Q&A moderation: answer questions publicly (they render in the
 * product page's Q&A tab) or remove spam. Every action is audit-logged
 * server-side.
 */
function AdminQuestions() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [answering, setAnswering] = useState<QuestionItem | null>(null);
  const [answer, setAnswer] = useState("");
  const [deleting, setDeleting] = useState<QuestionItem | null>(null);

  const { data, isLoading } = useQuery(["admin-questions", page], () =>
    QuestionApi.getAllQuestions(page, PAGE_SIZE)
  );

  const invalidate = () => {
    queryClient.invalidateQueries("admin-questions");
    queryClient.invalidateQueries("admin-questions-count");
  };

  const answerMutation = useMutation(
    () => QuestionApi.answerQuestion(answering!.id, answer.trim()),
    {
      onSuccess: () => {
        setAnswering(null);
        setAnswer("");
        showSuccess("Answer published — it is now live on the product page");
        invalidate();
      },
      onError: (e) => showError(errorMessage(e)),
    }
  );

  const deleteMutation = useMutation((id: string) => QuestionApi.deleteQuestion(id), {
    onSuccess: () => {
      setDeleting(null);
      showSuccess("Question has been removed");
      invalidate();
    },
    onError: (e) => {
      setDeleting(null);
      showError(errorMessage(e));
    },
  });

  const questions = data?.content ?? [];
  const total = data?.totalSize ?? data?.totalElements ?? questions.length;
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer questions"
        subtitle="Answer pre-purchase questions publicly — every answer shows on the product page with a Cartly Staff badge."
      />

      {isLoading ? (
        <SkeletonRows rows={5} columns={4} />
      ) : questions.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<HelpOutlineOutlinedIcon fontSize="large" />}
            title="No customer questions yet"
            subtitle="Questions asked on product pages collect here for answering."
          />
        </div>
      ) : (
        <Paper className="overflow-hidden">
          {questions.map((item) => (
            <div key={item.id} className="border-b border-line px-5 py-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <Avatar className="!bg-brand-soft !text-brand !text-xs !font-bold">
                  {initials(item.askedBy ?? "?")}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold leading-snug text-ink">
                    {item.text}
                  </p>
                  <Typography className="mt-0.5 text-xs text-ink-muted">
                    {item.askedBy} · {formatDate(item.createdDate ?? "")} · product {item.productId.slice(0, 8)}…
                  </Typography>

                  {item.answer ? (
                    <div className="mt-2 rounded-xl border border-line bg-brand-soft/20 px-4 py-3">
                      <p className="break-words text-sm leading-relaxed text-ink-soft">{item.answer}</p>
                      <p className="mt-1 text-xs font-semibold text-brand">
                        {item.answeredBy} · {formatDate(item.answeredAt ?? "")}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-state-warning">
                      Awaiting answer
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      setAnswering(item);
                      setAnswer(item.answer ?? "");
                    }}
                  >
                    {item.answer ? "Edit answer" : "Answer"}
                  </Button>
                  <IconButton
                    size="small"
                    aria-label="Delete question"
                    className="!text-state-danger"
                    onClick={() => setDeleting(item)}
                  >
                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs font-semibold text-ink-muted">
              <span>
                Page {page + 1} · {total} questions
              </span>
              <div className="flex gap-2">
                <Button size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Newer
                </Button>
                <Button
                  size="small"
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Older
                </Button>
              </div>
            </div>
          )}
        </Paper>
      )}

      {/* Answer dialog */}
      <Dialog open={Boolean(answering)} onClose={() => setAnswering(null)} fullWidth maxWidth="sm">
        <DialogTitle className="font-bold">Answer customer question</DialogTitle>
        <DialogContent className="space-y-4">
          <Typography className="rounded-xl border border-line bg-brand-soft/20 px-4 py-3 text-sm font-semibold text-ink">
            {answering?.text}
          </Typography>
          <Typography className="text-xs text-ink-muted">
            This publishes to the product page immediately, with your name as the responder.
          </Typography>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Write a clear, helpful answer…"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnswering(null)}>Cancel</Button>
          <LoadingButton
            variant="contained"
            loading={answerMutation.isLoading}
            disabled={answer.trim().length < 2}
            onClick={() => answerMutation.mutate()}
          >
            Publish answer
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} fullWidth maxWidth="xs">
        <DialogTitle className="font-bold">Remove this question?</DialogTitle>
        <DialogContent>
          <Typography className="text-sm text-ink-soft">
            “{deleting?.text}” will be permanently removed from the product page. This action is
            audit-logged.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <LoadingButton
            color="error"
            variant="contained"
            loading={deleteMutation.isLoading}
            onClick={() => deleting && deleteMutation.mutate(deleting.id)}
          >
            Remove question
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AdminQuestions;
