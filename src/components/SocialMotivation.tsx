import React, { useState, useRef } from 'react';
import {
  Users,
  Flame,
  Share2,
  Copy,
  Check,
  Download,
  Plus,
  Smartphone,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { CheerReaction } from '../types';

interface SocialMotivationProps {
  onOpenNewPostModal: () => void;
}

export const SocialMotivation: React.FC<SocialMotivationProps> = ({
  onOpenNewPostModal,
}) => {
  const {
    communityPosts,
    addCheer,
    todayStats,
    syncCode,
  } = useAppData();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShareText, setCopiedShareText] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'shareCard' | 'buddies'>('feed');
  const [selectedQuote, setSelectedQuote] = useState('We are what we repeatedly do. Excellence, then, is not an act, but a habit.');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCopySyncCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareText = () => {
    const text = `I'm on a ${todayStats.currentStreak}-day habit streak on HabitPulse! Today's score: ${todayStats.completionPercentage}%. Keep each other accountable using my code: ${syncCode}`;
    navigator.clipboard.writeText(text);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2000);
  };

  const handleDownloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    // MD3 dark surface palette (green)
    ctx.fillStyle = '#121412';
    ctx.fillRect(0, 0, 1080, 1080);

    const grad = ctx.createRadialGradient(540, 540, 100, 540, 540, 600);
    grad.addColorStop(0, 'rgba(123, 225, 147, 0.10)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.strokeStyle = 'rgba(224, 228, 224, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 980, 980);

    // Brand chip
    ctx.fillStyle = 'rgba(123, 225, 147, 0.12)';
    ctx.beginPath();
    ctx.roundRect(90, 90, 360, 60, 30);
    ctx.fill();

    ctx.fillStyle = '#7be193';
    ctx.font = 'bold 26px "Roboto Mono", monospace';
    ctx.fillText('HABITPULSE', 115, 130);

    ctx.fillStyle = 'rgba(190, 202, 192, 0.7)';
    ctx.font = '22px "Roboto", sans-serif';
    const dateText = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    ctx.fillText(dateText.toUpperCase(), 90, 220);

    ctx.fillStyle = '#e0e4e0';
    ctx.font = 'bold 50px "Roboto", sans-serif';
    ctx.fillText('Habit Architect', 90, 290);

    // Stat card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(90, 350, 900, 310, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(224, 228, 224, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#7be193';
    ctx.font = 'bold 150px "Roboto Mono", monospace';
    ctx.fillText(`${todayStats.currentStreak}`, 140, 530);

    ctx.font = 'bold 32px "Roboto", sans-serif';
    ctx.fillText('DAY STREAK', 145, 600);

    ctx.fillStyle = 'rgba(224, 228, 224, 0.7)';
    ctx.font = '28px "Roboto", sans-serif';
    ctx.fillText(`Adherence: ${todayStats.completionPercentage}%`, 620, 510);
    ctx.fillText(`Best Streak: ${todayStats.bestStreak} Days`, 620, 570);

    ctx.fillStyle = '#eef2ef';
    ctx.font = 'italic 32px "Roboto", sans-serif';
    ctx.fillText(`"${selectedQuote}"`, 90, 750);

    ctx.fillStyle = 'rgba(123, 225, 147, 0.1)';
    ctx.beginPath();
    ctx.roundRect(90, 890, 900, 90, 16);
    ctx.fill();

    ctx.fillStyle = '#e0e4e0';
    ctx.font = 'bold 24px "Roboto Mono", monospace';
    ctx.fillText(`SYNC CODE: ${syncCode}`, 130, 946);
    ctx.fillStyle = '#7be193';
    ctx.fillText('HABITPULSE.APP', 720, 946);

    const imageURL = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = `HabitPulse-Streak-${todayStats.currentStreak}Days.png`;
    downloadLink.href = imageURL;
    downloadLink.click();
  };

  const cheerReactions: { type: CheerReaction; emoji: string; label: string }[] = [
    { type: 'fire', emoji: '🔥', label: 'Flame' },
    { type: 'clap', emoji: '👏', label: 'Clap' },
    { type: 'rocket', emoji: '🚀', label: 'Rocket' },
    { type: 'muscle', emoji: '💪', label: 'Power' },
    { type: 'heart', emoji: '🤍', label: 'Heart' },
  ];

  const tabs: { id: 'feed' | 'shareCard' | 'buddies'; label: string; icon?: React.ReactNode }[] = [
    { id: 'feed', label: `Feed (${communityPosts.length})`, icon: <Users className="w-4 h-4" /> },
    { id: 'shareCard', label: 'Poster', icon: <Share2 className="w-4 h-4" /> },
    { id: 'buddies', label: 'Accountability', icon: <Smartphone className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header — flat on the surface */}
      <section className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h2 className="md-headline-small truncate">Community</h2>
          <p className="md-body-medium mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
            Share progress and cheer each other on
          </p>
        </div>
        <button
          onClick={onOpenNewPostModal}
          className="md-button md-button--tonal md-ripple shrink-0"
        >
          <Plus className="w-4 h-4" />
          Post a win
        </button>
      </section>

      {/* MD3 tabs */}
      <div className="md-tabs" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`md-tab md-ripple${activeTab === tab.id ? ' md-tab--active' : ''}`}
          >
            {activeTab === tab.id ? tab.icon : null}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-3">
          {communityPosts.map(post => (
            <article key={post.id} className="md-card md-card--filled space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 md-title-medium"
                    style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                  >
                    {post.authorName ? post.authorName[0].toUpperCase() : 'H'}
                  </span>
                  <div className="min-w-0">
                    <h4 className="md-title-small truncate">{post.authorName}</h4>
                    <div className="md-label-medium truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {post.routineName}
                    </div>
                  </div>
                </div>
                {post.streakCount > 0 && (
                  <span className="md-chip md-chip--assist shrink-0">
                    <Flame className="w-4 h-4" strokeWidth={2.5} style={{ color: 'var(--md-primary)' }} />
                    <span className="font-mono">{post.streakCount}d</span>
                  </span>
                )}
              </div>

              <div>
                <h5 className="md-title-small">{post.title}</h5>
                <p className="md-body-medium mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {post.content}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 flex-wrap">
                  {cheerReactions.map(r => (
                    <button
                      key={r.type}
                      onClick={() => addCheer(post.id, r.type)}
                      className="md-icon-button md-ripple text-base"
                      title={r.label}
                      aria-label={`Cheer with ${r.label}`}
                    >
                      <span aria-hidden="true">{r.emoji}</span>
                    </button>
                  ))}
                </div>
                <span className="md-label-large" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {post.cheerCount || 0} cheers
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Share poster */}
      {activeTab === 'shareCard' && (
        <section className="md-card md-card--outlined space-y-5">
          <div>
            <h3 className="md-title-medium">Achievement poster</h3>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Generate a high-contrast card of your streak and export it
            </p>
          </div>

          {/* Live preview */}
          <div
            className="rounded-3xl p-5 mx-auto w-full max-w-sm"
            style={{ background: '#121412', color: '#e0e4e0' }}
          >
            <div className="flex items-center justify-between md-label-medium">
              <span
                className="px-2.5 py-1 rounded-full font-mono font-bold"
                style={{ background: 'rgba(123,225,147,0.12)', color: '#7be193' }}
              >
                HABITPULSE
              </span>
              <span style={{ color: 'rgba(190,202,192,0.7)' }}>
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="mt-4">
              <h4 className="md-headline-small" style={{ color: '#ffffff' }}>
                Habit Architect
              </h4>
              <p className="md-label-medium mt-0.5" style={{ color: 'rgba(190,202,192,0.7)' }}>
                Day streak progress
              </p>
            </div>

            <div
              className="my-4 p-4 rounded-2xl flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(224,228,224,0.2)' }}
            >
              <div className="flex items-center gap-3">
                <Flame className="w-8 h-8" strokeWidth={2.5} style={{ color: '#7be193', fill: '#7be193' }} />
                <div>
                  <div className="md-headline-medium font-mono" style={{ color: '#7be193' }}>
                    {todayStats.currentStreak}
                  </div>
                  <div className="md-label-small" style={{ color: 'rgba(190,202,192,0.7)' }}>
                    DAY STREAK
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="md-title-large font-mono" style={{ color: '#ffffff' }}>
                  {todayStats.completionPercentage}%
                </div>
                <div className="md-label-small" style={{ color: 'rgba(190,202,192,0.7)' }}>
                  SCORE
                </div>
              </div>
            </div>

            <p className="md-body-medium italic" style={{ color: '#eef2ef' }}>
              &quot;{selectedQuote}&quot;
            </p>

            <div
              className="mt-4 flex items-center justify-between md-label-small pt-3 font-mono"
              style={{ color: 'rgba(190,202,192,0.7)', borderTop: '1px solid rgba(224,228,224,0.15)' }}
            >
              <span>CODE: {syncCode}</span>
              <span style={{ color: '#7be193' }}>HABITPULSE.APP</span>
            </div>
          </div>

          {/* Quote picker */}
          <label className="md-text-field md-text-field--select">
            <select
              className="md-text-field__input"
              value={selectedQuote}
              onChange={(e) => setSelectedQuote(e.target.value)}
            >
              <option value="We are what we repeatedly do. Excellence, then, is not an act, but a habit.">
                &quot;Excellence is a habit.&quot; — Aristotle
              </option>
              <option value="You do not rise to the level of your goals. You fall to the level of your systems.">
                &quot;You fall to the level of your systems.&quot; — James Clear
              </option>
              <option value="Small disciplines repeated with consistency every day lead to great achievements.">
                &quot;Small disciplines repeated lead to great achievements.&quot; — John Maxwell
              </option>
            </select>
            <span className="md-text-field__label">Philosophy</span>
            <span className="md-text-field__arrow" aria-hidden="true">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
            <button onClick={handleDownloadCard} className="md-button md-button--filled md-ripple">
              <Download className="w-4 h-4" />
              Download poster
            </button>
            <button onClick={handleCopyShareText} className="md-button md-button--outlined md-ripple">
              {copiedShareText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedShareText ? 'Copied' : 'Copy caption'}
            </button>
          </div>
        </section>
      )}

      {/* Accountability */}
      {activeTab === 'buddies' && (
        <section className="md-card md-card--outlined space-y-4">
          <div>
            <h3 className="md-title-medium">Accountability partner network</h3>
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              Share your code with friends or a coach to compare consistency
            </p>
          </div>

          <div className="md-card md-card--filled flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="md-label-medium block" style={{ color: 'var(--md-on-surface-variant)' }}>
                Your accountability code
              </span>
              <div className="md-headline-medium font-mono tracking-widest" style={{ color: 'var(--md-primary)' }}>
                {syncCode}
              </div>
            </div>
            <button onClick={handleCopySyncCode} className="md-button md-button--filled md-ripple w-full md:w-auto">
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied' : 'Copy code'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
