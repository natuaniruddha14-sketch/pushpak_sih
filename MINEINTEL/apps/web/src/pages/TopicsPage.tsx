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
    } catch (err) {
      console.error('Failed to load topic analytics:', err);
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
      mineName: selectedProject !== 'All' ? selectedProject : 'MineIntel Repository',
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
    link.setAttribute('download', `MineIntel_Topic_Taxonomy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Topic Identification & Knowledge Taxonomy</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated topic modeling, frequency distribution, representative document evidence, and keyword taxonomy.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTopicData}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Topics</span>
          </button>

          <button
            onClick={exportTopicsCSV}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Taxonomy (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Search topics, keywords, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Target Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
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
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Document Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
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
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 flex items-center space-x-3 text-cyan-300 text-xs">
        <Info className="w-5 h-5 flex-shrink-0 text-cyan-400" />
        <div>
          <span className="font-bold">Topic Frequency Definition:</span> {summaryNote}
        </div>
      </div>

      {/* Section 1: Topic Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Dominant Mining Topics ({filteredTopics.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{topic.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{topic.description}</p>
                  </div>
                  <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center flex-shrink-0">
                    <span className="text-[10px] text-slate-400 block font-mono">Mentions</span>
                    <span className="text-sm font-extrabold text-amber-400 font-mono">{topic.topicFrequency}</span>
                  </div>
                </div>

                {/* Frequency Note Disclaimer */}
                <div className="text-[10px] text-slate-400 bg-slate-950/80 border border-slate-800 rounded-xl p-2 font-mono">
                  💡 {topic.frequencyNote || 'Frequency represents document chunk mentions, not operational priority.'}
                </div>

                {/* Keywords List */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-mono block">Associated Keywords:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-mono"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Representative Documents */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono block">Representative Documents:</span>
                  <div className="space-y-1.5">
                    {topic.representativeDocuments.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-slate-950 border border-slate-800/80 rounded-xl p-2"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="text-slate-200 font-sans font-medium truncate">{doc.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 flex-shrink-0 ml-2">
                          {doc.mentionCount} mentions
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Representative Pages */}
                {topic.representativePages && topic.representativePages.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 font-mono block">Representative Evidence Pages:</span>
                    <div className="space-y-2">
                      {topic.representativePages.map((page, pIdx) => (
                        <div
                          key={pIdx}
                          className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-amber-400 font-bold font-mono text-[11px]">
                              {page.documentTitle} (p. {page.pageNumber})
                            </span>
                            <button
                              onClick={() => handleOpenRepresentativePage(page.documentTitle, page.pageNumber, page.snippet)}
                              className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-sans font-semibold inline-flex items-center space-x-1 transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View Page</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 leading-relaxed">
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Topic Occurrence Frequency Chart</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Total chunk mentions across {selectedProject} collection (Density Metric)
            </p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            Recharts Visualization
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-1">
                        <div className="font-bold text-white">{data.fullName}</div>
                        <div className="text-amber-400 font-mono">
                          Chunk Mentions Frequency: <span className="font-extrabold">{data.topicFrequency}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 italic">
                          Note: Indicates mention density across index, not priority rank.
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="topicFrequency" name="Chunk Mentions" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 3: Keyword Cloud */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Mining Keyword Cloud</span>
            </h3>
            <p className="text-xs text-slate-400">Term frequencies and representative page references</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          {wordCloud.map((wc, idx) => {
            const fontSize = Math.max(11, Math.min(20, Math.round(wc.value / 8)));
            return (
              <div
                key={idx}
                onClick={() => {
                  if (wc.representativePage) {
                    handleOpenRepresentativePage(wc.representativePage.documentTitle, wc.representativePage.pageNumber);
                  }
                }}
                className="px-3 py-1.5 rounded-xl border font-mono transition hover:scale-105 cursor-pointer flex items-center space-x-2"
                style={{
                  fontSize: `${fontSize}px`,
                  backgroundColor:
                    wc.category === 'reserve'
                      ? '#f59e0b15'
                      : wc.category === 'geology'
                      ? '#06b6d415'
                      : wc.category === 'mining'
                      ? '#8b5cf615'
                      : '#10b98115',
                  borderColor:
                    wc.category === 'reserve'
                      ? '#f59e0b40'
                      : wc.category === 'geology'
                      ? '#06b6d440'
                      : wc.category === 'mining'
                      ? '#8b5cf640'
                      : '#10b98140',
                  color:
                    wc.category === 'reserve'
                      ? '#f59e0b'
                      : wc.category === 'geology'
                      ? '#06b6d4'
                      : wc.category === 'mining'
                      ? '#8b5cf6'
                      : '#10b981',
                }}
              >
                <span>{wc.text}</span>
                <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded-md font-sans text-slate-300 border border-slate-800">
                  {wc.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Source Documents Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Representative Source Documents per Topic</span>
            </h3>
            <p className="text-xs text-slate-400">Indexed documents mapped to extracted domain topics</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Topic</th>
                <th className="p-3">Representative Document</th>
                <th className="p-3">Project Block</th>
                <th className="p-3">Mentions</th>
                <th className="p-3 text-right">Document Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {topics.flatMap((t) =>
                t.representativeDocuments.map((doc, dIdx) => (
                  <tr key={`${t.id}-${dIdx}`} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-sans font-bold text-white">{t.name}</td>
                    <td className="p-3 text-amber-400 font-bold">{doc.title}</td>
                    <td className="p-3 text-cyan-400">{doc.project}</td>
                    <td className="p-3 text-slate-300">{doc.mentionCount} mentions</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenRepresentativePage(doc.title, 1)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-sans font-semibold inline-flex items-center space-x-1 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Document</span>
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
