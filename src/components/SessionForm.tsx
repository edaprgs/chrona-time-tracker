"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SessionForm() {

  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [prLink, setPrLink] = useState("");

  async function saveSession() {

    const { error } = await supabase
      .from("sessions")
      .insert([
        {
          task,
          description,
          github_pr: prLink
        }
      ]);

    if (!error) {

      setTask("");
      setDescription("");
      setPrLink("");

    }

  }

  return (
    <div className="space-y-4">

      <input
        className="border rounded-lg p-3 w-full"
        placeholder="Task"
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />

      <textarea
        className="border rounded-lg p-3 w-full"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        className="border rounded-lg p-3 w-full"
        placeholder="Github PR"
        value={prLink}
        onChange={(e) => setPrLink(e.target.value)}
      />

      <button
        className="bg-pink-500 px-5 py-3 rounded-xl text-white"
        onClick={saveSession}
      >
        Save Session
      </button>

    </div>
  );
}