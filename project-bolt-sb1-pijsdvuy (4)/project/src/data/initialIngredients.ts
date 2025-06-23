export interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
  // Support for multiple storage locations
  bestände?: {
    hauptlager?: number;
    filiale1?: number;
    [key: string]: number | undefined;
  };
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export const initialIngredients: Ingredient[] = [
  {
    id: 1,
    name: "Mehl (Weizenmehl Type 405)",
    amount: 25.5,
    unit: "kg",
    minStock: 10,
    costPerUnit: 0.85,
    supplier: "Müller GmbH",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 20.5,
      filiale1: 5.0
    }
  },
  {
    id: 2,
    name: "Zucker (Kristallzucker)",
    amount: 18.2,
    unit: "kg",
    minStock: 8,
    costPerUnit: 1.20,
    supplier: "Süßwaren AG",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 15.2,
      filiale1: 3.0
    }
  },
  {
    id: 3,
    name: "Butter (ungesalzen)",
    amount: 12.8,
    unit: "kg",
    minStock: 5,
    costPerUnit: 6.50,
    supplier: "Molkerei Nord",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 10.0,
      filiale1: 2.8
    }
  },
  {
    id: 4,
    name: "Eier (Größe M)",
    amount: 144,
    unit: "Stück",
    minStock: 60,
    costPerUnit: 0.25,
    supplier: "Geflügelhof Schmidt",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 120,
      filiale1: 24
    }
  },
  {
    id: 5,
    name: "Schokoladenchips (Vollmilch)",
    amount: 8.5,
    unit: "kg",
    minStock: 3,
    costPerUnit: 8.90,
    supplier: "Choco Deluxe",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 6.5,
      filiale1: 2.0
    }
  },
  {
    id: 6,
    name: "Vanilleextrakt",
    amount: 0.5,
    unit: "Liter",
    minStock: 0.2,
    costPerUnit: 45.00,
    supplier: "Gewürze & Aromen",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 0.4,
      filiale1: 0.1
    }
  },
  {
    id: 7,
    name: "Backpulver",
    amount: 2.2,
    unit: "kg",
    minStock: 1,
    costPerUnit: 3.20,
    supplier: "Backhilfen Express",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 1.8,
      filiale1: 0.4
    }
  },
  {
    id: 8,
    name: "Salz (fein)",
    amount: 1.8,
    unit: "kg",
    minStock: 0.5,
    costPerUnit: 0.90,
    supplier: "Salz & Meer",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 1.5,
      filiale1: 0.3
    }
  },
  {
    id: 9,
    name: "Haferflocken (kernig)",
    amount: 6.3,
    unit: "kg",
    minStock: 2,
    costPerUnit: 2.40,
    supplier: "Getreide Zentral",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 5.0,
      filiale1: 1.3
    }
  },
  {
    id: 10,
    name: "Rosinen",
    amount: 3.1,
    unit: "kg",
    minStock: 1,
    costPerUnit: 4.80,
    supplier: "Trockenfrüchte Plus",
    lastUpdated: getToday(),
    bestände: {
      hauptlager: 2.5,
      filiale1: 0.6
    }
  }
];