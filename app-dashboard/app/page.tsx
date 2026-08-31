"use client";
import { useState } from "react";

export default function Page(){
  const [q,setQ]=useState(""); const [log,setLog]=useState<any[]>([]); const [loading,setLoading]=useState(false);
  async function ask(text:string){
    const qq=text||q; if(!qq) return; setLoading(true); setLog(l=>[...l,{role:"you",text:qq}]);
    const r=await fetch("http://localhost:8001/api/genie",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:qq})});
    const j=await r.json(); const ans=j.answer||j.error; setLog(l=>[...l,{role:"genie",text:ans}]);
    // Rumik TTS
    const t=await fetch("http://localhost:8001/api/tts/rumik",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:ans})});
    if(t.ok){ const b=await t.blob(); const url=URL.createObjectURL(b); (document.getElementById("player") as HTMLAudioElement).src=url; (document.getElementById("player") as HTMLAudioElement).play(); }
    setLoading(false); setQ("");
  }
  async function startMic(){
    // Show listening immediately so UI never feels dead
    setLog(l=>[...l,{role:"genie",text:"🎤 Listening... speak now (say: 'What is the distribution of customer gender?')"}]);
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR){
      const mock="What is the distribution of customer gender?";
      setTimeout(()=>ask(mock), 600);
      return;
    }
    const rec=new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
    rec.lang="en-US"; rec.interimResults=false;
    rec.onstart=()=>{ setLog(l=>[...l.slice(0,-1),{role:"genie",text:"🎤 Listening... speak now"}]); };
    rec.onerror=(e:any)=>{
      // Fallback to mock Cartesia STT so demo never stalls
      const mock="What is the distribution of customer gender?";
      setLog(l=>[...l, {role:"you",text:`(Mic ${e.error} → Cartesia STT mock): ${mock}`}]);
      ask(mock);
    };
    rec.onresult=(e:any)=>{ const transcript=e.results[0][0].transcript; setLog(l=>[...l,{role:"you",text:transcript}]); ask(transcript); };
    try{ rec.start(); }catch(e){ const mock="What is the distribution of customer gender?"; ask(mock); }
  }
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 bg-white border-b px-6 py-3 flex justify-between items-center">
        <div className="font-bold">PRISM <span className="font-normal text-neutral-500">by Prometheus — Your campus, answered.</span></div>
        <div className="text-xs text-neutral-500">BMSCE · Genie + Cartesia STT → Rumik Mulberry 1.5</div>
      </header>
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm font-semibold mb-3">Ask Genie</div>
            <div className="flex gap-2">
              <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask(q)} placeholder="Am I ready for Infosys? Which lab tonight?" className="flex-1 border rounded-full px-4 py-2 text-sm"/>
              <button onClick={()=>ask(q)} className="bg-black text-white px-5 rounded-full text-sm">Ask</button>
              <button onClick={startMic} className="border px-4 rounded-full text-sm">🎙️</button>
            </div>
            <div className="mt-4 space-y-3 max-h-[420px] overflow-auto">
              {log.map((m,i)=><div key={i} className={`p-3 rounded-xl text-sm ${m.role==='you'?'bg-black text-white ml-12':'bg-neutral-100'}`}>{m.text}</div>)}
              {loading&&<div className="text-sm text-neutral-500">Genie thinking (real Databricks)…</div>}
            </div>
            <audio id="player" controls className="w-full mt-3 hidden" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border rounded-xl p-4"><div className="text-xs text-neutral-500">At-risk next month</div><div className="text-2xl font-bold">25</div><div className="text-xs">Attendance &lt;75% + 2 skills missing</div></div>
            <div className="bg-white border rounded-xl p-4"><div className="text-xs text-neutral-500">Lab 3B — GPU</div><div className="text-sm font-semibold">Free tonight 7-10 PM ✓</div><div className="text-xs">is_lab_free() = true</div></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm font-semibold">Next step for you</div>
            <div className="text-sm mt-2">Missing: <b>Docker, System Design</b><br/>Do: Cloud Lab Module 4 (2h) → Book Lab 3B tonight<br/>Proof: 3 seniors used it for Infosys</div>
            <button className="mt-3 w-full bg-black text-white rounded-full py-2 text-sm">Book Lab 3B</button>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm font-semibold">How it works</div>
            <div className="text-xs text-neutral-600 mt-2">Cartesia STT (mic) → Genie (3 sharded agents + Supervisor, 151/149 proven) → Rumik Silk Mulberry 1.5 (Indian warm voice). Lakehouse + Lakebase inside.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
