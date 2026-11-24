
import { db } from "./firebase-config.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const categories = [
  {name: "معدات ملاكمة", icon: "🥊"},
  {name: "معدات كرة قدم", icon: "⚽"},
  {name: "ملابس رياضية", icon: "👕"},
  {name: "أدوات كمال أجسام", icon: "🏋️"},
  {name: "إكسسوارات رياضية", icon: "🎽"},
  {name: "أدوات سباحة", icon: "🏊"},
  {name: "معدات لياقة بدنية", icon: "💪"},
  {name: "مستلزمات تدريب", icon: "🏃"},
  {name: "حقائب رياضية", icon: "🎒"},
  {name: "أحذية رياضية", icon: "👟"},
  {name: "أدوات رياضات متنوعة", icon: "🏆"},
  {name: "معدات بيسبول", icon: "⚾"}
];

const categoryNames = {
  baseball: "معدات بيسبول",
  boxing: "معدات ملاكمة",
  football: "معدات كرة قدم"
};

const productsQuery = query(
  collection(db, "products"),
  where("active", "==", true)
);

onSnapshot(productsQuery, (snapshot) => {

  const products = snapshot.docs.map(doc => {

    const data = doc.data();

    return {
      id: doc.id,
      name: data.name || "",
      description: data.description || "",
      category: categoryNames[data.category]
        || data.category
        || "أدوات رياضات متنوعة",
      price: data.price ?? null,
      currency: data.currency || "USD",
      image_url: data.image || data.image_url || "",
      available: Number(data.stock) > 0,
      created_at: data.created_at?.toDate
        ? data.created_at.toDate().toISOString()
        : data.created_at || null
    };

  });

  const allCategories = [...categories];

  products.forEach(product => {
    if (!allCategories.some(c => c.name === product.category)) {
      allCategories.push({
        name: product.category,
        icon: "🏆"
      });
    }
  });

  window.setCatalogData({
    products,
    categories: allCategories
  });

}, (error) => {

  console.error("Firebase error:", error);

  document.getElementById("products").textContent =
    "تعذر تحميل المنتجات، يرجى المحاولة لاحقاً.";

});
