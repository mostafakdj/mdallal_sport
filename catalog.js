
import { db } from "./firebase-config.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let products = [];
let categories = [];

let productsReady = false;
let categoriesReady = false;

const icons = {
  fitness: "💪",
  bags: "🎒",
  sea: "🤿",
  swimming: "🏊",
  basketball: "🏀",
  supports: "🩹",
  weights: "🏋️",
  gym: "🏋️",
  handball: "🤾",
  martial: "🥊",
  football: "⚽",
  volleyball: "🏐",
  trophies: "🏆",
  treadmills: "🏃",
  "sports-tables": "🏓",
  "sports-machines": "🚴",
  electric: "⚡",
  clothes: "👕",
  shoes: "👟",
  rackets: "🎾",
  games: "♟️",
  other: "📦",
  baseball: "⚾",
  boxing: "🥊"
};

function cleanOptions(value) {

  if (!Array.isArray(value)) return [];

  return [...new Set(
    value
      .filter(item => typeof item === "string")
      .map(item => item.trim())
      .filter(Boolean)
  )];

}

function findCategory(value) {

  return categories.find(c =>
    c.id === value ||
    c.name === value ||
    (c.old_names || []).includes(value)
  );

}

function publishCatalog() {

  if (!productsReady || !categoriesReady) return;

  const mappedProducts = products.map(product => {

    const category =
      findCategory(product.category_id) ||
      findCategory(product.category);

    return {
      ...product,

      category_id:
        category?.id ||
        product.category_id ||
        product.category,

      category:
        category?.name ||
        product.category

    };

  });

  if (typeof window.setCatalogData === "function") {

    window.setCatalogData({
      products: mappedProducts,
      categories: categories
    });

  }

}

const categoriesQuery = query(
  collection(db, "categories"),
  where("active", "==", true)
);

onSnapshot(categoriesQuery, snapshot => {

  categories = snapshot.docs.map(item => {

    const data = item.data();

    return {

      id: item.id,

      name: data.name || "",

      image:
        data.image || data.image_url || "",

      image_url:
        data.image || data.image_url || "",

      icon:
        data.icon || icons[item.id] || "📦",

      parent_id:
        data.parent_id || "",

      active: true,

      old_names:
        Array.isArray(data.old_names)
          ? data.old_names
          : [],

      order:
        Number(data.order) || 0

    };

  }).sort((a, b) =>
    a.order - b.order ||
    a.name.localeCompare(b.name, "ar")
  );

  categoriesReady = true;

  publishCatalog();

}, error => {

  console.error("Categories error:", error);

  const element =
    document.getElementById("categoryList");

  if (element) {

    element.textContent =
      "تعذر تحميل الأقسام. يرجى إعادة المحاولة.";

  }

});

const productsQuery = query(
  collection(db, "products"),
  where("active", "==", true)
);

onSnapshot(productsQuery, snapshot => {

  products = snapshot.docs.map(item => {

    const data = item.data();

    const colors = cleanOptions(data.colors);

    const sizes = cleanOptions(data.sizes);

    const rawStock = Number(data.stock);

    const stock =
      Number.isSafeInteger(rawStock) &&
      rawStock >= 0
        ? rawStock
        : 0;

    const hasColors =
      data.has_colors !== false &&
      colors.length > 0;

    const hasSizes =
      data.has_sizes !== false &&
      sizes.length > 0;

    return {

      id: item.id,

      name:
        data.name || "",

      description:
        data.description || "",

      category:
        data.category || "",

      category_id:
        data.category_id || "",

      price:
        data.price ?? null,

      currency:
        data.currency || "USD",

      image_url:
        data.image || data.image_url || "",

      stock: stock,

      available: stock > 0,

      active: true,

      has_colors: hasColors,

      has_sizes: hasSizes,

      colors: hasColors ? colors : [],

      sizes: hasSizes ? sizes : [],

      created_at:
        data.created_at?.toDate
          ? data.created_at.toDate().toISOString()
          : data.created_at || null

    };

  });

  productsReady = true;

  publishCatalog();

}, error => {

  console.error("Products error:", error);

  const element =
    document.getElementById("products");

  if (element) {

    element.textContent =
      "تعذر تحميل المنتجات.";

  }

});
