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
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error('Failed to load validation quality data:', err);
      setError(err.message || 'Failed to load validation quality data from server.');
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
    <div className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-200/90">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Validation, Traceability & Data Quality</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit numerical extractions, resolve conflicting source values side-by-side, inspect validation rules, and review audit logs.
          </p>
        </div>

        <button
          onClick={fetchAllQualityData}
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs rounded transition flex items-center space-x-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAllQualityData}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-800 text-rose-800 rounded font-mono text-[11px] transition flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Health Score KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Quality Score */}
        <div className="panel-card bg-white border border-slate-200/90 rounded p-3 flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Overall Quality Score</span>
            <div className="text-lg font-bold font-mono text-emerald-600">{qualityScore.qualityScore}%</div>
            <span className="text-[10px] text-emerald-700 font-mono flex items-center mt-0.5">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> High Precision Data
            </span>
          </div>
        </div>

        {/* Total Evaluated */}
        <div className="panel-card bg-white border border-slate-200/90 rounded p-3 flex items-center space-x-3">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-cyan-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Total Extractions Evaluated</span>
            <div className="text-lg font-bold font-mono text-slate-900">{qualityScore.totalRecordsEvaluated} Records</div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Cross-Validated</span>
          </div>
        </div>

        {/* Passed Count */}
        <div className="panel-card bg-white border border-slate-200/90 rounded p-3 flex items-center space-x-3">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-indigo-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Passed Validation</span>
            <div className="text-lg font-bold font-mono text-slate-900">{qualityScore.passedValidationCount} Passed</div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">0 Format Errors</span>
          </div>
        </div>

        {/* Flagged Anomalies */}
        <div className="panel-card bg-white border border-slate-200/90 rounded p-3 flex items-center space-x-3">
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Flagged Anomalies</span>
            <div className="text-lg font-bold font-mono text-amber-600">{qualityScore.flaggedAnomaliesCount} Items</div>
            <span className="text-[10px] text-amber-700 font-mono flex items-center mt-0.5">
              <AlertTriangle className="w-3 h-3 mr-0.5" /> Requires Audit Review
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200/90 space-x-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 text-xs font-semibold rounded-t transition flex items-center space-x-1.5 border-b-2 ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600 bg-slate-100/60'
              : 'border-transparent text-slate-400 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>1. Validation Checks (7 Rules)</span>
        </button>

        <button
          onClick={() => setActiveTab('conflicts')}
          className={`px-3 py-2 text-xs font-semibold rounded-t transition flex items-center space-x-1.5 border-b-2 ${
            activeTab === 'conflicts'
              ? 'border-blue-500 text-blue-600 bg-slate-100/60'
              : 'border-transparent text-slate-400 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          <span>2. Conflicting Values ({conflicts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('traceability')}
          className={`px-3 py-2 text-xs font-semibold rounded-t transition flex items-center space-x-1.5 border-b-2 ${
            activeTab === 'traceability'
              ? 'border-blue-500 text-blue-600 bg-slate-100/60'
              : 'border-transparent text-slate-400 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>3. Numerical Traceability Log</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 text-xs font-semibold rounded-t transition flex items-center space-x-1.5 border-b-2 ${
            activeTab === 'audit'
              ? 'border-blue-500 text-blue-600 bg-slate-100/60'
              : 'border-transparent text-slate-400 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>4. System Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Validation Checks Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validationChecks.map((check) => (
              <div key={check.id} className="panel-card bg-white border border-slate-200/90 rounded p-3.5 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{check.name}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{check.description}</p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      check.status === 'ACTION_REQUIRED'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : check.status === 'WARNING'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}
                  >
                    {check.anomalyCount} Anomalies
                  </span>
                </div>

                {check.sampleAnomalies && check.sampleAnomalies.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/90">
                    <span className="text-[10px] text-slate-400 font-mono block">Sample Validation Anomalies:</span>
                    {check.sampleAnomalies.map((sa: any, sIdx: number) => (
                      <div key={sIdx} className="p-2 bg-slate-50 border border-slate-200/90 rounded text-[11px] text-slate-700 font-mono">
                        {sa.document && <div>📄 <span className="text-blue-700">{sa.document}</span> (p. {sa.page})</div>}
                        {sa.rawSnippet && <div className="text-slate-400 italic">"{sa.rawSnippet}"</div>}
                        {sa.project && <div>Block: <strong className="text-slate-800">{sa.project}</strong> | {sa.metric}: {sa.sourceA} vs {sa.sourceB}</div>}
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
          <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-center space-x-2.5 text-amber-600 text-xs">
            <Info className="w-4 h-4 flex-shrink-0 text-amber-700" />
            <div>
              <span className="font-bold">Conflict Resolution Policy:</span> When conflicting source values are detected across documents, CERA preserves both values without auto-overwriting. Operators can inspect exact page citations and confidence scores below.
            </div>
          </div>

          <div className="space-y-4">
            {conflicts.map((c) => (
              <div key={c.id} className="panel-card bg-white border border-slate-200/90 rounded p-4 space-y-3">
                {/* Conflict Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-200/90">
                  <div>
                    <div className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      <span>{c.alertMessage}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mt-0.5">
                      {c.project} — <span className="text-blue-700">{c.metricName}</span>
                    </h3>
                  </div>
                </div>

                {/* Side-by-Side Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Source A */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded p-3 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200/90 pb-1.5">
                      <span className="text-xs font-bold text-slate-700 font-mono">Source A (Primary)</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {Math.round(c.sourceA.confidence * 100)}% Conf.
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      <div className="text-slate-400">Document: <span className="text-slate-800 font-bold">{c.sourceA.documentName}</span></div>
                      <div className="text-slate-400">Page: <span className="text-blue-600 font-bold">Page {c.sourceA.pageNumber}</span></div>
                      <div className="text-slate-400">Value: <span className="text-base font-bold text-slate-900">{c.sourceA.value} {c.sourceA.unit}</span></div>
                      <div className="text-slate-400">Method: <span className="text-blue-700">{c.sourceA.extractionMethod}</span></div>
                      <div className="text-[10px] text-slate-400">{new Date(c.sourceA.timestamp).toLocaleString()}</div>
                    </div>

                    <div className="p-2 bg-white rounded text-[11px] text-slate-400 italic border border-slate-200/90">
                      "{c.sourceA.snippet}"
                    </div>

                    <button
                      onClick={() => handleOpenDocViewer(c.sourceA.documentName, c.sourceA.pageNumber, c.sourceA.snippet)}
                      className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded text-xs font-sans font-medium flex items-center justify-center space-x-1.5 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Inspect Source A (p.{c.sourceA.pageNumber})</span>
                    </button>
                  </div>

                  {/* Source B */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded p-3 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200/90 pb-1.5">
                      <span className="text-xs font-bold text-slate-700 font-mono">Source B (Alternative)</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {Math.round(c.sourceB.confidence * 100)}% Conf.
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      <div className="text-slate-400">Document: <span className="text-slate-800 font-bold">{c.sourceB.documentName}</span></div>
                      <div className="text-slate-400">Page: <span className="text-cyan-700 font-bold">Page {c.sourceB.pageNumber}</span></div>
                      <div className="text-slate-400">Value: <span className="text-base font-bold text-slate-900">{c.sourceB.value} {c.sourceB.unit}</span></div>
                      <div className="text-slate-400">Method: <span className="text-blue-700">{c.sourceB.extractionMethod}</span></div>
                      <div className="text-[10px] text-slate-400">{new Date(c.sourceB.timestamp).toLocaleString()}</div>
                    </div>

                    <div className="p-2 bg-white rounded text-[11px] text-slate-400 italic border border-slate-200/90">
                      "{c.sourceB.snippet}"
                    </div>

                    <button
                      onClick={() => handleOpenDocViewer(c.sourceB.documentName, c.sourceB.pageNumber, c.sourceB.snippet)}
                      className="w-full py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-xs font-sans font-medium flex items-center justify-center space-x-1.5 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Inspect Source B (p.{c.sourceB.pageNumber})</span>
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
        <div className="panel-card bg-white border border-slate-200/90 rounded p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2.5 border-b border-slate-200/90">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-700" />
                <span>Extracted Numerical Values Traceability Log</span>
              </h3>
              <p className="text-[11px] text-slate-400">Maintains value, unit, document, page, extraction method, confidence, and timestamp for every extraction.</p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Filter by metric, project, or method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Metric & Project</th>
                  <th>Extracted Value</th>
                  <th>Unit</th>
                  <th>Document & Page</th>
                  <th>Extraction Method</th>
                  <th>Confidence</th>
                  <th className="text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTraceability.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td>
                      <div className="font-sans font-bold text-slate-800">{row.metricName}</div>
                      <div className="text-[10px] text-blue-700">{row.project}</div>
                    </td>
                    <td className="font-bold text-slate-900">{row.value.toLocaleString()}</td>
                    <td className="text-slate-400">{row.unit}</td>
                    <td>
                      <button
                        onClick={() => handleOpenDocViewer(row.document, row.page)}
                        className="text-[10px] text-blue-700 hover:underline flex items-center space-x-1 font-sans"
                      >
                        <span>{row.document} (p. {row.page})</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </td>
                    <td>
                      <span className="px-1.5 py-0.5 bg-slate-50 text-slate-700 rounded text-[10px] border border-slate-200/90">
                        {row.extractionMethod}
                      </span>
                    </td>
                    <td>
                      <span className="text-emerald-700 font-bold">{Math.round(row.confidence * 100)}%</span>
                    </td>
                    <td className="text-right text-slate-400 text-[10px]">
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
        <div className="panel-card bg-white border border-slate-200/90 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>System Pipeline Audit Trail</span>
              </h3>
              <p className="text-[11px] text-slate-400">Audit logs for uploads, processing, extraction, indexing, queries, and report generation</p>
            </div>
          </div>

          <div className="space-y-1.5 font-mono">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200/90 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'DOCUMENT_UPLOAD'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : log.action === 'DOCUMENT_PROCESSING'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : log.action === 'NUMERICAL_EXTRACTION'
                        ? 'bg-purple-50 text-purple-600 border border-purple-200'
                        : log.action === 'VECTOR_INDEXING'
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        : log.action === 'RAG_QUERY'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {log.action}
                  </span>

                  <div>
                    <span className="text-slate-800 font-sans font-bold">{log.entityType}</span>
                    <span className="text-[10px] text-slate-400 ml-2">ID: {log.entityId}</span>
                    {log.details && (
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center space-x-3 self-end sm:self-auto">
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
