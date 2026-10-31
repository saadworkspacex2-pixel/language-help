'use client';

import { useActionState, useRef, useState } from 'react';
import { saveContent } from '@/lib/actions/content';
import { compressImage } from '@/lib/compress-image';
import type { SiteContent } from '@/lib/content';
import { CheckCircle2, ImagePlus, Loader2, Save } from 'lucide-react';

type Field =
  | { k: string; label: string; type: 'text' | 'textarea' | 'pairs'; hint?: string; rows?: number }
  | { k: string; label: string; type: 'image'; hint?: string };

const SECTIONS: { id: string; title: string; desc: string; fields: Field[] }[] = [
  {
    id: 'brand',
    title: 'Brand & Logo',
    desc: 'Your logo appears in the navigation bar, footer and dashboards.',
    fields: [
      { k: 'brand_logo', label: 'Logo image (PNG with transparency recommended)', type: 'image', hint: 'Leave empty to use the red “L” letter mark.' },
      { k: 'brand_name', label: 'Brand name', type: 'text' },
      { k: 'brand_accent', label: 'Brand name accent (shown in red)', type: 'text' },
      { k: 'footer_tagline', label: 'Footer tagline', type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'hero',
    title: 'Hero Section',
    desc: 'The first thing visitors see — headline, images and highlights.',
    fields: [
      { k: 'hero_badge', label: 'Top badge text', type: 'text' },
      { k: 'hero_title_1', label: 'Headline — line 1', type: 'text' },
      { k: 'hero_title_2', label: 'Headline — line 2', type: 'text' },
      { k: 'hero_title_accent', label: 'Headline — red italic word', type: 'text' },
      { k: 'hero_subtitle', label: 'Subtitle paragraph', type: 'textarea', rows: 3 },
      { k: 'hero_cta_primary', label: 'Primary button text', type: 'text' },
      { k: 'hero_cta_secondary', label: 'Secondary button text', type: 'text' },
      { k: 'hero_bg_image', label: 'Full-bleed 16:9 background image', type: 'image', hint: 'Landscape photo works best — it fills the entire hero with a dark overlay behind the text.' },
      { k: 'hero_overlay', label: 'Background darkness (0–95)', type: 'text', hint: 'Higher = darker photo = more readable text. Try 60–85.' },
      { k: 'hero_align', label: 'Text alignment (center or left)', type: 'text' },
      { k: 'hero_stats', label: 'Stats', type: 'pairs', hint: 'One per line: Value :: Label', rows: 3 },
      { k: 'hero_pill', label: 'Corner pill text', type: 'text' },
      { k: 'hero_marquee', label: 'Scrolling language strip', type: 'textarea', rows: 2, hint: 'Comma separated.' },
      { k: 'hero_card_title', label: '(legacy) floating card title', type: 'text' },
      { k: 'hero_image_1', label: '(legacy) hero image 1', type: 'image' },
      { k: 'hero_image_2', label: '(legacy) hero image 2', type: 'image' },
    ],
  },
  {
    id: 'about',
    title: 'About Us Section',
    desc: 'Your story, stats, images and the founder quote.',
    fields: [
      { k: 'about_eyebrow', label: 'Small label above heading', type: 'text' },
      { k: 'about_title', label: 'Heading — start', type: 'text' },
      { k: 'about_title_accent', label: 'Heading — italic grey part', type: 'text' },
      { k: 'about_title_end', label: 'Heading — end', type: 'text' },
      { k: 'about_body', label: 'About paragraph', type: 'textarea', rows: 5 },
      { k: 'about_stats', label: 'Stats', type: 'pairs', hint: 'One per line: Value :: Label', rows: 4 },
      { k: 'about_cta', label: 'Button text', type: 'text' },
      { k: 'about_quote', label: 'Quote text', type: 'textarea', rows: 2 },
      { k: 'about_quote_author', label: 'Quote author', type: 'text' },
      { k: 'about_image_1', label: 'About image 1 (large, top)', type: 'image' },
      { k: 'about_image_2', label: 'About image 2 (tall, left)', type: 'image' },
      { k: 'about_image_3', label: 'About image 3 (wide, bottom)', type: 'image' },
    ],
  },
  {
    id: 'why',
    title: 'Why Choose Language Help BD',
    desc: 'The dark feature section. The first item is shown as the large card.',
    fields: [
      { k: 'why_eyebrow', label: 'Small label above heading', type: 'text' },
      { k: 'why_title', label: 'Heading — start', type: 'text' },
      { k: 'why_title_accent', label: 'Heading — italic part', type: 'text' },
      { k: 'why_items', label: 'Feature cards', type: 'pairs', hint: 'One per line: Title :: Description', rows: 8 },
    ],
  },
  {
    id: 'headings',
    title: 'Other Section Headings',
    desc: 'Courses, People, Gallery and Branches section titles.',
    fields: [
      { k: 'courses_eyebrow', label: 'Courses — small label', type: 'text' },
      { k: 'courses_title', label: 'Courses — heading', type: 'text' },
      { k: 'courses_title_accent', label: 'Courses — italic part', type: 'text' },
      { k: 'people_eyebrow', label: 'People — small label', type: 'text' },
      { k: 'people_title', label: 'People — heading', type: 'text' },
      { k: 'people_title_accent', label: 'People — italic part', type: 'text' },
      { k: 'gallery_eyebrow', label: 'Gallery — small label', type: 'text' },
      { k: 'gallery_title', label: 'Gallery — heading', type: 'text' },
      { k: 'gallery_title_accent', label: 'Gallery — italic part', type: 'text' },
      { k: 'branches_eyebrow', label: 'Branches — small label', type: 'text' },
      { k: 'branches_title', label: 'Branches — heading', type: 'text' },
      { k: 'branches_title_accent', label: 'Branches — italic part', type: 'text' },
    ],
  },
];

function ImageField({ field, current }: { field: Field; current: string }) {
  const [preview, setPreview] = useState<string | null>(current || null);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="sm:col-span-2">
      <label className="label">{field.label}</label>
      <div className="flex items-center gap-4">
        <button
          type="button" onClick={() => ref.current?.click()}
          className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-black/10 bg-[#F8F9FA] text-[#ADB5BD] transition hover:border-[#E51A24]"
        >
          {preview ? <img src={preview} alt="" className="h-full w-full object-contain" /> : <ImagePlus size={20} />}
        </button>
        <div className="text-[11.5px] leading-relaxed text-[#6C757D]">
          {field.hint && <p className="mb-1">{field.hint}</p>}
          <button type="button" onClick={() => ref.current?.click()} className="font-[700] text-[#E51A24] hover:underline">
            Upload from computer
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => { setPreview(null); if (ref.current) ref.current.value = ''; }}
              className="ml-3 font-[650] text-[#ADB5BD] hover:text-[#1A1A1A]"
            >
              Clear preview
            </button>
          )}
        </div>
      </div>
      <input
        ref={ref} name={field.k} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }}
      />
      <input
        name={`${field.k}__url`} defaultValue={/^https?:|^\/uploads/.test(current) ? current : ''}
        className="input mt-2.5 text-[12px]" placeholder="…or paste an image URL"
        onChange={(e) => setPreview(e.target.value || null)}
      />
    </div>
  );
}

export default function ContentEditor({ content }: { content: SiteContent }) {
  const [state, formAction, pending] = useActionState(saveContent, null as { ok: boolean; error?: string } | null);
  const [tab, setTab] = useState(SECTIONS[0].id);
  const [compressing, setCompressing] = useState(false);
  const section = SECTIONS.find((s) => s.id === tab)!;
  const busy = pending || compressing;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    // Compress any chosen images before sending
    const fileInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'));
    setCompressing(true);
    try {
      for (const input of fileInputs) {
        const file = input.files?.[0];
        if (file && file.size > 0) fd.set(input.name, await compressImage(file, 1600, 0.85));
        else fd.delete(input.name);
      }
    } finally {
      setCompressing(false);
    }
    formAction(fd);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setTab(s.id)} className={`btn btn-md ${tab === s.id ? 'btn-dark' : 'btn-outline'}`}>
            {s.title}
          </button>
        ))}
      </div>

      <form key={section.id} onSubmit={handleSubmit} className="glass mt-6 rounded-[30px] p-7 md:p-9">
        <div>
          <p className="text-[17px] font-[800] tracking-tight">{section.title}</p>
          <p className="mt-1 text-[12.5px] text-[#6C757D]">{section.desc}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {section.fields.map((f) => {
            if (f.type === 'image') return <ImageField key={f.k} field={f} current={content[f.k] ?? ''} />;
            const wide = f.type === 'textarea' || f.type === 'pairs';
            return (
              <div key={f.k} className={wide ? 'sm:col-span-2' : ''}>
                <label className="label">{f.label}</label>
                {wide ? (
                  <textarea name={f.k} rows={f.rows ?? 3} defaultValue={content[f.k] ?? ''} className="input resize-y font-mono text-[12.5px]" />
                ) : (
                  <input name={f.k} defaultValue={content[f.k] ?? ''} className="input" />
                )}
                {f.hint && <p className="mt-1 text-[11px] font-[600] text-[#ADB5BD]">{f.hint}</p>}
              </div>
            );
          })}
        </div>

        {state?.error && <p className="mt-4 text-[13px] font-[650] text-[#E51A24]">{state.error}</p>}

        <div className="mt-7 flex items-center gap-3">
          <button disabled={busy} className="btn btn-primary btn-md gap-2 disabled:opacity-70">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {compressing ? 'Optimizing images…' : pending ? 'Saving…' : 'Save changes'}
          </button>
          {state?.ok && !busy && (
            <span className="flex items-center gap-1.5 text-[13px] font-[700] text-emerald-600">
              <CheckCircle2 size={15} /> Saved — live on the website
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
