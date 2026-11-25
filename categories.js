
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
  trophies: "🏆",
  swimming: "🏊",
  gym: "🏋️",
  electric: "⚡",
  shoes: "👟",
  clothes: "👕",
  football: "⚽",
  basketball: "🏀",
  handball: "🤾",
  volleyball: "🏐",
  bags: "🎒",
  martial: "🥋",
  games: "🎯",
  supports: "🩹",
  baseball: "⚾",
  boxing: "🥊"
};

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

    const category = findCategory(product.category);

    return {
      ...product,
      category_id: category?.id || product.category,
      category: category?.name || product.category
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
      image: data.image || data.image_url || "",
      image_url: data.image || data.image_url || "",
      icon: data.icon || icons[item.id] || "🏆",
      parent_id: data.parent_id || "",
      old_names: Array.isArray(data.old_names)
        ? data.old_names : [],
      order: Number(data.order) || 0
    };

  }).sort((a, b) =>
    a.order - b.order ||
    a.name.localeCompare(b.name, "ar")
  );

  categoriesReady = true;
  publishCatalog();

}, error => {
  console.error("Categories error:", error);
});

const productsQuery = query(
  collection(db, "products"),
  where("active", "==", true)
);

onSnapshot(productsQuery, snapshot => {

  products = snapshot.docs.map(item => {

    const data = item.data();

    return {
      id: item.id,
      name: data.name || "",
      description: data.description || "",
      category: data.category || "",
      price: data.price ?? null,
      currency: data.currency || "USD",
      image_url: data.image || data.image_url || "",
      available: Number(data.stock) > 0,
      created_at: data.created_at?.toDate
        ? data.created_at.toDate().toISOString()
        : data.created_at || null
    };

  });

  productsReady = true;
  publishCatalog();

}, error => {

  console.error("Products error:", error);

  const element = document.getElementById("products");
