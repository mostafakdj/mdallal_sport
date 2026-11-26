
(() => {
  "use strict";

  const SITE_KEY = "0x4AAAAAAGUOnttc10AQEy9p";

  const form = document.getElementById("orderForm");
  const button = document.getElementById("sendOrder");

  if (!form || !button) return;

  const container = document.createElement("div");

  container.id = "orderTurnstile";

  container.style.cssText = `
    display:flex;
    justify-content:center;
    margin:15px 0;
    min-height:65px;
    width:100%;
  `;

  form.insertBefore(container, button);

  let widgetId = null;
  let token = "";
  let busy = false;

  function message(text) {
    const element = document.getElementById("orderMessage");

    element.textContent = text;
    element.style.color = "#b7192b";
  }

  function resetVerification() {
    token = "";

    if (
      window.turnstile &&
      widgetId !== null
    ) {
      window.turnstile.reset(widgetId);
    }
  }

  function mountVerification() {
    if (
      !window.turnstile ||
      widgetId !== null
    ) return;

    widgetId = window.turnstile.render(
      container,
      {
        sitekey: SITE_KEY,
        theme: "light",
        size: "flexible",
        language: "ar",

        callback(value) {
          token = value;
        },

        "expired-callback"() {
          token = "";
        },

        "timeout-callback"() {
          token = "";
        },

        "error-callback"() {
          token = "";
          return true;
        }
      }
    );
  }

  const script = document.createElement("script");

  script.src =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

  script.async = true;

  script.onload = mountVerification;

  script.onerror = () => {
    message(
      "تعذر تحميل التحقق الأمني. تحقق من الإنترنت وأعد فتح الصفحة."
    );
  };

  document.head.appendChild(script);

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();
      event.stopImmediatePropagation();

      if (busy || sendingOrder) return;

      message("");

      if (!catalogReady) {
        message("انتظر تحميل المنتجات.");
        return;
      }

      if (!navigator.onLine) {
        message("لا يوجد اتصال بالإنترنت.");
        return;
      }

      const entries = Object.values(cart);

      if (!entries.length) {
        message("سلة الطلبات فارغة.");
        return;
      }

      if (entries.length > 100) {
        message("الحد الأقصى 100 بند في الطلب.");
        return;
      }

      for (const item of entries) {
        const product =
          window.getStoreProduct(item.id);

        const error =
          validateCartLine(item, product);

        if (error) {
          message(item.name + ": " + error);
          return;
        }
      }

      const customer = getCustomerData();

      if (
        !customer.name ||
        !customer.shop_name ||
        !customer.phone ||
        !customer.city ||
        !customer.address
      ) {
        message("يرجى تعبئة جميع البيانات المطلوبة.");
        return;
      }

      if (
        !/^\+?[0-9]{7,15}$/.test(customer.phone)
      ) {
        message("يرجى إدخال رقم هاتف صحيح.");
        return;
      }

      if (!token) {
        message("يرجى إكمال التحقق الأمني أولاً.");
        return;
      }

      busy = true;

      setSendingState(true);

      let timeout;

      try {

        const items = buildOrderItems();

        const totals = {
          products: new Set(
            items.map(item => item.product_id)
          ).size,

          lines: items.length,

          dozens: items.reduce(
            (sum, item) =>
              sum + (
                item.sale_unit === "dozen"
                  ? item.quantity
                  : 0
              ),
            0
          ),

          single_pieces: items.reduce(
            (sum, item) =>
              sum + (
                item.sale_unit === "piece"
                  ? item.quantity
                  : 0
              ),
            0
          ),

          total_pieces: items.reduce(
            (sum, item) =>
              sum + item.total_pieces,
            0
          )
        };

        if (
          !Number.isSafeInteger(
            totals.total_pieces
          )
        ) {
          throw new Error(
            "إجمالي الكمية غير صحيح."
          );
        }

        const signature = await hashOrder(
          JSON.stringify({
            customer,
            items
          })
        );

        const orderId = getOrderId(signature);

        const payload = {
          action: "create_order",
          order_id: orderId,
          turnstile_token: token,
          customer,
          items,
          totals,
          created_at: new Date().toISOString()
        };

        const controller =
          new AbortController();

        timeout = setTimeout(
          () => controller.abort(),
          120000
        );

        const response = await fetch(
          ORDER_API,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify(payload),

            signal: controller.signal,

            cache: "no-store"
          }
        );

        const result = await response.json();

        if (
          !response.ok ||
          result.success !== true ||
          result.order_id !== orderId ||
          result.status !== "accepted"
        ) {
          throw new Error(
            result.message ||
            "لم يتم تأكيد استلام الطلب."
          );
        }

        cart = Object.create(null);

        pendingOrder = null;

        try {
          localStorage.removeItem(
            "mdallal-pending-order"
          );
        } catch {}

        form.reset();

        const success =
          document.getElementById(
            "orderSuccess"
          );

        success.textContent =
          "✓ تم قبول طلبك للإرسال إلى المستودع.\n" +
          "رقم الطلب: " + orderId + "\n" +
          "سيتم التواصل معك لتأكيد الطلب.";

        success.hidden = false;

        saveCart();

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      } catch (error) {

        console.error(error);

        if (error.name === "AbortError") {

          message(
            "انتهت مهلة الاتصال. أعد المحاولة بنفس الطلب دون تغيير محتوياته. تم الاحتفاظ بالسلة."
          );

        } else {

          message(
            "تعذر تأكيد إرسال الطلب: " +
            (error.message || "خطأ في الاتصال") +
            " — تم الاحتفاظ بالسلة."
          );

        }

      } finally {

        clearTimeout(timeout);

        busy = false;

        resetVerification();

        setSendingState(false);

      }

    },

    true

  );

})();
