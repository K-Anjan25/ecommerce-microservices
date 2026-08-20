import React from "react";
import Comment from "./Comment";
import { Comment as CommentType } from "../../types/comment";
import { Box, Button, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import EmptyState from "../EmptyState";

interface CommentsProps {
  comments: CommentType[];
  onCreateComment: (comment: string) => void;
}

function Comments({ comments, onCreateComment }: CommentsProps) {
  const [comment, setComment] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (comment.trim()) {
      onCreateComment(comment.trim());
      setComment("");
    }
  };

  return (
    <Box>
      <Box className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Typography variant="h5" component="h2" className="font-bold">
          Comments
        </Typography>

        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md items-start gap-2"
        >
          <TextField
            label="Add a comment"
            size="small"
            fullWidth
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="!bg-white"
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            type="submit"
            disabled={!comment.trim()}
            className="!bg-brand !text-paper hover:!bg-brand-main"
          >
            Post
          </Button>
        </form>
      </Box>

      {comments.length === 0 ? (
        <EmptyState
          icon={<ForumOutlinedIcon fontSize="large" />}
          title="No comments yet"
          subtitle="Be the first to share your thoughts on this product."
        />
      ) : (
        <Box className="space-y-3">
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default Comments;
