import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pickaxe,
  ArrowRight,
  Play,
  CheckCircle2,
  Star,
  FileText,
  Search,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronUp,
  Database,
  Lock,
  ExternalLink,
  Users,
  Compass,
  FileCheck2,
  Activity,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'What types of mining documents can CERA process?',
      a: 'CERA ingests Geological Reports (GRs), borehole lithology logs, drill core assays, DGMS safety circulars, EIA/EMP reports, mine lease agreements, and seismic surveys in PDF, DOCX, XLSX, and scanned image formats with OCR support.',
    },
    {
      q: 'How does the Multi-Agent RAG architecture work?',
      a: 'Our AI pipeline deploys specialized autonomous agents: Document Ingestion, Geological QA & Extraction, Spatial Correlation, and Regulatory Compliance. Each agent queries tailored vector stores and cross-references data to eliminate hallucinations.',
    },
    {
      q: 'Is CERA compliant with Indian Ministry of Mines and DGMS regulations?',
      a: 'Yes. CERA is specifically fine-tuned on CMPDI standards, DGMS safety frameworks, and MMDR Act guidelines, providing automated cross-checks and audit trails for regulatory filings.',
    },
    {
      q: 'Can CERA integrate with existing GIS and ERP systems?',
      a: 'CERA offers REST APIs and GeoJSON/Shapefile export capabilities that seamlessly interface with ArcGIS, QGIS, Surpac, Datamine, and enterprise SAP/Oracle backends.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* 1. FLOATING TOP NAV BAR */}
      <header className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm px-5 py-3.5 flex items-center justify-between transition-all">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Pickaxe className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                CER<span className="text-blue-600">A</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60">
                Enterprise
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Product
            </a>
            <div className="relative">
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                onBlur={() => setTimeout(() => setSolutionsOpen(false), 200)}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
              >
                Solutions <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <a
                    href="#features"
                    className="block px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
                  >
                    Coal & Mineral Exploration
                  </a>
                  <a
                    href="#features"
                    className="block px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
                  >
                    DGMS & Regulatory Compliance
                  </a>
                  <a
                    href="#features"
                    className="block px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded-lg"
                  >
                    Borehole & Reserve Modeling
                  </a>
                </div>
              )}
            </div>
            <a href="#activity" className="hover:text-slate-900 transition-colors">
              Insights
            </a>
            <a href="#stats" className="hover:text-slate-900 transition-colors">
              Impact
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Action CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <span>Request Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative overflow-hidden">
        {/* Glow effect in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-200/40 via-indigo-100/30 to-amber-100/30 blur-3xl -z-10 pointer-events-none rounded-full" />

        {/* Trust Badges */}
        <div className="inline-flex items-center gap-3 p-1.5 pr-4 bg-white border border-slate-200/90 rounded-full shadow-xs mb-8 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200/50">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="font-bold">4.9/5</span>
          </div>
          <span className="text-slate-400 hidden sm:inline">Rated by Geological Analysts</span>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Govt-Grade Security & DGMS Ready</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Autonomous Intelligence for{' '}
          <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 bg-clip-text text-transparent">
            Mining Exploration & Compliance
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Ingest thousands of geological reports, borehole lithology logs, and DGMS circulars in seconds.
          Empower exploration teams with AI-driven reserve estimation and instant regulatory due diligence.
        </p>

        {/* CTA Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#activity"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-base px-6 py-3.5 rounded-xl shadow-xs transition-all duration-200"
          >
            <Play className="w-4 h-4 text-blue-600 fill-blue-600/20" />
            <span>View Live Feed</span>
          </a>
        </div>

        {/* 3. ORBIT / FEATURE VISUALIZATION GRAPHIC */}
        <div className="mt-16 relative flex items-center justify-center py-8">
          <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] flex items-center justify-center">
            {/* Outer Orbit Ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-slate-300 animate-[spin_60s_linear_infinite]" />
            {/* Middle Orbit Ring */}
            <div className="absolute inset-8 sm:inset-12 rounded-full border border-slate-200/90 shadow-inner" />
            {/* Inner Ring */}
            <div className="absolute inset-20 sm:inset-28 rounded-full border border-dashed border-blue-200 animate-[spin_40s_linear_infinite_reverse]" />

            {/* Central Hub Core */}
            <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-2xl border-4 border-white">
              <Cpu className="w-8 h-8 text-white animate-pulse mb-1" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-white">CERA</span>
              <span className="text-[9px] text-blue-200 font-medium">Core v2.4</span>
            </div>

            {/* Satellite Node 1: Top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 shadow-lg px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 hover:scale-105 transition-transform">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>CMPDI Reports</span>
            </div>

            {/* Satellite Node 2: Right Top */}
            <div className="absolute right-0 top-1/4 translate-x-1/4 bg-white border border-slate-200 shadow-lg px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 hover:scale-105 transition-transform">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Borehole Logs</span>
            </div>

            {/* Satellite Node 3: Right Bottom */}
            <div className="absolute right-2 bottom-1/4 translate-x-1/4 bg-white border border-slate-200 shadow-lg px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>DGMS Safety</span>
            </div>

            {/* Satellite Node 4: Bottom */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white border border-slate-200 shadow-lg px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Reserve Est.</span>
            </div>

            {/* Satellite Node 5: Left Bottom */}
            <div className="absolute left-0 bottom-1/4 -translate-x-1/4 bg-white border border-slate-200 shadow-lg px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Multi-Agent QA</span>
            </div>

            {/* Satellite Node 6: Left Top */}
            <div className="absolute left-2 top-1/4 -translate-x-1/4 bg-white border border-slate-200 shadow-lg px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Spatial Leases</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTIVITY & INTELLIGENCE PREVIEW CARD */}
      <section id="activity" className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-blue-600 rounded-3xl p-6 sm:p-10 shadow-2xl border border-blue-400/30 text-white relative overflow-hidden">
          {/* Ambient light inside card */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />

          {/* Header of Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-400/30 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Live System Telemetry</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Multi-Source Autonomous Mining Intelligence
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Agents Active
              </span>
              <span className="text-xs text-blue-100 bg-blue-700/50 px-3 py-1 rounded-full border border-blue-400/30">
                Latency: 28ms
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
            <div className="bg-blue-700/30 border border-blue-400/20 p-4 rounded-2xl">
              <p className="text-xs text-blue-200 font-medium">Extraction Accuracy</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">99.8%</p>
              <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">↑ Verified by CMPDI</span>
            </div>
            <div className="bg-blue-700/30 border border-blue-400/20 p-4 rounded-2xl">
              <p className="text-xs text-blue-200 font-medium">Lithology Parsing</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">1,420</p>
              <span className="text-[11px] text-blue-300 font-semibold mt-1 inline-block">Boreholes Mapped</span>
            </div>
            <div className="bg-blue-700/30 border border-blue-400/20 p-4 rounded-2xl">
              <p className="text-xs text-blue-200 font-medium">DGMS Compliance Rate</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">100%</p>
              <span className="text-[11px] text-purple-300 font-semibold mt-1 inline-block">Zero Infractions</span>
            </div>
            <div className="bg-blue-700/30 border border-blue-400/20 p-4 rounded-2xl">
              <p className="text-xs text-blue-200 font-medium">Due Diligence Speed</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">12x</p>
              <span className="text-[11px] text-amber-300 font-semibold mt-1 inline-block">Faster Turnaround</span>
            </div>
          </div>

          {/* Live Feed Mock Items */}
          <div className="space-y-3">
            <div className="bg-blue-700/40 border border-blue-400/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-400/40 transition">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-600 border border-blue-400/30 text-blue-100 mt-0.5">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">
                      Raniganj Coalfield Block-IV Geological Synthesis
                    </span>
                    <span className="text-[10px] bg-blue-500/30 text-blue-200 font-semibold px-2 py-0.5 rounded">
                      PDF + Boreholes
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-1">
                    AI Agent extracted 4 Seam correlations (Seam VII to IX), 18 borehole intercepts, and stripping ratio (1:4.2).
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30">
                  Ready for Review
                </span>
                <p className="text-[10px] text-blue-300 mt-1 font-mono">Processed in 1.4s</p>
              </div>
            </div>

            <div className="bg-blue-700/40 border border-blue-400/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-400/40 transition">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-600 border border-blue-400/30 text-amber-300 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">
                      DGMS Safety Circular Circular No. 04/2024 Audit
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded">
                      Compliance Engine
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-1">
                    Automated gap analysis against heavy earth moving machinery (HEMM) proximity sensor mandates.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-blue-200 bg-blue-500/30 px-2.5 py-1 rounded-full border border-blue-400/30">
                  Audit Passed
                </span>
                <p className="text-[10px] text-blue-300 mt-1 font-mono">100% matched</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRUSTED BY / STATS STRIP */}
      <section id="stats" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-8">
            Engineered for Indian Coal, Metal & Mineral Sectors
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-slate-400 font-semibold text-sm sm:text-base">
            <div className="flex items-center gap-2 hover:text-slate-900 transition">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Coal India Ecosystem</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-900 transition">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span>CMPDI Standards</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-900 transition">
              <div className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Geological Survey of India</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-900 transition">
              <div className="w-3 h-3 rounded-full bg-amber-600" />
              <span>Singareni (SCCL)</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-900 transition">
              <div className="w-3 h-3 rounded-full bg-purple-600" />
              <span>Ministry of Mines (MMDR)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURES BENTO GRID */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/50">
            Unrivaled Exploration Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
            Everything your mining geologists & compliance teams need
          </h2>
          <p className="mt-4 text-slate-600 text-base">
            From raw geophysical field notes to boardroom reserve presentations, CERA powers the complete lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: Multi-Agent RAG */}
          <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Multi-Agent RAG Geological Intelligence</h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
              Ask deep domain questions like <em>"What is the average seam thickness of Seam III in Block B?"</em> or{' '}
              <em>"Extract all fault displacements and ash content percentages."</em> Our agent ensemble cross-examines tables,
              lithology logs, and seismic interpretations with zero hallucinations.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                Vector Similarity + Re-ranking
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                Source Document Page Citations
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                Tabular Data Extraction
              </span>
            </div>
          </div>

          {/* Bento Card 2: DGMS Safety & Compliance */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Automated DGMS Compliance</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Instant regulatory audit checks against Directorate General of Mines Safety guidelines, environmental clearance
              conditions, and statutory forest clearance records.
            </p>
          </div>

          {/* Bento Card 3: Geospatial & Lease Boundary */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Geospatial & Boundary Mapping</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Overlay concession boundaries, mining lease coordinates, fault lines, and borehole drill collars with high-precision
              coordinate transformation (WGS84 / UTM).
            </p>
          </div>

          {/* Bento Card 4: Reserve Estimation */}
          <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Automated Reserve Estimation & Stripping Ratios</h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
              CERA aggregates borehole intercepts across drill campaigns to compute measured, indicated, and inferred
              reserves (UNFC / JORC aligned). Calculate overburden volumes and economic stripping ratios automatically.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION SECTION */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Got Questions?
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs transition"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left px-6 py-4.5 flex items-center justify-between font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                <span className="text-base">{faq.q}</span>
                {activeFaq === idx ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 ml-4" />
                )}
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-blue-600 text-white rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to modernize your geological & mining intelligence?
            </h2>
            <p className="mt-4 text-slate-700 text-base">
              Join leading mining corporations, exploration consultancies, and compliance directors operating on CERA.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-blue-600 font-semibold text-base px-8 py-3.5 rounded-xl shadow-lg hover:shadow-slate-200/50 transition-all"
              >
                <span>Get Started with CERA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-blue-700 text-white border border-blue-400 font-semibold text-base px-6 py-3.5 rounded-xl transition"
              >
                <span>Book Technical Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. MINIMALIST FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Pickaxe className="w-4 h-4 text-amber-700" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              CER<span className="text-blue-600">A</span>
            </span>
            <span className="text-xs text-slate-400 ml-2">
              © {new Date().getFullYear()} CERA Technologies Inc.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#features" className="hover:text-slate-900 transition">
              Documentation
            </a>
            <a href="#activity" className="hover:text-slate-900 transition">
              Security & Compliance
            </a>
            <a href="#stats" className="hover:text-slate-900 transition">
              Privacy Policy
            </a>
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Sign In →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
