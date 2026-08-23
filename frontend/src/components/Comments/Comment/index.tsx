import React from "react";
import { Avatar, Box, Paper, Typography } from "@mui/material";
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
    <Paper className="p-4">
      <Box className="flex gap-3">
        <Avatar className="!bg-brand-soft !font-bold !text-brand">
          {initials}
        </Avatar>
        <Box className="min-w-0 flex-1">
          <Box className="flex flex-wrap items-baseline justify-between gap-x-3">
            <Typography className="font-semibold text-ink">
              {comment?.creator}
            </Typography>
            <Typography variant="caption" className="text-ink-muted">
              {formatDate(comment?.createdDate)}
            </Typography>
          </Box>
          <Typography className="mt-1 text-ink-soft">{comment?.text}</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default Comment;
