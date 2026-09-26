import React from "react";
import { Avatar, Rating } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import { Comment as CommentType } from "../../../types/comment";
import { formatDate } from "../../../utils/date";
import { ImageLightbox } from "../../ProductGallery";

interface CommentProps {
  comment: CommentType;
}

function Comment({ comment }: CommentProps) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const images = comment?.images ?? [];
  const initials =
    (comment?.creator?.split(" ").map((p) => p[0]?.toUpperCase()).join("") ??
      "?") || "?";

  return (
    <article className="panel p-4 sm:p-5">
      <div className="flex gap-3">
        <Avatar className="!h-10 !w-10 !bg-brand-soft !text-sm !font-bold !text-brand">
          {initials}
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
              {comment?.creator}
              {comment?.verifiedPurchase && (
                <span className="inline-flex items-center gap-1 rounded-full bg-state-success-soft px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-state-success-on">
                  ✓ Verified purchase
                </span>
              )}
            </p>
            <p className="text-xs text-ink-muted">
              {formatDate(comment?.createdDate)}
            </p>
          </div>
          {comment?.rating != null && comment.rating > 0 && (
            <Rating value={comment.rating} size="small" readOnly />
          )}
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            {comment?.text}
          </p>

          {/* customer photos of the received product */}
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.id ?? idx}
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`Open customer photo ${idx + 1}`}
                  className="h-16 w-16 overflow-hidden rounded-md border border-line transition hover:border-ink"
                >
                  <img
                    src={img.imageUrl}
                    alt={img.altText ?? "Customer photo of the received product"}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = "/images/store/product-placeholder.svg";
                    }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightboxIndex != null && images.length > 0 && (
        <ImageLightbox
          images={images.map((img) => ({
            url: img.imageUrl,
            altText: img.altText ?? "Customer photo of the received product",
          }))}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          alt="Customer photo of the received product"
        />
      )}
    </article>
  );
}

export default Comment;
