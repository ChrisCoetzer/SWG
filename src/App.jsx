import React, { useState, useMemo, useEffect } from "react";
import {
  Search, Trash2, Database, Palette, Warehouse, Filter,
  ArrowUpDown, ChevronUp, ChevronDown, Zap, ZapOff,
  TrendingUp, ChevronRight, LayoutGrid, ClipboardList, Plus
} from "lucide-react";


const PLANETS = [
  "Corellia", "Dantooine", "Dathomir", "Endor", "Lok",
  "Mustafar", "Naboo", "Rori", "Talus", "Tatooine", "Yavin IV"
];

const CATEGORIES = [
  { cat: "Inorganic: Mineral", types: ["Metal", "Ore", "Gemstone", "Radioactive"] },
  { cat: "Inorganic: Chemical", types: ["Gas", "Water", "Petrochemical"] },
  { cat: "Inorganic: Energy", types: ["Renewable", "Direct"] },
  { cat: "Organic: Flora", types: ["Flora"] },
  { cat: "Organic: Creature", types: ["Harvest"] }
];

const ATTRIBUTES = [
  { id: "oq", label: "OQ" }, { id: "cd", label: "CD" }, { id: "dr", label: "DR" },
  { id: "hr", label: "HR" }, { id: "ma", label: "MA" }, { id: "pe", label: "PE" },
  { id: "sr", label: "SR" }, { id: "ut", label: "UT" }, { id: "fl", label: "FL" },
  { id: "cr", label: "CR" }, { id: "er", label: "ER" }
];

const THEMES = {
  standard: { name: "CEC Standard", bg: "bg-[#001219]", card: "bg-[#002233]", accent: "text-[#FFD700]", border: "border-[#1A3A4A]", secondary: "text-[#78C3FB]", btn: "bg-[#3A7CA5]", input: "bg-[#001219] text-[#78C3FB]" },
  dark: { name: "Deep Void", bg: "bg-[#0a0a0a]", card: "bg-[#151515]", accent: "text-purple-500", border: "border-zinc-800", secondary: "text-zinc-400", btn: "bg-zinc-700", input: "bg-[#0a0a0a] text-zinc-400" },
  rebel: { name: "Alliance", bg: "bg-[#1a0f0a]", card: "bg-[#2d1b14]", accent: "text-[#e63946]", border: "border-[#4a2c1d]", secondary: "text-[#f1faee]", btn: "bg-[#a8dadc]", input: "bg-[#1a0f0a] text-[#f1faee]" },
  imperial: { name: "Remnant", bg: "bg-[#121212]", card: "bg-[#1e1e1e]", accent: "text-red-600", border: "border-red-900/30", secondary: "text-gray-300", btn: "bg-zinc-800", input: "bg-[#121212] text-gray-300" }
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("tracker");
  const [resources, setResources] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlanet, setFilterPlanet] = useState("All");
  const [filterSpawn, setFilterSpawn] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });
  const [invSearchTerm, setInvSearchTerm] = useState("");
  const [invSortConfig, setInvSortConfig] = useState({ key: "quantity", direction: "desc" });

  const [activeTheme, setActiveTheme] = useState("standard");
  const theme = THEMES[activeTheme];

  const [resFormData, setResFormData] = useState({
  name: "",
  planet: "Corellia",
  category: "Inorganic: Mineral",
  type: "Metal",
  stats: {},
  inSpawn: true
  });


  const [invFormData, setInvFormData] = useState({ resourceName: "", quantity: 0 });

  const [dataPath, setDataPath] = useState("");

  // Load once
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!window.storage) {
        console.error("window.storage not found. Are you running inside Electron?");
        return;
      }
      const [data, p] = await Promise.all([window.storage.load(), window.storage.path()]);
      if (!alive) return;

      setResources(Array.isArray(data.resources) ? data.resources : []);
      setInventory(Array.isArray(data.inventory) ? data.inventory : []);
      setDataPath(p?.path || "");
    })();

    return () => { alive = false; };
  }, []);

  // Persist helper
  const persistAll = async (nextResources, nextInventory) => {
    setResources(nextResources);
    setInventory(nextInventory);
    if (window.storage) {
      await window.storage.save({ resources: nextResources, inventory: nextInventory });
    }
  };

  // CRUD helpers
  const persistResource = async (data) => {
    const id = String(data.id ?? makeId());
    const next = [...resources];
    const idx = next.findIndex(r => String(r.id) === id);

    const merged = {
      id,
      name: data.name ?? "",
      planet: data.planet ?? "",
      category: data.category ?? "",
      type: data.type ?? "",
      inSpawn: Boolean(data.inSpawn ?? true),
      stats: (data.stats && typeof data.stats === "object") ? data.stats : {},
      timestamp: Number(data.timestamp ?? Date.now())
    };

    if (idx >= 0) next[idx] = { ...next[idx], ...merged };
    else next.push(merged);

    await persistAll(next, inventory);
  };

  const persistInventoryItem = async (data) => {
    const id = String(data.id ?? makeId());
    const next = [...inventory];
    const idx = next.findIndex(i => String(i.id) === id);

    const merged = {
      id,
      resourceName: String(data.resourceName ?? ""),
      quantity: Number(data.quantity ?? 0),
      timestamp: Number(data.timestamp ?? Date.now())
    };

    if (idx >= 0) next[idx] = { ...next[idx], ...merged };
    else next.push(merged);

    await persistAll(resources, next);
  };

  const deleteResource = async (id) => {
    const sid = String(id);
    const nextResources = resources.filter(r => String(r.id) !== sid);
    // optional: keep inventory as-is; it’ll just show missing metadata if name mismatches
    await persistAll(nextResources, inventory);
  };

  const deleteInvItem = async (id) => {
    const sid = String(id);
    const next = inventory.filter(i => String(i.id) !== sid);
    await persistAll(resources, next);
  };

  const toggleSpawnStatus = (id) => {
    const res = resources.find(r => String(r.id) === String(id));
    if (res) persistResource({ ...res, inSpawn: !res.inSpawn });
  };

  const getResourceData = (name) => resources.find(r => r.name === name) || {};

  const cycleTheme = () => {
    const keys = Object.keys(THEMES);
    const currentIndex = keys.indexOf(activeTheme);
    const nextIndex = (currentIndex + 1) % keys.length;
    setActiveTheme(keys[nextIndex]);
  };

  const sortedAndFilteredTracker = useMemo(() => {
    return resources
      .filter(r => {
        const name = r.name || "";
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlanet = filterPlanet === "All" || r.planet === filterPlanet;
        const matchesSpawn =
          filterSpawn === "All" ||
          (filterSpawn === "Active" && r.inSpawn) ||
          (filterSpawn === "Despawned" && !r.inSpawn);
        const matchesCategory = filterCategory === "All" || r.category === filterCategory;
        return matchesSearch && matchesPlanet && matchesSpawn && matchesCategory;
      })
      .sort((a, b) => {
        let valA, valB;

        if (sortConfig.key === "inSpawn") {
          valA = a.inSpawn ? 1 : 0;
          valB = b.inSpawn ? 1 : 0;
        } else if (ATTRIBUTES.some(attr => attr.id === sortConfig.key)) {
          valA = a.stats?.[sortConfig.key] || 0;
          valB = b.stats?.[sortConfig.key] || 0;
        } else {
          valA = a[sortConfig.key] ?? "";
          valB = b[sortConfig.key] ?? "";
        }

        if (valA === valB) return 0;
        return sortConfig.direction === "asc"
          ? (valA > valB ? 1 : -1)
          : (valA < valB ? 1 : -1);
      });
  }, [resources, searchTerm, filterPlanet, filterSpawn, filterCategory, sortConfig]);

  const sortedInventory = useMemo(() => {
    return inventory
      .filter(item => (item.resourceName || "").toLowerCase().includes(invSearchTerm.toLowerCase()))
      .sort((a, b) => {
        const rDataA = getResourceData(a.resourceName);
        const rDataB = getResourceData(b.resourceName);

        let valA, valB;
        if (invSortConfig.key === "quantity") {
          valA = a.quantity;
          valB = b.quantity;
        } else if (ATTRIBUTES.some(attr => attr.id === invSortConfig.key)) {
          valA = rDataA.stats?.[invSortConfig.key] || 0;
          valB = rDataB.stats?.[invSortConfig.key] || 0;
        } else {
          valA = a[invSortConfig.key] || rDataA[invSortConfig.key] || "";
          valB = b[invSortConfig.key] || rDataB[invSortConfig.key] || "";
        }

        if (valA === valB) return 0;
        return invSortConfig.direction === "asc"
          ? (valA > valB ? 1 : -1)
          : (valA < valB ? 1 : -1);
      });
  }, [inventory, invSearchTerm, resources, invSortConfig]);

  const toggleSort = (key) =>
    setSortConfig(p => ({ key, direction: p.key === key && p.direction === "desc" ? "asc" : "desc" }));

  const toggleInvSort = (key) =>
    setInvSortConfig(p => ({ key, direction: p.key === key && p.direction === "desc" ? "asc" : "desc" }));

  const SortIcon = ({ currentKey, targetKey, direction }) => {
    if (currentKey !== targetKey) return <ArrowUpDown size={10} className="opacity-20" />;
    return direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className={`min-h-screen font-sans p-4 md:p-8 transition-colors duration-500 ${theme.bg} ${theme.secondary}`}>

      {/* TOP CONTROL BAR */}
      <div className="max-w-[1600px] mx-auto mb-6 flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-sm shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4 px-2">
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Active Skin:</span>
            <span className={`text-[9px] font-black uppercase ${theme.accent}`}>{theme.name}</span>
          </div>
          <button
            onClick={cycleTheme}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all rounded-sm shadow-lg active:scale-95"
          >
            <Palette size={14} /> Cycle System Skin
          </button>
        </div>

        <div className="hidden md:block px-4 opacity-20 text-[8px] font-bold uppercase tracking-[0.3em]">
          LOCAL MODE // {dataPath ? `FILE: ${dataPath}` : "FILE: (loading...)"}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`max-w-[1600px] mx-auto mb-6 flex items-center gap-1 p-1 ${theme.card} border ${theme.border} rounded-sm shadow-xl`}>
        <button
          onClick={() => setActiveTab("tracker")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "tracker" ? `bg-yellow-500 text-black` : "hover:bg-white/5"}`}
        >
          <Database size={14} /> Survey Grid
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "inventory" ? `bg-yellow-500 text-black` : "hover:bg-white/5"}`}
        >
          <Warehouse size={14} /> Stockroom
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6">

        {/* SIDEBAR */}
        <div className={`w-full lg:w-72 flex-shrink-0 flex flex-col gap-6 p-5 ${theme.card} border ${theme.border} rounded-sm h-fit sticky top-8 shadow-2xl`}>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Filter size={14} className={theme.accent} /> Command Panel
            </h2>
            <button
              onClick={() => { setSearchTerm(""); setFilterPlanet("All"); setFilterSpawn("All"); setFilterCategory("All"); }}
              className="text-[8px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity"
            >
              Reset
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40 flex items-center gap-2"><Search size={10} /> Data Query</label>
            <input
              type="text"
              placeholder="Filter by name..."
              className={`w-full ${theme.input} border ${theme.border} p-2 text-xs outline-none focus:border-yellow-500/50 transition-all`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">Spawn Status</label>
            <div className="flex flex-col gap-1">
              {["All", "Active", "Despawned"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSpawn(s)}
                  className={`flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase border transition-all ${filterSpawn === s ? "bg-yellow-500 text-black border-yellow-500" : "border-white/5 hover:bg-white/5"}`}
                >
                  {s} {filterSpawn === s && <ChevronRight size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">Planet Sector</label>
            <select
              className={`w-full ${theme.input} border ${theme.border} p-2 text-xs outline-none cursor-pointer`}
              value={filterPlanet}
              onChange={e => setFilterPlanet(e.target.value)}
            >
              <option value="All">All Systems</option>
              {PLANETS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">Material Category</label>
            <select
              className={`w-full ${theme.input} border ${theme.border} p-2 text-xs outline-none cursor-pointer`}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c.cat} value={c.cat}>{c.cat}</option>)}
            </select>
          </div>
        </div>

        {/* MAIN TERMINAL */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-black italic tracking-tighter ${theme.accent} uppercase`}>
                {activeTab === "tracker" ? "Survey Terminal" : "Inventory Control"}
              </h1>
              <p className="opacity-40 text-[9px] font-bold uppercase tracking-[0.2em] italic">
                Stream Active // {sortedAndFilteredTracker.length} Records
              </p>
            </div>
          </div>

          {activeTab === "tracker" ? (
  <div className="space-y-6">

    {/* ENTRY MANIFEST */}
    <div className={`${theme.card} border ${theme.border} p-5 rounded-sm shadow-2xl`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!resFormData.name.trim()) return;

          persistResource({
            ...resFormData,
            id: makeId(),
            timestamp: Date.now()
          });

          setResFormData({ ...resFormData, name: "", stats: {} });
        }}
        className="space-y-4"
      >

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            placeholder="Resource Name"
            className={`${theme.input} border ${theme.border} p-2 text-xs`}
            value={resFormData.name}
            onChange={e => setResFormData({ ...resFormData, name: e.target.value })}
          />

          <select
            className={`${theme.input} border ${theme.border} p-2 text-xs`}
            value={resFormData.planet}
            onChange={e => setResFormData({ ...resFormData, planet: e.target.value })}
          >
            {PLANETS.map(p => <option key={p}>{p}</option>)}
          </select>

          <select
            className={`${theme.input} border ${theme.border} p-2 text-xs`}
            value={resFormData.category}
            onChange={e => {
              const cat = e.target.value;
              const t = CATEGORIES.find(c => c.cat === cat)?.types[0] || "";
              setResFormData({ ...resFormData, category: cat, type: t });
            }}
          >
            {CATEGORIES.map(c => <option key={c.cat}>{c.cat}</option>)}
          </select>

          <select
            className={`${theme.input} border ${theme.border} p-2 text-xs`}
            value={resFormData.type}
            onChange={e => setResFormData({ ...resFormData, type: e.target.value })}
            >
            {(CATEGORIES.find(c => c.cat === resFormData.category)?.types || []).map(t => (
                <option key={t} value={t}>{t}</option>
            ))}
            </select>

        </div>

        <div className="grid grid-cols-4 md:grid-cols-11 gap-2">
          {ATTRIBUTES.map(a => (
            <input
              key={a.id}
              type="number"
              placeholder={a.label}
              className={`${theme.input} border ${theme.border} p-1 text-[10px] text-center`}
              value={resFormData.stats[a.id] || ""}
              onChange={e =>
                setResFormData({
                  ...resFormData,
                  stats: { ...resFormData.stats, [a.id]: Number(e.target.value) || 0 }
                })
              }
            />
          ))}
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-500 text-black py-3 text-[10px] font-black uppercase"
        >
          Commit to Database
        </button>

      </form>
    </div>

                    {/* TRACKER TABLE (unchanged) */}
                    <div className={`${theme.card} border ${theme.border} rounded-sm overflow-x-auto shadow-2xl`}>
                    <table className="w-full text-left text-[10px] border-collapse">
                        <thead className="bg-black/60 border-b border-white/10 font-black text-[9px] uppercase tracking-tighter sticky top-0 z-20">
                        <tr>
                            <th onClick={() => toggleSort("inSpawn")} className="p-3 cursor-pointer text-center w-12">
                            LIVE <SortIcon currentKey={sortConfig.key} targetKey="inSpawn" direction={sortConfig.direction} />
                            </th>
                            <th onClick={() => toggleSort("name")} className="p-3 cursor-pointer min-w-[150px]">
                            RESOURCE <SortIcon currentKey={sortConfig.key} targetKey="name" direction={sortConfig.direction} />
                            </th>
                            <th onClick={() => toggleSort("planet")} className="p-3 cursor-pointer">
                            PLANET <SortIcon currentKey={sortConfig.key} targetKey="planet" direction={sortConfig.direction} />
                            </th>
                            <th className="p-3 opacity-40">TYPE</th>

                            {ATTRIBUTES.map(attr => (
                            <th
                                key={attr.id}
                                onClick={() => toggleSort(attr.id)}
                                className="p-3 cursor-pointer text-center border-l border-white/5"
                            >
                                {attr.label}
                            </th>
                            ))}

                            <th className="p-3"></th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5">
                        {sortedAndFilteredTracker.length === 0 ? (
                            <tr>
                            <td colSpan={ATTRIBUTES.length + 5} className="p-12 text-center opacity-30 italic font-bold">
                                No resource data detected in sector.
                            </td>
                            </tr>
                        ) : (
                            sortedAndFilteredTracker.map(res => (
                            <tr key={res.id} className={`hover:bg-white/10 ${!res.inSpawn && "opacity-30 grayscale-[0.8]"}`}>
                                <td className="p-3 text-center">
                                <button onClick={() => toggleSpawnStatus(res.id)}>
                                    {res.inSpawn ? <Zap size={14} /> : <ZapOff size={14} />}
                                </button>
                                </td>
                                <td className="p-3 font-black">{res.name}</td>
                                <td className="p-3 opacity-60">{res.planet}</td>
                                <td className="p-3 opacity-30 text-[8px] uppercase">{res.type}</td>

                                {ATTRIBUTES.map(attr => (
                                <td key={attr.id} className="p-3 text-center border-l border-white/5">
                                    {res.stats?.[attr.id] || "-"}
                                </td>
                                ))}

                                <td className="p-3 text-right">
                                <button onClick={() => deleteResource(res.id)}>
                                    <Trash2 size={12} />
                                </button>
                                </td>
                            </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                ) : (

            <div className="space-y-4">
              <div className={`${theme.card} p-3 border ${theme.border} rounded-sm flex items-center gap-4`}>
                <div className="flex items-center gap-2 flex-1">
                  <Search size={14} className="opacity-40" />
                  <input
                    type="text"
                    placeholder="Filter stockroom..."
                    className="w-full bg-transparent text-xs outline-none"
                    value={invSearchTerm}
                    onChange={(e) => setInvSearchTerm(e.target.value)}
                  />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!invFormData.resourceName) return;
                    const newItem = { id: makeId(), ...invFormData, timestamp: Date.now() };
                    persistInventoryItem(newItem);
                    setInvFormData({ resourceName: "", quantity: 0 });
                  }}
                  className="flex gap-2"
                >
                  <input
                    list="logged-resources"
                    className={`bg-transparent border-b ${theme.border} text-[10px] w-32 outline-none p-1`}
                    placeholder="Resource Name"
                    value={invFormData.resourceName}
                    onChange={e => setInvFormData({ ...invFormData, resourceName: e.target.value })}
                  />
                  <datalist id="logged-resources">
                    {resources.map(r => <option key={r.id} value={r.name} />)}
                  </datalist>

                  <input
                    type="number"
                    className={`bg-transparent border-b ${theme.border} text-[10px] w-20 outline-none p-1`}
                    placeholder="Qty (kg)"
                    value={invFormData.quantity || ""}
                    onChange={e => setInvFormData({ ...invFormData, quantity: parseInt(e.target.value) || 0 })}
                  />
                  <button type="submit" className="text-[9px] font-black uppercase bg-yellow-500 text-black px-3 py-1 rounded-sm hover:bg-yellow-400">
                    Log
                  </button>
                </form>
              </div>

              <div className={`${theme.card} border ${theme.border} rounded-sm overflow-x-auto shadow-2xl`}>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead className="bg-black/60 border-b border-white/10 font-black text-[9px] uppercase tracking-tighter sticky top-0 z-20">
                    <tr>
                      <th className="p-3 text-center w-12">LIVE</th>
                      <th onClick={() => toggleInvSort("resourceName")} className="p-3 cursor-pointer">
                        RESOURCE <SortIcon currentKey={invSortConfig.key} targetKey="resourceName" direction={invSortConfig.direction} />
                      </th>
                      <th className="p-3 opacity-40">TYPE</th>
                      {ATTRIBUTES.map(attr => (
                        <th
                          key={attr.id}
                          onClick={() => toggleInvSort(attr.id)}
                          className="p-3 cursor-pointer text-center min-w-[40px] border-l border-white/5"
                        >
                          {attr.label} <SortIcon currentKey={invSortConfig.key} targetKey={attr.id} direction={invSortConfig.direction} />
                        </th>
                      ))}
                      <th onClick={() => toggleInvSort("quantity")} className="p-3 cursor-pointer text-right text-yellow-500">
                        QUANTITY <SortIcon currentKey={invSortConfig.key} targetKey="quantity" direction={invSortConfig.direction} />
                      </th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {sortedInventory.length === 0 ? (
                      <tr>
                        <td colSpan={ATTRIBUTES.length + 5} className="p-12 text-center opacity-30 italic font-bold">
                          Stockroom empty. Log resources to begin inventory tracking.
                        </td>
                      </tr>
                    ) : (
                      sortedInventory.map(item => {
                        const rData = getResourceData(item.resourceName);
                        return (
                          <tr key={item.id} className={`hover:bg-white/10 transition-colors group ${!rData.inSpawn && "opacity-50"}`}>
                            <td className="p-3 text-center">
                              {rData.inSpawn ? <Zap size={14} className="text-green-500/50 mx-auto" /> : <ZapOff size={14} className="text-red-500/20 mx-auto" />}
                            </td>
                            <td className="p-3 font-black text-white">{item.resourceName}</td>
                            <td className="p-3 opacity-30 text-[8px] uppercase">{rData.type || "---"}</td>
                            {ATTRIBUTES.map(attr => {
                              const val = rData.stats?.[attr.id];
                              return (
                                <td key={attr.id} className={`p-3 text-center font-mono border-l border-white/5 ${val >= 900 ? "text-green-400 font-bold" : "text-white/60"}`}>
                                  {val || "-"}
                                </td>
                              );
                            })}
                            <td className="p-3 text-right font-mono text-yellow-500 font-bold">
                              {Number(item.quantity || 0).toLocaleString()} kg
                            </td>
                            <td className="p-3 text-right">
                              <button onClick={() => deleteInvItem(item.id)} className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 rounded-sm transition-all">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto mt-6 flex justify-between items-center opacity-20">
        <p className="text-[8px] font-bold uppercase tracking-[0.4em]">CORELLIA ENGINEERING CORP // LOCAL_DATA_TERMINAL</p>
        <span className="text-[9px] font-black italic flex items-center gap-2">
          {activeTab === "inventory" ? (
            <>TOTAL TONNAGE: {(inventory.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0) / 1000).toLocaleString()}T <LayoutGrid size={10} /></>
          ) : (
            <>SECTOR BROADCAST: ACTIVE <TrendingUp size={10} /></>
          )}
        </span>
      </div>
    </div>
  );
}
