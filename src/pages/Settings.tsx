import React, { useState } from "react";
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

export default function Settings() {
  const [voice, setVoice] = useState("default");
  const [model, setModel] = useState("gpt-4");
  const [wakeWord, setWakeWord] = useState(false);
  const [memoryLimit, setMemoryLimit] = useState(100);
  const [privacy, setPrivacy] = useState(true);

  // TODO: Persist settings to backend or localStorage

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="p-8 w-full max-w-lg space-y-6">
        <h2 className="text-2xl font-bold mb-2">Jupiter Settings</h2>
        <div>
          <Label>Model Tier</Label>
          <select
            className="w-full border rounded p-2 mt-1"
            value={model}
            onChange={e => setModel(e.target.value)}
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
            value={voice}
            onChange={e => setVoice(e.target.value)}
          >
            {voices.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <Label>Wake Word</Label>
          <Switch checked={wakeWord} onCheckedChange={setWakeWord} />
        </div>
        <div>
          <Label>Memory Limit (messages)</Label>
          <Input
            type="number"
            min={10}
            max={1000}
            value={memoryLimit}
            onChange={e => setMemoryLimit(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Privacy Mode</Label>
          <Switch checked={privacy} onCheckedChange={setPrivacy} />
        </div>
        <Button onClick={() => window.history.back()}>Back</Button>
      </Card>
    </div>
  );
}