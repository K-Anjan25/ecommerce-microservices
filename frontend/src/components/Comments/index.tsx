import React from "react";
import { Box, CircularProgress, Rating, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import Comment from "./Comment";
import { Comment as CommentType } from "../../types/comment";
import EmptyState from "../EmptyState";

interface CommentsProps {
  comments: CommentType[];
  onCreateComment: (
    text: string,
    rating?: number,
    images?: string[]
  ) => Promise<unknown>;
}

const MAX_PHOTOS = 8;

/** Client-side downscale to keep review uploads fast and small (JPEG ~1200px). */
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1200;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

/**
 * Product reviews — Editorial Warmth treatment of the Reviews tab.
 *
 * A quiet full-width composer (hairline panel, star rating, review photos of
 * the received product, rust "Post" action) sits above an unboxed list of
 * review lines. The heading uses the same Instrument Serif / eyebrow rhythm
 * as the rest of the storefront.
 */
function Comments({ comments, onCreateComment }: CommentsProps) {
  const [text, setText] = React.useState("");
  const [rating, setRating] = React.useState<number | null>(null);
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);

  const canSubmit = text.trim().length > 0 && !submitting && !processing;

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const chosen = files.slice(0, Math.max(0, room));
      const dataUrls = await Promise.all(chosen.map(fileToDataUrl));
      setPhotos((prev) => [...prev, ...dataUrls].slice(0, MAX_PHOTOS));
    } catch {
      /* Ignore unreadable files; the rest still attach. */
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || submitting) return;

    setSubmitting(true);
    try {
      await onCreateComment(value, rating ?? undefined, photos.length ? photos : undefined);
      setText("");
      setRating(null);
      setPhotos([]);
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
          <h3 className="mt-1 font-heading text-xl font-extrabold tracking-tight text-ink">
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

          {/* review photos — shots of the product you received */}
          <div className="mt-3">
            <p className="mb-2 text-xs text-ink-muted">
              Add photos of the received product{" "}
              <span className="text-ink-faint">({photos.length}/{MAX_PHOTOS})</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {photos.map((src, idx) => (
                <span key={idx} className="relative h-16 w-16">
                  <img
                    src={src}
                    alt={`Review photo ${idx + 1}`}
                    className="h-full w-full rounded-md border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label={`Remove photo ${idx + 1}`}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-oncontrast shadow"
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </button>
                </span>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="chip !py-2 !text-xs">
                  <AddAPhotoOutlinedIcon sx={{ fontSize: 15 }} />
                  {processing ? "Processing…" : "Add photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                    disabled={processing}
                  />
                </label>
              )}
            </div>
          </div>

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
