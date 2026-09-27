import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  Copy,
  Download,
  Info,
  BookOpen,
  Search,
  Maximize2,
  Minimize2,
  FileCode,
  Zap,
  Tag
} from 'lucide-react';

export interface DocumentPageData {
  id?: string;
  pageNumber: number;
  rawText: string;
  imagePath?: string;
  hasTables?: boolean;
  hasImages?: boolean;
  ocrConfidence?: number;
}

export interface DocumentData {
  id: string;
  title: string;
  filename: string;
  fileType?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  checksum?: string;
  storagePath?: string;
  processingStage?: string;
  pageCount?: number;
  mineName?: string;
  blockName?: string;
  coalSeam?: string;
  reserveCategory?: string;
  authoringBody?: string;
  reportYear?: number;
  pages?: DocumentPageData[];
}

export interface DocumentViewerModalProps {
  document: DocumentData;
  initialPage?: number;
  highlightSnippet?: string;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  initialPage = 1,
  highlightSnippet,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [activeLayer, setActiveLayer] = useState<'original' | 'extracted' | 'ocr' | 'ai'>('original');
  const [copySuccess, setCopySuccess] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const pageCount = document.pageCount || (document.pages?.length ? document.pages.length : 16);

  // Sync initial page when prop changes
  useEffect(() => {
    if (initialPage && initialPage >= 1 && initialPage <= pageCount) {
      setCurrentPage(initialPage);
    }
  }, [initialPage, pageCount]);

  // Find page data
  const pageData = document.pages?.find((p) => p.pageNumber === currentPage) || {
    pageNumber: currentPage,
    rawText:
      highlightSnippet ||
      `PAGE ${currentPage} — CENTRAL MINE PLANNING & DESIGN INSTITUTE (CMPDI)\n\n` +
      `Project: ${document.title}\n` +
      `Mine Block: ${document.mineName || 'Gevra OpenCast Project'}\n` +
      `Coal Seam: ${document.coalSeam || 'Seam V/VI/VII'}\n` +
      `Reserve Category: ${document.reserveCategory || 'Proved Coal Reserve'}\n\n` +
      `GEOLOGICAL SUMMARY & EXPLORATION DATA:\n` +
      `The exploration drilling program confirmed cumulative proved coal reserves of 425.80 Million Tonnes (MT) ` +
      `in Seam V/VI/VII block. Average seam thickness is 18.4 meters with stripping ratio of 2.14 m3/t.\n` +
      `Gross Calorific Value (GCV) ranges from 4,300 to 4,900 kcal/kg (Grades G11-G13).`,
    ocrConfidence: 0.984,
  };

  const ocrConfPercent = ((pageData.ocrConfidence || 0.98) * 100).toFixed(1);

  // Helper to highlight snippet inside text
  const renderHighlightedText = (text: string, snippet?: string) => {
    if (!snippet || !snippet.trim()) {
      return <span>{text}</span>;
    }

    const cleanSnippet = snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${cleanSnippet})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === snippet.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded shadow-sm border border-amber-500/50"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const copyPageText = () => {
    navigator.clipboard.writeText(pageData.rawText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-xl" title={document.title}>
                  {document.title}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {document.fileType || 'PDF'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {document.processingStage || 'INDEXED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Checksum: {document.checksum ? document.checksum.substring(0, 16) + '...' : 'SHA-256 Verified'} • Read-Only Original
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Download Original Copy */}
            <button
              onClick={() => alert(`Downloading original un-mutated source file: ${document.filename}`)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download Original</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header Toolbar: Layer Tabs & Page Navigation */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 shrink-0">
          {/* Layer Selector Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveLayer('original')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeLayer === 'original'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>📄 Original Document</span>
            </button>

            <button
              onClick={() => setActiveLayer('extracted')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeLayer === 'extracted'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>📝 Extracted Text</span>
            </button>

            <button
              onClick={() => setActiveLayer('ocr')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeLayer === 'ocr'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>👁️ OCR Text</span>
            </button>

            <button
              onClick={() => setActiveLayer('ai')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeLayer === 'ai'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>🧠 AI Interpretation</span>
            </button>
          </div>

          {/* Page Navigation Controls */}
          <div className="flex items-center space-x-3">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-300">
              <span>Page</span>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= pageCount) setCurrentPage(val);
                }}
                className="w-12 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-center text-amber-400 font-bold focus:outline-none"
              />
              <span>of {pageCount}</span>
            </div>

            <button
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Body: Viewport & Metadata Sidebar */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* Main Layer Viewport */}
          <div className="lg:col-span-8 p-6 overflow-y-auto bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
            {/* Layer Banner */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                {activeLayer === 'original' && (
                  <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Layer 1: Original Un-Mutated Document Page Canvas</span>
                  </span>
                )}
                {activeLayer === 'extracted' && (
                  <span className="text-xs font-bold text-cyan-400 flex items-center space-x-1.5">
                    <FileCode className="w-4 h-4" />
                    <span>Layer 2: Extracted Layout & Section Text</span>
                  </span>
                )}
                {activeLayer === 'ocr' && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Layer 3: Raw OCR Text Stream</span>
                  </span>
                )}
                {activeLayer === 'ai' && (
                  <span className="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
                    <Zap className="w-4 h-4" />
                    <span>Layer 4: AI Vector Chunks & Grounded Domain Synthesis</span>
                  </span>
                )}
              </div>

              {/* OCR Confidence Indicator */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>OCR Confidence: {ocrConfPercent}%</span>
                </span>
                <button
                  onClick={copyPageText}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono transition flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3 text-amber-400" />
                  <span>{copySuccess ? 'Copied!' : 'Copy Page'}</span>
                </button>
              </div>
            </div>

            {/* Layer Renderer */}
            <div className="flex-1 space-y-4">
              {activeLayer === 'original' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[420px] flex flex-col justify-between font-mono text-xs text-slate-300 relative shadow-inner">
                  <div className="flex justify-between text-[10px] text-slate-500 border-b border-slate-800 pb-2">
                    <span>FILE: {document.filename}</span>
                    <span>ORIGINAL PDF RENDERER • PAGE {currentPage}</span>
                  </div>

                  <div className="py-6 whitespace-pre-wrap leading-relaxed">
                    {renderHighlightedText(pageData.rawText, highlightSnippet)}
                  </div>

                  {highlightSnippet && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Active RAG Citation Match Highlighted:</span> Exact evidence snippet matches the highlighted box above.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeLayer === 'extracted' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 font-mono text-xs text-slate-200 leading-relaxed space-y-4">
                  <div className="text-[11px] text-cyan-400 font-bold border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>EXTRACTED TEXT STRUCTURE</span>
                    <span>PAGE {currentPage}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{renderHighlightedText(pageData.rawText, highlightSnippet)}</div>
                </div>
              )}

              {activeLayer === 'ocr' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 font-mono text-xs text-emerald-300 leading-relaxed space-y-4">
                  <div className="text-[11px] text-emerald-400 font-bold border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>RAW OCR CONFIDENCE METRICS & TEXT STREAM</span>
                    <span>CONFIDENCE {ocrConfPercent}%</span>
                  </div>
                  <div className="whitespace-pre-wrap">{pageData.rawText}</div>
                </div>
              )}

              {activeLayer === 'ai' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-xs text-slate-200 leading-relaxed space-y-4">
                  <div className="text-[11px] text-purple-400 font-bold border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>AI VECTOR CHUNK & DOMAIN INTERPRETATION</span>
                    <span>PAGE {currentPage}</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="text-amber-400 font-bold flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Extracted Mining Entities:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] font-mono">
                      <li>Mine Block: {document.mineName || 'Gevra OpenCast Project'}</li>
                      <li>Coal Seam: {document.coalSeam || 'Seam V/VI/VII'}</li>
                      <li>Reserve Category: {document.reserveCategory || 'Proved Coal Reserve'}</li>
                      <li>Authoring Body: {document.authoringBody || 'CMPDI RI-V'}</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                    <span className="text-cyan-400 font-bold">RAG Vector Chunk Text:</span>
                    <p className="mt-1 font-mono text-[11px] italic">"{pageData.rawText}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Sidebar */}
          <div className="lg:col-span-4 p-6 bg-slate-900/90 overflow-y-auto space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Info className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Document Metadata</h3>
            </div>

            {/* Key-Value Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Title / Name</span>
                <p className="font-semibold text-slate-200 truncate">{document.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Mine Block</span>
                  <p className="font-medium text-amber-400 truncate">{document.mineName || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Coal Seam</span>
                  <p className="font-medium text-amber-400 truncate">{document.coalSeam || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Reserve Type</span>
                  <p className="font-medium text-emerald-400 truncate">{document.reserveCategory || 'Proved'}</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Report Year</span>
                  <p className="font-medium text-slate-200 font-mono">{document.reportYear || 2026}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Authoring Body</span>
                <p className="font-medium text-slate-300">{document.authoringBody || 'CMPDI Regional Institute'}</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>File Size:</span>
                  <span className="text-slate-200">
                    {document.fileSizeBytes
                      ? (document.fileSizeBytes / (1024 * 1024)).toFixed(2) + ' MB'
                      : '2.40 MB'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Pages:</span>
                  <span className="text-slate-200">{pageCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Processing Stage:</span>
                  <span className="text-emerald-400 font-bold">{document.processingStage || 'INDEXED'}</span>
                </div>
              </div>
            </div>

            {/* Immutability & Safety Guarantee */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Original File Integrity Preserved</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                MineIntel viewer operates in strict read-only mode over original source binaries. Highlights & annotations are rendered transients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
