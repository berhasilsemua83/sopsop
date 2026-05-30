import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Video, 
  Clock, 
  Hash, 
  FileText, 
  Loader2, 
  Wand2, 
  Copy, 
  CheckCircle2,
  Download,
  Trash2,
  History,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Tag,
  Target,
  Key,
  Package
} from 'lucide-react';
import { generateScripts, GeneratedScript, GenerateInput } from './lib/gemini';
import { openAffiliateLink } from './lib/affiliateLinks';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScriptSession {
  id: string;
  timestamp: string;
  productName: string;
  productDesc: string;
  scripts: GeneratedScript[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function loadSessions(): ScriptSession[] {
  try {
    const raw = localStorage.getItem('svscript_sessions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ScriptSession[]) {
  localStorage.setItem('svscript_sessions', JSON.stringify(sessions));
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Form state
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('svs_apiKey') || '');
  const [productName, setProductName] = useState(() => localStorage.getItem('svs_productName') || '');
  const [productDesc, setProductDesc] = useState(() => localStorage.getItem('svs_productDesc') || '');
  const [duration, setDuration] = useState<number>(() => {
    const val = localStorage.getItem('svs_duration');
    return val ? Number(val) : 30;
  });
  const [scriptCount, setScriptCount] = useState<number>(() => {
    const val = localStorage.getItem('svs_scriptCount');
    return val ? Number(val) : 3;
  });
  const [scriptMode, setScriptMode] = useState<'BEBAS' | 'AMAN'>(() => {
    const val = localStorage.getItem('svs_scriptMode');
    return (val === 'AMAN') ? 'AMAN' : 'BEBAS';
  });
  const [normalPrice, setNormalPrice] = useState(() => localStorage.getItem('svs_normalPrice') || '');
  const [promoPrice, setPromoPrice] = useState(() => localStorage.getItem('svs_promoPrice') || '');
  const [productQty, setProductQty] = useState<number>(() => {
    const val = localStorage.getItem('svs_productQty');
    return val ? Number(val) : 1;
  });
  const [angle, setAngle] = useState(() => localStorage.getItem('svs_angle') || '');

  // Session history & active view
  const [sessions, setSessions] = useState<ScriptSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});

  // Persist form prefs
  useEffect(() => { localStorage.setItem('svs_apiKey', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('svs_productName', productName); }, [productName]);
  useEffect(() => { localStorage.setItem('svs_productDesc', productDesc); }, [productDesc]);
  useEffect(() => { localStorage.setItem('svs_duration', String(duration)); }, [duration]);
  useEffect(() => { localStorage.setItem('svs_scriptCount', String(scriptCount)); }, [scriptCount]);
  useEffect(() => { localStorage.setItem('svs_scriptMode', scriptMode); }, [scriptMode]);
  useEffect(() => { localStorage.setItem('svs_normalPrice', normalPrice); }, [normalPrice]);
  useEffect(() => { localStorage.setItem('svs_promoPrice', promoPrice); }, [promoPrice]);
  useEffect(() => { localStorage.setItem('svs_productQty', String(productQty)); }, [productQty]);
  useEffect(() => { localStorage.setItem('svs_angle', angle); }, [angle]);

  // Persist sessions
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // Derived: active session object
  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productDesc) return;

    setIsLoading(true);
    try {
      const input: GenerateInput = {
        productName,
        productDesc,
        duration,
        scriptCount,
        scriptMode,
        normalPrice,
        promoPrice,
        productQty,
        angle,
        apiKey,
      };
      
      const generated = await generateScripts(input);

      const newSession: ScriptSession = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        productName,
        productDesc,
        scripts: generated,
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    } catch (error: any) {
      alert(error.message || 'Gagal membuat skrip.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedStates(prev => ({ ...prev, [index]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [index]: false })), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleScriptChange = (scriptIndex: number, newContent: string) => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const scripts = [...s.scripts];
      scripts[scriptIndex] = { ...scripts[scriptIndex], content: newContent };
      return { ...s, scripts };
    }));
  };

  const deleteSession = (id: string) => {
    if (!window.confirm('Hapus histori skrip ini?')) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const downloadSession = (session: ScriptSession) => {
    const text = session.scripts
      .map((s, i) => `========================\nVARIASI ${i + 1}\n========================\nTOTAL ESTIMASI:\n- ${s.wordCount} kata\n- estimasi ${s.duration} detik\n========================\n\n${s.content}\n\n`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SVscript_${session.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] overflow-x-hidden selection:bg-orange-500/30 text-slate-200 font-sans">
      {/* Elegant Dark Gradient Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ef4444]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-[#f97316]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-[#8b5cf6]/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-8 lg:py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md mb-6"
          >
            <Sparkles className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium tracking-wide text-orange-100/80 uppercase">Shopee Spesialis v2.0</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-orange-100 to-orange-500 mb-4 text-center"
          >
            SVScript AI.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto text-center text-lg sm:text-xl font-light"
          >
            Generator skrip afiliasi Shopee Video & TikTok dengan konversi tinggi. 
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* ── Left: Form ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 w-full bg-[#121214] border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl"
          >
            <form onSubmit={handleGenerate} className="space-y-6">
              
              {/* API Key */}
              <div className="space-y-2 p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                <label className="text-sm font-medium pl-1 text-orange-300 flex items-center">
                  <Key className="w-4 h-4 mr-2" />
                  Gemini API Key (Manual)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#1a1a1e] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm font-mono"
                />
                <p className="text-xs text-slate-400 mt-2 leading-relaxed pl-1">
                  Copy paste API Key akun google anda gratis di{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 hover:underline"
                  >
                    Google AI Studio
                  </a>.{' '}
                  Sangat aman: API Key hanya disimpan sementara di browser Anda dan dikirim langsung ke Google, Jika gagal/eror klik pertama buat coba ulangi lagi selagi API Key anda masih ada kuotanya tool tetap bisa di gunakan.
                </p>
              </div>

              {/* Nama Produk */}
              <div className="space-y-2">
                <label className="text-sm font-medium pl-1 text-slate-300">Nama Produk</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 opacity-50"><Tag className="w-4 h-4" /></div>
                  <input
                    type="text"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="Contoh: Tas Selempang Wanita Anti Air..."
                    className="w-full bg-[#1a1a1e] border border-white/5 hover:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <label className="text-sm font-medium pl-1 text-slate-300">Deskripsi / Detail / Selling Point</label>
                <textarea
                  value={productDesc}
                  onChange={e => setProductDesc(e.target.value)}
                  placeholder="Ceritakan bahan, keunggulan, untuk siapa produk ini, masalah apa yang diselesaikan..."
                  className="w-full bg-[#1a1a1e] border border-white/5 hover:border-white/10 rounded-2xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-y min-h-[100px] transition-all text-sm leading-relaxed"
                  required
                />
              </div>

              {/* Mode Selection */}
              <div className="space-y-3 pb-2">
                <label className="text-sm font-medium pl-1 text-slate-300">Strategy Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScriptMode('BEBAS')}
                    className={`flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 ${
                      scriptMode === 'BEBAS'
                        ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30'
                        : 'bg-[#1a1a1e] border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className={`w-4 h-4 ${scriptMode === 'BEBAS' ? 'text-orange-400' : 'text-slate-500'}`} />
                      <span className={`font-semibold text-sm ${scriptMode === 'BEBAS' ? 'text-orange-300' : 'text-slate-400'}`}>BEBAS</span>
                    </div>
                    <span className="text-xs text-left text-slate-500 leading-relaxed">Sebut diskon & harga nominal terang-terangan.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScriptMode('AMAN')}
                    className={`flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 ${
                      scriptMode === 'AMAN'
                        ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
                        : 'bg-[#1a1a1e] border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <ShieldCheck className={`w-4 h-4 ${scriptMode === 'AMAN' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className={`font-semibold text-sm ${scriptMode === 'AMAN' ? 'text-emerald-300' : 'text-slate-400'}`}>AMAN</span>
                    </div>
                    <span className="text-xs text-left text-slate-500 leading-relaxed">Tanpa embel harga. Pakai value perception.</span>
                  </button>
                </div>
              </div>

              {/* Harga Normal + Harga Promo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium pl-1 text-slate-400">Harga Normal (opsional)</label>
                  <input
                    type="text"
                    value={normalPrice}
                    onChange={e => setNormalPrice(e.target.value)}
                    placeholder="Rp100.000"
                    className="w-full bg-[#1a1a1e] border border-white/5 rounded-xl px-4 py-2.5 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium pl-1 text-slate-400">Harga Promo (opsional)</label>
                  <input
                    type="text"
                    value={promoPrice}
                    onChange={e => setPromoPrice(e.target.value)}
                    placeholder="Rp25.000"
                    className="w-full bg-[#1a1a1e] border border-white/5 rounded-xl px-4 py-2.5 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Jumlah Isi / Pcs Produk */}
              <div className="space-y-2">
                <label className="text-xs font-medium pl-1 text-slate-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Jumlah Isi / Pcs dalam 1 Paket (opsional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={productQty}
                  onChange={e => setProductQty(Math.max(1, Number(e.target.value)))}
                  placeholder="1"
                  className="w-full bg-[#1a1a1e] border border-white/5 rounded-xl px-4 py-2.5 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder:text-slate-600"
                />
                <p className="text-[11px] text-slate-500 pl-1 leading-relaxed">
                  Dipakai agar enumerasi skrip (1,2,3 / Senin,Selasa,dst) sesuai jumlah produk aslinya.
                </p>
              </div>

              {/* Angle */}
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium pl-1 text-slate-300">Angle / Sudut Pandang (opsional)</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 opacity-50"><Target className="w-4 h-4" /></div>
                  <input
                    type="text"
                    value={angle}
                    onChange={e => setAngle(e.target.value)}
                    placeholder="Contoh: Viral, estetik, hemat, kaum mendang-mending"
                    className="w-full bg-[#1a1a1e] border border-white/5 hover:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Durasi + Jumlah Variasi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium pl-1 text-slate-300">Durasi Video (Detik)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      placeholder="Contoh: 30"
                      className="w-full bg-[#1a1a1e] border border-white/5 hover:border-white/10 rounded-2xl py-3.5 pl-4 pr-10 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm"
                      required
                    />
                    <Clock className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium pl-1 text-slate-300">Jumlah Variasi</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={scriptCount}
                      onChange={e => setScriptCount(Number(e.target.value))}
                      className="w-full bg-[#1a1a1e] border border-white/5 rounded-2xl py-3.5 pl-4 pr-10 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm"
                      required
                    />
                    <Hash className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !productName || !productDesc}
                onClick={() => {
                  // Direct user click = browser izinkan buka tab baru
                  // Hanya buka jika form valid (tidak loading & ada input)
                  if (!isLoading && productName && productDesc) openAffiliateLink();
                }}
                className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 mt-6 font-semibold text-white hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_10px_40px_-10px_rgba(249,115,22,0.5)] active:scale-[0.98] border border-orange-400/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Racik Formula...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate SVScript</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* ── Right: History / Detail ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-8 flex flex-col"
          >
            <div className="bg-[#121214]/60 border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl backdrop-blur-2xl min-h-[700px] flex flex-col relative overflow-hidden">
              
              <AnimatePresence mode="wait">

                {/* Loading State */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-[#121214]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin" />
                      <div className="absolute inset-2 border-r-2 border-red-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
                      <div className="absolute inset-4 border-b-2 border-amber-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-xl font-medium tracking-tight text-white mb-2">Meramu Hook & Copywriting...</p>
                    <p className="text-sm text-slate-400">Mengoptimasi struktur agar konversi maksimal</p>
                  </motion.div>
                )}

                {/* Empty State */}
                {!isLoading && sessions.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400"
                  >
                    <div className="bg-orange-500/5 p-6 rounded-full mb-6 border border-orange-500/10">
                      <Video className="w-12 h-12 text-orange-400/50" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-300 mb-2">Belum ada skrip yang dibuat</h3>
                    <p className="text-sm max-w-sm leading-relaxed">
                      Lengkapi form di sebelah kiri untuk mulai menghasilkan naskah promosi affiliate dengan konversi tinggi.
                    </p>
                  </motion.div>
                )}

                {/* History List */}
                {sessions.length > 0 && activeSessionId === null && (
                  <motion.div
                    key="history-list"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-slate-200 flex items-center">
                        <History className="w-5 h-5 mr-3 text-orange-400" />
                        Penyimpanan Skrip
                      </h3>
                      <span className="text-xs font-mono bg-white/5 border border-white/5 px-3 py-1 rounded-full text-slate-400">
                        {sessions.length} Riwayat
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-10">
                      {sessions.map(session => (
                        <motion.div
                          key={session.id}
                          layout
                          onClick={() => setActiveSessionId(session.id)}
                          className="group bg-[#1a1a1e] hover:bg-[#202025] border border-white/5 hover:border-orange-500/30 rounded-2xl p-5 cursor-pointer transition-all flex flex-col relative overflow-hidden"
                        >
                          {/* Active decoration line */}
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-[10px] font-bold tracking-wider uppercase bg-orange-500/10 text-orange-400 px-2 py-1 rounded-md">
                              {session.scripts.length} Variasi
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {formatTimestamp(session.timestamp)}
                            </span>
                          </div>
                          
                          <h4 className="text-base font-semibold text-slate-200 mb-1 truncate">
                            {session.productName}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
                            {session.productDesc}
                          </p>

                          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-slate-400 flex items-center">
                              Buka Detail <ChevronRight className="w-3 h-3 ml-1" />
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={e => { e.stopPropagation(); downloadSession(session); }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Session Detail */}
                {activeSession && activeSessionId !== null && (
                  <motion.div
                    key={`detail-${activeSession.id}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-white/5 space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setActiveSessionId(null)}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-100 mb-1">{activeSession.productName}</h3>
                          <p className="text-xs text-slate-500">{formatTimestamp(activeSession.timestamp)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadSession(activeSession)}
                          className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl transition-all text-sm font-medium"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          <span>Download All</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(
                            activeSession.scripts
                              .map((s, i) => `========================\nVARIASI ${i + 1}\n========================\nTOTAL ESTIMASI:\n- ${s.wordCount} kata\n- estimasi ${s.duration} detik\n========================\n\n${s.content}\n`)
                              .join('\n\n')
                          )}
                          className="flex items-center px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/20 rounded-xl transition-all text-sm font-medium"
                        >
                          {copiedAll ? (
                            <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" /><span className="text-green-400">Tersalin</span></>
                          ) : (
                            <><Copy className="w-4 h-4 mr-2" /><span>Copy All</span></>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-8 overflow-y-auto pr-2 pb-10">
                      {activeSession.scripts.map((script, index) => (
                        <div key={index} className="bg-[#1a1a1e] border border-white/5 rounded-2xl p-6 relative group">
                          
                          <div className="mb-4">
                            <div className="inline-block bg-white/5 border border-white/5 rounded-full px-3 py-1 mb-3">
                              <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                                VARIASI {index + 1}
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-orange-200 mb-2 leading-relaxed">
                              {script.title}
                            </h4>
                            <div className="flex space-x-4 text-xs font-mono text-slate-500 bg-black/40 inline-flex px-3 py-1.5 rounded-lg border border-white/5">
                              <span><strong className="text-slate-300">{script.wordCount}</strong> kata</span>
                              <span>•</span>
                              <span><strong className="text-slate-300">~{script.duration}</strong> detik</span>
                            </div>
                          </div>

                          <div className="relative">
                            <textarea
                              value={script.content}
                              onChange={e => handleScriptChange(index, e.target.value)}
                              className="w-full bg-black/30 border border-white/5 hover:border-white/10 rounded-xl p-5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-y min-h-[220px] text-sm leading-relaxed"
                            />
                            
                            <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => copyToClipboard(
                                  `========================\nVARIASI ${index + 1}\n========================\nTOTAL ESTIMASI:\n- ${script.wordCount} kata\n- estimasi ${script.duration} detik\n========================\n\n${script.content}`,
                                  index
                                )}
                                className="p-2 bg-black/80 hover:bg-orange-500 text-slate-300 hover:text-white rounded-lg transition-colors shadow-lg backdrop-blur-md"
                                title="Copy Script"
                              >
                                {copiedStates[index] ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
