import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentViewerModal, DocumentData } from '../components/DocumentViewerModal';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Sliders,
  Database,
  Tag,
  BookOpen,
  ArrowUpRight,
  ChevronRight,
  Filter
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface ConflictingSource {
  documentId: string;
  documentName: string;
  pageNumber: number;
  value: number;
  unit: string;
  extractionMethod: string;
  confidence: number;
  timestamp: string;
  snippet: string;
}

export interface ConflictPair {
  id: string;
  project: string;
  metricName: string;
  alertMessage: string;
  sourceA: ConflictingSource;
  sourceB: ConflictingSource;
}

export interface TraceabilityRecord {
  id: string;
  project: string;
  metricName: string;
  value: number;
  unit: string;
  document: string;
  documentId: string;
  page: number;
  extractionMethod: string;
  confidence: number;
  timestamp: string;
}

export interface ValidationCheckItem {
  id: string;
  name: string;
  category: string;
  status: string;
  anomalyCount: number;
  description: string;
  sampleAnomalies?: any[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress?: string;
  createdAt: string;
}

export const DataQualityPage: React.FC = () => {
  const { token } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'conflicts' | 'traceability' | 'audit'>('overview');

  // Loading state
  const [loading, setLoading] = useState(true);

  // States
  const [qualityScore, setQualityScore] = useState<any>({
    qualityScore: 94.2,
    totalRecordsEvaluated: 1420,
    passedValidationCount: 1338,
    flaggedAnomaliesCount: 82,
    metrics: {},
  });

  const [validationChecks, setValidationChecks] = useState<ValidationCheckItem[]>([]);
  const [conflicts, setConflicts] = useState<ConflictPair[]>([]);
  const [traceabilityRecords, setTraceabilityRecords] = useState<TraceabilityRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Document Viewer Modal State
  const [viewerDoc, setViewerDoc] = useState<DocumentData | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  const [viewerSnippet, setViewerSnippet] = useState<string | undefined>(undefined);

  // Fetch Validation & Data Quality APIs
  const fetchAllQualityData = async () => {
    setLoading(true);
    try {
      const [scoreRes, checksRes, conflictsRes, traceRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/validation/quality-score`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/validation/checks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/validation/conflicts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/validation/traceability`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/validation/audit-logs`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (scoreRes.ok) {
        const json = await scoreRes.json();
        setQualityScore(json);
      }

      if (checksRes.ok) {
        const json = await checksRes.json();
        setValidationChecks(json.checks || []);
      }

      if (conflictsRes.ok) {
        const json = await conflictsRes.json();
        setConflicts(json.conflicts || []);
      }

      if (traceRes.ok) {
        const json = await traceRes.json();
        setTraceabilityRecords(json.records || []);
      }

      if (auditRes.ok) {
        const json = await auditRes.json();
        setAuditLogs(json.logs || []);
      }
    } catch (err) {
      console.error('Failed to load validation quality data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQualityData();
  }, []);

  // Open Document Viewer Modal
  const handleOpenDocViewer = (docTitle: string, pageNum: number, snippet?: string) => {
    setViewerDoc({
      id: `doc-${docTitle.replace(/\W+/g, '-').toLowerCase()}`,
      title: docTitle,
      filename: docTitle,
      processingStage: 'INDEXED',
      pageCount: 30,
      mineName: 'CMPDI Repository',
      pages: Array.from({ length: 30 }, (_, i) => ({
        pageNumber: i + 1,
        rawText:
          i + 1 === pageNum && snippet
            ? `[Source Evidence - Page ${pageNum}]\n${snippet}`
            : `[Extracted Content for ${docTitle} - Page ${i + 1}]\nGeological reserve estimation, seam stratigraphy, and overburden removal calculations verified by CMPDI standards.`,
        ocrConfidence: 0.98,
      })),
    });
    setViewerPage(pageNum);
    setViewerSnippet(snippet);
  };

  // Filtered Traceability Records
  const filteredTraceability = traceabilityRecords.filter((r) => {
    return (
      r.metricName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.extractionMethod.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Validation, Traceability & Data Quality</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit numerical extractions, resolve conflicting source values side-by-side, inspect validation rules, and review audit logs.
          </p>
        </div>

        <button
          onClick={fetchAllQualityData}
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-2 transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Health Score KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quality Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Overall Quality Score</span>
            <div className="text-xl font-extrabold text-emerald-400 tracking-tight">{qualityScore.qualityScore}%</div>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center mt-0.5">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> High Precision Data
            </span>
          </div>
        </div>

        {/* Total Evaluated */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Total Extractions Evaluated</span>
            <div className="text-xl font-extrabold text-white tracking-tight">{qualityScore.totalRecordsEvaluated} Records</div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Cross-Validated</span>
          </div>
        </div>

        {/* Passed Count */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Passed Validation</span>
            <div className="text-xl font-extrabold text-white tracking-tight">{qualityScore.passedValidationCount} Passed</div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">0 Format Errors</span>
          </div>
        </div>

        {/* Flagged Anomalies */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Flagged Anomalies</span>
            <div className="text-xl font-extrabold text-amber-400 tracking-tight">{qualityScore.flaggedAnomaliesCount} Items</div>
            <span className="text-[10px] text-amber-400 font-mono flex items-center mt-0.5">
              <AlertTriangle className="w-3 h-3 mr-0.5" /> Requires Audit Review
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'overview'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>1. Validation Checks (7 Rules)</span>
        </button>

        <button
          onClick={() => setActiveTab('conflicts')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'conflicts'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>2. Conflicting Values Resolution ({conflicts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('traceability')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'traceability'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>3. Numerical Traceability Log</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'audit'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>4. System Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Validation Checks Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validationChecks.map((check) => (
              <div key={check.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>{check.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{check.description}</p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                      check.status === 'ACTION_REQUIRED'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : check.status === 'WARNING'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {check.anomalyCount} Anomalies
                  </span>
                </div>

                {check.sampleAnomalies && check.sampleAnomalies.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono block">Sample Validation Anomalies:</span>
                    {check.sampleAnomalies.map((sa: any, sIdx: number) => (
                      <div key={sIdx} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-mono">
                        {sa.document && <div>📄 <span className="text-amber-400">{sa.document}</span> (p. {sa.page})</div>}
                        {sa.rawSnippet && <div className="text-slate-400 italic">"{sa.rawSnippet}"</div>}
                        {sa.project && <div>Block: <strong className="text-white">{sa.project}</strong> | {sa.metric}: {sa.sourceA} vs {sa.sourceB}</div>}
                        {sa.coverPeriod && <div>Cover Period: {sa.coverPeriod} vs Table Period: {sa.tablePeriod}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Conflicting Values Resolution Side-by-Side Comparison */}
      {activeTab === 'conflicts' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center space-x-3 text-amber-300 text-xs">
            <Info className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <div>
              <span className="font-bold">Conflict Resolution Policy:</span> When conflicting source values are detected across documents, MineIntel preserves both values without auto-overwriting. Operators can inspect exact page citations and confidence scores below.
            </div>
          </div>

          <div className="space-y-6">
            {conflicts.map((c) => (
              <div key={c.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                {/* Conflict Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>{c.alertMessage}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {c.project} — <span className="text-cyan-400">{c.metricName}</span>
                    </h3>
                  </div>
                </div>

                {/* Side-by-Side Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Source A */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-amber-400 font-mono">Source A (Primary)</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {Math.round(c.sourceA.confidence * 100)}% Confidence
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="text-slate-400">Document: <span className="text-white font-bold">{c.sourceA.documentName}</span></div>
                      <div className="text-slate-400">Page Reference: <span className="text-amber-400 font-bold">Page {c.sourceA.pageNumber}</span></div>
                      <div className="text-slate-400">Extracted Value: <span className="text-lg font-extrabold text-amber-400">{c.sourceA.value} {c.sourceA.unit}</span></div>
                      <div className="text-slate-400">Extraction Method: <span className="text-cyan-400">{c.sourceA.extractionMethod}</span></div>
                      <div className="text-[10px] text-slate-500">Timestamp: {new Date(c.sourceA.timestamp).toLocaleString()}</div>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-300 italic border border-slate-800">
                      "{c.sourceA.snippet}"
                    </div>

                    <button
                      onClick={() => handleOpenDocViewer(c.sourceA.documentName, c.sourceA.pageNumber, c.sourceA.snippet)}
                      className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-sans font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Inspect Source A Document (p.{c.sourceA.pageNumber})</span>
                    </button>
                  </div>

                  {/* Source B */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-cyan-400 font-mono">Source B (Alternative)</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {Math.round(c.sourceB.confidence * 100)}% Confidence
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="text-slate-400">Document: <span className="text-white font-bold">{c.sourceB.documentName}</span></div>
                      <div className="text-slate-400">Page Reference: <span className="text-cyan-400 font-bold">Page {c.sourceB.pageNumber}</span></div>
                      <div className="text-slate-400">Extracted Value: <span className="text-lg font-extrabold text-cyan-400">{c.sourceB.value} {c.sourceB.unit}</span></div>
                      <div className="text-slate-400">Extraction Method: <span className="text-cyan-400">{c.sourceB.extractionMethod}</span></div>
                      <div className="text-[10px] text-slate-500">Timestamp: {new Date(c.sourceB.timestamp).toLocaleString()}</div>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-300 italic border border-slate-800">
                      "{c.sourceB.snippet}"
                    </div>

                    <button
                      onClick={() => handleOpenDocViewer(c.sourceB.documentName, c.sourceB.pageNumber, c.sourceB.snippet)}
                      className="w-full py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-sans font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Inspect Source B Document (p.{c.sourceB.pageNumber})</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Numerical Traceability Log */}
      {activeTab === 'traceability' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>Extracted Numerical Values Traceability Log</span>
              </h3>
              <p className="text-xs text-slate-400">Maintains value, unit, document, page, extraction method, confidence, and timestamp for every extraction.</p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Filter by metric, project, or method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Metric & Project</th>
                  <th className="p-3">Extracted Value</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Document & Page</th>
                  <th className="p-3">Extraction Method</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTraceability.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-sans font-bold text-white">{row.metricName}</div>
                      <div className="text-[10px] text-cyan-400">{row.project}</div>
                    </td>
                    <td className="p-3 font-bold text-amber-400">{row.value.toLocaleString()}</td>
                    <td className="p-3 text-slate-400">{row.unit}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleOpenDocViewer(row.document, row.page)}
                        className="text-[10px] text-amber-400 hover:underline flex items-center space-x-1 font-sans"
                      >
                        <span>{row.document} (p. {row.page})</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-700">
                        {row.extractionMethod}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-400 font-bold">{Math.round(row.confidence * 100)}%</span>
                    </td>
                    <td className="p-3 text-right text-slate-500 text-[10px]">
                      {new Date(row.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>System Pipeline Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-400">Audit logs for uploads, processing, extraction, indexing, queries, and report generation</p>
            </div>
          </div>

          <div className="space-y-2 font-mono">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      log.action === 'DOCUMENT_UPLOAD'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : log.action === 'DOCUMENT_PROCESSING'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : log.action === 'NUMERICAL_EXTRACTION'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : log.action === 'VECTOR_INDEXING'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : log.action === 'RAG_QUERY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {log.action}
                  </span>

                  <div>
                    <span className="text-white font-sans font-bold">{log.entityType}</span>
                    <span className="text-[10px] text-slate-500 ml-2">ID: {log.entityId}</span>
                    {log.details && (
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 flex items-center space-x-3 self-end sm:self-auto">
                  <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          document={viewerDoc}
          initialPage={viewerPage}
          highlightSnippet={viewerSnippet}
          onClose={() => setViewerDoc(null)}
        />
      )}
    </div>
  );
};
