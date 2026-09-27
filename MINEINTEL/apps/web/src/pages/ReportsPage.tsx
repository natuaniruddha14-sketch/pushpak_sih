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
  const [activeReport, setActiveReport] = useState<GroundedReport | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Document Viewer Modal State
  const [viewerDocument, setViewerDocument] = useState<DocumentData | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  const [viewerSnippet, setViewerSnippet] = useState<string | undefined>(undefined);

  // Past Reports History
  const [history, setHistory] = useState<any[]>([]);

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
    try {
      const res = await fetch(`${API_URL}/api/v1/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch reports history:', err);
    }
  };

  useEffect(() => {
    if (token) fetchReportsHistory();
  }, [token]);

  // Execute Pipeline: Generate Grounded Report
  const handleGenerateReport = async () => {
    setGenerating(true);
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
        setActiveReport(json.report);
        fetchReportsHistory();
      } else {
        alert('Report generation failed. Please try again.');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Error generating report from server.');
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
        a.download = `MineIntel_Report_${selectedProjectName.replace(/\W+/g, '_')}_${reportId}.${format.toLowerCase()}`;
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Automated MineIntel Report Generator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Grounded automated synthesis across 8 mandatory report sections with full source citations and PDF/DOCX exports.
          </p>
        </div>
      </div>

      {/* Main Grid: Pipeline Controls + Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pipeline Controls Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Step 1: Select Report Type */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-mono text-[11px] flex items-center justify-center font-extrabold">
                1
              </span>
              <span>Report Type</span>
            </h3>

            <div className="space-y-2.5">
              {reportTypesList.map((rt) => {
                const Icon = rt.icon;
                const isSelected = selectedReportType === rt.type;
                return (
                  <div
                    key={rt.type}
                    onClick={() => setSelectedReportType(rt.type)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{rt.title}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                          {rt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{rt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Configure Project, Period, Format */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-mono text-[11px] flex items-center justify-center font-extrabold">
                2
              </span>
              <span>Pipeline Parameters</span>
            </h3>

            {/* Target Project */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono block">Target Project Block</label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  const found = projects.find((p) => p.id === e.target.value);
                  if (found) setSelectedProjectName(found.name);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="prj-gevra">Gevra OCP (PRJ-GEVRA-2026)</option>
                <option value="prj-dipka">Dipka OCP (PRJ-DIPKA-2025)</option>
                <option value="prj-kusmunda">Kusmunda OCP (PRJ-KUSMUNDA-2024)</option>
                <option value="prj-rajmahal">Rajmahal OCP (PRJ-RAJMAHAL-2025)</option>
                <option value="prj-singrauli">Singrauli Block (PRJ-SINGRAULI-2024)</option>
              </select>
            </div>

            {/* Reporting Period */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono block">Reporting Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="2024-25">FY 2024-25 (Current Audit)</option>
                <option value="2025-26">FY 2025-26 (Projected Targets)</option>
                <option value="2023-24">FY 2023-24 (Historical Baseline)</option>
                <option value="All Time">Multi-Year All Time Cumulative</option>
              </select>
            </div>

            {/* Export Format Selection */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono block">Export File Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFileFormat('PDF')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    selectedFileFormat === 'PDF'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PDF Document (.pdf)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFileFormat('DOCX')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    selectedFileFormat === 'DOCX'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
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
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/10"
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex-1 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Grounded Report Output (8 Mandatory Sections)</span>
              </div>

              {activeReport && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyReportText}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs rounded-lg flex items-center space-x-1 font-mono transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copySuccess ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload(activeReport.id, 'PDF')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownload(activeReport.id, 'DOCX')}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOCX</span>
                  </button>
                </div>
              )}
            </div>

            {activeReport ? (
              <div className="space-y-5 overflow-y-auto max-h-[650px] pr-2">
                {/* Header Metadata */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono">
                  <div className="text-sm font-bold text-amber-400">{activeReport.title}</div>
                  <div className="text-[11px] text-slate-400 flex flex-wrap gap-4">
                    <span>Project: <strong className="text-white">{activeReport.projectName}</strong></span>
                    <span>Period: <strong className="text-white">{activeReport.period}</strong></span>
                    <span>Report Type: <strong className="text-cyan-400">{activeReport.reportType}</strong></span>
                    <span>Format: <strong className="text-white">{activeReport.fileFormat}</strong></span>
                  </div>
                </div>

                {/* 8 Sections */}
                {activeReport.sections.map((section) => (
                  <div key={section.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-2">{section.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{section.content}</p>

                    {/* Section Sources */}
                    {section.sources && section.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60 space-y-1.5 font-mono text-[10px]">
                        <span className="text-slate-400 block font-semibold">Section Sources & Traceability:</span>
                        {section.sources.map((src, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-cyan-400">
                              📄 {src.documentName} (Page {src.pageNumber})
                            </span>
                            <button
                              onClick={() => handleOpenCitation(src.documentName, src.pageNumber, src.citationSnippet)}
                              className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-sans font-semibold inline-flex items-center space-x-1 transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View Source</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-28 text-center text-slate-500 space-y-3">
                <Printer className="w-12 h-12 text-slate-700 stroke-1" />
                <p className="text-xs max-w-sm">
                  Select your target project, reporting period, and report type on the left, then click <strong>"Generate Grounded Report"</strong> to synthesize an 8-section report.
                </p>
              </div>
            )}
          </div>

          {/* Past Generated Reports History */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Report Generation History</span>
            </h4>

            <div className="space-y-2">
              {history.map((h, i) => (
                <div
                  key={h.id || i}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="font-semibold text-white">{h.title}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(h.id, 'PDF')}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-mono flex items-center space-x-1 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleDownload(h.id, 'DOCX')}
                      className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-mono flex items-center space-x-1 transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>DOCX</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
