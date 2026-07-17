"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  fetchCurrentUser,
  updateProfile,
  uploadAvatar,
  type AuthUser,
} from "@/lib/auth";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Profile state
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preferences state
  const [themePref, setThemePref] = useState<"light" | "dark" | "system">(
    "system",
  );
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const { setTheme } = useTheme();

  // Status state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (u) {
        setUser(u);
        setName(u.name);
        setAvatar(u.avatar || "");
        if (u.preferences) {
          setThemePref(u.preferences.theme);
          setEmailNotifs(u.preferences.notifications.email);
          setPushNotifs(u.preferences.notifications.push);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleGenerateAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 15);
    const newAvatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`;
    setAvatar(newAvatar);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File too large (max 5MB)" });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    const { user: updatedUser, error } = await uploadAvatar(file);
    if (error) {
      setMessage({ type: "error", text: error });
    } else if (updatedUser) {
      setUser(updatedUser);
      setAvatar(updatedUser.avatar || "");
      setMessage({ type: "success", text: "Avatar uploaded successfully!" });
      setTimeout(() => window.location.reload(), 1000);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setSaving(true);

    const payload: any = {
      name,
      avatar,
      preferences: {
        theme: themePref,
        notifications: {
          email: emailNotifs,
          push: pushNotifs,
        },
      },
    };

    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    // Apply theme immediately on save
    if (themePref !== "system") {
      setTheme(themePref);
    }

    const { user: updatedUser, error } = await updateProfile(payload);

    if (error) {
      setMessage({ type: "error", text: error });
    } else if (updatedUser) {
      setUser(updatedUser);
      setMessage({ type: "success", text: "Profile updated successfully!" });

      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => window.location.reload(), 1000);
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
    <div className="settings-page max-w-3xl">
      <h1 className="welcome-title mb-6">Profile Settings</h1>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md text-sm border shadow-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* PROFILE SECTION */}
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Basic Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="label mb-3 block">Profile Picture</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover shadow-sm bg-gray-50 border border-gray-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-sm">
                    {name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-primary text-sm h-10 px-4"
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Upload Custom"}
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateAvatar}
                      className="btn btn-secondary text-sm h-10 px-4"
                      disabled={uploading}
                    >
                      Randomize
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Max 5MB. Custom images are stored securely on Azure.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input type="hidden" value={avatar} name="avatar" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="label block mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="input-field w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label block mb-2">Email Address</label>
                <input
                  type="email"
                  className="input-field w-full opacity-60 bg-gray-50 cursor-not-allowed"
                  value={user?.email}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-2">
                  Email cannot be changed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PREFERENCES SECTION */}
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Preferences
          </h2>
          <div className="space-y-6">
            <div>
              <label className="label block mb-2">Theme</label>
              <select
                className="input-field w-full sm:w-1/2"
                value={themePref}
                onChange={(e) => setThemePref(e.target.value as any)}
              >
                <option value="system">System (Default)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <h3 className="label block mb-3">Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Email Notifications
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={pushNotifs}
                    onChange={(e) => setPushNotifs(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Push Notifications
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECURITY SECTION */}
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Security</h2>
          <p className="text-sm text-gray-600 mb-6">
            Leave these fields blank if you do not want to change your password.
          </p>

          <div className="space-y-5">
            <div>
              <label htmlFor="currentPassword" className="label block mb-2">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                className="input-field w-full sm:w-2/3"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label htmlFor="newPassword" className="label block mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="input-field w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label block mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input-field w-full"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="btn btn-primary px-8 py-2.5 text-base"
            disabled={saving}
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
