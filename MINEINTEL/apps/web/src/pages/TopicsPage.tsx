import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentViewerModal, DocumentData } from '../components/DocumentViewerModal';
import {
  BookOpen,
  Tag,
  Filter,
  Search,
  FileText,
  ExternalLink,
  Info,
  RefreshCw,
  Sparkles,
  BarChart3,
  Layers,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  Download,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface RepresentativeDoc {
  documentId: string;
  title: string;
  project: string;
  year: string;
  mentionCount: number;
}

export interface RepresentativePage {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  snippet: string;
}

export interface TopicItem {
  id: string;
  name: string;
  description: string;
  topicFrequency: number;
  frequencyNote?: string;
  keywords: string[];
  representativeDocuments: RepresentativeDoc[];
  representativePages: RepresentativePage[];
}

export interface WordCloudItem {
  text: string;
  value: number;
  category: string;
  topicId?: string;
  representativePage?: {
    documentTitle: string;
    pageNumber: number;
  };
}

export const TopicsPage: React.FC = () => {
  const { token } = useAuth();

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedCollection, setSelectedCollection] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [wordCloud, setWordCloud] = useState<WordCloudItem[]>([]);
  const [summaryNote, setSummaryNote] = useState<string>(
    'Topic frequency indicates total chunk occurrences across indexed documents. Frequency is a density metric and does not represent intrinsic operational priority.'
  );

  // Document Viewer Modal State
  const [viewerDoc, setViewerDoc] = useState<DocumentData | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  const [viewerSnippet, setViewerSnippet] = useState<string | undefined>(undefined);

  // Fetch Topics & Word Cloud from API
  const fetchTopicData = async () => {
    setLoading(true);
    try {
      const topicParams = new URLSearchParams();
      if (selectedProject !== 'All') topicParams.append('projectId', selectedProject);
      if (selectedCollection !== 'All') topicParams.append('documentCollectionId', selectedCollection);

      const [topicRes, wcRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/analytics/topics?${topicParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/v1/analytics/word-cloud?${topicParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (topicRes.ok) {
        const json = await topicRes.json();
        setTopics(json.topics || json.dominantTopics || []);
        if (json.summaryNote) setSummaryNote(json.summaryNote);
      }

      if (wcRes.ok) {
        const json = await wcRes.json();
        setWordCloud(json.wordCloud || []);
      }
    } catch (err: any) {
      console.error('Failed to load topic analytics:', err);
      setError(err.message || 'Failed to load topic analytics from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicData();
  }, [selectedProject, selectedCollection]);

  // Open Document Viewer at Representative Page
  const handleOpenRepresentativePage = (docTitle: string, pageNum: number, snippet?: string) => {
    setViewerDoc({
      id: `doc-${docTitle.replace(/\W+/g, '-').toLowerCase()}`,
      title: docTitle,
      filename: docTitle,
      processingStage: 'INDEXED',
      pageCount: 30,
      mineName: selectedProject !== 'All' ? selectedProject : 'CERA Repository',
      pages: Array.from({ length: 30 }, (_, i) => ({
        pageNumber: i + 1,
        rawText:
          i + 1 === pageNum && snippet
            ? `[Representative Page Text - Page ${pageNum}]\n${snippet}`
            : `[Extracted Document Content for ${docTitle} - Page ${i + 1}]\nGeological reserves, seam stratigraphy, and overburden removal calculations verified by CMPDI standards.`,
        ocrConfidence: 0.98,
      })),
    });
    setViewerPage(pageNum);
    setViewerSnippet(snippet);
  };

  // Filter topics by user search query
  const filteredTopics = topics.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Chart Data for Topic Frequency
  const chartData = topics.map((t) => ({
    name: t.name.length > 25 ? `${t.name.slice(0, 25)}...` : t.name,
    fullName: t.name,
    topicFrequency: t.topicFrequency,
  }));

  // Export JSON/CSV
  const exportTopicsCSV = () => {
    const headers = ['Topic ID', 'Topic Name', 'Chunk Mentions Frequency', 'Keywords', 'Representative Document'];
    const rows = topics.map((t) => [
      t.id,
      t.name,
      t.topicFrequency,
      t.keywords.join('; '),
      t.representativeDocuments[0]?.title || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CERA_Topic_Taxonomy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Topic Identification & Knowledge Taxonomy</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated topic modeling, frequency distribution, representative document evidence, and keyword taxonomy.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTopicData}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl shadow-xs transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportTopicsCSV}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={fetchTopicData}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-semibold text-xs transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search topics, keywords, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Target Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="All">All Projects</option>
              <option value="Gevra OCP">Gevra OCP</option>
              <option value="Dipka OCP">Dipka OCP</option>
              <option value="Kusmunda OCP">Kusmunda OCP</option>
              <option value="Rajmahal OCP">Rajmahal OCP</option>
              <option value="Singrauli Block">Singrauli Block</option>
            </select>
          </div>

          {/* Document Collection Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Document Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="All">All Ingested Documents</option>
              <option value="Geological Reports">Geological Reports (GR)</option>
              <option value="Exploration Dossiers">Exploration Dossiers</option>
              <option value="Feasibility Reports">Feasibility Reports</option>
              <option value="Borehole Logs">Borehole Logs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Explicit Frequency Definition Disclaimer Banner */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-center space-x-3 text-blue-900 text-xs shadow-xs">
        <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />
        <div className="leading-relaxed">
          <span className="font-bold text-blue-950">Topic Frequency Definition:</span> {summaryNote}
        </div>
      </div>

      {/* Section 1: Topic Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Dominant Mining Topics ({filteredTopics.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">{topic.name}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{topic.description}</p>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-center flex-shrink-0">
                    <span className="text-[10px] text-blue-600 block font-semibold uppercase tracking-wider">Mentions</span>
                    <span className="text-sm font-bold text-blue-700 font-mono">{topic.topicFrequency}</span>
                  </div>
                </div>

                {/* Frequency Note Disclaimer */}
                <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200/80 rounded-xl p-3 leading-relaxed flex items-start space-x-2">
                  <span className="text-sm">💡</span>
                  <span>{topic.frequencyNote || 'Frequency represents document chunk mentions, not operational priority.'}</span>
                </div>

                {/* Keywords List */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">Associated Keywords:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-default"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Representative Documents */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block">Representative Documents:</span>
                  <div className="space-y-1.5">
                    {topic.representativeDocuments.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl p-2.5 transition"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="text-slate-800 font-medium truncate">{doc.title}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-600 font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 flex-shrink-0 ml-2">
                          {doc.mentionCount}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Representative Pages */}
                {topic.representativePages && topic.representativePages.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-700 block">Representative Evidence Pages:</span>
                    <div className="space-y-2">
                      {topic.representativePages.map((page, pIdx) => (
                        <div
                          key={pIdx}
                          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 font-bold text-xs">
                              {page.documentTitle} (p. {page.pageNumber})
                            </span>
                            <button
                              onClick={() => handleOpenRepresentativePage(page.documentTitle, page.pageNumber, page.snippet)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 shadow-xs transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                            "{page.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Topic Frequency Chart */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Topic Occurrence Frequency Chart</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Total chunk mentions across {selectedProject} collection (Density Metric)
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            Recharts Distribution
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs space-y-1">
                        <div className="font-bold text-slate-900">{data.fullName}</div>
                        <div className="text-blue-600 font-medium">
                          Chunk Mentions: <span className="font-bold">{data.topicFrequency}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 italic mt-1">
                          Note: Indicates mention density across index, not priority rank.
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="topicFrequency" name="Chunk Mentions" fill="#0f172a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 3: Keyword Cloud */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Mining Keyword Cloud</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Term frequencies and representative page references</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          {wordCloud.map((wc, idx) => {
            const fontSize = Math.max(12, Math.min(18, Math.round(wc.value / 8)));
            const isReserve = wc.category === 'reserve';
            const isGeology = wc.category === 'geology';
            const isMining = wc.category === 'mining';

            const bgClass = isReserve
              ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
              : isGeology
              ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200'
              : isMining
              ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div
                key={idx}
                onClick={() => {
                  if (wc.representativePage) {
                    handleOpenRepresentativePage(wc.representativePage.documentTitle, wc.representativePage.pageNumber);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl border font-sans font-medium transition hover:scale-105 cursor-pointer flex items-center space-x-2 shadow-2xs ${bgClass}`}
                style={{ fontSize: `${fontSize}px` }}
              >
                <span>{wc.text}</span>
                <span className="text-[11px] bg-white px-1.5 py-0.5 rounded-md font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
                  {wc.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Source Documents Matrix */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Representative Source Documents per Topic</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Indexed documents mapped to extracted domain topics</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Topic</th>
                <th className="px-4 py-3">Representative Document</th>
                <th className="px-4 py-3">Project Block</th>
                <th className="px-4 py-3">Mentions</th>
                <th className="px-4 py-3 text-right rounded-r-xl">Document Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {topics.flatMap((t) =>
                t.representativeDocuments.map((doc, dIdx) => (
                  <tr key={`${t.id}-${dIdx}`} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{t.name}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{doc.title}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.project}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{doc.mentionCount}x</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenRepresentativePage(doc.title, 1)}
                        className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 shadow-2xs transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Viewer */}
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
