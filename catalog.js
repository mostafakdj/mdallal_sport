
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

function cleanText(value) {

  return typeof value === "string"

    ? value.trim()

    : "";

}

function positiveInteger(value, fallback = 1) {

  const number = Number(value);

  return Number.isSafeInteger(number) &&
    number > 0

    ? number

    : fallback;

}

function findCategory(value) {

  return categories.find(category =>

    category.id === value ||

    category.name === value ||

    (category.old_names || []).includes(value)

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

        data.image ||

        data.image_url ||

        "",

      image_url:

        data.image ||

        data.image_url ||

        "",

      icon:

        data.icon ||

        icons[item.id] ||

        "📦",

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
      "تعذر تحميل الأقسام.";

  }

});

const productsQuery = query(

  collection(db, "products"),

  where("active", "==", true)

);

onSnapshot(productsQuery, snapshot => {

  products = snapshot.docs.map(item => {

    const data = item.data();

    // خيارات الألوان والمقاسات

    const colors =
      cleanOptions(data.colors);

    const sizes =
      cleanOptions(data.sizes);

    const hasColors =

      data.has_colors !== false &&

      colors.length > 0;

    const hasSizes =

      data.has_sizes !== false &&

      sizes.length > 0;

    // طريقة البيع

    const saleUnit =

      data.sale_unit === "dozen"

        ? "dozen"

        : "piece";

    // عدد القطع داخل الدزينة

    const piecesPerUnit =

      saleUnit === "dozen"

        ? positiveInteger(
            data.pieces_per_unit,
            12
          )

        : 1;

    // المخزون محسوب بالقطع

    const rawStock =
      Number(data.stock);

    const stock =

      Number.isSafeInteger(rawStock) &&

      rawStock >= 0

        ? rawStock

        : 0;

    // عدد وحدات البيع المتوفرة

    const availableUnits =

      Math.floor(stock / piecesPerUnit);

    // توضيح محتويات الدزينة

    const dozenColors =
      cleanText(data.dozen_colors);

    const dozenSizes =
      cleanText(data.dozen_sizes);

    const showDozenColors =

      saleUnit === "dozen" &&

      data.show_dozen_colors === true &&

      dozenColors.length > 0;

    const showDozenSizes =

      saleUnit === "dozen" &&

      data.show_dozen_sizes === true &&

      dozenSizes.length > 0;

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

        data.image ||

        data.image_url ||

        "",

      active: true,

      // المخزون

      stock: stock,

      available: availableUnits > 0,

      available_units: availableUnits,

      // طريقة البيع

      sale_unit: saleUnit,

      unit_label:

        saleUnit === "dozen"

          ? "دزينة"

          : "قطعة",

      pieces_per_unit: piecesPerUnit,

      // اختيار الألوان

      has_colors: hasColors,

      colors:

        hasColors ? colors : [],

      // اختيار المقاسات

      has_sizes: hasSizes,

      sizes:

        hasSizes ? sizes : [],

      // توضيح ألوان الدزينة

      show_dozen_colors: showDozenColors,

      dozen_colors:

        showDozenColors ? dozenColors : "",

      // توضيح مقاسات الدزينة

      show_dozen_sizes: showDozenSizes,

      dozen_sizes:

        showDozenSizes ? dozenSizes : "",

      created_at:

        data.created_at?.toDate

          ? data.created_at
              .toDate()
              .toISOString()

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
