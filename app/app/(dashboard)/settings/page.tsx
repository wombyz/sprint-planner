"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="glass rounded-xl p-8 text-center">
        <div className="p-4 rounded-full bg-dark-700/50 inline-block mb-4">
          <Settings className="h-10 w-10 text-dark-400" />
        </div>
        <h2 className="text-lg font-semibold text-dark-100 mb-2">Settings Coming Soon</h2>
        <p className="text-dark-400">
          Application settings will be available in a future update.
        </p>
      </div>
    </div>
  );
}
