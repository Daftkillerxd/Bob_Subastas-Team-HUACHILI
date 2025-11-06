import { useEffect, useMemo, useState } from "react";
import "./App.css";

// URL base de tu backend
// 👉 En desarrollo usa localhost, en producción tu backend en Render
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://bob-subastas-team-huachili-backend.onrender.com");

// Conversaciones de ejemplo (luego las podrás traer del backend también)
const conversationsData = [
  {
    id: "c1",
    leadId: 1,
    leadName: "Juan Díaz",
    phone: "+51 999 999 999",
    interest: "Alto",
    lastMessageTime: "hace 2 m",
    lastMessagePreview: "Hola, quisiera saber más sobre el auto Modelo X.",
    status: "Abierta",
    unread: 2,
    channel: "WhatsApp",
    messages: [
      {
        id: "m1",
        from: "cliente",
        time: "10:30",
        text: "Hola, quisiera saber más sobre el auto Modelo X.",
      },
      {
        id: "m2",
        from: "bot",
        time: "10:31",
        text: "¡Hola Juan! Claro, ¿qué te gustaría saber del Modelo X?",
      },
      {
        id: "m3",
        from: "cliente",
        time: "10:32",
        text: "Quisiera saber el precio y si tienen en stock.",
      },
    ],
  },
  {
    id: "c2",
    leadId: 2,
    leadName: "María Gómez",
    phone: "+51 988 888 888",
    interest: "Medio",
    lastMessageTime: "hace 18 m",
    lastMessagePreview: "¿Tienen otros modelos en stock?",
    status: "Abierta",
    unread: 0,
    channel: "WhatsApp",
    messages: [
      {
        id: "m4",
        from: "cliente",
        time: "09:10",
        text: "¿Tienen otros modelos en stock?",
      },
      {
        id: "m5",
        from: "bot",
        time: "09:11",
        text: "Sí María, contamos con varios modelos disponibles. ¿Qué rango de precio buscas?",
      },
    ],
  },
  {
    id: "c3",
    leadId: 6,
    leadName: "Ana Martínez",
    phone: "+51 944 444 444",
    interest: "Bajo",
    lastMessageTime: "hace 23 mar",
    lastMessagePreview: "Solo estoy comparando precios por ahora.",
    status: "Cerrada",
    unread: 0,
    channel: "WhatsApp",
    messages: [
      {
        id: "m6",
        from: "cliente",
        time: "ayer",
        text: "Solo estoy comparando precios por ahora.",
      },
      {
        id: "m7",
        from: "bot",
        time: "ayer",
        text: "Perfecto Ana, si más adelante quieres avanzar, aquí estaré para ayudarte.",
      },
    ],
  },
];

function getInterestClass(interest) {
  if (interest === "Alto") return "badge badge-high";
  if (interest === "Medio") return "badge badge-medium";
  return "badge badge-low";
}

const INTEREST_ORDER = { Alto: 0, Medio: 1, Bajo: 2 };

export default function App() {
  const [activeSection, setActiveSection] = useState("leads"); // leads | conversaciones | dashboard

  // --- LEADS traídos del backend ---
  const [leadsData, setLeadsData] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [errorLeads, setErrorLeads] = useState(null);

  const [search, setSearch] = useState("");
  const [interestFilter, setInterestFilter] = useState("Todos");

  // Dashboard filtros
  const [dashboardInterestFilter, setDashboardInterestFilter] =
    useState("Todos");
  const [dashboardRange, setDashboardRange] = useState("30"); // 7 | 30 | 90 | "Todos"

  // Conversaciones
  const [selectedConversation, setSelectedConversation] = useState(
    conversationsData[0]
  );
  const [conversationFilter, setConversationFilter] = useState("Abiertas");
  const [searchConversation, setSearchConversation] = useState("");

  // --- Cargar leads desde el backend al montar la app ---
  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoadingLeads(true);
        setErrorLeads(null);

        const res = await fetch(`${API_BASE_URL}/frontend/leads?limit=200`);
        if (!res.ok) {
          throw new Error(
            `Error al cargar leads: ${res.status} ${res.statusText}`
          );
        }

        const data = await res.json();
        setLeadsData(data || []);
        setSelectedLead((prev) => prev || (data && data[0]) || null);
      } catch (err) {
        console.error("Error fetching leads:", err);
        setErrorLeads(err.message);
      } finally {
        setLoadingLeads(false);
      }
    }

    fetchLeads();
  }, []);

  // resumen global de leads
  const summary = useMemo(() => {
    return leadsData.reduce(
      (acc, lead) => {
        acc.total++;
        acc[lead.interest.toLowerCase()]++;
        return acc;
      },
      { total: 0, alto: 0, medio: 0, bajo: 0 }
    );
  }, [leadsData]);

  // leads para sección Leads
  const filteredLeads = useMemo(() => {
    return leadsData
      .filter((lead) => {
        const matchesSearch =
          lead.name.toLowerCase().includes(search.toLowerCase()) ||
          lead.phone.toLowerCase().includes(search.toLowerCase());
        const matchesInterest =
          interestFilter === "Todos" || lead.interest === interestFilter;
        return matchesSearch && matchesInterest;
      })
      .sort(
        (a, b) => INTEREST_ORDER[a.interest] - INTEREST_ORDER[b.interest]
      );
  }, [leadsData, search, interestFilter]);

  // leads filtrados para Dashboard
  const dashboardLeads = useMemo(() => {
    return leadsData.filter((lead) => {
      const byInterest =
        dashboardInterestFilter === "Todos" ||
        lead.interest === dashboardInterestFilter;
      const byRange =
        dashboardRange === "Todos" ||
        lead.daysAgo <= Number(dashboardRange);
      return byInterest && byRange;
    });
  }, [leadsData, dashboardInterestFilter, dashboardRange]);

  const dashboardSummary = useMemo(() => {
    return dashboardLeads.reduce(
      (acc, lead) => {
        acc.total++;
        acc[lead.interest.toLowerCase()]++;
        return acc;
      },
      { total: 0, alto: 0, medio: 0, bajo: 0 }
    );
  }, [dashboardLeads]);

  const maxCount =
    Math.max(
      dashboardSummary.alto,
      dashboardSummary.medio,
      dashboardSummary.bajo
    ) || 1;

  const highRatio =
    dashboardSummary.total === 0
      ? 0
      : Math.round(
          (dashboardSummary.alto / dashboardSummary.total) * 100
        );

  // buckets de tiempo para timeline
  const timelineBuckets = useMemo(() => {
    const buckets = {
      "0-7": 0,
      "8-14": 0,
      "15-30": 0,
      "31+": 0,
    };

    leadsData.forEach((lead) => {
      if (
        dashboardInterestFilter !== "Todos" &&
        lead.interest !== dashboardInterestFilter
      ) {
        return;
      }

      if (lead.daysAgo <= 7) buckets["0-7"]++;
      else if (lead.daysAgo <= 14) buckets["8-14"]++;
      else if (lead.daysAgo <= 30) buckets["15-30"]++;
      else buckets["31+"]++;
    });

    return buckets;
  }, [leadsData, dashboardInterestFilter]);

  const maxBucket = Math.max(
    timelineBuckets["0-7"],
    timelineBuckets["8-14"],
    timelineBuckets["15-30"],
    timelineBuckets["31+"]
  );

  // conversaciones filtradas
  const filteredConversations = useMemo(() => {
    return conversationsData.filter((conv) => {
      const matchesSearch =
        conv.leadName
          .toLowerCase()
          .includes(searchConversation.toLowerCase()) ||
        conv.phone.toLowerCase().includes(searchConversation.toLowerCase());
      const matchesStatus =
        conversationFilter === "Todas" ||
        conv.status === conversationFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchConversation, conversationFilter]);

  // --- contenido principal según sección ---
  let mainContent = null;

  if (activeSection === "conversaciones") {
    // INBOX DE CONVERSACIONES
    mainContent = (
      <div className="conversations-panel">
        <section className="conversations-list-section">
          <div className="conversations-header">
            <h1 className="leads-title">Conversaciones</h1>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                className="search-input"
                value={searchConversation}
                onChange={(e) => setSearchConversation(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-row">
            <div className="chip-filter-group">
              {["Abiertas", "Todas", "Cerrada"].map((st) => (
                <button
                  key={st}
                  className={
                    "chip-filter" +
                    (conversationFilter === st ? " active" : "")
                  }
                  onClick={() => setConversationFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="conversation-list">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                className={
                  "conversation-row" +
                  (selectedConversation?.id === conv.id ? " selected" : "")
                }
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="conversation-main">
                  <div className="conversation-name-row">
                    <span className="conversation-lead-name">
                      {conv.leadName}
                    </span>
                    <span className={getInterestClass(conv.interest)}>
                      {conv.interest}
                    </span>
                  </div>
                  <p className="conversation-preview">
                    {conv.lastMessagePreview}
                  </p>
                </div>
                <div className="conversation-meta">
                  <span className="conversation-time">
                    {conv.lastMessageTime}
                  </span>
                  {conv.unread > 0 && (
                    <span className="conversation-unread">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {filteredConversations.length === 0 && (
              <div className="empty-state">
                No hay conversaciones para este filtro.
              </div>
            )}
          </div>
        </section>

        <section className="conversation-detail">
          <h2 className="lead-detail-title">Detalle de la conversación</h2>
          {selectedConversation ? (
            <div className="conversation-card">
              <div className="lead-card-header">
                <div className="lead-avatar">
                  {selectedConversation.leadName.charAt(0)}
                </div>
                <div className="lead-card-info">
                  <div className="lead-card-name-row">
                    <span className="lead-card-name">
                      {selectedConversation.leadName}
                    </span>
                    <span
                      className={getInterestClass(
                        selectedConversation.interest
                      )}
                    >
                      {selectedConversation.interest}
                    </span>
                    <span className="conversation-status-pill">
                      {selectedConversation.status}
                    </span>
                  </div>
                  <span className="lead-card-phone">
                    {selectedConversation.phone}
                  </span>
                  <span className="lead-card-time">
                    Último mensaje {selectedConversation.lastMessageTime}
                  </span>
                </div>
              </div>

              <div className="conversation-messages">
                {selectedConversation.messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      "chat-message " +
                      (m.from === "cliente"
                        ? "from-client"
                        : m.from === "bot"
                        ? "from-bot"
                        : "from-agent")
                    }
                  >
                    <div className="chat-bubble">
                      <p>{m.text}</p>
                      <span className="chat-time">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-outline full-width">
                ➕ Asignar a un agente
              </button>
            </div>
          ) : (
            <div className="lead-empty">
              Selecciona una conversación en la lista.
            </div>
          )}
        </section>
      </div>
    );
  } else if (activeSection === "dashboard") {
    // DASHBOARD TOP
    mainContent = (
      <section className="dashboard-panel">
        <div className="leads-header">
          <div className="dashboard-title-block">
            <h1 className="leads-title">Dashboard</h1>
            <span className="dashboard-subtitle">
              Visión general del rendimiento de tus leads
            </span>
          </div>
          <div className="leads-header-right">
            <button className="btn-primary">Exportar reporte</button>
          </div>
        </div>

        {/* Filtros dashboard */}
        <div className="dashboard-filters">
          <div className="chip-filter-group">
            {["Todos", "Alto", "Medio", "Bajo"].map((lvl) => (
              <button
                key={lvl}
                className={
                  "chip-filter" +
                  (dashboardInterestFilter === lvl ? " active" : "")
                }
                onClick={() => setDashboardInterestFilter(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="date-filter-group">
            {["7", "30", "90", "Todos"].map((range) => (
              <button
                key={range}
                className={
                  "date-filter-button" +
                  (dashboardRange === range ? " active" : "")
                }
                onClick={() => setDashboardRange(range)}
              >
                {range === "Todos" ? "Todo el tiempo" : `Últimos ${range} días`}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="dashboard-kpi-row">
          <div className="summary-card kpi-main">
            <span className="summary-label">Leads en periodo</span>
            <div className="kpi-main-row">
              <span className="summary-value">
                {dashboardSummary.total}
              </span>
              <span className="kpi-chip">
                {dashboardInterestFilter === "Todos"
                  ? "Todos los niveles"
                  : `Solo ${dashboardInterestFilter}`}
              </span>
            </div>
            <span className="kpi-helper">
              Filtrado por rango de fechas e interés
            </span>
          </div>

          <div className="summary-card kpi-highlight">
            <span className="summary-label">Leads de interés alto</span>
            <div className="kpi-main-row">
              <span className="summary-value">
                {dashboardSummary.alto}
              </span>
              <span className="kpi-percentage">
                {highRatio}% del periodo
              </span>
            </div>
            <span className="kpi-helper">
              Ideal para priorizar al equipo comercial
            </span>
          </div>

          <div className="summary-card kpi-secondary">
            <span className="summary-label">Leads de seguimiento</span>
            <span className="summary-value">
              {dashboardSummary.medio + dashboardSummary.bajo}
            </span>
            <span className="kpi-helper">
              Leads que requieren nurturing o recordatorios
            </span>
          </div>
        </div>

        {/* Gráficos: barras por interés + timeline */}
        <div className="dashboard-grid">
          <div className="evolutive-card">
            <div className="evolutive-header">
              <h3 className="evolutive-title">
                Distribución de leads por interés
              </h3>
              <span className="evolutive-subtitle">
                Basado en los filtros seleccionados
              </span>
            </div>

            <div className="evolutive-bars">
              {[
                {
                  label: "Alto",
                  value: dashboardSummary.alto,
                  className: "bar-high",
                },
                {
                  label: "Medio",
                  value: dashboardSummary.medio,
                  className: "bar-medium",
                },
                {
                  label: "Bajo",
                  value: dashboardSummary.bajo,
                  className: "bar-low",
                },
              ].map((item) => (
                <div key={item.label} className="evolutive-bar-row">
                  <span className="evolutive-label">
                    {item.label}
                  </span>
                  <div className="evolutive-bar-track">
                    <div
                      className={
                        "evolutive-bar-fill " + item.className
                      }
                      style={{
                        width: `${(item.value / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="evolutive-value">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="timeline-card">
            <div className="evolutive-header">
              <h3 className="evolutive-title">
                Antigüedad de los leads
              </h3>
              <span className="evolutive-subtitle">
                Según días desde el último mensaje
              </span>
            </div>

            <div className="timeline-bars">
              {[
                { key: "0-7", label: "0 - 7d" },
                { key: "8-14", label: "8 - 14d" },
                { key: "15-30", label: "15 - 30d" },
                { key: "31+", label: "31+d" },
              ].map((bucket) => (
                <div key={bucket.key} className="timeline-col">
                  <div className="timeline-bar-track">
                    <div
                      className="timeline-bar-fill"
                      style={{
                        height:
                          maxBucket === 0
                            ? 0
                            : `${(timelineBuckets[bucket.key] / maxBucket) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="timeline-label">
                    {bucket.label}
                  </span>
                  <span className="timeline-value">
                    {timelineBuckets[bucket.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  } else {
    // PANEL DE LEADS (por defecto)
    mainContent = (
      <>
        <section className="leads-panel">
          <div className="leads-header">
            <h1 className="leads-title">Leads</h1>
            <div className="leads-header-right">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre o teléfono..."
                  className="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="btn-primary">+ Nuevo Lead</button>
            </div>
          </div>

          <div className="summary-row">
            <div className="summary-card">
              <span className="summary-label">Total</span>
              <span className="summary-value">{summary.total}</span>
            </div>
            <div className="summary-card summary-high">
              <span className="summary-label">Alto</span>
              <span className="summary-value">{summary.alto}</span>
            </div>
            <div className="summary-card summary-medium">
              <span className="summary-label">Medio</span>
              <span className="summary-value">{summary.medio}</span>
            </div>
            <div className="summary-card summary-low">
              <span className="summary-label">Bajo</span>
              <span className="summary-value">{summary.bajo}</span>
            </div>
          </div>

          <div className="filters-row">
            <div className="chip-filter-group">
              {["Todos", "Alto", "Medio", "Bajo"].map((lvl) => (
                <button
                  key={lvl}
                  className={
                    "chip-filter" + (interestFilter === lvl ? " active" : "")
                  }
                  onClick={() => setInterestFilter(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <button className="filter-button">Últimos 30 días ▾</button>
          </div>

          <div className="leads-table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Último mensaje</th>
                  <th>Interés</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeads && (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      Cargando leads...
                    </td>
                  </tr>
                )}

                {errorLeads && !loadingLeads && (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      Error al cargar leads: {errorLeads}
                    </td>
                  </tr>
                )}

                {!loadingLeads &&
                  !errorLeads &&
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={
                        selectedLead?.id === lead.id
                          ? "lead-row selected"
                          : "lead-row"
                      }
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="lead-name">{lead.name}</td>
                      <td className="lead-time">{lead.lastMessageTime}</td>
                      <td>
                        <span className={getInterestClass(lead.interest)}>
                          {lead.interest}
                        </span>
                      </td>
                    </tr>
                  ))}

                {!loadingLeads &&
                  !errorLeads &&
                  filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-state">
                        No hay leads para este filtro.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lead-detail">
          <h2 className="lead-detail-title">Visor del lead</h2>

          {selectedLead ? (
            <div className="lead-card">
              <div className="lead-card-header">
                <div className="lead-avatar">
                  {selectedLead.name.charAt(0)}
                </div>
                <div className="lead-card-info">
                  <div className="lead-card-name-row">
                    <span className="lead-card-name">
                      {selectedLead.name}
                    </span>
                    <span
                      className={getInterestClass(selectedLead.interest)}
                    >
                      {selectedLead.interest}
                    </span>
                  </div>
                  <span className="lead-card-phone">
                    {selectedLead.phone}
                  </span>
                  <span className="lead-card-time">
                    {selectedLead.lastSeen}
                  </span>
                </div>
              </div>

              <div className="lead-card-body">
                <div className="lead-card-icons">
                  <span>📞</span>
                  <span>💬</span>
                </div>

                <div className="message-bubble">
                  <p>{selectedLead.message}</p>
                  <button className="tag-pill">
                    {selectedLead.tag}
                  </button>
                </div>

                <div className="lead-meta">
                  <span className="lead-meta-item">
                    ⚡ Lead generado por: {selectedLead.channel}
                  </span>
                </div>

                <button className="btn-outline">
                  ⏱ Ver conversación
                </button>
              </div>
            </div>
          ) : (
            <div className="lead-empty">
              Selecciona un lead en la tabla.
            </div>
          )}
        </section>
      </>
    );
  }

  return (
    <div className="app">
      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">💬</span>
            <span className="sidebar-logo-text">Panel</span>
          </div>

          <nav className="sidebar-nav">
            <button
              className={
                "nav-item" + (activeSection === "leads" ? " active" : "")
              }
              onClick={() => setActiveSection("leads")}
            >
              <span className="nav-icon">👤</span>
              <span>Leads</span>
            </button>
            <button
              className={
                "nav-item" +
                (activeSection === "conversaciones" ? " active" : "")
              }
              onClick={() => setActiveSection("conversaciones")}
            >
              <span className="nav-icon">💭</span>
              <span>Conversaciones</span>
            </button>
            <button
              className={
                "nav-item" +
                (activeSection === "dashboard" ? " active" : "")
              }
              onClick={() => setActiveSection("dashboard")}
            >
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="nav-item">
              <span className="nav-icon">⚙️</span>
              <span>Ajustes</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="main">{mainContent}</main>
      </div>
    </div>
  );
}

