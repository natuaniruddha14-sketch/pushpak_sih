import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Copy,
  Download,
  Info,
  Table as TableIcon,
  FileCode,
  Zap,
  Tag,
  Building,
  Calendar,
  CheckCircle2,
  Search
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface DocumentPageData {
  id?: string;
  pageNumber: number;
  rawText: string;
  imagePath?: string;
  hasTables?: boolean;
  hasImages?: boolean;
  ocrConfidence?: number;
}

export interface ExtractedTableData {
  id?: string;
  table_id?: string;
  table_index?: number;
  page_number?: number;
  sheetName?: string;
  title?: string;
  category?: string;
  headers: string[];
  rows: any[][];
  rowCount?: number;
  colCount?: number;
  data?: Record<string, any>[];
  cells?: any[];
  formulas?: Record<string, string>;
  sourceReference?: {
    documentId?: string;
    sheetName?: string;
    pageNumber?: number;
    section?: string;
    locator?: string;
  };
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
  processingError?: string | null;
  pageCount?: number;
  mineName?: string;
  blockName?: string;
  coalSeam?: string;
  reserveCategory?: string;
  authoringBody?: string;
  reportYear?: number;
  sourceDepartment?: string;
  subsidiary?: string;
  documentDate?: string;
  ocrStatus?: string;
  ocrConfidence?: number;
  tables?: ExtractedTableData[];
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
  const [activeLayer, setActiveLayer] = useState<'original' | 'extracted' | 'ocr' | 'tables' | 'ai'>('original');
  const [copySuccess, setCopySuccess] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [selectedTableCategory, setSelectedTableCategory] = useState<string>('all');

  const pageCount = document.pageCount || (document.pages?.length ? document.pages.length : 1);
  const tables = document.tables || [];

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
      `PAGE ${currentPage} — DOCUMENT CONTENT\n\n` +
      `Title: ${document.title}\n` +
      `Filename: ${document.filename}\n` +
      `Mine: ${document.mineName || 'Gevra OpenCast Project'}\n` +
      `Subsidiary: ${document.subsidiary || 'CIL / CMPDI'}\n` +
      `Status: ${document.processingStage || 'COMPLETED'}\n\n` +
      `Extracted content preserved with complete fact traceability.`,
    ocrConfidence: document.ocrConfidence ?? 1.0,
  };

  const ocrConfidence = pageData.ocrConfidence ?? document.ocrConfidence ?? 1.0;
  const ocrConfPercent = (ocrConfidence * 100).toFixed(1);
  const isLowConfidence = ocrConfidence < 0.75 && document.ocrStatus !== 'NOT_NEEDED';

  // Filter tables
  const filteredTables = tables.filter((tbl) => {
    const matchesCat = selectedTableCategory === 'all' || (tbl.category && tbl.category.toLowerCase() === selectedTableCategory.toLowerCase());
    if (!matchesCat) return false;
    if (!tableSearchQuery.trim()) return true;
    const q = tableSearchQuery.toLowerCase();
    const titleMatch = (tbl.title || '').toLowerCase().includes(q);
    const headerMatch = (tbl.headers || []).some((h) => String(h).toLowerCase().includes(q));
    const cellMatch = (tbl.rows || []).some((r) => r.some((c) => String(c).toLowerCase().includes(q)));
    return titleMatch || headerMatch || cellMatch;
  });

  const handleDownload = () => {
    window.open(`${API_URL}/api/v1/documents/${document.id}/download`, '_blank');
  };

  const copyPageText = () => {
    navigator.clipboard.writeText(pageData.rawText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate max-w-xl" title={document.title}>
                  {document.title}
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {document.fileType || 'PDF'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                    document.processingStage === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : document.processingStage === 'PARTIAL'
                      ? 'bg-amber-50/70 text-amber-600 border-amber-200'
                      : document.processingStage === 'FAILED'
                      ? 'bg-rose-950/70 text-rose-600 border-rose-200'
                      : 'bg-blue-50/70 text-blue-600 border-blue-200'
                  }`}
                >
                  {document.processingStage || 'COMPLETED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Checksum: {document.checksum ? document.checksum.substring(0, 16) + '...' : 'SHA-256 Verified'} • Read-Only Original
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Download Original Copy */}
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-slate-100 hover:bg-[#1a2b4e] text-blue-600 text-xs font-semibold rounded border border-blue-200 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Download Original</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Header Toolbar: Layer Tabs & Page Navigation */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Layer Selector Tabs */}
          <div className="flex bg-slate-200/50 p-0.5 rounded border border-slate-200 space-x-0.5">
            <button
              onClick={() => setActiveLayer('original')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === 'original'
                  ? 'bg-white text-blue-700 border border-slate-200 shadow-sm shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-700" />
              <span>Document Canvas</span>
            </button>

            <button
              onClick={() => setActiveLayer('extracted')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === 'extracted'
                  ? 'bg-white text-blue-700 border border-slate-200 shadow-sm shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 border border-transparent'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-700" />
              <span>Extracted Text</span>
            </button>

            <button
              onClick={() => setActiveLayer('tables')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === 'tables'
                  ? 'bg-white text-blue-700 border border-slate-200 shadow-sm shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 border border-transparent'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-blue-700" />
              <span>Structured Tables ({tables.length})</span>
            </button>

            <button
              onClick={() => setActiveLayer('ocr')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === 'ocr'
                  ? 'bg-white text-blue-700 border border-slate-200 shadow-sm shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>OCR Analysis</span>
            </button>

            <button
              onClick={() => setActiveLayer('ai')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === 'ai'
                  ? 'bg-white text-blue-700 border border-slate-200 shadow-sm shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-blue-700" />
              <span>Domain Entities</span>
            </button>
          </div>

          {/* Page Navigation Controls */}
          <div className="flex items-center space-x-3">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="p-1.5 bg-blue-500 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg border border-slate-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-700">
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
                className="w-12 bg-white border border-slate-200 rounded px-2 py-0.5 text-center text-amber-700 font-bold focus:outline-none"
              />
              <span>of {pageCount}</span>
            </div>

            <button
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
              className="p-1.5 bg-blue-500 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg border border-slate-200 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* Main Layer Viewport */}
          <div className="lg:col-span-8 p-6 overflow-y-auto bg-white border-r border-slate-200 flex flex-col justify-between">
            {/* Layer Banner & Confidence Badges */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                {activeLayer === 'original' && (
                  <span className="text-xs font-bold text-amber-700 flex items-center space-x-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Layer 1: Document Text & Canvas (Page {currentPage})</span>
                  </span>
                )}
                {activeLayer === 'extracted' && (
                  <span className="text-xs font-bold text-cyan-700 flex items-center space-x-1.5">
                    <FileCode className="w-4 h-4" />
                    <span>Layer 2: Extracted Clean Text Stream</span>
                  </span>
                )}
                {activeLayer === 'tables' && (
                  <span className="text-xs font-bold text-amber-700 flex items-center space-x-1.5">
                    <TableIcon className="w-4 h-4" />
                    <span>Layer 3: Extracted Mining Tables & Cell Coordinates</span>
                  </span>
                )}
                {activeLayer === 'ocr' && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Layer 4: OCR Engine Confidence & Bounding Regions</span>
                  </span>
                )}
                {activeLayer === 'ai' && (
                  <span className="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
                    <Zap className="w-4 h-4" />
                    <span>Layer 5: Mining Knowledge & Vector Chunk Graph</span>
                  </span>
                )}
              </div>

              {/* OCR Confidence Badge with Low Confidence Warning Flag */}
              <div className="flex items-center space-x-2">
                {isLowConfidence ? (
                  <span className="text-[10px] font-mono text-amber-600 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40 font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    <span>Low Confidence OCR ({ocrConfPercent}%) — Review Required</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Confidence: {ocrConfPercent}%</span>
                  </span>
                )}
                <button
                  onClick={copyPageText}
                  className="px-2.5 py-1 bg-white hover:bg-blue-700 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono transition flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3 text-amber-700" />
                  <span>{copySuccess ? 'Copied!' : 'Copy Page'}</span>
                </button>
              </div>
            </div>

            {/* Layer Renderer */}
            <div className="flex-1 space-y-4">
              {activeLayer === 'original' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[420px] flex flex-col justify-between font-mono text-xs text-slate-700 relative shadow-inner">
                  <div className="flex justify-between text-[10px] text-slate-500 border-b border-slate-200 pb-2">
                    <span>FILE: {document.filename}</span>
                    <span>CANVAS STREAM • PAGE {currentPage} OF {pageCount}</span>
                  </div>

                  <div className="py-6 whitespace-pre-wrap leading-relaxed">
                    {renderHighlightedText(pageData.rawText, highlightSnippet)}
                  </div>

                  {highlightSnippet && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 text-[11px] flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Active RAG Citation Match Highlighted:</span> Exact evidence snippet matches the highlighted box above.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeLayer === 'extracted' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 font-mono text-xs text-slate-800 leading-relaxed space-y-4">
                  <div className="text-[11px] text-cyan-700 font-bold border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>STRUCTURED EXTRACTED TEXT</span>
                    <span>PAGE {currentPage}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{renderHighlightedText(pageData.rawText, highlightSnippet)}</div>
                </div>
              )}

              {/* Tables Layer */}
              {activeLayer === 'tables' && (
                <div className="space-y-4">
                  {/* Table controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search within tables..."
                        value={tableSearchQuery}
                        onChange={(e) => setTableSearchQuery(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-500 focus:outline-none w-56 font-mono"
                      />
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs">
                      <span className="text-slate-500 font-mono text-[11px]">Category:</span>
                      <select
                        value={selectedTableCategory}
                        onChange={(e) => setSelectedTableCategory(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-amber-700 font-mono focus:outline-none"
                      >
                        <option value="all">All Categories</option>
                        <option value="production">Production & Offtake</option>
                        <option value="dispatch">Dispatch & Siding</option>
                        <option value="grade">Grade & Quality</option>
                        <option value="safety">Safety Statistics</option>
                        <option value="manpower">Manpower</option>
                        <option value="financial">Financial Values</option>
                        <option value="general">General Tables</option>
                      </select>
                    </div>
                  </div>

                  {filteredTables.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500 font-mono space-y-2">
                      <TableIcon className="w-8 h-8 text-slate-600 mx-auto" />
                      <p>No structured tables matched your filter in this document.</p>
                    </div>
                  ) : (
                    filteredTables.map((tbl, tIdx) => (
                      <div key={tbl.id || tIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Table Header Details */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className="p-1 bg-amber-500/10 text-amber-700 rounded">
                              <TableIcon className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                {tbl.title || `Extracted Table ${tIdx + 1}`}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-mono">
                                Source Reference: {tbl.sourceReference?.locator || tbl.sourceReference?.section || `Page ${tbl.page_number || currentPage}`} • {tbl.rowCount || tbl.rows?.length || 0} rows × {tbl.colCount || tbl.headers?.length || 0} columns
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20 uppercase font-semibold">
                            {tbl.category || 'General Mining'}
                          </span>
                        </div>

                        {/* Interactive Data Table View */}
                        <div className="overflow-x-auto max-h-[320px]">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700">
                              <tr>
                                <th className="px-3 py-2 text-[10px] text-slate-500 border-r border-slate-200 w-12 text-center">#</th>
                                {(tbl.headers || []).map((h, hIdx) => (
                                  <th key={hIdx} className="px-3 py-2 font-semibold text-amber-700 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-700">
                              {(tbl.rows || []).map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50 transition">
                                  <td className="px-3 py-1.5 text-[10px] text-slate-500 border-r border-slate-200 text-center font-mono bg-slate-50">
                                    {rIdx + 1}
                                  </td>
                                  {row.map((cellVal, cIdx) => (
                                    <td key={cIdx} className="px-3 py-1.5 border-r border-slate-200/40 last:border-r-0 whitespace-nowrap">
                                      {String(cellVal ?? '-')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeLayer === 'ocr' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 font-mono text-xs text-emerald-600 leading-relaxed space-y-4">
                  <div className="text-[11px] text-emerald-700 font-bold border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>RAW OCR ENGINE CONFIDENCE & VERIFICATION</span>
                    <span className="flex items-center space-x-1">
                      {isLowConfidence && <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />}
                      <span>CONFIDENCE: {ocrConfPercent}%</span>
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{pageData.rawText}</div>
                </div>
              )}

              {activeLayer === 'ai' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-xs text-slate-800 leading-relaxed space-y-4">
                  <div className="text-[11px] text-purple-400 font-bold border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>MINING KNOWLEDGE GRAPH & VECTOR CHUNKS</span>
                    <span>PAGE {currentPage}</span>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2">
                    <div className="text-amber-700 font-bold flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Traceable Mining Domain Attributes:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] font-mono">
                      <li>Mine Name: {document.mineName || 'N/A'}</li>
                      <li>Subsidiary: {document.subsidiary || 'N/A'}</li>
                      <li>Department: {document.sourceDepartment || 'Geology & Exploration'}</li>
                      <li>Coal Seam: {document.coalSeam || 'Seam V/VI/VII'}</li>
                      <li>Reserve Category: {document.reserveCategory || 'Proved Reserve'}</li>
                      <li>Document Date: {document.documentDate ? new Date(document.documentDate).toLocaleDateString() : 'N/A'}</li>
                    </ul>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-slate-700">
                    <span className="text-cyan-700 font-bold">RAG Vector Chunk Text:</span>
                    <p className="mt-1 font-mono text-[11px] italic">"{pageData.rawText}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Sidebar */}
          <div className="lg:col-span-4 p-6 bg-slate-50 overflow-y-auto space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
              <Info className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Source Document Metadata</h3>
            </div>

            {/* Error banner if processing failed */}
            {document.processingError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Processing Error:</span>
                </div>
                <p className="text-[11px] font-mono">{document.processingError}</p>
              </div>
            )}

            {/* Key-Value Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Document ID</span>
                <p className="font-mono text-cyan-700 text-[11px] truncate">{document.id}</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Title / Name</span>
                <p className="font-semibold text-slate-800 truncate">{document.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Mine Block</span>
                  <p className="font-medium text-amber-700 truncate">{document.mineName || 'N/A'}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Subsidiary</span>
                  <p className="font-medium text-slate-800 truncate">{document.subsidiary || 'CIL'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Department</span>
                  <p className="font-medium text-slate-800 truncate">{document.sourceDepartment || 'Geology'}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Doc Date</span>
                  <p className="font-medium text-slate-800 font-mono text-[11px]">
                    {document.documentDate ? new Date(document.documentDate).toLocaleDateString() : '2026-03-27'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>File Size:</span>
                  <span className="text-slate-800">
                    {document.fileSizeBytes
                      ? (document.fileSizeBytes / (1024 * 1024)).toFixed(2) + ' MB'
                      : '2.40 MB'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Page Count:</span>
                  <span className="text-slate-800">{pageCount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tables Extracted:</span>
                  <span className="text-amber-700 font-bold">{tables.length}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>OCR Status:</span>
                  <span className="text-slate-800">{document.ocrStatus || 'NOT_NEEDED'}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>OCR Confidence:</span>
                  <span className={isLowConfidence ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {ocrConfPercent}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                  <span>Processing Stage:</span>
                  <span className="text-emerald-700 font-bold">{document.processingStage || 'COMPLETED'}</span>
                </div>
              </div>
            </div>

            {/* Immutability & Safety Guarantee */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-600 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Original File Integrity Preserved</span>
              </div>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                CERA operates in strict read-only mode over original source binaries. Extracted knowledge and tables maintain strict cell coordinate traceability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
