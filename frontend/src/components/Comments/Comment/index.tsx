import React from "react";
import { Avatar, Rating } from "@mui/material";
import { Comment as CommentType } from "../../../types/comment";
import { formatDate } from "../../../utils/date";

interface CommentProps {
  comment: CommentType;
}

function Comment({ comment }: CommentProps) {
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
            <p className="font-semibold text-ink">{comment?.creator}</p>
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
        </div>
      </div>
    </article>
  );
}

export default Comment;
