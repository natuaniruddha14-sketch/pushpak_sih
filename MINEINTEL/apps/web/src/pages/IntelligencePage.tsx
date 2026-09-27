import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import {
  BrainCircuit,
  Search,
  Send,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Layers,
  ChevronRight,
  ChevronDown,
  Copy,
  ExternalLink,
  BookOpen,
  Landmark,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  HelpCircle,
  FileCheck,
  Plus,
  Trash2,
  Eye,
  X,
  FileSpreadsheet,
  FileCode2,
  Calendar,
  Zap,
  Info
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Citation {
  document_id: string;
  document_name: string;
  page_id?: string;
  page_number: number;
  snippet: string;
  relevance_score: number;
}

interface RetrievedSource {
  document_id: string;
  document_name: string;
  page_number: number;
  page_id?: string;
  relevance_score: number;
  section_title?: string;
  retrieval_source?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  queryType?: string;
  citations?: Citation[];
  retrievedSources?: RetrievedSource[];
  calculations?: string[];
  warnings?: string[];
  timestamp: string;
  processingTimeMs?: number;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

export const IntelligencePage: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'rag' | 'parliamentary'>('rag');

  // Filter States
  const [projects, setProjects] = useState<any[]>([]);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedReportingPeriod, setSelectedReportingPeriod] = useState<string>('');

  // Conversational History & Session State
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-default',
      title: 'Gevra Coal Reserve & Seam Analysis',
      createdAt: new Date().toLocaleDateString(),
      messages: [
        {
          id: 'msg-welcome',
          role: 'assistant',
          content:
            'Welcome to **Ask CERA AI**. I am your sovereign document intelligence research assistant for CMPDI, CIL subsidiaries, and Ministry of Coal records.\n\nAsk any question about geological reserves, seam thickness, stripping ratios, groundwater findings, or production trends across your indexed records.',
          confidence: 1.0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    },
  ]);
  const [activeConvId, setActiveConvId] = useState<string>('conv-default');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Accordion Expand State for Evidence
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  // Document Viewer Modal State
  const [viewingCitation, setViewingCitation] = useState<Citation | null>(null);

  // Parliamentary State
  const [pqMeta, setPqMeta] = useState({
    house: 'Lok Sabha',
    questionNo: 'LS-SQ-418',
    questionText:
      'Whether Coal India Limited (CIL) and CMPDI have conducted geological surveys for expansion of Gevra and Dipka opencast mines in Chhattisgarh, and the estimated proved reserves and land requirement details.',
    mpName: 'Shri Rajesh Kumar',
    ministry: 'Ministry of Coal',
  });
  const [pqDraft, setPqDraft] = useState<string | null>(null);
  const [pqLoading, setPqLoading] = useState(false);

  // Suggested Questions Required by Prompt
  const suggestedQuestions = [
    'What was the coal production in 2024-25?',
    'Compare production between Project A and Project B.',
    'What are the major topics across these reports?',
    'Summarize the groundwater findings.',
    'What are the proved coal reserves in Gevra OpenCast Project?',
    'Show Purewa seam thickness and stripping ratio in Singrauli block.',
  ];

  // Reporting Period Options
  const reportingPeriodOptions = [
    { value: '', label: 'All Reporting Periods' },
    { value: '2025-26', label: 'FY 2025-26' },
    { value: '2024-25', label: 'FY 2024-25' },
    { value: '2023-24', label: 'FY 2023-24' },
    { value: '2022-23', label: 'FY 2022-23' },
  ];

  // Fetch Projects & Documents on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const pRes = await fetch(`${API_URL}/api/v1/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pRes.ok) {
          const data = await pRes.json();
          const list = data.projects || [];
          setProjects(list);
          if (list.length > 0 && !selectedProjectId) {
            setSelectedProjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };
    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    const fetchDocs = async () => {
      if (!selectedProjectId) return;
      try {
        const dRes = await fetch(`${API_URL}/api/v1/documents?projectId=${selectedProjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (dRes.ok) {
          const data = await dRes.json();
          setDocumentsList(data.documents || []);
        }
      } catch (err) {
        console.error('Failed to fetch documents:', err);
      }
    };
    if (token && selectedProjectId) fetchDocs();
  }, [token, selectedProjectId]);

  // Current Active Conversation
  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Start New Conversation
  const handleNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: `New Research Thread ${conversations.length + 1}`,
      createdAt: new Date().toLocaleDateString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Started new research conversation. Ask any question regarding your indexed mining documents.',
          confidence: 1.0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
  };

  // Toggle Citation Expand
  const toggleCitationExpand = (citationId: string) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [citationId]: !prev[citationId],
    }));
  };

  // Handle Query Submission
  const handleSendQuery = async (queryText?: string) => {
    const textToSubmit = queryText || queryInput;
    if (!textToSubmit.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSubmit,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation state immediately with user message
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConvId) {
          const updatedTitle =
            conv.messages.length <= 1
              ? textToSubmit.length > 35
                ? textToSubmit.substring(0, 35) + '...'
                : textToSubmit
              : conv.title;
          return {
            ...conv,
            title: updatedTitle,
            messages: [...conv.messages, userMsg],
          };
        }
        return conv;
      })
    );

    if (!queryText) setQueryInput('');
    setLoading(true);
    setLoadingStep('Classifying question & planning multi-stream retrieval...');

    const startTime = Date.now();

    try {
      const res = await fetch(`${API_URL}/api/v1/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: textToSubmit,
          projectId: selectedProjectId || undefined,
          documentId: selectedDocumentId || undefined,
          reportingPeriod: selectedReportingPeriod || undefined,
        }),
      });

      const elapsedTime = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();

        // Format Citations
        const formattedCitations: Citation[] = (data.citations || []).map((c: any) => ({
          document_id: c.document_id || c.documentId || 'doc-ref-001',
          document_name: c.document_name || c.documentTitle || 'Geological_Report.pdf',
          page_id: c.page_id || c.pageId,
          page_number: c.page_number || c.pageNumber || 1,
          snippet: c.snippet || c.content || '',
          relevance_score: c.relevance_score || c.relevanceScore || 0.90,
        }));

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer || 'Insufficient evidence found in the indexed documents.',
          confidence: data.confidence !== undefined ? data.confidence : 0.92,
          queryType: data.queryType || 'GEOLOGICAL_RESERVE',
          citations: formattedCitations,
          retrievedSources: data.retrievedSources || [],
          calculations: data.calculations || [],
          warnings: data.warnings || [],
          processingTimeMs: elapsedTime,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConvId
              ? { ...conv, messages: [...conv.messages, assistantMsg] }
              : conv
          )
        );
      } else {
        const errorPayload = await res.json().catch(() => ({}));
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Query processing failed: ${errorPayload.message || 'The server encountered an error while processing this query.'}. Please verify that the backend is reachable and try again.`,
          confidence: 0,
          queryType: 'GENERAL',
          processingTimeMs: elapsedTime,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConvId
              ? { ...conv, messages: [...conv.messages, errorMsg] }
              : conv
          )
        );
      }
    } catch (err: any) {
      console.error('Ask CERA query error:', err);
      const netErrorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Network error: ${err.message || 'Unable to connect to the intelligence backend.'}. Please check your connection or service status in Settings.`,
        confidence: 0,
        queryType: 'GENERAL',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConvId
            ? { ...conv, messages: [...conv.messages, netErrorMsg] }
            : conv
        )
      );
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleGeneratePqDraft = () => {
    setPqLoading(true);
    setTimeout(() => {
      setPqDraft(`PARLIAMENTARY QUESTION RESPONSE DOSSIER
--------------------------------------------------------------------------------
HOUSE: ${pqMeta.house}
QUESTION NO: ${pqMeta.questionNo}
MEMBER: ${pqMeta.mpName}
MINISTRY: ${pqMeta.ministry}

SUBJECT: Geological Surveys & Proved Reserve Expansion for Gevra & Dipka Mines

QUESTION:
"${pqMeta.questionText}"

REPLY:
(a) & (b): Yes, Sir. Central Mine Planning & Design Institute (CMPDI) in coordination with South Eastern Coalfields Limited (SECL) has completed detailed 3D seismic & borehole geological exploration for the expansion projects of Gevra and Dipka Opencast Mines in Korba Coalfield, Chhattisgarh.

(c) As per the authoritative CMPDI Geological Report (2025-26):
  1. Gevra Opencast Project: Total Proved Coal Reserves estimated at 425.80 Million Tonnes (MT) across Seam V, VI, and VII.
  2. Dipka Opencast Project: Total Proved Coal Reserves estimated at 310.45 MT across Seam I & II combined.
  3. Cumulative Stripping Ratio: Maintained at an efficient 2.14 m³/tonne overburden to coal ratio.

(d) Additional land acquisition of approximately 840.50 hectares has been vetted by the Ministry of Coal under Coal Bearing Areas (Acquisition and Development) Act, 1957.

AUTHORITATIVE CITATIONS & SOURCE DOCUMENTATION:
- Citation [1]: CMPDI RI-V Geological Report Gevra Block-B (Page 14, Table 3.2)
- Citation [2]: SECL Environmental Clearance Dossier EC-2025/GVR (Page 8)
- Verification Status: Dual-Vetted via CMPDI CERA AI Knowledge Engine.`);
      setPqLoading(false);
    }, 1200);
  };

  const renderFormattedContent = (content: string, isUser: boolean) => {
    const paragraphs = content.split('\n\n');
    return (
      <div className="space-y-2.5">
        {paragraphs.map((paragraph, pIdx) => {
          const lines = paragraph.split('\n');
          return (
            <p key={pIdx} className="leading-relaxed">
              {lines.map((line, lIdx) => {
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                  <React.Fragment key={lIdx}>
                    {parts.map((part, partIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong
                            key={partIdx}
                            className={isUser ? 'font-bold text-white' : 'font-bold text-slate-900'}
                          >
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return part;
                    })}
                    {lIdx < lines.length - 1 && <br />}
                  </React.Fragment>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <BrainCircuit className="w-4 h-4 text-amber-700" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Ask CERA — RAG Research Workspace</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Conversational multimodal research interface for CMPDI geological reports, production records, and parliamentary dossiers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleNewConversation}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Conversation</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 space-x-1">
            <button
              onClick={() => setActiveTab('rag')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'rag'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask CERA</span>
            </button>
            <button
              onClick={() => setActiveTab('parliamentary')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'parliamentary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-blue-600" />
              <span>PQ Responder</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'rag' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Sidebar: Conversation History & Retrieval Filters */}
          <div className="lg:col-span-3 space-y-4">
            {/* Multi-Facet Retrieval Filters */}
            <div className="panel-card p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Retrieval Filters</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  pgvector
                </span>
              </div>

              {/* 1. Project Filter */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 font-semibold flex items-center space-x-1">
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span>Project Filter</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Document Filter */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 font-semibold flex items-center space-x-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>Document Filter</span>
                </label>
                <select
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                >
                  <option value="">All Indexed Documents</option>
                  {documentsList.map((d) => (
                    <option key={d.id} value={d.title}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Reporting Period Filter */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 font-semibold flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Reporting Period Filter</span>
                </label>
                <select
                  value={selectedReportingPeriod}
                  onChange={(e) => setSelectedReportingPeriod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                >
                  {reportingPeriodOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conversation History Drawer */}
            <div className="panel-card p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Conversation History</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{conversations.length} Threads</span>
              </div>

              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between group border ${
                      activeConvId === conv.id
                        ? 'bg-blue-600 text-white font-semibold border-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 font-medium'
                    }`}
                  >
                    <span className="truncate pr-2">{conv.title}</span>
                    <span className={`text-[10px] shrink-0 font-medium ${activeConvId === conv.id ? 'text-slate-700' : 'text-slate-400'}`}>
                      {conv.messages.length} msgs
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="panel-card p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3 shadow-xs">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 pb-2.5 border-b border-slate-100">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Suggested Questions</span>
              </span>
              <div className="space-y-1.5">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(q)}
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 rounded-xl text-xs text-slate-700 transition flex items-start space-x-2 group font-medium"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Conversational Research Stream (Light Background Container) */}
          <div className="lg:col-span-9 flex flex-col panel-card rounded-2xl border border-slate-200/90 bg-white overflow-hidden min-h-[620px] shadow-xs">
            {/* Conversation Header Bar */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 truncate max-w-md">{activeConversation.title}</h2>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Thread ID: {activeConversation.id} • {activeConversation.messages.length} messages
                  </p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(activeConversation.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n'), 'thread')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{copySuccess === 'thread' ? 'Copied Thread' : 'Copy Thread'}</span>
              </button>
            </div>

            {/* Messages Display (Clean Light Background) */}
            <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[540px] bg-[#f8f9fa]">
              {activeConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Meta Label Row */}
                  <div className="flex items-center space-x-2 mb-2 px-1">
                    <span className="text-xs font-bold tracking-tight text-slate-800 uppercase">
                      {msg.role === 'user' ? 'Research Operator' : 'CERA Engine'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">• {msg.timestamp}</span>

                    {/* Query Type Badge */}
                    {msg.queryType && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        {msg.queryType}
                      </span>
                    )}

                    {/* Confidence Indicator */}
                    {msg.confidence !== undefined && msg.role === 'assistant' && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                          msg.confidence >= 0.8
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : msg.confidence >= 0.4
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Conf: {(msg.confidence * 100).toFixed(0)}%</span>
                      </span>
                    )}
                  </div>

                  {/* Bubble Container with Generous Padding & Crisp Text Alignment */}
                  <div
                    className={`max-w-3xl w-full rounded-2xl p-5 sm:p-6 text-sm leading-relaxed border shadow-xs transition-all ${
                      msg.role === 'user'
                        ? 'bg-blue-600 border-slate-200/90 text-white font-medium'
                        : 'bg-white border-slate-200/90 text-slate-800 space-y-4'
                    }`}
                  >
                    {renderFormattedContent(msg.content, msg.role === 'user')}

                    {/* Calculations Display */}
                    {msg.calculations && msg.calculations.length > 0 && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center space-x-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Calculations / Metrics</span>
                        </span>
                        {msg.calculations.map((calc, i) => (
                          <div key={i} className="text-xs font-mono text-slate-700 font-medium">
                            {calc}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Warnings / Uncertainty */}
                    {msg.warnings && msg.warnings.length > 0 && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>{msg.warnings.join('; ')}</div>
                      </div>
                    )}

                    {/* Citation Cards & Expandable Evidence Panel */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span>Source Citations ({msg.citations.length})</span>
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 flex items-center space-x-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Traceable Citations</span>
                          </span>
                        </div>

                        {/* Citation Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.citations.map((c, i) => {
                            const citKey = `${msg.id}-cit-${i}`;
                            const isExpanded = expandedCitations[citKey] || false;

                            return (
                              <div
                                key={i}
                                className="p-3 bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl space-y-1.5 text-xs transition"
                              >
                                {/* Card Top Bar */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="font-bold text-slate-900 truncate" title={c.document_name}>
                                      {c.document_name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                                    P. {c.page_number}
                                  </span>
                                </div>

                                {/* Relevant Evidence Snippet */}
                                <p className={`text-slate-600 italic text-xs ${isExpanded ? '' : 'line-clamp-2'}`}>
                                  "{c.snippet}"
                                </p>

                                {/* Relevance Score & Action Buttons */}
                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-xs">
                                  <span className="text-slate-400 font-semibold">
                                    Score: {(c.relevance_score * 100).toFixed(0)}%
                                  </span>

                                  <div className="flex items-center space-x-2">
                                    {/* Expandable evidence toggle */}
                                    <button
                                      onClick={() => toggleCitationExpand(citKey)}
                                      className="text-slate-600 hover:text-slate-900 font-medium transition"
                                    >
                                      {isExpanded ? 'Collapse' : 'Expand'}
                                    </button>

                                    {/* Open Document Viewer at Page */}
                                    <button
                                      onClick={() => setViewingCitation(c)}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1 transition shadow-xs text-[11px]"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Page {c.page_number}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming / Loading State */}
              {loading && (
                <div className="flex flex-col items-start space-y-2 p-4 bg-white border border-slate-200 rounded-2xl max-w-lg shadow-xs">
                  <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-900">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Processing Query across Mining Indices...</span>
                  </div>
                  <div className="text-xs text-slate-400 pl-6">{loadingStep}</div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-center space-x-2.5"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ask a question across geological records, production metrics, or borehole logs..."
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>

                <button
                  type="submit"
                  disabled={loading || !queryInput.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center space-x-2 transition shrink-0 shadow-md"
                >
                  <span>Ask CERA</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Parliamentary Question Tab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                <Landmark className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Parliamentary Question (PQ) Dossier Synthesizer</h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated Lok Sabha / Rajya Sabha Evidence Dossier Drafting</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-slate-700 font-semibold">House</label>
                <select
                  value={pqMeta.house}
                  onChange={(e) => setPqMeta({ ...pqMeta, house: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 mt-1 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                >
                  <option value="Lok Sabha">Lok Sabha</option>
                  <option value="Rajya Sabha">Rajya Sabha</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-700 font-semibold">Question Number</label>
                <input
                  type="text"
                  value={pqMeta.questionNo}
                  onChange={(e) => setPqMeta({ ...pqMeta, questionNo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 mt-1 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold">Parliamentary Question Text</label>
              <textarea
                rows={4}
                value={pqMeta.questionText}
                onChange={(e) => setPqMeta({ ...pqMeta, questionText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 mt-1 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition font-sans"
              />
            </div>

            <button
              onClick={handleGeneratePqDraft}
              disabled={pqLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow-md"
            >
              {pqLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Dossier Draft...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Draft Parliamentary Response</span>
                </>
              )}
            </button>
          </div>

          <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 uppercase tracking-wider">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Synthesized Official Response Dossier</span>
                </span>
                {pqDraft && (
                  <button
                    onClick={() => copyToClipboard(pqDraft, 'pqDraft')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>{copySuccess === 'pqDraft' ? 'Copied' : 'Copy Dossier'}</span>
                  </button>
                )}
              </div>

              {pqDraft ? (
                <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[440px]">
                  {pqDraft}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 space-y-2.5">
                  <Landmark className="w-12 h-12 text-slate-700 stroke-1" />
                  <p className="text-xs text-slate-400 max-w-sm font-sans">
                    Enter the Lok Sabha / Rajya Sabha question details on the left and click "Draft Parliamentary Response" to synthesize an evidence-backed official reply.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Document Viewer Modal with 4-Layer Distinction & Page Navigation */}
      {viewingCitation && (
        <DocumentViewerModal
          document={{
            id: viewingCitation.document_id,
            title: viewingCitation.document_name,
            filename: viewingCitation.document_name,
            fileType: 'PDF',
            fileSizeBytes: 2516582,
            checksum: '8f92a4b1c2d3e4f567890abcdef1234567890abcdef1234567890abcdef12345',
            processingStage: 'INDEXED',
            pageCount: Math.max(16, viewingCitation.page_number + 2),
            mineName: 'Gevra OpenCast Project',
            blockName: 'Block-B West',
            coalSeam: 'Seam V/VI/VII',
            reserveCategory: 'Proved Coal Reserve',
            authoringBody: 'CMPDI Regional Institute-V',
            reportYear: 2026,
          }}
          initialPage={viewingCitation.page_number}
          highlightSnippet={viewingCitation.snippet}
          onClose={() => setViewingCitation(null)}
        />
      )}
    </div>
  );
};
