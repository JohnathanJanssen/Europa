import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const voices = [
  { id: "elevenlabs-1", name: "ElevenLabs - Ava" },
  { id: "elevenlabs-2", name: "ElevenLabs - Josh" },
  { id: "default", name: "Default" },
];

const models = [
  { id: "gpt-4", name: "Jupiter (High Tier)" },
  { id: "gpt-3.5", name: "Economy Mode" },
];

const SETTINGS_KEY = "jupiter_settings";

type SettingsType = {
  voice: string;
  model: string;
  wakeWord: boolean;
  memoryLimit: number;
  privacy: boolean;
};

const defaultSettings: SettingsType = {
  voice: "default",
  model: "gpt-4",
  wakeWord: false,
  memoryLimit: 100,
  privacy: true,
};

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="p-8 w-full max-w-lg space-y-6">
        <h2 className="text-2xl font-bold mb-2">Jupiter Settings</h2>
        <div>
          <Label>Model Tier</Label>
          <select
            className="w-full border rounded p-2 mt-1"
            value={settings.model}
            onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Voice</Label>
          <select
            className="w-full border rounded p-2 mt-1"
            value={settings.voice}
            onChange={e => setSettings(s => ({ ...s, voice: e.target.value }))}
          >
            {voices.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <Label>Wake Word</Label>
          <Switch checked={settings.wakeWord} onCheckedChange={val => setSettings(s => ({ ...s, wakeWord: val }))} />
        </div>
        <div>
          <Label>Memory Limit (messages)</Label>
          <Input
            type="number"
            min={10}
            max={1000}
            value={settings.memoryLimit}
            onChange={e => setSettings(s => ({ ...s, memoryLimit: Number(e.target.value) }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Privacy Mode</Label>
          <Switch checked={settings.privacy} onCheckedChange={val => setSettings(s => ({ ...s, privacy: val }))} />
        </div>
        <Button onClick={() => window.history.back()}>Back</Button>
      </Card>
    </div>
  );
}