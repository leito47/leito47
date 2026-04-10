const sheetRows = [
  {
    id_recu: "38101006437",
    date: "2026-04-09",
    entreprise: "STATION SUPER U (S.A.S MARMANDIS)",
    adresse: "6-8 Rue François Mauriac, 47200 Marmande, France",
    ville: "Marmande",
    devise: "EUR",
    total_ttc: 74.07,
    tva: 12.34,
    tva_percent: 20,
    total_ht: 61.73,
    categorie: "essence",
  },
  {
    id_recu: "8,594E+20",
    date: "2026-04-09",
    entreprise: "Carrefour Market",
    adresse: "Carrefour Market, 47200 Marmande, France",
    ville: "Marmande",
    devise: "EUR",
    total_ttc: 30.15,
    tva: 5.03,
    tva_percent: 20,
    total_ht: 25.12,
    categorie: "essence",
  },
  {
    id_recu: "2-25269",
    date: "2026-04-08",
    entreprise: "LAUDIS SUD OUEST",
    adresse: "376 Av. du Général Leclerc, 47000 Agen, France",
    ville: "Agen",
    devise: "EUR",
    total_ttc: 258.56,
    tva: 43.09,
    tva_percent: 20,
    total_ht: 215.47,
    categorie: "autres",
  },
];

const n8nScript = `// n8n Function Node - Normalisation Google Sheets
const records = $input.all();

return records.map(({ json }) => {
  const totalTtc = Number(json.total_ttc || 0);
  const tvaPercent = Number(json.tva_percent || 20);
  const totalHt = +(totalTtc / (1 + tvaPercent / 100)).toFixed(2);
  const tva = +(totalTtc - totalHt).toFixed(2);

  return {
    json: {
      id_recu: json.id_recu,
      date: json.date || new Date().toISOString().slice(0, 10),
      entreprise: json.entreprise,
      adresse: json.adresse,
      ville: json.ville,
      devise: json.devise || 'EUR',
      total_ttc: totalTtc,
      tva,
      tva_percent: tvaPercent,
      total_ht: totalHt,
      categorie: json.categorie || 'autres',
      notes: json.notes || ''
    }
  }
});`;

const flowGraph = `flowchart LR
  tg[Telegram Trigger] --> gf[Get a file]
  gf --> up[Upload file]
  up --> sf[Share file]
  sf --> llm[Basic LLM Chain]
  llm --> gs[Append row in sheet]
  model((OpenAI Chat Model)) -. model .-> llm
  parser((Structured Output Parser)) -. output parser .-> llm`;

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function mountKpis() {
  const total = sheetRows.reduce((sum, row) => sum + row.total_ttc, 0);
  const categories = new Set(sheetRows.map((row) => row.categorie)).size;
  const cities = new Set(sheetRows.map((row) => row.ville)).size;

  const kpis = [
    { label: "Entrées", value: sheetRows.length },
    { label: "Total TTC", value: euro.format(total) },
    { label: "Catégories", value: categories },
    { label: "Villes", value: cities },
  ];

  const grid = document.querySelector("#kpi-grid");
  kpis.forEach((kpi) => {
    const item = document.createElement("article");
    item.className = "kpi";
    item.innerHTML = `<h3>${kpi.label}</h3><p>${kpi.value}</p>`;
    grid.appendChild(item);
  });
}

function mountTable() {
  const columns = Object.keys(sheetRows[0]);
  document.querySelector("#sheet-table thead").innerHTML = `<tr>${columns
    .map((col) => `<th>${col}</th>`)
    .join("")}</tr>`;

  document.querySelector("#sheet-table tbody").innerHTML = sheetRows
    .map(
      (row) =>
        `<tr>${columns
          .map((col) => `<td>${row[col] ?? ""}</td>`)
          .join("")}</tr>`
    )
    .join("");
}

function mountCharts() {
  const byCategory = sheetRows.reduce((map, row) => {
    map[row.categorie] = (map[row.categorie] || 0) + row.total_ttc;
    return map;
  }, {});

  const byCity = sheetRows.reduce((map, row) => {
    map[row.ville] = (map[row.ville] || 0) + row.total_ttc;
    return map;
  }, {});

  new Chart(document.getElementById("categoryChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(byCategory),
      datasets: [
        {
          data: Object.values(byCategory),
          backgroundColor: ["#34d399", "#60a5fa", "#f59e0b", "#f472b6"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#cbd5e1" } },
      },
    },
  });

  new Chart(document.getElementById("cityChart"), {
    type: "bar",
    data: {
      labels: Object.keys(byCity),
      datasets: [
        {
          label: "Total TTC (€)",
          data: Object.values(byCity),
          backgroundColor: "#22c55e",
          borderRadius: 8,
        },
      ],
    },
    options: {
      scales: {
        x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,.15)" } },
        y: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,.15)" } },
      },
      plugins: { legend: { labels: { color: "#cbd5e1" } } },
    },
  });
}

function mountFlow() {
  mermaid.initialize({ startOnLoad: false, theme: "dark" });
  mermaid
    .render("n8n-flow", flowGraph)
    .then(({ svg }) => {
      document.getElementById("flow-diagram").innerHTML = svg;
    })
    .catch(() => {
      document.getElementById("flow-diagram").innerHTML =
        "<p>Impossible de charger le diagramme Mermaid.</p>";
    });
}

function mountScript() {
  const code = document.getElementById("script-block");
  code.textContent = n8nScript;

  const copyBtn = document.getElementById("copy-script");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(n8nScript);
      copyBtn.textContent = "Copié ✓";
      setTimeout(() => {
        copyBtn.textContent = "Copier";
      }, 1500);
    } catch {
      copyBtn.textContent = "Copie bloquée";
    }
  });
}

mountKpis();
mountFlow();
mountScript();
mountCharts();
mountTable();
