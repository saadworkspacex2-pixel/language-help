'use server';

import { db } from '@/db';
import { books, bookVariants, bookOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole, getSessionUser } from '@/lib/session';
import { saveUpload } from '@/lib/upload';
import { slugify } from '@/lib/utils';
import { notify, TEMPLATES } from '@/lib/notify';
import { sendTemplateEmail } from '@/lib/email-send';
import { revalidatePath } from 'next/cache';

const refresh = () => revalidatePath('/', 'layout');

export async function upsertBook(prev: unknown, formData: FormData) {
  await requireRole('management');
  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const title = String(formData.get('title') || '').trim();
  if (!title) return { ok: false, error: 'Title is required.' };

  const cover = await saveUpload(formData.get('cover') as File | null, 'book');
  const pdf = await saveUpload(formData.get('pdf') as File | null, 'bookpdf');
  const previewFiles = formData.getAll('previews') as File[];
  const previewImages: string[] = [];
  for (const f of previewFiles) {
    const url = await saveUpload(f, 'preview');
    if (url) previewImages.push(url);
  }

  const data = {
    slug: String(formData.get('slug') || '').trim() || slugify(title),
    title,
    subtitle: String(formData.get('subtitle') || ''),
    description: String(formData.get('description') || ''),
    author: String(formData.get('author') || ''),
    pages: Number(formData.get('pages') || 0) || null,
    language: String(formData.get('language') || ''),
    courseId: formData.get('courseId') ? Number(formData.get('courseId')) : null,
    active: formData.get('active') === 'on',
    ...(cover ? { coverImage: cover } : {}),
    ...(pdf ? { previewPdf: pdf } : {}),
    ...(previewImages.length ? { previewImages } : {}),
  };

  try {
    if (id) {
      await db.update(books).set(data).where(eq(books.id, id));
    } else {
      const created = await db.insert(books).values(data).returning({ id: books.id });
      // Seed the three standard variations
      await db.insert(bookVariants).values([
        { bookId: created[0].id, name: 'Colourful', kind: 'print', price: 450, sortOrder: 0 },
        { bookId: created[0].id, name: 'Black & White', kind: 'print', price: 300, sortOrder: 1 },
        { bookId: created[0].id, name: 'E-book (PDF)', kind: 'ebook', price: 150, sortOrder: 2 },
      ]);
    }
  } catch {
    return { ok: false, error: 'Slug already exists or the data is invalid.' };
  }
  refresh();
  return { ok: true };
}

export async function deleteBook(formData: FormData) {
  await requireRole('management');
  const id = Number(formData.get('id'));
  await db.delete(bookOrders).where(eq(bookOrders.bookId, id));
  await db.delete(bookVariants).where(eq(bookVariants.bookId, id));
  await db.delete(books).where(eq(books.id, id));
  refresh();
}

export async function saveVariant(formData: FormData) {
  await requireRole('management');
  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const bookId = Number(formData.get('bookId'));
  const name = String(formData.get('name') || '').trim();
  if (!bookId || !name) return;
  const data = {
    bookId, name,
    kind: String(formData.get('kind') || 'print'),
    price: Number(formData.get('price') || 0),
    offerPrice: formData.get('offerPrice') ? Number(formData.get('offerPrice')) : null,
    inStock: formData.get('inStock') === 'on',
    sortOrder: Number(formData.get('sortOrder') || 0),
  };
  if (id) await db.update(bookVariants).set(data).where(eq(bookVariants.id, id));
  else await db.insert(bookVariants).values(data);
  refresh();
}

export async function deleteVariant(formData: FormData) {
  await requireRole('management');
  await db.delete(bookVariants).where(eq(bookVariants.id, Number(formData.get('id'))));
  refresh();
}

export async function placeBookOrder(prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  const bookId = Number(formData.get('bookId'));
  const variantId = Number(formData.get('variantId'));
  const quantity = Math.max(1, Number(formData.get('quantity') || 1));
  const fullName = String(formData.get('fullName') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  if (!bookId || !variantId) return { ok: false, error: 'Please choose a book variation.' };
  if (!fullName || !phone) return { ok: false, error: 'Name and phone are required.' };

  const variant = (await db.select().from(bookVariants).where(eq(bookVariants.id, variantId)).limit(1))[0];
  const book = (await db.select().from(books).where(eq(books.id, bookId)).limit(1))[0];
  if (!variant || !book) return { ok: false, error: 'This book is no longer available.' };

  const unit = variant.offerPrice ?? variant.price;
  const amount = unit * quantity;

  const orderEmail = String(formData.get('email') || '').trim();
  await db.insert(bookOrders).values({
    bookId, variantId, userId: user?.id ?? null, fullName, phone,
    email: orderEmail,
    address: String(formData.get('address') || ''),
    quantity, amount,
  });

  // Confirmation email — template editable in Admin → Automated Emails.
  await sendTemplateEmail('book_order', orderEmail, {
    name: fullName,
    book: book.title,
    variant: variant.name,
    amount: '৳' + amount.toLocaleString('en-IN'),
  });

  if (user) {
    await notify({ userId: user.id, ...TEMPLATES.bookOrder(book.title, variant.name, amount), actionUrl: '/portal' });
  }
  revalidatePath('/admin/books');
  return { ok: true, amount };
}

export async function setBookOrderStatus(formData: FormData) {
  await requireRole('management');
  const id = Number(formData.get('id'));
  const status = String(formData.get('status') || 'new');
  const order = (await db.select().from(bookOrders).where(eq(bookOrders.id, id)).limit(1))[0];
  await db.update(bookOrders).set({ status }).where(eq(bookOrders.id, id));
  if (order?.userId) {
    const book = (await db.select().from(books).where(eq(books.id, order.bookId)).limit(1))[0];
    const map: Record<string, { title: string; body: string; tone: 'info' | 'success' | 'danger' }> = {
      confirmed: { title: 'Book order confirmed', body: `Your order for “${book?.title}” is confirmed. Please collect it from the office.`, tone: 'success' },
      delivered: { title: 'Book delivered', body: `Your copy of “${book?.title}” has been handed over. Happy learning!`, tone: 'success' },
      cancelled: { title: 'Book order cancelled', body: `Your order for “${book?.title}” was cancelled. Contact the office for details.`, tone: 'danger' },
    };
    const m = map[status];
    if (m) await notify({ userId: order.userId, title: m.title, body: m.body, category: 'update', tone: m.tone, actionUrl: '/portal' });
  }
  refresh();
}
