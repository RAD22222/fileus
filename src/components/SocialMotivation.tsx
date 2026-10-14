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
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { CheerReaction } from '../types';

interface SocialMotivationProps {
  onOpenNewPostModal: () => void;
}

export const SocialMotivation: React.FC<SocialMotivationProps> = ({
  onOpenNewPostModal,
}) => {
  const {
    user,
    userProfile,
    communityPosts,
    addCheer,
    todayStats,
    syncCode,
  } = useAuthAndSync();

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
    const text = `🔥 I'm on a ${todayStats.currentStreak}-day habit streak on HabitPulse! Today's score: ${todayStats.completionPercentage}%. Join me and keep each other accountable using my code: ${syncCode}`;
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

    // Stark monochrome background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 1080, 1080);

    const grad = ctx.createRadialGradient(540, 540, 100, 540, 540, 600);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 980, 980);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(90, 90, 320, 60, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('HABITPULSE // PROTOCOL', 115, 130);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '22px monospace';
    const dateText = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    ctx.fillText(dateText.toUpperCase(), 90, 220);

    const userName = (user?.displayName || userProfile?.displayName || 'Habit Architect').toUpperCase();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText(userName, 90, 290);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.roundRect(90, 350, 900, 310, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 150px monospace';
    ctx.fillText(`${todayStats.currentStreak}`, 140, 530);

    ctx.font = 'bold 32px monospace';
    ctx.fillText('DAY CONTINUOUS STREAK', 145, 600);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '28px monospace';
    ctx.fillText(`Adherence: ${todayStats.completionPercentage}%`, 620, 510);
    ctx.fillText(`Best Streak: ${todayStats.bestStreak} Days`, 620, 570);

    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'italic 32px sans-serif';
    ctx.fillText(`"${selectedQuote}"`, 90, 750);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(90, 890, 900, 90, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`SYNC CODE: ${syncCode}`, 130, 946);
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

  return (
    <div className="space-y-4 sm:space-y-8 w-full max-w-full">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Banner */}
      <div className="glass-surface p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/15 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-black dark:text-white" />
            <h2 className="text-lg sm:text-2xl font-black text-black dark:text-white">
              Social Motivation
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Share routine victories, cheer on friends, and generate shareable achievement cards.
          </p>
        </div>

        <button
          onClick={onOpenNewPostModal}
          className="w-full sm:w-auto min-h-[42px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post Habit Win</span>
        </button>
      </div>

      {/* Segmented Filter Buttons - Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-black/10 dark:border-white/10 pb-2.5 w-full">
        <button
          onClick={() => setActiveTab('feed')}
          className={`min-h-[38px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'feed'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Feed ({communityPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('shareCard')}
          className={`min-h-[38px] flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'shareCard'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Poster</span>
        </button>
        <button
          onClick={() => setActiveTab('buddies')}
          className={`min-h-[38px] flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'buddies'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Accountability</span>
        </button>
      </div>

      {/* Tab 1: Community Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-3 sm:space-y-4 w-full">
          {communityPosts.map(post => (
            <div
              key={post.id}
              className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-3 w-full"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black dark:bg-white text-white dark:text-black font-mono font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                    {post.authorName ? post.authorName[0].toUpperCase() : 'H'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-black dark:text-white truncate">
                      {post.authorName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                      <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span>·</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">{post.routineName}</span>
                    </div>
                  </div>
                </div>

                {post.streakCount > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-xl glass-button text-black dark:text-white text-xs font-mono font-bold shrink-0">
                    <Flame className="w-3.5 h-3.5 fill-black dark:fill-white text-black dark:text-white" />
                    <span>{post.streakCount}d</span>
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <h5 className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                  {post.title}
                </h5>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Reaction Bar */}
              <div className="pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1 flex-wrap">
                  {cheerReactions.map(r => (
                    <button
                      key={r.type}
                      onClick={() => addCheer(post.id, r.type)}
                      className="min-h-[34px] min-w-[34px] flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono glass-button text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-all active:scale-90"
                      title={r.label}
                    >
                      <span>{r.emoji}</span>
                      <span className="text-[10px] hidden sm:inline">{r.label}</span>
                    </button>
                  ))}
                </div>

                <div className="text-[11px] sm:text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  {post.cheerCount || 0} cheers
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Share Poster Generator */}
      {activeTab === 'shareCard' && (
        <div className="glass-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-4 sm:space-y-6 w-full">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-black dark:text-white">
              Visual Achievement Share Card
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Generate a high-contrast monochromatic achievement poster ready to export.
            </p>
          </div>

          {/* Scaled Poster Preview for Mobile */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-black text-white p-5 sm:p-8 shadow-xl w-full max-w-sm sm:max-w-md mx-auto border border-white/20">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-zinc-400">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                HABITPULSE // PROTOCOL
              </span>
              <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="mt-4 sm:mt-5">
              <h4 className="text-lg sm:text-2xl font-black text-white truncate">
                {user?.displayName || userProfile?.displayName || 'Daily Habit Architect'}
              </h4>
              <p className="text-[10px] sm:text-xs font-mono text-zinc-400 mt-0.5">CONTINUOUS PROTOCOL</p>
            </div>

            <div className="my-4 sm:my-5 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 fill-white text-white" />
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {todayStats.currentStreak}
                  </div>
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400">
                    Day Streak
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg sm:text-xl font-bold text-white">
                  {todayStats.completionPercentage}%
                </div>
                <div className="text-[9px] sm:text-[10px] text-zinc-400">Score</div>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs italic text-zinc-300 bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/5">
              &quot;{selectedQuote}&quot;
            </p>

            <div className="mt-4 sm:mt-5 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-zinc-400 border-t border-white/10 pt-2.5 sm:pt-3">
              <span>CODE: {syncCode}</span>
              <span>HABITPULSE.APP</span>
            </div>
          </div>

          {/* Quote Selection */}
          <div className="space-y-1.5 w-full max-w-sm sm:max-w-md mx-auto">
            <label className="text-xs font-mono font-bold text-black dark:text-white">
              Select Philosophy:
            </label>
            <select
              value={selectedQuote}
              onChange={(e) => setSelectedQuote(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-black/5 dark:bg-white/5 text-black dark:text-white border border-black/10 dark:border-white/10 focus:outline-none"
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
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-sm sm:max-w-md mx-auto">
            <button
              onClick={handleDownloadCard}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Poster (PNG)</span>
            </button>
            <button
              onClick={handleCopyShareText}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl glass-button text-black dark:text-white text-xs font-mono font-bold transition-all active:scale-95"
            >
              {copiedShareText ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedShareText ? 'Copied!' : 'Copy Caption'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Accountability */}
      {activeTab === 'buddies' && (
        <div className="glass-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 space-y-4 sm:space-y-6 w-full">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-black dark:text-white">
              Accountability Partner Network
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Share your accountability code with workout buddies, coaches, or friends to compare consistency.
            </p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl glass-button flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-bold">
                Your Personal Accountability Code
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-black text-black dark:text-white tracking-widest">
                {syncCode}
              </div>
            </div>

            <button
              onClick={handleCopySyncCode}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold shadow-sm transition-all active:scale-95 shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
