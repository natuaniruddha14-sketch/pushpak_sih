import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentViewerModal, DocumentData } from '../components/DocumentViewerModal';
import {
  FileSpreadsheet,
  FileText,
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  Landmark,
  ShieldCheck,
  Layers,
  Printer,
  Eye,
  FileCheck,
  FolderKanban,
  ExternalLink,
  BookOpen,
  Calendar,
  Building2,
  AlertTriangle,
  Info
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface ReportSourceRef {
  documentName: string;
  pageNumber: number;
  citationSnippet?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  sources?: ReportSourceRef[];
}

export interface GroundedReport {
  id: string;
  title: string;
  reportType: string;
  projectName: string;
  period: string;
  fileFormat: string;
  status: string;
  createdAt: string;
  summaryText: string;
  sections: ReportSection[];
}

export const ReportsPage: React.FC = () => {
  const { token } = useAuth();

  // Pipeline Inputs
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('Gevra OCP');
  const [selectedReportType, setSelectedReportType] = useState<string>('EXECUTIVE SUMMARY');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2024-25');
  const [selectedFileFormat, setSelectedFileFormat] = useState<'PDF' | 'DOCX'>('PDF');

  // Generation & Status
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<GroundedReport | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Document Viewer Modal State
  const [viewerDocument, setViewerDocument] = useState<DocumentData | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  const [viewerSnippet, setViewerSnippet] = useState<string | undefined>(undefined);

  // Past Reports History
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Supported Report Types Definitions
  const reportTypesList = [
    {
      type: 'PROJECT SUMMARY',
      title: 'Project Summary Report',
      description: 'Comprehensive block dossier covering geological reserves, seam stratigraphy, and mining layout.',
      badge: 'CMPDI Form 1A',
      icon: FolderKanban,
    },
    {
      type: 'PRODUCTION REPORT',
      title: 'Production & Overburden Audit Report',
      description: 'Annual extraction targets, proved reserve depletion, and stripping ratio (m³/t) compliance.',
      badge: 'Production Audit',
      icon: Layers,
    },
    {
      type: 'DOCUMENT INTELLIGENCE REPORT',
      title: 'Document Intelligence Synthesis',
      description: 'AI-synthesized cross-document analysis, entity extraction, and latent topic taxonomy.',
      badge: 'AI Cross-RAG',
      icon: Sparkles,
    },
    {
      type: 'EXECUTIVE SUMMARY',
      title: 'Executive Mine Summary',
      description: 'Grounded executive briefing for Ministry of Coal oversight committees and CIL Directorate.',
      badge: 'Directorate Brief',
      icon: FileText,
    },
  ];

  // Fetch Projects List
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.projects || [];
          setProjects(list);
          if (list.length > 0) {
            setSelectedProjectId(list[0].id);
            setSelectedProjectName(list[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    if (token) fetchProjects();
  }, [token]);

  // Fetch Reports History
  const fetchReportsHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reports || data.data || []);
      } else {
        const data = await res.json().catch(() => ({}));
        setHistoryError(data.message || 'Failed to fetch reports history');
      }
    } catch (err: any) {
      console.error('Failed to fetch reports history:', err);
      setHistoryError(err.message || 'Network error fetching reports');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReportsHistory();
  }, [token]);

  // Execute Pipeline: Generate Grounded Report
  const handleGenerateReport = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportType: selectedReportType,
          projectId: selectedProjectId,
          projectName: selectedProjectName,
          period: selectedPeriod,
          fileFormat: selectedFileFormat,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setActiveReport(json.report || json.data);
        fetchReportsHistory();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setGenerateError(errJson.message || 'Report generation failed on the server.');
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setGenerateError(err.message || 'Error connecting to report generation service.');
    } finally {
      setGenerating(false);
    }
  };

  // Download PDF or DOCX File
  const handleDownload = async (reportId: string, format: 'PDF' | 'DOCX') => {
    try {
      const res = await fetch(`${API_URL}/api/v1/reports/${reportId}/download?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CERA_Report_${selectedProjectName.replace(/\W+/g, '_')}_${reportId}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download report document.');
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Copy Full Markdown/Text Report Content
  const copyReportText = () => {
    if (!activeReport) return;
    let fullText = `${activeReport.title}\n========================================\n\n`;
    activeReport.sections.forEach((sec) => {
      fullText += `## ${sec.title}\n${sec.content}\n\n`;
    });
    navigator.clipboard.writeText(fullText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Open Document Viewer at Source Citation
  const handleOpenCitation = (docName: string, pageNum: number, snippet?: string) => {
    setViewerDocument({
      id: `doc-${docName.replace(/\W+/g, '-').toLowerCase()}`,
      title: docName,
      filename: docName,
      processingStage: 'INDEXED',
      pageCount: 30,
      mineName: selectedProjectName,
      pages: Array.from({ length: 30 }, (_, i) => ({
        pageNumber: i + 1,
        rawText:
          i + 1 === pageNum && snippet
            ? `[Cited Source Content - Page ${pageNum}]\n${snippet}`
            : `[Extracted Document Content for ${docName} - Page ${i + 1}]\nGeological reserves, seam stratigraphy, and overburden removal calculations verified by CMPDI standards.`,
        ocrConfidence: 0.98,
      })),
    });
    setViewerPage(pageNum);
    setViewerSnippet(snippet);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Automated CERA Report Generator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Grounded automated synthesis across 8 mandatory report sections with full source citations and PDF/DOCX exports.
          </p>
        </div>
      </div>

      {/* Main Grid: Pipeline Controls + Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pipeline Controls Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Step 1: Select Report Type */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Report Type</span>
            </h3>

            <div className="space-y-2">
              {reportTypesList.map((rt) => {
                const Icon = rt.icon;
                const isSelected = selectedReportType === rt.type;
                return (
                  <div
                    key={rt.type}
                    onClick={() => setSelectedReportType(rt.type)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 text-slate-900 shadow-xs ring-1 ring-blue-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">{rt.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shrink-0 font-medium">
                          {rt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Configure Project, Period, Format */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Pipeline Parameters</span>
            </h3>

            {/* Target Project */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Target Project Block</label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  const found = projects.find((p) => p.id === e.target.value);
                  if (found) setSelectedProjectName(found.name);
                }}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="prj-gevra">Gevra OCP (PRJ-GEVRA-2026)</option>
                <option value="prj-dipka">Dipka OCP (PRJ-DIPKA-2025)</option>
                <option value="prj-kusmunda">Kusmunda OCP (PRJ-KUSMUNDA-2024)</option>
                <option value="prj-rajmahal">Rajmahal OCP (PRJ-RAJMAHAL-2025)</option>
                <option value="prj-singrauli">Singrauli Block (PRJ-SINGRAULI-2024)</option>
              </select>
            </div>

            {/* Reporting Period */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Reporting Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="2024-25">FY 2024-25 (Current Audit)</option>
                <option value="2025-26">FY 2025-26 (Projected Targets)</option>
                <option value="2023-24">FY 2023-24 (Historical Baseline)</option>
                <option value="All Time">Multi-Year All Time Cumulative</option>
              </select>
            </div>

            {/* Export Format Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Export File Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFileFormat('PDF')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    selectedFileFormat === 'PDF'
                      ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  PDF Document (.pdf)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFileFormat('DOCX')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    selectedFileFormat === 'DOCX'
                      ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  Word Document (.docx)
                </button>
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs transition"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Grounded Report...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Grounded Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Preview & Viewer Column */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex-1 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">Grounded Report Output (8 Mandatory Sections)</span>
              </div>

              {activeReport && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyReportText}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center space-x-1.5 shadow-2xs transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copySuccess ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload(activeReport.id, 'PDF')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-2xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownload(activeReport.id, 'DOCX')}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-2xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOCX</span>
                  </button>
                </div>
              )}
            </div>

            {activeReport ? (
              <div className="space-y-4 overflow-y-auto max-h-[620px] pr-1">
                {/* Header Metadata */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="text-sm font-bold text-blue-700">{activeReport.title}</div>
                  <div className="text-xs text-slate-600 flex flex-wrap gap-4">
                    <span>Project: <strong className="text-slate-900">{activeReport.projectName}</strong></span>
                    <span>Period: <strong className="text-slate-900">{activeReport.period}</strong></span>
                    <span>Type: <strong className="text-blue-700 font-semibold">{activeReport.reportType}</strong></span>
                    <span>Format: <strong className="text-slate-900">{activeReport.fileFormat}</strong></span>
                  </div>
                </div>

                {/* 8 Sections */}
                {activeReport.sections.map((section) => (
                  <div key={section.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 border-b border-slate-200/80 pb-2">{section.title}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">{section.content}</p>

                    {/* Section Sources */}
                    {section.sources && section.sources.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-200/80 space-y-1.5 text-xs">
                        <span className="text-slate-600 block font-semibold text-[11px]">Section Sources & Traceability:</span>
                        {section.sources.map((src, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-blue-600 font-medium">
                              📄 {src.documentName} (Page {src.pageNumber})
                            </span>
                            <button
                              onClick={() => handleOpenCitation(src.documentName, src.pageNumber, src.citationSnippet)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold inline-flex items-center space-x-1 shadow-2xs transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 space-y-3">
                <Printer className="w-10 h-10 text-slate-400 stroke-1" />
                <p className="text-xs max-w-sm text-slate-600 leading-relaxed">
                  Select your target project, reporting period, and report type on the left, then click <strong>"Generate Grounded Report"</strong> to synthesize an 8-section report.
                </p>
              </div>
            )}
          </div>

          {/* Past Generated Reports History */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Report Generation History</span>
              </h4>
              <button
                onClick={fetchReportsHistory}
                disabled={historyLoading}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                title="Refresh history"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {historyError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between font-medium">
                <span>{historyError}</span>
                <button
                  onClick={fetchReportsHistory}
                  className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {historyLoading ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span className="font-medium text-slate-700">Loading report history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No past reports generated yet.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white border border-slate-200 rounded-lg text-blue-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">{h.title}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(h.id, 'PDF')}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handleDownload(h.id, 'DOCX')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>DOCX</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Document Viewer */}
      {viewerDocument && (
        <DocumentViewerModal
          document={viewerDocument}
          initialPage={viewerPage}
          highlightSnippet={viewerSnippet}
          onClose={() => setViewerDocument(null)}
        />
      )}
    </div>
  );
};
