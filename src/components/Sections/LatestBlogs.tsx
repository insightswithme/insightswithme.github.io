import { Blog } from "@/types/blog";
import Link from "next/link";
import React from "react";
import LazyBackground from "@/components/LazyBackground";
import { cardImageUrl } from "@/lib/contentfulImage";
import { withBasePath } from "@/lib/withBasePath";

interface LatestBlogsProps {
  blogs: Blog[];
}

const LatestBlogs: React.FC<LatestBlogsProps> = ({ blogs }) => {
  if (!blogs || blogs.length === 0) return null;

  const [featured, ...rest] = blogs.slice(0, 4);

  return (
    <section className="latest-posts" id="blog">
      <div className="container">
        <div className="section-header">
          <h1>Latest Sitecore & .NET Development Articles</h1>
          <p>
            Latest tutorials and real-world solutions for Sitecore, .NET, and modern web development.
          </p>
        </div>

        <div className="posts-grid">
          {featured && (
            <article
              className="featured-post"
              style={{
                animation: "0.8s ease-out 0s 1 normal none running fadeInUp",
              }}
            >
              <LazyBackground
                className="post-image"
                eager
                src={withBasePath(cardImageUrl(featured.featuredImage))}
              />
              <div className="post-content">
                <div className="post-meta">
                  <span className="post-category">
                    {featured.category && featured.category[0]}
                  </span>
                  <span>
                    <i className="fas fa-calendar"></i>{" "}
                    {(() => {
                      const dateObj =
                        typeof featured.date === "string"
                          ? new Date(featured.date)
                          : featured.date;
                      return dateObj.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                    })()}
                  </span>
                  {featured.readTime && (
                    <span>
                      <i className="fas fa-clock"></i> {featured.readTime}
                    </span>
                  )}
                </div>
                {featured.url ? (
                  <Link href={featured.url}>
                    <h3 className="post-title">{featured.title}</h3>
                  </Link>
                ) : (
                  <h3 className="post-title">{featured.title}</h3>
                )}
                <p className="post-excerpt">{featured.excerpt}</p>
                <Link href={featured.url ?? "#"} className="read-more">
                  Read Full Article <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </article>
          )}

          {rest.map((blog) => (
            <article
              key={blog.slug}
              className="post-card"
              style={{
                animation: "0.8s ease-out 0s 1 normal none running fadeInUp",
              }}
            >
              <LazyBackground
                className="post-image"
                src={withBasePath(cardImageUrl(blog.featuredImage))}
              />
              <div className="post-content">
                <div className="post-meta">
                  <span className="post-category">
                    {blog.category && blog.category[0]}
                  </span>
                  <span>
                    <i className="fas fa-calendar"></i>{" "}
                    {(() => {
                      const dateObj =
                        typeof blog.date === "string"
                          ? new Date(blog.date)
                          : blog.date;
                      return dateObj.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                    })()}
                  </span>
                  {blog.readTime && (
                    <span>
                      <i className="fas fa-clock"></i> {blog.readTime}
                    </span>
                  )}
                </div>
                {blog.url ? (
                  <Link href={blog.url}>
                    <h3 className="post-title">{blog.title}</h3>
                  </Link>
                ) : (
                  <h3 className="post-title">{blog.title}</h3>
                )}
                <p className="post-excerpt">{blog.excerpt}</p>
                <Link href={blog.url ?? "#"} className="read-more">
                  Read More <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div
          className="section-cta"
          style={{ textAlign: "center", marginTop: "2rem" }}
        >
          <Link href="/blogs" className="btn btn-primary">
            {"View All Blogs "}
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestBlogs;
