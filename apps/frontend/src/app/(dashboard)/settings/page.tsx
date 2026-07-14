"use client";

import { useEffect, useState, type FormEvent } from "react";
import { fetchCurrentUser, updateProfile, type AuthUser } from "@/lib/auth";

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (u) {
        setUser(u);
        setName(u.name);
        setAvatar(u.avatar || "");
      }
      setLoading(false);
    });
  }, []);

  const handleGenerateAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 15);
    const newAvatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`;
    setAvatar(newAvatar);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setSaving(true);

    const { user: updatedUser, error } = await updateProfile({ name, avatar });

    if (error) {
      setMessage({ type: "error", text: error });
    } else if (updatedUser) {
      setUser(updatedUser);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      // Minor delay to let user see success before reloading to update sidebar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="settings-page max-w-2xl">
      <h1 className="welcome-title mb-6">Profile Settings</h1>

      <div className="section-card">
        {message.text && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              message.type === "error"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-green-50 text-green-600 border border-green-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label mb-2">Avatar</label>
            <div className="flex items-center gap-6">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover bg-black"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
              <button
                type="button"
                onClick={handleGenerateAvatar}
                className="btn btn-secondary text-sm h-10"
              >
                Generate Random Avatar
              </button>
            </div>
            <input type="hidden" value={avatar} name="avatar" />
          </div>

          <div>
            <label htmlFor="name" className="label">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input-field opacity-60 bg-gray-50 cursor-not-allowed"
              value={user?.email}
              disabled
            />
            <p className="text-xs text-gray-500 mt-2">
              Email cannot be changed.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
