import { db } from '@/db';
import { books, bookVariants, bookOrders, courses } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import BooksManager from '@/components/admin/books-manager';

export const dynamic = 'force-dynamic';

export default async function AdminBooksPage() {
  await requireRole('management');
  const [list, courseRows, orders] = await Promise.all([
    db.select().from(books).orderBy(desc(books.id)),
    db.select({ id: courses.id, title: courses.title }).from(courses),
    db.select().from(bookOrders).orderBy(desc(bookOrders.id)),
  ]);

  const withVariants = await Promise.all(
    list.map(async (b) => ({
      book: {
        id: b.id, slug: b.slug, title: b.title, subtitle: b.subtitle, description: b.description,
        author: b.author, coverImage: b.coverImage, previewPdf: b.previewPdf,
        previewImages: b.previewImages ?? [], pages: b.pages, language: b.language,
        courseId: b.courseId, active: b.active,
      },
      variants: (await db.select().from(bookVariants).where(eq(bookVariants.bookId, b.id)))
        .sort((x, y) => x.sortOrder - y.sortOrder)
        .map((v) => ({ id: v.id, name: v.name, kind: v.kind, price: v.price, offerPrice: v.offerPrice, inStock: v.inStock, sortOrder: v.sortOrder })),
    })),
  );

  const bookMap = new Map(list.map((b) => [b.id, b.title]));
  const variantRows = await db.select().from(bookVariants);
  const variantMap = new Map(variantRows.map((v) => [v.id, v.name]));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">Store</p>
        <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
          Books & <span className="font-serif-accent font-normal italic text-[#6C757D]">orders.</span>
        </h1>
      </div>
      <BooksManager
        items={withVariants}
        courses={courseRows}
        orders={orders.map((o) => ({
          id: o.id, fullName: o.fullName, phone: o.phone, email: o.email, address: o.address,
          quantity: o.quantity, amount: o.amount, status: o.status, createdAt: o.createdAt,
          bookTitle: bookMap.get(o.bookId) ?? '—', variantName: variantMap.get(o.variantId) ?? '—',
        }))}
      />
    </div>
  );
}
