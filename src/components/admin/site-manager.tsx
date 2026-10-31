'use client';

import { useRef, useState } from 'react';
import {
  addGalleryItem, createNotice, deleteBranch, deleteGalleryItem, deleteNotice,
  deletePerson, saveBranch, saveSettings,
} from '@/lib/actions/admin';
import PersonFormModal, { PersonLite } from '@/components/admin/person-form';
import { compressImage } from '@/lib/compress-image';
import { formatDate } from '@/lib/utils';
import {
  BadgeCheck, ImagePlus, Loader2, Megaphone, Pencil, Plus, Save, Trash2, UserRound,
} from 'lucide-react';

type Notice = { id: number; title: string; body: string | null; audience: string; createdAt: Date };
type Gallery = { id: number; imageUrl: string; caption: string | null };
type Branch = { id: number; name: string; address: string | null; phone: string | null; mapEmbed: string | null; isMain: boolean };

const TABS = [
  { key: 'people', label: 'People', icon: UserRound },
  { key: 'notices', label: 'Notices', icon: Megaphone },
  { key: 'gallery', label: 'Gallery', icon: ImagePlus },
  { key: 'branches', label: 'Branches & Contact', icon: Save },
] as const;

export default function SiteManager({
  people, notices, gallery, branches, settingsMap,
}: {
  people: NonNullable<PersonLite>[];
  notices: Notice[];
  gallery: Gallery[];
  branches: Branch[];
  settingsMap: Record<string, string>;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('people');
  const [personModal, setPersonModal] = useState<{ open: boolean; person: PersonLite }>({ open: false, person: null });
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryMsg, setGalleryMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);

  async function uploadGallery() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setGalleryMsg('Choose an image first.'); return; }
    setGalleryBusy(true);
    setGalleryMsg('Optimizing image…');
    const fd = new FormData();
    fd.set('image', await compressImage(file, 1600, 0.82));
    fd.set('caption', captionRef.current?.value ?? '');
    const res = await addGalleryItem(fd);
    setGalleryBusy(false);
    setGalleryMsg(res.ok ? 'Added to gallery.' : res.error ?? 'Failed');
    if (res.ok && fileRef.current) { fileRef.current.value = ''; if (captionRef.current) captionRef.current.value = ''; }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`btn btn-md gap-2 ${tab === t.key ? 'btn-dark' : 'btn-outline'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* PEOPLE */}
        {tab === 'people' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => setPersonModal({ open: true, person: null })} className="btn btn-primary btn-md gap-1.5">
                <Plus size={14} /> Add teacher / manager
              </button>
            </div>
            {people.map((p) => (
              <div key={p.id} className="glass flex flex-wrap items-center gap-4 rounded-[24px] p-5">
                {p.profileImage ? (
                  <img src={p.profileImage} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A1A1A] font-[800] text-white">{p.name[0]}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14.5px] font-[800] tracking-tight">{p.name}</p>
                    {p.isFounder && <span className="flex items-center gap-1 rounded-full bg-[#E51A24] px-2.5 py-0.5 text-[10px] font-[750] text-white"><BadgeCheck size={11} /> Founder</span>}
                  </div>
                  <p className="text-[11.5px] font-[600] text-[#ADB5BD]">{p.role} · {p.experience ?? '—'} · {p.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPersonModal({ open: true, person: p })} className="btn btn-outline btn-sm gap-1.5"><Pencil size={13} /> Edit</button>
                  <form action={async (fd) => { if (confirm(`Remove ${p.name}?`)) await deletePerson(fd); }}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn btn-outline btn-sm !border-red-200 !text-[#E51A24] hover:!border-[#E51A24]">Remove</button>
                  </form>
                </div>
              </div>
            ))}
            {!people.length && <p className="glass rounded-[24px] p-8 text-center text-[13px] text-[#ADB5BD]">No public people yet.</p>}
            <PersonFormModal person={personModal.person} open={personModal.open} onClose={() => setPersonModal({ open: false, person: null })} />
          </div>
        )}

        {/* NOTICES */}
        {tab === 'notices' && (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <form action={createNotice} className="glass h-fit rounded-[24px] p-6">
              <p className="text-[15px] font-[800] tracking-tight">New notice</p>
              <div className="mt-4 space-y-3">
                <input name="title" required className="input" placeholder="Notice title" />
                <textarea name="body" rows={3} className="input resize-none" placeholder="Details…" />
                <select name="audience" className="input">
                  <option value="all">Everyone</option>
                  <option value="students">Students only</option>
                  <option value="teachers">Teachers only</option>
                </select>
                <button className="btn btn-primary btn-md w-full">Publish notice</button>
              </div>
            </form>
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="glass flex items-start justify-between gap-4 rounded-[22px] p-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-[800] tracking-tight">{n.title}</p>
                      <span className="rounded-full bg-[#F1F3F5] px-2 py-0.5 text-[10px] font-[750] text-[#6C757D]">{n.audience}</span>
                    </div>
                    {n.body && <p className="mt-1 text-[12.5px] leading-relaxed text-[#6C757D]">{n.body}</p>}
                    <p className="mt-1.5 text-[10.5px] font-[650] text-[#ADB5BD]">{formatDate(n.createdAt)}</p>
                  </div>
                  <form action={deleteNotice}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className="flex h-8 w-8 items-center justify-center rounded-xl text-[#ADB5BD] transition hover:bg-red-50 hover:text-[#E51A24]"><Trash2 size={14} /></button>
                  </form>
                </div>
              ))}
              {!notices.length && <p className="glass rounded-[22px] p-8 text-center text-[12.5px] text-[#ADB5BD]">No notices published.</p>}
            </div>
          </div>
        )}

        {/* GALLERY */}
        {tab === 'gallery' && (
          <div className="space-y-5">
            <div className="glass flex flex-wrap items-end gap-3 rounded-[24px] p-6">
              <div>
                <label className="label">Upload photo</label>
                <input ref={fileRef} type="file" accept="image/*" className="input !w-64 !py-2 text-xs" />
              </div>
              <div className="min-w-52 flex-1">
                <label className="label">Caption</label>
                <input ref={captionRef} className="input" placeholder="e.g. IELTS Batch 12 — speaking practice" />
              </div>
              <button onClick={uploadGallery} disabled={galleryBusy} className="btn btn-primary btn-md gap-1.5 disabled:opacity-70">
                {galleryBusy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} Add
              </button>
              {galleryMsg && <p className="w-full text-[12px] font-[650] text-[#6C757D]">{galleryMsg}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((g) => (
                <div key={g.id} className="group relative overflow-hidden rounded-3xl ring-1 ring-black/[0.06]">
                  <img src={g.imageUrl} alt="" className="aspect-square w-full object-cover" />
                  <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-[11px] font-[600] text-white">{g.caption}</p>
                    <form action={deleteGalleryItem}>
                      <input type="hidden" name="id" value={g.id} />
                      <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-[#E51A24]"><Trash2 size={13} /></button>
                    </form>
                  </div>
                </div>
              ))}
              {!gallery.length && <p className="glass col-span-full rounded-[22px] p-8 text-center text-[12.5px] text-[#ADB5BD]">Gallery is empty.</p>}
            </div>
          </div>
        )}

        {/* BRANCHES & CONTACT */}
        {tab === 'branches' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="glass rounded-[24px] p-6">
                <p className="text-[15px] font-[800] tracking-tight">Add / edit branches</p>
                <form action={saveBranch} className="mt-4 space-y-3">
                  <input name="name" required className="input" placeholder="Branch name" />
                  <input name="address" className="input" placeholder="Address" />
                  <input name="phone" className="input" placeholder="Phone" />
                  <input name="mapEmbed" className="input" placeholder="Google Maps embed URL (…&output=embed)" />
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input type="checkbox" name="isMain" className="h-4 w-4 accent-[#E51A24]" />
                    <span className="text-[12.5px] font-[650]">Main campus</span>
                  </label>
                  <button className="btn btn-primary btn-md gap-1.5"><Plus size={14} /> Add branch</button>
                </form>
              </div>
              {branches.map((b) => (
                <div key={b.id} className="glass rounded-[24px] p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-[800] tracking-tight">{b.name} {b.isMain && <span className="ml-1 rounded-full bg-[#E51A24] px-2 py-0.5 text-[9.5px] font-[800] text-white">MAIN</span>}</p>
                      <p className="mt-1 text-[12px] font-[600] text-[#6C757D]">{b.address}</p>
                      <p className="text-[12px] font-[600] text-[#ADB5BD]">{b.phone}</p>
                    </div>
                    <form action={deleteBranch}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="flex h-8 w-8 items-center justify-center rounded-xl text-[#ADB5BD] hover:bg-red-50 hover:text-[#E51A24]"><Trash2 size={14} /></button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            <form action={saveSettings} className="glass h-fit rounded-[24px] p-6">
              <p className="text-[15px] font-[800] tracking-tight">Contact information (website)</p>
              <div className="mt-4 space-y-3">
                <div><label className="label">Phone</label><input name="phone" defaultValue={settingsMap.phone ?? ''} className="input" /></div>
                <div><label className="label">WhatsApp (international format, digits only)</label><input name="whatsapp" defaultValue={settingsMap.whatsapp ?? ''} className="input" placeholder="8801XXXXXXXXX" /></div>
                <div><label className="label">Email</label><input name="email" defaultValue={settingsMap.email ?? ''} className="input" /></div>
                <div><label className="label">Address</label><input name="address" defaultValue={settingsMap.address ?? ''} className="input" /></div>
                <button className="btn btn-dark btn-md gap-1.5"><Save size={14} /> Save contact info</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
