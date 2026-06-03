"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Pin, MessageCircle } from "lucide-react";

interface Comment {
  id: string;
  name: string;
  email?: string;
  text: string;
  avatar: string;
  timestamp: number;
}

const PINNED_COMMENT: Comment = {
  id: "pinned",
  name: "KagePlay",
  text: 'Had fun? Just drop a "thanks" \u2014 it means a lot to us, and if you spot a dead link, let us know, we\u2019ll fix it fast!',
  avatar: "https://media.tenor.com/seGvGe7Cp2cAAAAi/anime-bocchi.gif",
  timestamp: 0,
};

const TENOR_API = "https://g.tenor.com/v1/search?q=funny anime&key=LIVDSRZULELA&limit=8";
const STORAGE_PREFIX = "kageplay_comments_";

function getAnimeId(): string {
  if (typeof window === "undefined") return "unknown";
  const params = new URLSearchParams(window.location.search);
  return params.get("anime") || "unknown";
}

function loadComments(animeId: string): Comment[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + animeId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveComments(animeId: string, comments: Comment[]) {
  localStorage.setItem(STORAGE_PREFIX + animeId, JSON.stringify(comments));
}

const Comments = () => {
  const animeId = getAnimeId();
  const [comments, setComments] = useState<Comment[]>([]);
  const [tenorAvatars, setTenorAvatars] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setComments(loadComments(animeId));
    fetch(TENOR_API)
      .then((r) => r.json())
      .then((d) => {
        const urls = (d?.results || []).map((g: any) => g.media[0]?.gif?.url || g.media[0]?.tinygif?.url || "").filter(Boolean);
        setTenorAvatars(urls);
      })
      .catch(() => setTenorAvatars([]));
  }, [animeId]);

  const getRandomAvatar = useCallback(() => {
    if (tenorAvatars.length === 0) return "";
    return tenorAvatars[Math.floor(Math.random() * tenorAvatars.length)];
  }, [tenorAvatars]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    const newComment: Comment = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim() || undefined,
      text: text.trim(),
      avatar: getRandomAvatar(),
      timestamp: Date.now(),
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    saveComments(animeId, updated);
    setName("");
    setEmail("");
    setText("");
    setSubmitting(false);
  };

  const formatDate = (ts: number) => {
    if (ts === 0) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="mt-10 border-t border-white/10 pt-8">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5" />
        Comments
      </h3>

      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 mb-6 flex gap-3 items-start">
        <img src={PINNED_COMMENT.avatar} alt="KagePlay" className="w-10 h-10 rounded-full object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-semibold text-sm">{PINNED_COMMENT.name}</span>
            <Pin className="h-3 w-3 text-yellow-500" />
            <span className="text-[10px] text-yellow-500 font-medium">PINNED</span>
          </div>
          <p className="text-sm text-gray-300">{PINNED_COMMENT.text}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3 bg-slate-900 rounded-lg p-4 border border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-slate-800 border-white/10"
          />
          <Input
            placeholder="Email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-800 border-white/10"
          />
        </div>
        <Input
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          className="bg-slate-800 border-white/10"
        />
        <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
          <Send className="h-4 w-4 mr-1" />
          {submitting ? "Posting..." : "Post Comment"}
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start bg-slate-900/50 rounded-lg p-3 border border-white/5">
              {c.avatar ? (
                <img src={c.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-xs text-gray-400">
                  {c.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm">{c.name}</span>
                  <span className="text-[10px] text-gray-500">{formatDate(c.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-300">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments;
