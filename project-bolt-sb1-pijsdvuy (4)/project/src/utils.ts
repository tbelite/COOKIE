export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function loadFromStorage(key: string, defaultValue: any) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function exportCookiesToCSV(cookies: any[]) {
  const days = Array.from(new Set(cookies.flatMap(c => Object.keys(c.history)))).sort();
  let csv = "Tag,Cookie,Kategorie,Verkauft,Vorbereitet,Benutzt,Entsorgt,Neu_Produziert,Verkaufspreis,Produktionskosten,Umsatz\n";
  
  days.forEach(day => {
    cookies.forEach(cookie => {
      const d = cookie.history[day] || {};
      const revenue = (d.sold || 0) * cookie.price;
      csv += [
        day,
        `"${cookie.name}"`,
        `"${cookie.category}"`,
        d.sold || 0,
        d.prepared || 0,
        d.used || 0,
        d.trash || 0,
        d.new || 0,
        cookie.price?.toFixed(2) || '0.00',
        cookie.productionPrice?.toFixed(2) || '0.00',
        revenue.toFixed(2)
      ].join(",") + "\n";
    });
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cookie_report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSummaryToCSV(cookies: any[]) {
  let csv = "Cookie_Name,Kategorie,Gesamt_Verkauft,Aktueller_Lagerbestand,Vorbereitet,Verkaufspreis,Produktionskosten,Gesamtumsatz,Gewinnmarge_Euro,Gewinnmarge_Prozent\n";
  
  cookies.forEach(cookie => {
    const totalRevenue = cookie.sold * cookie.price;
    const profitMargin = cookie.price - (cookie.productionPrice || 0);
    const profitPercentage = cookie.price > 0 ? (profitMargin / cookie.price) * 100 : 0;
    
    csv += [
      `"${cookie.name}"`,
      `"${cookie.category}"`,
      cookie.sold,
      cookie.stock,
      cookie.prepared,
      cookie.price?.toFixed(2) || '0.00',
      cookie.productionPrice?.toFixed(2) || '0.00',
      totalRevenue.toFixed(2),
      profitMargin.toFixed(2),
      profitPercentage.toFixed(1)
    ].join(",") + "\n";
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cookie_summary_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAuditToCSV(audits: any[]) {
  let csv = "Datum,Bearbeiter,Bearbeiter_Name,Cookie,Soll,Ist_Lager_Verpackt,Ist_Lager_Versand,Ist_Location,Ist_Gesamt,Differenz,Kommentar,Gesamtabweichung,Status,Erstellt_Am\n";
  
  audits.forEach(audit =>
    audit.items.forEach((item: any) =>
      csv += [
        audit.date,
        `"${audit.user}"`,
        `"${audit.userName}"`,
        `"${item.cookie}"`,
        item.soll,
        item.ist_lager_verpackt || 0,
        item.ist_lager_versand || 0,
        item.ist_location || 0,
        item.ist_final || item.ist || 0,
        item.differenz,
        `"${item.kommentar || ""}"`,
        audit.totalDifference,
        audit.status,
        audit.createdAt
      ].join(",") + "\n"
    )
  );
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventurprotokoll_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportRecipesToCSV(recipes: any[], cookies: any[], ingredients: any[]) {
  let csv = "Cookie_Name,Kategorie,Ausbeute_Stueck,Notizen";
  
  // Add ingredient columns
  ingredients.forEach(ingredient => {
    csv += `,${ingredient.name}_${ingredient.unit}`;
  });
  csv += ",Gesamtkosten_Euro,Kosten_pro_Cookie_Euro\n";
  
  recipes.forEach(recipe => {
    const cookie = cookies.find(c => c.id === recipe.cookieId);
    if (!cookie) return;
    
    let row = [
      `"${cookie.name}"`,
      `"${cookie.category}"`,
      recipe.yield,
      `"${recipe.notes || ""}"`
    ];
    
    let totalCost = 0;
    ingredients.forEach(ingredient => {
      const amount = recipe.ingredients[ingredient.id] || 0;
      row.push(amount);
      totalCost += amount * ingredient.costPerUnit;
    });
    
    row.push(totalCost.toFixed(2));
    row.push((totalCost / recipe.yield).toFixed(3));
    
    csv += row.join(",") + "\n";
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cookie_recipes_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProdPlansToCSV(plans: any[]) {
  let csv = "Sorte,Menge,Deadline,Notiz,Status,Erstellt_Am\n";
  plans.forEach(p => {
    csv += [
      `"${p.cookie}"`,
      p.menge,
      p.deadline,
      `"${p.note || ""}"`,
      p.done ? "Erledigt" : "Offen",
      new Date(p.createdAt).toLocaleDateString('de-DE')
    ].join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; 
  a.download = `produktionsplanung_${new Date().toISOString().split('T')[0]}.csv`; 
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function clearAllData() {
  const keys = ['cookies', 'settings', 'websiteSettings', 'ingredients', 'inventoryAudits', 'warnLevels', 'recipes', 'cookieToDos', 'cookieProdPlans'];
  keys.forEach(key => {
    localStorage.removeItem(key);
  });
}

export function exportAllData() {
  const data = {
    cookies: loadFromStorage('cookies', []),
    settings: loadFromStorage('settings', {}),
    websiteSettings: loadFromStorage('websiteSettings', {}),
    ingredients: loadFromStorage('ingredients', []),
    inventoryAudits: loadFromStorage('inventoryAudits', []),
    warnLevels: loadFromStorage('warnLevels', {}),
    recipes: loadFromStorage('recipes', []),
    cookieToDos: loadFromStorage('cookieToDos', []),
    cookieProdPlans: loadFromStorage('cookieProdPlans', []),
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cookie_business_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}