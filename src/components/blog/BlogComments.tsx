import React, { useState } from "react";
import { format } from "date-fns";
import { commentsSubmitUrl } from "@/lib/comments";
import type { BlogComment } from "@/lib/comments";

export interface BlogCommentsProps {
  slug: string;
  comments: BlogComment[];
  commentsEnabled: boolean;
  submitEnabled: boolean;
}

const BlogComments: React.FC<BlogCommentsProps> = ({
  slug,
  comments,
  commentsEnabled,
  submitEnabled,
}) => {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  if (!commentsEnabled) return null;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!submitEnabled || status === "saving") return;
    setError("");
    setStatus("saving");
    try {
      const res = await fetch(commentsSubmitUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, body, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Could not send your comment.");
        return;
      }
      setStatus("sent");
      setName("");
      setBody("");
    } catch {
      setStatus("error");
      setError("Could not send your comment.");
    }
  };

  return (
    <section className="blog-comments" aria-labelledby="blog-comments-heading">
      {comments.length > 0 ? (
        <ol className="blog-comments-list">
          {comments.map((comment) => (
            <li key={comment.id} className="blog-comment">
              <div className="blog-comment-meta">
                <strong>{comment.name}</strong>
                {comment.createdAt ? (
                  <time dateTime={comment.createdAt}>
                    {format(new Date(comment.createdAt), "MMMM d, yyyy")}
                  </time>
                ) : null}
              </div>
              <p>{comment.body}</p>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="blog-comment-box">
        <h2 id="blog-comments-heading">Leave a comment</h2>
        {status === "sent" ? (
          <p className="blog-comment-thanks">
            Thanks. Your comment is in Contentful as a draft. It will show here
            after it is published.
          </p>
        ) : submitEnabled ? (
          <form onSubmit={onSubmit} noValidate>
            <label className="blog-comment-name">
              <span>Name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="blog-comment-hp" aria-hidden="true">
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
            <textarea
              name="comment"
              required
              maxLength={4000}
              placeholder="Write a comment..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label="Write a comment"
            />
            {error ? <p className="blog-comment-error">{error}</p> : null}
            <div className="blog-comment-actions">
              <button type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Sending…" : "Comment"}
              </button>
            </div>
          </form>
        ) : (
          <p className="blog-comment-note">
            Comments can be posted after this site is connected to the live
            comments API.
          </p>
        )}
      </div>
    </section>
  );
};

export default BlogComments;
