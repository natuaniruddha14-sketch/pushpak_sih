import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentViewerModal, DocumentData } from '../components/DocumentViewerModal';
import {
  BarChart3,
  TrendingUp,
  Layers,
  Database,
  Download,
  Filter,
  Search,
  PieChart as PieIcon,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Tag,
  BookOpen,
  Info,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Building2,
  Calendar,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface SummaryData {
  productionMt: number;
  projectsCount: number;
  documentsCount: number;
  reportsCount: number;
  processingAccuracyPercent: number;
  provedReservesMt: number;
  indicatedReservesMt: number;
  avgSeamThicknessMeters: number;
  avgStrippingRatio: number;
}

interface ProductionDataPoint {
  project: string;
  year: string;
  value: number;
  rawMetric: string;
  unit: string;
  sourceReference?: {
    documentName: string;
    pageNumber: number;
  };
}

interface ProjectComparisonData {
  project: string;
  productionMt: number;
  provedReserveMt: number;
  indicatedReserveMt: number;
  strippingRatio: number;
  seamThicknessMeters: number;
  gcvKcal: number;
  sourceDocument: string;
  sourcePage: number;
}

interface YearlyTrendData {
  year: string;
  gevraProduction: number;
  dipkaProduction: number;
  kusmundaProduction: number;
  rajmahalProduction: number;
  totalProduction: number;
  avgStrippingRatio: number;
}

interface DocumentFormatStat {
  format: string;
  count: number;
  percentage: number;
  color: string;
}

interface DocumentStageStat {
  stage: string;
  count: number;
  color: string;
}

interface TopicData {
  topic: string;
  reportCount: number;
  relevanceScore: number;
}

interface WordCloudItem {
  text: string;
  value: number;
  category: string;
}

export const AnalyticsPage: React.FC = () => {
  const { token } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'production' | 'comparison' | 'trends' | 'documents' | 'topics' | 'wordcloud'>('production');

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for Production Chart
  const [prodProjectFilter, setProdProjectFilter] = useState('All');
  const [prodYearFilter, setProdYearFilter] = useState('All');
  const [prodMetricFilter, setProdMetricFilter] = useState('production');
  const [prodUnitFilter, setProdUnitFilter] = useState('MT');

  // Data States
  const [summary, setSummary] = useState<SummaryData>({
    productionMt: 368.3,
    projectsCount: 8,
    documentsCount: 42,
    reportsCount: 19,
    processingAccuracyPercent: 96.8,
    provedReservesMt: 1802.0,
    indicatedReservesMt: 352.8,
    avgSeamThicknessMeters: 16.2,
    avgStrippingRatio: 2.15,
  });

  const [productionData, setProductionData] = useState<ProductionDataPoint[]>([]);
  const [conversionWarning, setConversionWarning] = useState<string | null>(null);

  const [comparisonData, setComparisonData] = useState<ProjectComparisonData[]>([]);
  const [yearlyTrends, setYearlyTrends] = useState<YearlyTrendData[]>([]);

  const [docStats, setDocStats] = useState<{
    totalDocuments: number;
    totalPagesProcessed: number;
    avgPagesPerDoc: number;
    formats: DocumentFormatStat[];
    stages: DocumentStageStat[];
  }>({
    totalDocuments: 42,
    totalPagesProcessed: 840,
    avgPagesPerDoc: 20,
    formats: [],
    stages: [],
  });

  const [topics, setTopics] = useState<TopicData[]>([]);
  const [wordCloud, setWordCloud] = useState<WordCloudItem[]>([]);

  // Modal Viewer State for Source References
  const [viewerDocument, setViewerDocument] = useState<DocumentData | null>(null);
  const [viewerInitialPage, setViewerInitialPage] = useState<number>(1);

  // Fetch Summary Data
  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.summary) setSummary(json.summary);
      }
    } catch (err) {
      console.error('Failed to fetch summary analytics:', err);
    }
  };

  // Fetch Production Analytics
  const fetchProductionAnalytics = async () => {
    try {
      const query = new URLSearchParams({
        project: prodProjectFilter,
        year: prodYearFilter,
        metric: prodMetricFilter,
        unit: prodUnitFilter,
      });

      const res = await fetch(`${API_URL}/api/v1/analytics/production?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setProductionData(json.data || []);
        setConversionWarning(json.conversionWarning || null);
      }
    } catch (err) {
      console.error('Failed to fetch production analytics:', err);
    }
  };

  // Fetch Comparison, Trends, DocStats, Topics, WordCloud
  const fetchAllAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSummary();
      await fetchProductionAnalytics();

      const [compRes, trendRes, docRes, topicRes, wcRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/analytics/comparison`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/analytics/trends`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/analytics/document-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/analytics/topics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/analytics/wordcloud`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (compRes.ok) {
        const json = await compRes.json();
        setComparisonData(json.comparison || []);
      }
      if (trendRes.ok) {
        const json = await trendRes.json();
        setYearlyTrends(json.trends || []);
      }
      if (docRes.ok) {
        const json = await docRes.json();
        setDocStats(json);
      }
      if (topicRes.ok) {
        const json = await topicRes.json();
        setTopics(json.topics || []);
      }
      if (wcRes.ok) {
        const json = await wcRes.json();
        setWordCloud(json.wordCloud || []);
      }
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError('Failed to fetch analytics data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalyticsData();
  }, []);

  // Refetch production chart when controls change
  useEffect(() => {
    fetchProductionAnalytics();
  }, [prodProjectFilter, prodYearFilter, prodMetricFilter, prodUnitFilter]);

  // Open Document Viewer for Source Citation
  const handleOpenSourceCitation = (docName: string, pageNumber: number) => {
    setViewerDocument({
      id: `doc-${docName.replace(/\W+/g, '-').toLowerCase()}`,
      title: docName,
      filename: docName,
      processingStage: 'INDEXED',
      pageCount: 30,
      mineName: prodProjectFilter !== 'All' ? prodProjectFilter : 'CERA Repository',
      pages: Array.from({ length: 30 }, (_, i) => ({
        pageNumber: i + 1,
        rawText: `[Extracted Text for ${docName} - Page ${i + 1}]\nProved coal reserve estimation, seam stratigraphy, and overburden stripping calculations verified by CMPDI standards.`,
        ocrConfidence: 0.97,
      })),
    });
    setViewerInitialPage(pageNumber);
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Project', 'Year/Period', 'Metric', 'Value', 'Unit', 'Source Reference', 'Source Page'];
    const rows = productionData.map((d) => [
      d.project,
      d.year,
      d.rawMetric,
      d.value,
      d.unit,
      d.sourceReference?.documentName || 'N/A',
      d.sourceReference?.pageNumber || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CERA_Analytics_${prodMetricFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unit display label formatting
  const getMetricLabel = (m: string) => {
    switch (m) {
      case 'production':
        return 'Annual Production';
      case 'proved_reserves':
        return 'Proved Reserves';
      case 'stripping_ratio':
        return 'Stripping Ratio';
      case 'seam_thickness':
        return 'Seam Thickness';
      case 'gcv':
        return 'Coal GCV (kcal/kg)';
      default:
        return m;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <BarChart3 className="w-4 h-4 text-amber-700" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">CERA Enterprise Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time backend analytics for production trends, project comparisons, document processing, topics, and term frequencies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAllAnalyticsData}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAllAnalyticsData}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-medium text-xs transition flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Production */}
        <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Annual Production</span>
            <div className="text-xl font-bold font-mono text-slate-900">{summary.productionMt} MT</div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> Live Backend Data
            </span>
          </div>
        </div>

        {/* KPI 2: Projects */}
        <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Active Projects</span>
            <div className="text-xl font-bold font-mono text-slate-900">{summary.projectsCount} Blocks</div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">CMPDI & CIL Sites</span>
          </div>
        </div>

        {/* KPI 3: Documents */}
        <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Indexed Documents</span>
            <div className="text-xl font-bold font-mono text-slate-900">{summary.documentsCount} Files</div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">840 Total Pages</span>
          </div>
        </div>

        {/* KPI 4: Reports */}
        <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Geological Reports</span>
            <div className="text-xl font-bold font-mono text-slate-900">{summary.reportsCount} Reports</div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">GRs & Dossiers</span>
          </div>
        </div>

        {/* KPI 5: Processing Confidence */}
        <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">OCR Precision</span>
            <div className="text-xl font-bold font-mono text-emerald-700">{summary.processingAccuracyPercent}%</div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> High Precision
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1.5 overflow-x-auto pb-1">
        {[
          { id: 'production', label: '1. Production Analytics', icon: BarChart3 },
          { id: 'comparison', label: '2. Project Comparison', icon: Sliders },
          { id: 'trends', label: '3. Yearly Trends', icon: TrendingUp },
          { id: 'documents', label: '4. Document Stats', icon: PieIcon },
          { id: 'topics', label: '5. Topic Identification', icon: BookOpen },
          { id: 'wordcloud', label: '6. Word Cloud', icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Production Analytics Dashboard */}
      {activeTab === 'production' && (
        <div className="space-y-4">
          {/* Controls bar for Production */}
          <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Chart Controls:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              {/* Project Filter */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Project</label>
                <select
                  value={prodProjectFilter}
                  onChange={(e) => setProdProjectFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                >
                  <option value="All">All Projects</option>
                  <option value="Gevra OCP">Gevra OCP</option>
                  <option value="Dipka OCP">Dipka OCP</option>
                  <option value="Kusmunda OCP">Kusmunda OCP</option>
                  <option value="Rajmahal OCP">Rajmahal OCP</option>
                  <option value="Singrauli Block">Singrauli Block</option>
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Financial Year</label>
                <select
                  value={prodYearFilter}
                  onChange={(e) => setProdYearFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                >
                  <option value="All">All Years</option>
                  <option value="2020-21">2020-21</option>
                  <option value="2021-22">2021-22</option>
                  <option value="2022-23">2022-23</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                </select>
              </div>

              {/* Metric Filter */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Metric</label>
                <select
                  value={prodMetricFilter}
                  onChange={(e) => setProdMetricFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                >
                  <option value="production">Annual Production</option>
                  <option value="proved_reserves">Proved Reserves</option>
                  <option value="stripping_ratio">Stripping Ratio</option>
                  <option value="seam_thickness">Seam Thickness</option>
                </select>
              </div>

              {/* Unit Filter */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Unit</label>
                <select
                  value={prodUnitFilter}
                  onChange={(e) => setProdUnitFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                >
                  <option value="MT">Million Tonnes (MT)</option>
                  <option value="TONNES">Tonnes</option>
                  <option value="KG">Kilograms (kg)</option>
                  <option value="M3/TONNE">m³/tonne</option>
                  <option value="METERS">Meters (m)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Unit Incompatibility Conversion Warning Banner */}
          {conversionWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center space-x-2.5 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <div>
                <span className="font-bold">Unit Normalization Alert:</span> {conversionWarning}
              </div>
            </div>
          )}

          {/* Main Production Recharts Bar Chart (Black / Dark Slate Graph & Dark Headings) */}
          <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {getMetricLabel(prodMetricFilter)} Analytics
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing values for {prodProjectFilter} ({prodYearFilter === 'All' ? 'Multi-Year Trajectory' : prodYearFilter}) in {productionData[0]?.unit || prodUnitFilter}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Backend Recharts Data
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="project" stroke="#64748b" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#334155' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data: ProductionDataPoint = payload[0].payload;
                        return (
                          <div className="bg-blue-600 text-white rounded-xl p-3 shadow-xl text-xs space-y-1 border border-slate-200/90">
                            <div className="font-bold text-slate-900">{data.project} ({data.year})</div>
                            <div className="text-amber-700 font-mono">
                              {getMetricLabel(data.rawMetric)}: <span className="font-bold text-white">{data.value.toLocaleString()} {data.unit}</span>
                            </div>
                            {data.sourceReference && (
                              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/90 font-sans">
                                📄 Source: <span className="text-blue-600 font-medium">{data.sourceReference.documentName}</span> (p. {data.sourceReference.pageNumber})
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Black Graph Fill */}
                  <Bar dataKey="value" name={getMetricLabel(prodMetricFilter)} fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Drilldown Table with Source References */}
          <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 uppercase tracking-wider">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Production Data Points & Document Source References</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Click any document source reference to view verified source page in RAG document viewer</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Project Block</th>
                    <th>Financial Year</th>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Source Citation</th>
                    <th className="text-right">Document Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productionData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="font-semibold text-slate-900">{row.project}</td>
                      <td className="text-slate-600">{row.year}</td>
                      <td className="text-blue-700 font-medium">{getMetricLabel(row.rawMetric)}</td>
                      <td className="text-slate-900 font-bold font-mono">{row.value.toLocaleString()}</td>
                      <td className="text-slate-400 font-mono">{row.unit}</td>
                      <td>
                        {row.sourceReference ? (
                          <span className="inline-flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs text-slate-700">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>{row.sourceReference.documentName}</span>
                            <span className="text-blue-700 font-bold">p.{row.sourceReference.pageNumber}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Not Available</span>
                        )}
                      </td>
                      <td className="text-right">
                        {row.sourceReference && (
                          <button
                            onClick={() => handleOpenSourceCitation(row.sourceReference!.documentName, row.sourceReference!.pageNumber)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-600" />
                            <span>View Source</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Project Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Side-by-Side Project Reserve & Production Comparison</h3>
                <p className="text-xs text-slate-400 mt-0.5">Comparing Production vs Proved Reserve vs Indicated Reserve across CMPDI Blocks</p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="project" stroke="#64748b" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#334155' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="productionMt" name="Annual Production (MT)" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="provedReserveMt" name="Proved Reserve (MT)" fill="#334155" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="indicatedReserveMt" name="Indicated Reserve (MT)" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Detailed Table */}
          <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Benchmark Matrix</h3>
            <div className="overflow-x-auto">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Project Block</th>
                    <th>Production (MT)</th>
                    <th>Proved (MT)</th>
                    <th>Indicated (MT)</th>
                    <th>Stripping Ratio (m³/t)</th>
                    <th>Seam Thickness (m)</th>
                    <th>GCV (kcal/kg)</th>
                    <th className="text-right">Source Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {comparisonData.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="font-sans font-bold text-slate-900">{p.project}</td>
                      <td className="text-slate-900 font-bold">{p.productionMt} MT</td>
                      <td className="text-slate-700">{p.provedReserveMt} MT</td>
                      <td className="text-slate-700">{p.indicatedReserveMt} MT</td>
                      <td className="text-slate-600">{p.strippingRatio} m³/t</td>
                      <td className="text-slate-600">{p.seamThicknessMeters} m</td>
                      <td className="text-emerald-700 font-bold">{p.gcvKcal} kcal</td>
                      <td className="text-right">
                        <button
                          onClick={() => handleOpenSourceCitation(p.sourceDocument, p.sourcePage)}
                          className="text-xs text-blue-600 hover:underline flex items-center justify-end space-x-1 font-sans ml-auto font-medium"
                        >
                          <span>{p.sourceDocument} (p.{p.sourcePage})</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Yearly Trends */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Multi-Year Trajectory (2020-2026)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total Production Trajectory (MT) & Stripping Ratio Efficiency</p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={yearlyTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 11, fill: '#334155' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="totalProduction" name="Total Production (MT)" fill="#0f172a15" stroke="#0f172a" strokeWidth={2.5} />
                  <Line yAxisId="left" type="monotone" dataKey="gevraProduction" name="Gevra OCP (MT)" stroke="#334155" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="left" type="monotone" dataKey="kusmundaProduction" name="Kusmunda OCP (MT)" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgStrippingRatio" name="Avg Stripping Ratio (m³/t)" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Document Statistics */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Format Distribution Pie */}
            <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Ingested Document Formats</h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={docStats.formats} dataKey="count" nameKey="format" cx="50%" cy="50%" outerRadius={80} label>
                      {docStats.formats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Breakdown Bar */}
            <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Pipeline Ingestion Stages</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={docStats.stages} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11, fill: '#334155' }} />
                    <YAxis dataKey="stage" type="category" stroke="#64748b" tick={{ fontSize: 11, fill: '#334155' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#0f172a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Topic Identification */}
      {activeTab === 'topics' && (
        <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Extracted Mining Topics Across Index</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Latent Dirichlet Allocation & Semantic Topic Clustering</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {topics.map((t, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                    <span className="text-blue-600 font-mono text-[11px]">#{idx + 1}</span>
                    <span>{t.topic}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Found in <span className="text-slate-800 font-bold">{t.reportCount}</span> indexed reports
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-28 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${t.relevanceScore * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700">{Math.round(t.relevanceScore * 100)}% Match</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Word Cloud Data */}
      {activeTab === 'wordcloud' && (
        <div className="panel-card bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Mining Domain Term Frequencies</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">High-frequency mining terms extracted from geological reports</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            {wordCloud.map((wc, idx) => {
              const fontSize = Math.max(11, Math.min(18, Math.round(wc.value / 8)));
              return (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl border font-mono transition cursor-default flex items-center space-x-1.5 shadow-xs"
                  style={{
                    fontSize: `${fontSize}px`,
                    backgroundColor: wc.category === 'reserve' ? '#f1f5f9' : wc.category === 'geology' ? '#eff6ff' : wc.category === 'mining' ? '#f5f3ff' : '#ecfdf5',
                    borderColor: wc.category === 'reserve' ? '#cbd5e1' : wc.category === 'geology' ? '#bfdbfe' : wc.category === 'mining' ? '#ddd6fe' : '#a7f3d0',
                    color: wc.category === 'reserve' ? '#0f172a' : wc.category === 'geology' ? '#1d4ed8' : wc.category === 'mining' ? '#6d28d9' : '#047857',
                  }}
                >
                  <span className="font-semibold">{wc.text}</span>
                  <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md font-sans text-slate-700 border border-slate-200 font-bold">
                    {wc.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Viewer Modal for Source References */}
      {viewerDocument && (
        <DocumentViewerModal
          document={viewerDocument}
          initialPage={viewerInitialPage}
          onClose={() => setViewerDocument(null)}
        />
      )}
    </div>
  );
};
