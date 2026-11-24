
(() => {
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  function initInstall() {

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true
    ) return;

    if (document.getElementById("installAppButton")) return;

    const style = document.createElement("style");

    style.textContent = `
      #installAppButton {
        position: fixed;
        top: calc(12px + env(safe-area-inset-top));
        right: 12px;
        width: 66px;
        height: 66px;
        border-radius: 50%;
        background: linear-gradient(145deg, #f5d77a, #b88a25);
        color: #111;
        border: 2px solid #e9c45e;
        box-shadow: 0 4px 15px #0004;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        cursor: pointer;
        font-family: inherit;
        font-weight: bold;
        font-size: 10px;
      }

      #installAppButton svg {
        width: 25px;
        height: 25px;
      }

      #installAppModal {
        position: fixed;
        inset: 0;
        background: #0009;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        direction: rtl;
      }

      #installAppModal .install-box {
        background: #151515;
        color: white;
        border: 1px solid #d4af37;
        border-radius: 20px;
        padding: 25px;
        width: 100%;
        max-width: 360px;
        text-align: center;
        line-height: 1.9;
        font-family: inherit;
      }

      #installAppModal h2 {
        color: #d4af37;
      }

      #installAppModal button {
        background: #d4af37;
        color: #111;
        border: none;
        border-radius: 12px;
        padding: 12px;
        width: 100%;
        font-weight: bold;
        cursor: pointer;
        margin-top: 15px;
      }
    `;

    document.head.appendChild(style);

    const button = document.createElement("button");

    button.id = "installAppButton";
    button.type = "button";
    button.setAttribute("aria-label", "تحميل التطبيق");

    button.innerHTML = `
      <svg viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           stroke-width="2"
           stroke-linecap="round"
           stroke-linejoin="round">
        <path d="M12 3v12"/>
        <path d="m7 10 5 5 5-5"/>
        <path d="M4 16v5h16v-5"/>
      </svg>
      <span>تحميل التطبيق</span>
    `;

    document.body.appendChild(button);

    button.addEventListener("click", async () => {

      if (deferredPrompt) {
        try {
          await deferredPrompt.prompt();

          const result = await deferredPrompt.userChoice;

          if (result.outcome === "accepted") {
            button.remove();
          }

          deferredPrompt = null;
          return;
        } catch (error) {
          deferredPrompt = null;
        }
      }

      if (document.getElementById("installAppModal")) return;

      const isIOS =
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" &&
         navigator.maxTouchPoints > 1);

      const modal = document.createElement("div");

      modal.id = "installAppModal";

      modal.innerHTML = `
        <div class="install-box"
             role="dialog"
             aria-modal="true">

          <h2>MDALLAL SPORTS</h2>

          <p>ثبّت التطبيق مجاناً على هاتفك</p>

          ${isIOS ? `
            <p>1. افتح المتجر باستخدام Safari.</p>
            <p>2. اضغط على زر المشاركة ⬆.</p>
            <p>3. اختر إضافة إلى الشاشة الرئيسية.</p>
            <p>4. اضغط على إضافة.</p>
          ` : `
            <p>1. افتح المتجر باستخدام Chrome.</p>
            <p>2. اضغط على قائمة النقاط الثلاث ⋮.</p>
            <p>3. اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية، إن توفر الخيار.</p>
          `}

          <button type="button" id="closeInstallModal">
            إغلاق
          </button>

        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById("closeInstallModal")
        .addEventListener("click", () => modal.remove());

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
      });

    });

    window.addEventListener("appinstalled", () => {
      button.remove();
      deferredPrompt = null;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInstall);
  } else {
    initInstall();
  }
})();
