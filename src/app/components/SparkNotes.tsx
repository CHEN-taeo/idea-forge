import { useState, useRef, useEffect, useCallback } from 'react';
import { brand } from '../lib/brand';
import {
  loadSparkNotes,
  addSparkNote,
  deleteSparkNote,
  formatSparkTime,
  type SparkNote,
} from '../lib/sparkNotes';
import { buildWeeklyReview, type WeeklyReview } from '../lib/sparkReview';

type Tab = 'capture' | 'review';

interface SparkNotesProps {
  onStartRoundtable?: (topic: string) => void;
}

const AUTOSAVE_MS = 1500;

export function SparkNotes({ onStartRoundtable }: SparkNotesProps) {
  const [tab, setTab] = useState<Tab>('capture');
  const [notes, setNotes] = useState<SparkNote[]>([]);
  const [text, setText] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [showList, setShowList] = useState(false);
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    const loaded = loadSparkNotes();
    setNotes(loaded);
    setReview(buildWeeklyReview(loaded));
  }, []);

  useEffect(() => {
    refresh();
    inputRef.current?.focus();
  }, [refresh]);

  const commitNote = useCallback((raw: string, silent = false) => {
    const note = addSparkNote(raw);
    if (!note) return false;
    refresh();
    setText('');
    if (!silent) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }
    inputRef.current?.focus();
    return true;
  }, [refresh]);

  const scheduleAutosave = useCallback((value: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const trimmed = value.trim();
    if (!trimmed) return;
    saveTimer.current = setTimeout(() => {
      commitNote(trimmed, true);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }, AUTOSAVE_MS);
  }, [commitNote]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const onBlurSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (text.trim()) commitNote(text, true);
  };

  const remove = (id: string) => {
    setNotes(deleteSparkNote(id));
    refresh();
  };

  return (
    <div className="if-page px-4 py-4 max-w-md mx-auto min-h-screen flex flex-col pb-8">
      <div className="flex gap-2 mb-4 p-1 rounded-xl bg-[var(--if-surface)] border border-[var(--if-line)]">
        <button
          type="button"
          onClick={() => setTab('capture')}
          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
            tab === 'capture'
              ? 'bg-[var(--if-card)] text-[var(--if-ink)] shadow-sm'
              : 'text-[var(--if-muted)]'
          }`}
        >
          {brand.sparkTabCapture}
        </button>
        <button
          type="button"
          onClick={() => { setTab('review'); refresh(); }}
          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
            tab === 'review'
              ? 'bg-[var(--if-card)] text-[var(--if-ink)] shadow-sm'
              : 'text-[var(--if-muted)]'
          }`}
        >
          {brand.sparkTabReview}
        </button>
      </div>

      {tab === 'capture' ? (
        <>
          <div className="flex items-center justify-between mb-2 min-h-6">
            <p className="if-eyebrow">{brand.sparkName}</p>
            {savedFlash && (
              <span className="text-[11px] text-[var(--if-success)] animate-fade-in-up">{brand.sparkSavedShort}</span>
            )}
          </div>

          <textarea
            ref={inputRef}
            className="if-field-textarea min-h-[140px] text-base mb-2 border-[var(--if-accent-border)]/40"
            placeholder={brand.sparkCapturePlaceholder}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              scheduleAutosave(e.target.value);
            }}
            onBlur={onBlurSave}
            autoFocus
          />
          <p className="text-[10px] text-[var(--if-muted-soft)] mb-4">
            {brand.sparkAutosaveHint}
          </p>

          {notes.length > 0 && (
            <div className="mt-auto">
              <button
                type="button"
                onClick={() => setShowList(!showList)}
                className="w-full text-left text-xs text-[var(--if-muted)] py-2"
              >
                {showList ? '收起' : '查看'}最近 {notes.length} 条 ›
              </button>
              {showList && (
                <ul className="space-y-2 max-h-[40vh] overflow-y-auto pb-4">
                  {notes.slice(0, 20).map((note) => (
                    <li key={note.id} className="if-card--flat p-3">
                      <p className="text-sm text-[var(--if-ink-soft)] leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {note.text}
                      </p>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-[10px] text-[var(--if-muted-soft)]">
                          {formatSparkTime(note.createdAt)}
                        </span>
                        <div className="flex gap-3">
                          {onStartRoundtable && (
                            <button
                              type="button"
                              onClick={() => onStartRoundtable(note.text)}
                              className="text-[11px] text-[var(--if-accent)]"
                            >
                              {brand.sparkToRoundtable}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(note.id)}
                            className="text-[11px] text-[var(--if-muted)]"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      ) : review ? (
        <div className="flex-1">
          <p className="if-eyebrow mb-1">{review.weekLabel}</p>
          <h2 className="font-display text-xl text-[var(--if-ink)] mb-1">{review.headline}</h2>
          <p className="text-xs text-[var(--if-muted)] mb-6">{review.hint}</p>

          {review.empty ? null : (
            <>
              {review.themes && review.themes.length > 0 && (
                <div className="mb-4">
                  <p className="if-field-label">可能反复出现的主题</p>
                  <div className="space-y-2">
                    {review.themes.map((t) => (
                      <div key={t.label} className="if-card--flat p-3">
                        <p className="text-sm text-[var(--if-accent)]">{t.label} · {t.count} 条</p>
                        <p className="text-xs text-[var(--if-muted)] mt-1 line-clamp-2">{t.sample}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {review.connections && review.connections.length > 0 && (
                <div className="mb-4">
                  <p className="if-field-label">可能的联系</p>
                  <div className="space-y-2">
                    {review.connections.map((c, i) => (
                      <div key={i} className="if-card--flat p-3">
                        <p className="text-[10px] text-[var(--if-muted-soft)] mb-2">{c.reason}</p>
                        <p className="text-xs text-[var(--if-ink-soft)] line-clamp-2">「{c.textA}」</p>
                        <p className="text-xs text-[var(--if-ink-soft)] line-clamp-2 mt-1">「{c.textB}」</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {review.openQuestion && (
                <div className="if-card p-4 mb-4 border-[var(--if-accent-border)] bg-[var(--if-accent-soft)]">
                  <p className="if-field-label text-[var(--if-accent)] mb-2">想一想</p>
                  <p className="text-sm text-[var(--if-ink-soft)] leading-relaxed">{review.openQuestion}</p>
                </div>
              )}

              <p className="if-field-label">{brand.sparkWeekNotes}</p>
              <ul className="space-y-2 mb-6">
                {review.notes?.map((note) => (
                  <li key={note.id} className="if-card--flat p-3 flex gap-3 items-start">
                    <p className="text-sm text-[var(--if-ink-soft)] flex-1 leading-relaxed">{note.text}</p>
                    {onStartRoundtable && (
                      <button
                        type="button"
                        onClick={() => onStartRoundtable(note.text)}
                        className="text-[11px] text-[var(--if-accent)] shrink-0"
                      >
                        {brand.sparkToRoundtable}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
