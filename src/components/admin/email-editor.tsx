'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, AlignCenter, AlignLeft, AlignRight, Bold, CheckCircle2, Code2,
  Eraser, Eye, Italic, Link2, List, ListOrdered, Loader2, Mail, PenLine,
  RotateCcw, Save, Send, Type, Underline,
} from 'lucide-react';
import { resetEmailTemplate, saveEmailTemplate, sendTestEmail } from '@/lib/actions/emails';
import { EMAIL_BY_KEY, isFullDocument, sampleVarsFor, substitute, wrapEmailShell } from '@/lib/email-templates';
import type { StoredTemplate } from '@/lib/email-store';

type Mode = 'design' | 'html' | 'preview';

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const btnBase =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] border border-[#D7D9DE] bg-white px-2 text-[12px] font-[650] text-[#3F434A] transition hover:border-[#B7BDC7] hover:bg-[#F7F8FA] active:translate-y-[1px]';

export default function EmailEditor({
  templates,
  mailReady,
}: {
  templates: StoredTemplate[];
  mailReady: boolean;
}) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState(templates[0]?.key ?? 'otp_login');
  const selected = templates.find((t) => t.key === selectedKey) ?? templates[0];

  const [subject, setSubject] = useState(selected?.subject ?? '');
  const [html, setHtml] = useState(selected?.bodyHtml ?? '');
  const [enabled, setEnabled] = useState(selected?.enabled ?? true);
  const [mode, setMode] = useState<Mode>('design');
  const [status, setStatus] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const [resetting, startResetting] = useTransition();
  const [testing, startTesting] = useTransition();
  const [testTo, setTestTo] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const [baseline, setBaseline] = useState({
    subject: selected?.subject ?? '',
    html: selected?.bodyHtml ?? '',
  });

  /** Switching template loads its content — done in the handler, not an effect. */
  function selectTemplate(key: string) {
    const next = templates.find((t) => t.key === key);
    if (!next) return;
    setSelectedKey(key);
    setSubject(next.subject);
    setHtml(next.bodyHtml);
    setEnabled(next.enabled);
    setBaseline({ subject: next.subject, html: next.bodyHtml });
    setStatus(null);
    setMode('design');
  }

  // Keep the contentEditable in sync when the source HTML changes from outside
  useEffect(() => {
    const el = editorRef.current;
    if (!el || mode !== 'design') return;
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [html, mode, selectedKey]);

  const dirty = subject !== baseline.subject || html !== baseline.html;
  // Sign-in codes must always go out — switching them off would lock users out.
  const alwaysOn = selected?.key === 'otp_login';

  function currentHtml(): string {
    if (mode === 'design' && editorRef.current) return editorRef.current.innerHTML;
    return html;
  }

  function syncFromEditor() {
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  }

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    syncFromEditor();
  }

  /** Wrap the current selection in a span with an inline style (clean email HTML). */
  function wrapStyle(prop: 'fontSize' | 'color', value: string) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      setStatus({ tone: 'err', text: 'Select some text first, then choose a size.' });
      return;
    }
    const span = document.createElement('span');
    if (prop === 'fontSize') span.style.fontSize = value;
    else span.style.color = value;
    try {
      range.surroundContents(span);
    } catch {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const next = document.createRange();
    next.selectNodeContents(span);
    sel.addRange(next);
    syncFromEditor();
  }

  function insertVariable(name: string) {
    const token = `{{${name}}}`;
    if (mode === 'html') {
      setHtml((prev) => prev + token);
      return;
    }
    editorRef.current?.focus();
    document.execCommand('insertText', false, token);
    syncFromEditor();
  }

  const previewHtml = useMemo(() => {
    const vars = sampleVarsFor(selected?.key ?? 'otp_login');
    const body = substitute(html, { site: 'Language Help BD', ...vars });
    return isFullDocument(body) ? body : wrapEmailShell(body);
  }, [html, selected?.key]);

  const previewSubject = useMemo(
    () => substitute(subject, { site: 'Language Help BD', ...sampleVarsFor(selected?.key ?? 'otp_login') }),
    [subject, selected?.key],
  );

  function handleSave() {
    if (!selected) return;
    const body = currentHtml();
    const fd = new FormData();
    fd.set('key', selected.key);
    fd.set('subject', subject);
    fd.set('bodyHtml', body);
    if (enabled || alwaysOn) fd.set('enabled', 'on');
    startSaving(async () => {
      const result = await saveEmailTemplate(null, fd);
      if (result.ok) {
        setBaseline({ subject, html: body });
        setHtml(body);
        setStatus({ tone: 'ok', text: result.message ?? 'Saved' });
        router.refresh();
      } else {
        setStatus({ tone: 'err', text: result.error ?? 'Could not save' });
      }
    });
  }

  function handleReset() {
    if (!selected) return;
    const fd = new FormData();
    fd.set('key', selected.key);
    startResetting(async () => {
      const result = await resetEmailTemplate(null, fd);
      if (result.ok) {
        const def = EMAIL_BY_KEY[selected.key];
        setStatus({ tone: 'ok', text: result.message ?? 'Reset' });
        setSubject(def.defaultSubject);
        setHtml(def.defaultBody);
        setBaseline({ subject: def.defaultSubject, html: def.defaultBody });
        router.refresh();
      } else {
        setStatus({ tone: 'err', text: result.error ?? 'Could not reset' });
      }
    });
  }

  function handleTest() {
    if (!selected) return;
    const fd = new FormData();
    fd.set('key', selected.key);
    fd.set('to', testTo);
    fd.set('subject', subject);
    fd.set('bodyHtml', currentHtml());
    startTesting(async () => {
      const result = await sendTestEmail(null, fd);
      setStatus(
        result.ok
          ? { tone: 'ok', text: result.message ?? 'Test sent' }
          : { tone: 'err', text: result.error ?? 'Could not send' },
      );
    });
  }

  if (!selected) return <p className="text-[13px] text-[#6C757D]">No email templates available.</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[268px_minmax(0,1fr)]">
      {/* ---------------- template list ---------------- */}
      <aside className="glass h-fit rounded-[24px] p-2.5 lg:sticky lg:top-6">
        <p className="px-2.5 pb-2 pt-2 text-[10.5px] font-[800] uppercase tracking-[0.18em] text-[#9AA1AB]">
          Automated emails
        </p>
        <div className="space-y-1">
          {templates.map((t) => {
            const active = t.key === selectedKey;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTemplate(t.key)}
                className={`group flex w-full items-start gap-2.5 rounded-[16px] px-2.5 py-2.5 text-left transition ${
                  active ? 'bg-[#1A1A1A] text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,.65)]' : 'hover:bg-white/70'
                }`}
              >
                <span
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border ${
                    active ? 'border-white/25 bg-white/12 text-white' : 'border-[#E3E5EA] bg-white text-[#8B93A0]'
                  }`}
                >
                  <Mail size={13} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-[750] leading-tight">{t.name}</span>
                  <span className={`mt-0.5 block truncate text-[11px] ${active ? 'text-white/60' : 'text-[#9AA1AB]'}`}>
                    {t.key}
                  </span>
                </span>
                <span className="ml-auto flex shrink-0 flex-col items-end gap-1">
                  {t.custom && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-[800] uppercase tracking-[0.08em] ${
                        active ? 'bg-white/15 text-white' : 'bg-[#FCE9EA] text-[#B3141C]'
                      }`}
                    >
                      Custom
                    </span>
                  )}
                  {!t.enabled && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-[800] uppercase tracking-[0.08em] ${
                        active ? 'bg-white/15 text-white' : 'bg-[#F1F2F5] text-[#6B7280]'
                      }`}
                    >
                      Off
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ---------------- editor ---------------- */}
      <div className="space-y-5">
        <section className="glass rounded-[28px] p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[19px] font-[800] tracking-[-0.02em] text-[#1A1A1A]">{selected.name}</h2>
              <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-[#6C757D]">{selected.when}</p>
            </div>
            {alwaysOn ? (
              <span
                className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11.5px] font-[750] text-emerald-700"
                title="Sign-in codes are required to log in, so this email is always sent."
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Always on — needed for sign-in
              </span>
            ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#E3E5EA] bg-white px-3 py-1.5">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <span className="relative h-4 w-7 rounded-full bg-[#D7D9DE] transition peer-checked:bg-emerald-500">
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
                    enabled ? 'left-3.5' : 'left-0.5'
                  }`}
                />
              </span>
              <span className="text-[11.5px] font-[750] text-[#3F434A]">{enabled ? 'Sending' : 'Switched off'}</span>
            </label>
            )}
          </div>

          {/* subject */}
          <div className="mt-5">
            <label className="label">Subject line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              placeholder="Subject shown in the inbox"
            />
            <p className="mt-1 text-[11px] font-[600] text-[#ADB5BD]">
              Preview: <span className="text-[#6C757D]">{previewSubject || '—'}</span>
            </p>
          </div>

          {/* variables */}
          <div className="mt-4">
            <p className="text-[10.5px] font-[800] uppercase tracking-[0.16em] text-[#9AA1AB]">Insert variable</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {selected.variables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertVariable(v)}
                  className="rounded-full border border-[#E3E5EA] bg-white px-2.5 py-1 font-mono text-[11px] font-[650] text-[#3F434A] transition hover:border-[#E51A24] hover:text-[#B3141C]"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>

          {/* mode tabs */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="flex rounded-[10px] border border-[#E3E5EA] bg-[#F7F8FA] p-0.5">
              {([
                { id: 'design' as Mode, label: 'Design', icon: PenLine },
                { id: 'html' as Mode, label: 'HTML', icon: Code2 },
                { id: 'preview' as Mode, label: 'Preview', icon: Eye },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (mode === 'design') syncFromEditor();
                    setMode(id);
                  }}
                  className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-[700] transition ${
                    mode === id ? 'bg-white text-[#1A1A1A] shadow-[0_1px_2px_rgba(15,23,42,.12)]' : 'text-[#6B7280] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
            {mode === 'design' && <span className="text-[11px] font-[600] text-[#ADB5BD]">Select text, then style it.</span>}
          </div>

          {/* design mode */}
          {mode === 'design' && (
            <div className="mt-3 overflow-hidden rounded-[16px] border border-[#E3E5EA] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
              <div className="flex flex-wrap items-center gap-1 border-b border-[#EDEFF2] bg-[#FAFBFC] px-2 py-1.5">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className={btnBase} title="Bold">
                  <Bold size={14} />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className={btnBase} title="Italic">
                  <Italic size={14} />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} className={btnBase} title="Underline">
                  <Underline size={14} />
                </button>
                <span className="mx-1 h-5 w-px bg-[#E3E5EA]" />
                <span className={`${btnBase} cursor-default gap-1 border-transparent bg-transparent hover:bg-transparent`}>
                  <Type size={13} />
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    wrapStyle('fontSize', `${e.target.value}px`);
                    e.currentTarget.value = '';
                  }}
                  className="h-8 rounded-[8px] border border-[#D7D9DE] bg-white px-1.5 text-[12px] font-[650] text-[#3F434A]"
                  title="Text size"
                >
                  <option value="">Size</option>
                  {FONT_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}px
                    </option>
                  ))}
                </select>
                <span className="mx-1 h-5 w-px bg-[#E3E5EA]" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'h2')} className={btnBase} title="Heading">
                  H2
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'h3')} className={btnBase} title="Sub-heading">
                  H3
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'p')} className={btnBase} title="Paragraph">
                  P
                </button>
                <span className="mx-1 h-5 w-px bg-[#E3E5EA]" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')} className={btnBase} title="Bullet list">
                  <List size={14} />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')} className={btnBase} title="Numbered list">
                  <ListOrdered size={14} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const url = window.prompt('Link URL', 'https://');
                    if (url) exec('createLink', url);
                  }}
                  className={btnBase}
                  title="Link"
                >
                  <Link2 size={14} />
                </button>
                <span className="mx-1 h-5 w-px bg-[#E3E5EA]" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')} className={btnBase} title="Align left">
                  <AlignLeft size={14} />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')} className={btnBase} title="Align centre">
                  <AlignCenter size={14} />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')} className={btnBase} title="Align right">
                  <AlignRight size={14} />
                </button>
                <span className="mx-1 h-5 w-px bg-[#E3E5EA]" />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editorRef.current?.focus();
                    document.execCommand('removeFormat');
                    document.execCommand('formatBlock', false, 'p');
                    syncFromEditor();
                  }}
                  className={btnBase}
                  title="Clear formatting"
                >
                  <Eraser size={14} />
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncFromEditor}
                onBlur={syncFromEditor}
                className="email-canvas min-h-[300px] px-5 py-4 text-[14px] leading-[1.65] text-[#16181C] outline-none"
              />
            </div>
          )}

          {/* html mode */}
          {mode === 'html' && (
            <div className="mt-3 overflow-hidden rounded-[16px] border border-[#E3E5EA] bg-[#0F1115]">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
                <span className="font-mono text-[11px] font-[700] text-white/60">email.html</span>
                <span className="font-mono text-[10.5px] text-white/35">
                  {isFullDocument(html) ? 'full document — sent as-is' : 'body only — wrapped in the brand shell'}
                </span>
              </div>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                spellCheck={false}
                rows={16}
                className="w-full resize-y bg-transparent px-4 py-3 font-mono text-[12px] leading-[1.7] text-[#D8E1EA] outline-none"
              />
            </div>
          )}

          {/* preview */}
          {mode === 'preview' && (
            <div className="mt-3 overflow-hidden rounded-[16px] border border-[#E3E5EA] bg-[#F4F5F7]">
              <div className="flex items-center gap-2 border-b border-[#E3E5EA] bg-white px-3 py-2">
                <span className="text-[10.5px] font-[800] uppercase tracking-[0.14em] text-[#9AA1AB]">Inbox preview</span>
                <span className="ml-2 min-w-0 truncate text-[12px] font-[700] text-[#1A1A1A]">{previewSubject || '—'}</span>
              </div>
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                sandbox=""
                className="h-[460px] w-full bg-[#F4F5F7]"
              />
            </div>
          )}

          {/* actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary btn-md gap-2 disabled:opacity-70"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save template'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="btn btn-outline btn-md gap-2 disabled:opacity-70"
            >
              {resetting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              Restore default
            </button>
            {dirty && !saving && (
              <span className="rounded-full bg-[#FFF7E6] px-2.5 py-1 text-[11px] font-[750] text-[#8A5A00]">
                Unsaved changes
              </span>
            )}
            {status && (
              <span
                className={`flex items-center gap-1.5 text-[12.5px] font-[750] ${
                  status.tone === 'ok' ? 'text-emerald-600' : 'text-[#E51A24]'
                }`}
              >
                {status.tone === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {status.text}
              </span>
            )}
          </div>
        </section>

        {/* test send */}
        <section className="glass rounded-[24px] p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-[800] uppercase tracking-[0.18em] text-[#E51A24]">Test it</p>
              <h3 className="mt-1 text-[15.5px] font-[800] tracking-[-0.01em]">Send yourself a copy</h3>
              <p className="mt-1 text-[12px] text-[#6C757D]">
                Uses the current editor contents with sample data
                {selected.variables.length ? ` (${selected.variables.map((v) => `${v}: sample`).join(', ')})` : ''}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@example.com"
                className="input h-[38px] w-[220px] text-[13px]"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="btn btn-dark btn-md gap-2 disabled:opacity-70"
              >
                {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {testing ? 'Sending…' : 'Send test'}
              </button>
            </div>
          </div>
          {!mailReady && (
            <p className="mt-3 flex items-start gap-2 rounded-[12px] border border-[#FFE0B2] bg-[#FFF8EF] px-3 py-2 text-[12px] font-[650] text-[#8A5A00]">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              SMTP is not configured on this deployment, so test emails cannot leave the server. Add SMTP_HOST,
              SMTP_USER and SMTP_PASS in your environment variables to enable sending.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
