import { notFound } from 'next/navigation';
import { db } from '@/db';
import { books, bookVariants, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import BookPurchase from '@/components/site/book-purchase';

export const dynamic = 'force-dynamic';

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = (await db.select().from(books).where(eq(books.slug, slug)).limit(1))[0];
  if (!book) notFound();

  const variants = (await db.select().from(bookVariants).where(eq(bookVariants.bookId, book.id)))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const course = book.courseId
    ? (await db.select().from(courses).where(eq(courses.id, book.courseId)).limit(1))[0] ?? null
    : null;

  return (
    <BookPurchase
      book={{
        id: book.id, title: book.title, subtitle: book.subtitle, description: book.description,
        author: book.author, coverImage: book.coverImage, previewPdf: book.previewPdf,
        previewImages: book.previewImages ?? [], pages: book.pages, language: book.language,
      }}
      variants={variants.map((v) => ({
        id: v.id, name: v.name, kind: v.kind, price: v.price, offerPrice: v.offerPrice, inStock: v.inStock,
      }))}
      course={course ? { title: course.title, slug: course.slug } : null}
    />
  );
}
