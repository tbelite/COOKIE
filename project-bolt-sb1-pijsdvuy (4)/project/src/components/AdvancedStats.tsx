import React, { useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from "recharts";
import { ArrowLeft, TrendingUp, Calendar, BarChart3, Download, Filter, FileText, FileSpreadsheet, X, Eye, Award, Target, Camera } from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportTableAndChartToPDF, exportSimplePDF } from '../utils/pdfExport';

// Beautiful color palette
const COLORS = ["#ec4899", "#6366f1", "#fbbf24", "#10b981", "#f59e42", "#334155"];

interface DailyData {
  sold?: number;
  prepared?: number;
  used?: number;
  trash?: number;
  new?: number;
  produziert?: number;
  verkauft_location?: number;
  verkauft_ubereats?: number;
  verkauft_wolt?: number;
  verkauft_lieferando?: number;
  verkauft_website?: number;
  mitarbeiter_verbrauch?: number;
}

interface CookieData {
  id: number;
  name: string;
  sold: number;
  stock: number;
  prepared: number;
  price: number;
  productionPrice: number;
  category: string;
  history: Record<string, DailyData>;
}

interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
}

interface Recipe {
  cookieId: number;
  ingredients: { [ingredientId: number]: number };
  yield: number;
  notes: string;
}

interface AdvancedStatsProps {
  cookies: CookieData[];
  ingredients: Ingredient[];
  recipes: Recipe[];
}

export default function AdvancedStats({ cookies, ingredients, recipes }: AdvancedStatsProps) {
  const navigate = useNavigate();
  
  // Chart refs for PDF export
  const productionChartRef = useRef<HTMLDivElement>(null);
  const salesChartRef = useRef<HTMLDivElement>(null);
  const ingredientsChartRef = useRef<HTMLDivElement>(null);
  const financeChartRef = useRef<HTMLDivElement>(null);
  
  // Enhanced filter state
  const [filter, setFilter] = useState({
    days: 7,
    cookieIdx: "all",
    platform: "all"
  });

  // Drilldown state
  const [drilldown, setDrilldown] = useState<string | null>(null);

  // Verkaufskanäle
  const salesFields = [
    { key: "verkauft_location", label: "Vor Ort" },
    { key: "verkauft_ubereats", label: "Uber Eats" },
    { key: "verkauft_wolt", label: "Wolt" },
    { key: "verkauft_lieferando", label: "Lieferando" },
    { key: "verkauft_website", label: "Website" },
  ];

  // Filter cookies based on selection
  const filteredCookies = filter.cookieIdx === "all" 
    ? cookies 
    : [cookies[parseInt(filter.cookieIdx)]].filter(Boolean);

  // Alle Tage finden, nur die letzten N
  const allDates = Array.from(
    new Set(filteredCookies.flatMap(c => Object.keys(c.history)))
  ).sort();
  const selectedDates = allDates.slice(-filter.days);

  // Daten für Charts vorbereiten
  const chartData = selectedDates.map(date => {
    const row: any = { date: date.split('-').slice(1).join('/'), fullDate: date };
    filteredCookies.forEach((c, i) => {
      const h = c.history[date] || {};
      row[`prod${i}`] = h.produziert || 0;
      
      // Platform filtering
      if (filter.platform === "all") {
        row[`sales${i}`] = salesFields.reduce((sum, f) => sum + (h[f.key as keyof DailyData] as number || 0), 0);
      } else {
        row[`sales${i}`] = h[filter.platform as keyof DailyData] || 0;
      }
      
      salesFields.forEach(f => {
        row[`${f.key}${i}`] = h[f.key as keyof DailyData] || 0;
      });
      row[`verbrauch${i}`] = h.mitarbeiter_verbrauch || 0;
    });
    return row;
  });

  // Summen pro Cookie/Plattform über Zeitraum
  const totals = filteredCookies.map((c, i) => {
    let verkauft = 0, produziert = 0, verbrauch = 0;
    let byPlattform: any = {};
    salesFields.forEach(f => (byPlattform[f.key] = 0));
    
    selectedDates.forEach(date => {
      const h = c.history[date] || {};
      produziert += h.produziert || 0;
      
      if (filter.platform === "all") {
        verkauft += salesFields.reduce((s, f) => s + (h[f.key as keyof DailyData] as number || 0), 0);
      } else {
        verkauft += h[filter.platform as keyof DailyData] as number || 0;
      }
      
      salesFields.forEach(f => { byPlattform[f.key] += h[f.key as keyof DailyData] || 0; });
      verbrauch += h.mitarbeiter_verbrauch || 0;
    });
    return { name: c.name, produziert, verkauft, verbrauch, byPlattform };
  });

  // Zutatenverbrauch pro Zutat im Zeitraum
  const zVerbrauch = ingredients.map((ing, i) => {
    const usage = filteredCookies.reduce((sum, c, ci) => {
      let count = 0;
      selectedDates.forEach(date => {
        count += (c.history[date]?.produziert || 0);
      });
      const recipe = recipes.find(r => r.cookieId === c.id);
      const ingredientAmount = recipe?.ingredients[ing.id] || 0;
      const multiplier = recipe?.yield ? count / recipe.yield : 0;
      return sum + (ingredientAmount * multiplier);
    }, 0);
    return { name: ing.name, verbraucht: usage, unit: ing.unit };
  });

  // Umsätze/Marge pro Cookie
  const finanzen = filteredCookies.map((c, i) => {
    let verkauft = 0;
    selectedDates.forEach(date => {
      const h = c.history[date] || {};
      if (filter.platform === "all") {
        verkauft += salesFields.reduce((s, f) => s + (h[f.key as keyof DailyData] as number || 0), 0);
      } else {
        verkauft += h[filter.platform as keyof DailyData] as number || 0;
      }
    });
    const umsatz = verkauft * c.price;
    const kosten = (totals[i]?.produziert || 0) * c.productionPrice;
    return {
      name: c.name,
      verkauft,
      umsatz,
      kosten,
      marge: umsatz - kosten
    };
  });

  // Today's stats
  const today = new Date().toISOString().split('T')[0];
  const heuteVerkauft = filteredCookies.reduce((sum, c) => {
    const h = c.history[today] || {};
    return sum + salesFields.reduce((s, f) => s + (h[f.key as keyof DailyData] as number || 0), 0);
  }, 0);

  const heuteProduziert = filteredCookies.reduce((sum, c) => {
    return sum + (c.history[today]?.produziert || 0);
  }, 0);

  // Topseller & Margen-Bestenlisten
  const topseller = [...totals].sort((a, b) => b.verkauft - a.verkauft)[0];
  const margenTop = [...finanzen].sort((a, b) => b.marge - a.marge).slice(0, 3);

  // Export functions
  function exportToExcel(rows: any[], filename = "statistik.xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daten");
    XLSX.writeFile(wb, filename);
  }

  // Enhanced PDF export with chart
  const handlePDFExport = async (chartRef: React.RefObject<HTMLDivElement>, data: any[], title: string) => {
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    
    await exportTableAndChartToPDF({
      exportData: data,
      columns,
      title: `${title} - ${filter.days} Tage`,
      chartRef,
      logo: undefined // You can add logo from websiteSettings if available
    });
  };

  // Drilldown data for specific date
  const getDrilldownData = (date: string) => {
    return filteredCookies.map(c => {
      const h = c.history[date] || {};
      return {
        cookie: c.name,
        produziert: h.produziert || 0,
        verkauft_location: h.verkauft_location || 0,
        verkauft_ubereats: h.verkauft_ubereats || 0,
        verkauft_wolt: h.verkauft_wolt || 0,
        verkauft_lieferando: h.verkauft_lieferando || 0,
        verkauft_website: h.verkauft_website || 0,
        mitarbeiter_verbrauch: h.mitarbeiter_verbrauch || 0,
        gesamt_verkauft: salesFields.reduce((sum, f) => sum + (h[f.key as keyof DailyData] as number || 0), 0)
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/stats')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Erweiterte Statistiken</h1>
                  <p className="text-sm sm:text-base text-gray-600">Detaillierte Analysen & Auswertungen</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportToExcel(finanzen, `statistik_${filter.days}tage.xlsx`)}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={() => exportSimplePDF(finanzen, `Statistik ${filter.days} Tage`)}
                className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Enhanced Filter Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-gray-900">Filter & Zeitraum</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <select 
              className="p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              value={filter.days}
              onChange={e => setFilter(f => ({ ...f, days: Number(e.target.value) }))}
            >
              <option value={7}>Letzte 7 Tage</option>
              <option value={30}>Letzte 30 Tage</option>
              <option value={90}>Letzte 90 Tage</option>
            </select>
            <select 
              className="p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              value={filter.cookieIdx}
              onChange={e => setFilter(f => ({ ...f, cookieIdx: e.target.value }))}
            >
              <option value="all">Alle Cookies</option>
              {cookies.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
            </select>
            <select 
              className="p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              value={filter.platform}
              onChange={e => setFilter(f => ({ ...f, platform: e.target.value }))}
            >
              <option value="all">Alle Plattformen</option>
              <option value="verkauft_location">Vor Ort</option>
              <option value="verkauft_ubereats">Uber Eats</option>
              <option value="verkauft_wolt">Wolt</option>
              <option value="verkauft_lieferando">Lieferando</option>
              <option value="verkauft_website">Website</option>
            </select>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Aktuell analysiert: <strong>{selectedDates.length} Tage</strong> mit Daten
            {filter.cookieIdx !== "all" && ` • Cookie: ${cookies[parseInt(filter.cookieIdx)]?.name}`}
            {filter.platform !== "all" && ` • Plattform: ${salesFields.find(f => f.key === filter.platform)?.label}`}
          </p>
        </div>

        {/* KPI Dashboard */}
        <div className="flex gap-4 flex-wrap justify-center mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 text-center w-44 border border-gray-100">
            <div className="text-xs text-gray-400">Verkauft heute</div>
            <div className="text-2xl font-bold text-amber-600">{heuteVerkauft}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 text-center w-44 border border-gray-100">
            <div className="text-xs text-gray-400">Produziert heute</div>
            <div className="text-2xl font-bold text-blue-600">{heuteProduziert}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 text-center w-44 border border-gray-100">
            <div className="text-xs text-gray-400">Topseller</div>
            <div className="text-lg font-bold text-green-600">{topseller?.name || "N/A"}</div>
            <div className="text-xs text-gray-500">{topseller?.verkauft || 0} verkauft</div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 text-center w-44 border border-gray-100">
            <div className="text-xs text-gray-400">Beste Marge</div>
            <div className="text-lg font-bold text-purple-600">
              €{margenTop[0]?.marge?.toFixed(2) || "0.00"}
            </div>
            <div className="text-xs text-gray-500">{margenTop[0]?.name || "N/A"}</div>
          </div>
        </div>

        {/* Insights & Bestenlisten */}
        <div className="mb-6 sm:mb-8 flex flex-wrap gap-4">
          <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 rounded flex-1 min-w-64">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="h-5 w-5 text-green-600" />
              <div className="text-sm font-medium text-green-800">Topseller</div>
            </div>
            <div className="font-bold text-green-900">{topseller?.name || "N/A"} ({topseller?.verkauft || 0} verkauft)</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded flex-1 min-w-64">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div className="text-sm font-medium text-blue-800">Top 3 Margen</div>
            </div>
            {margenTop.slice(0, 3).map((m, i) => (
              <div key={i} className="text-sm text-blue-900">
                {i + 1}. {m.name}: €{m.marge.toFixed(2)}
              </div>
            ))}
          </div>
        </div>

        {/* Produktion pro Tag mit Drilldown */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-amber-600" />
              Produktion pro Tag & Cookie
              <span className="text-sm font-normal text-gray-500 ml-2">(Klicken für Details)</span>
            </h2>
            <button
              onClick={() => handlePDFExport(productionChartRef, chartData, "Produktionsstatistik")}
              className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Chart PDF</span>
            </button>
          </div>
          <div ref={productionChartRef}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: "#fff", 
                    borderRadius: 12, 
                    boxShadow: "0 2px 16px #e5e7eb", 
                    fontWeight: 500 
                  }} 
                />
                <Legend iconType="circle" />
                {filteredCookies.map((c, i) =>
                  <Line 
                    key={c.name} 
                    type="monotone"
                    dataKey={`prod${i}`} 
                    name={c.name} 
                    stroke={COLORS[i % COLORS.length]} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    onClick={(data: any) => setDrilldown(data.payload.fullDate)}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verkauf pro Cookie & Plattform */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Verkäufe nach {filter.platform === "all" ? "Plattform" : salesFields.find(f => f.key === filter.platform)?.label}
            </h2>
            <button
              onClick={() => handlePDFExport(salesChartRef, totals, "Verkaufsstatistik")}
              className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Chart PDF</span>
            </button>
          </div>
          <div ref={salesChartRef}>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={totals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    boxShadow: "0 2px 16px #e5e7eb", 
                    fontWeight: 500 
                  }} 
                />
                <Legend iconType="circle" />
                {filter.platform === "all" ? (
                  salesFields.map((f, fi) =>
                    <Bar 
                      key={f.key} 
                      dataKey={(d: any) => d.byPlattform[f.key]} 
                      stackId="a"
                      name={f.label} 
                      fill={COLORS[fi % COLORS.length]}
                      radius={[6, 6, 0, 0]}
                    />
                  )
                ) : (
                  <Bar 
                    dataKey="verkauft" 
                    name="Verkauft" 
                    fill={COLORS[0]}
                    radius={[6, 6, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grid Layout für kleinere Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-6 sm:mb-8">
          {/* Zutatenverbrauch PieChart */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Zutatenverbrauch</h2>
              <button
                onClick={() => handlePDFExport(ingredientsChartRef, zVerbrauch.filter(z => z.verbraucht > 0), "Zutatenverbrauch")}
                className="flex items-center space-x-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div ref={ingredientsChartRef}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={zVerbrauch.filter(z => z.verbraucht > 0)}
                    dataKey="verbraucht"
                    nameKey="name"
                    outerRadius={80}
                    paddingAngle={4}
                    label={({ name, verbraucht, unit }) =>
                      `${name}: ${Number(verbraucht).toFixed(1)} ${unit}`
                    }
                  >
                    {zVerbrauch.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "#fff", 
                      borderRadius: 12, 
                      boxShadow: "0 2px 16px #e5e7eb", 
                      fontWeight: 500 
                    }}
                    formatter={(value, name) => [`${Number(value).toFixed(2)}`, name]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mitarbeiter-Verbrauch */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Mitarbeiter-Verbrauch</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={totals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    boxShadow: "0 2px 16px #e5e7eb", 
                    fontWeight: 500 
                  }} 
                />
                <Bar 
                  dataKey="verbrauch" 
                  name="Mitarbeiter-Verbrauch" 
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Finanzen: Umsatz und Marge pro Cookie */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Umsatz & Marge</h2>
              <button
                onClick={() => handlePDFExport(financeChartRef, finanzen, "Finanzstatistik")}
                className="flex items-center space-x-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div ref={financeChartRef}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={finanzen}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 12, 
                      boxShadow: "0 2px 16px #e5e7eb", 
                      fontWeight: 500 
                    }}
                    formatter={(value) => [`€${Number(value).toFixed(2)}`, '']} 
                  />
                  <Legend iconType="circle" />
                  <Bar 
                    dataKey="umsatz" 
                    fill="#0ea5e9" 
                    name="Umsatz (€)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar 
                    dataKey="marge" 
                    fill="#22c55e" 
                    name="Marge (€)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Zusammenfassung ({filter.days} Tage)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {totals.reduce((sum, t) => sum + t.produziert, 0)}
              </div>
              <div className="text-sm text-gray-600">Cookies produziert</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {totals.reduce((sum, t) => sum + t.verkauft, 0)}
              </div>
              <div className="text-sm text-gray-600">Cookies verkauft</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-amber-600">
                €{finanzen.reduce((sum, f) => sum + f.umsatz, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Gesamtumsatz</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                €{finanzen.reduce((sum, f) => sum + f.marge, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Gesamtmarge</div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="text-xs sm:text-sm text-gray-500 bg-white rounded-lg p-3 sm:p-4 border border-gray-100">
            <p className="mb-2">
              <strong>Datenbasis:</strong> Letzte {filter.days} Tage ({selectedDates.length} Tage mit Daten)
            </p>
            <p>
              Die Charts sind interaktiv - klicken Sie auf Datenpunkte für Details. 
              Alle Berechnungen basieren auf den erfassten Produktions- und Verkaufsdaten.
              <br />
              <strong>PDF-Export:</strong> Klicken Sie auf die Kamera-Symbole bei den Charts für PDF-Export mit Chart-Bildern.
            </p>
          </div>
        </div>
      </div>

      {/* Drilldown Modal */}
      {drilldown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-amber-600" />
                  Details für {drilldown}
                </h3>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                  onClick={() => setDrilldown(null)}
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Cookie</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Produziert</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Vor Ort</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Uber Eats</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Wolt</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Lieferando</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Website</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Mitarbeiter</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDrilldownData(drilldown).map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{item.cookie}</td>
                        <td className="text-center py-2 px-3">{item.produziert}</td>
                        <td className="text-center py-2 px-3">{item.verkauft_location}</td>
                        <td className="text-center py-2 px-3">{item.verkauft_ubereats}</td>
                        <td className="text-center py-2 px-3">{item.verkauft_wolt}</td>
                        <td className="text-center py-2 px-3">{item.verkauft_lieferando}</td>
                        <td className="text-center py-2 px-3">{item.verkauft_website}</td>
                        <td className="text-center py-2 px-3">{item.mitarbeiter_verbrauch}</td>
                        <td className="text-center py-2 px-3 font-bold text-amber-600">{item.gesamt_verkauft}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => exportToExcel(getDrilldownData(drilldown), `details_${drilldown}.xlsx`)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel Export</span>
                </button>
                <button
                  onClick={() => exportSimplePDF(getDrilldownData(drilldown), `Details ${drilldown}`)}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF Export</span>
                </button>
                <button 
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors" 
                  onClick={() => setDrilldown(null)}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}