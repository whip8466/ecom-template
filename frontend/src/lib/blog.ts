/** Blog taxonomy (admin + public category lists). */
export type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
};

/** API shape for a full blog post (admin + public detail). */
export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  category: BlogCategory | null;
  createdAt: string;
  updatedAt: string;
};

/** Public list entries omit `body`. */
export type BlogPostSummary = Omit<BlogPost, 'body'>;
