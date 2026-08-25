import React from "react";
import { Box, CircularProgress, Rating, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import Comment from "./Comment";
import { Comment as CommentType } from "../../types/comment";
import EmptyState from "../EmptyState";

interface CommentsProps {
  comments: CommentType[];
  onCreateComment: (text: string, rating?: number) => Promise<unknown>;
}

/**
 * Product reviews — Editorial Warmth treatment of the Reviews tab.
 *
 * A quiet full-width composer (hairline panel, star rating, rust "Post"
 * action) sits above an unboxed list of review lines. The heading uses the
 * same Instrument Serif / eyebrow rhythm as the rest of the storefront.
 */
function Comments({ comments, onCreateComment }: CommentsProps) {
  const [text, setText] = React.useState("");
  const [rating, setRating] = React.useState<number | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit = text.trim().length > 0 && !submitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || submitting) return;

    setSubmitting(true);
    try {
      await onCreateComment(value, rating ?? undefined);
      setText("");
      setRating(null);
    } catch {
      /* Error toast is raised by the owning mutation; keep the draft so it can be retried. */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
        <div>
          <p className="eyebrow">Reviews</p>
          <h3 className="mt-1 font-display text-3xl font-normal tracking-tight text-ink">
            What customers say
          </h3>
        </div>
        <span className="pb-1 text-xs text-ink-muted">
          {comments.length} {comments.length === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* composer */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="panel p-4 sm:p-5">
          <label
            htmlFor="review-text"
            className="mb-2 block text-sm font-semibold text-ink"
          >
            Share your thoughts
          </label>
          <TextField
            id="review-text"
            placeholder="How did you find it? Fit, materials, what stood out…"
            multiline
            minRows={3}
            fullWidth
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Your rating</span>
              <Rating
                value={rating}
                precision={1}
                size="small"
                onChange={(_event, value) => setRating(value)}
              />
              {rating != null && (
                <span className="text-xs font-semibold text-ink">
                  {rating} / 5
                </span>
              )}
            </div>
            <button type="submit" disabled={!canSubmit} className="primary-button">
              {submitting ? (
                <>
                  <CircularProgress size={16} sx={{ color: "inherit" }} />
                  Posting…
                </>
              ) : (
                <>
                  Post review <SendIcon sx={{ fontSize: 16 }} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* list */}
      {comments.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<ForumOutlinedIcon fontSize="large" />}
            title="No reviews yet"
            subtitle="Be the first to share your thoughts on this product."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </Box>
  );
}

export default Comments;
