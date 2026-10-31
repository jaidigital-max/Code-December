// ===== CONFIG: replace these placeholders =====
const WHATSAPP_NUMBER = "2348080432392"; // digits only, with country code e.g. 2348012345678
const FLW_PUBLIC_KEY = "FLWPUBK_TEST-daa4e8f3544abe67fbaa2e798431077d-X"; // Flutterwave public key (Dashboard > Settings > API Keys)
const FORM_ENDPOINT = "https://formspree.io/f/xnppbrvy"; // Formspree endpoint, e.g. https://formspree.io/f/xxxxxxx (saves every registration)
const AMOUNT = 2000; // promo fee in NGN
// ==============================================
const $ = (s, r = document) => r.querySelector(s);
const burger = $("#burger"), links = $("#links");
burger.onclick = () => { const o = links.classList.toggle("show"); burger.setAttribute("aria-expanded", o); };
links.addEventListener("click", e => { if (e.target.tagName === "A") { links.classList.remove("show"); burger.setAttribute("aria-expanded", false); } });

const faqs = [
["Do I need coding experience to join?","No. The training starts from zero and is built for complete beginners."],
["Do I need a laptop?","A laptop is recommended, but it is not compulsory. A compatible smartphone also works."],
["Can I participate using my smartphone?","Yes. You can learn with a compatible smartphone, though a laptop gives a smoother experience."],
["Who is this training for?","Secondary school and university students who want to use their December holiday to learn a valuable skill."],
["How much does the training cost?","The special December promo fee is ₦2,000, reduced from ₦5,000."],
["Will the classes be online?","Yes. All classes are live and online, so you can join from home. Meeting details will be shared after registration."],
["How long will the training last?","3 weeks, with 2–3 classes per week. Each class lasts 1–2 hours."],
["What will I build during the training?","A simple website of your choice, such as a personal portfolio, business, restaurant or school webpage, which you will present at the project showcase."]
];
const fq = $("#faq");
if (fq) faqs.forEach(([q, a], i) => {
  fq.insertAdjacentHTML("beforeend", `<div><button aria-expanded="false" aria-controls="a${i}" id="q${i}">${q}</button><div class="a" id="a${i}" role="region" aria-labelledby="q${i}"><div><p>${a}</p></div></div></div>`);
});
if (fq) fq.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const open = b.getAttribute("aria-expanded") === "true";
  b.setAttribute("aria-expanded", !open);
  b.nextElementSibling.classList.toggle("open", !open);
});

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll(".rv").forEach(el => io.observe(el));

const snow = $("#snow");
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  for (let i = 0; i < 28; i++) {
    const s = document.createElement("span");
    s.textContent = "❄";
    s.style.left = Math.random() * 100 + "%";
    s.style.fontSize = 8 + Math.random() * 12 + "px";
    s.style.animationDuration = 9 + Math.random() * 12 + "s";
    s.style.animationDelay = -Math.random() * 15 + "s";
    snow.appendChild(s);
  }
}

const form = $("#form"), msg = $("#msg");
if (form) {
  const payBtn = $("#payBtn"), waBtn = $("#waBtn");
  const say = (t, good = true) => { msg.textContent = t; msg.style.color = good ? "var(--cyan)" : "#ff8da1"; };
  const data = () => Object.fromEntries(new FormData(form));
  const waLink = t => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`;

  function validate(needEmail) {
    let ok = true;
    form.querySelectorAll("[required]").forEach(f => {
      const err = f.parentElement.querySelector(".err");
      let m = "";
      if (!f.value.trim()) m = "This field is required.";
      else if (f.name === "phone" && !/^[+\d][\d\s-]{6,}$/.test(f.value.trim())) m = "Enter a valid phone number.";
      err.textContent = m; if (m) ok = false;
    });
    const em = form.email, ee = em.parentElement.querySelector(".err");
    let m = "";
    if (needEmail && !em.value.trim()) m = "Email is required to pay online.";
    else if (em.value && !em.validity.valid) m = "Enter a valid email address.";
    ee.textContent = m; if (m) ok = false;
    return ok;
  }

  async function save(payload) {
    if (!FORM_ENDPOINT) return false;
    try {
      const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      return r.ok;
    } catch { return false; }
  }

  const loadFlw = () => new Promise((res, rej) => {
    if (window.FlutterwaveCheckout) return res();
    const s = document.createElement("script");
    s.src = "https://checkout.flutterwave.com/v3.js"; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

  function success(d, ref) {
    const t = `Hello! I've paid ₦${AMOUNT.toLocaleString()} for Code This Christmas.\nName: ${d.name}\nPhone: ${d.phone}\nPayment ref: ${ref}`;
    form.innerHTML = `<div style="text-align:center"><h3 class="gt" style="font-size:1.8rem">You’re in! 🎉</h3><p>Payment received. Your reference is <b>${ref}</b>.</p><p style="color:var(--muted)">Tap below to confirm on WhatsApp. Class details will be sent there.</p><a class="btn" href="${waLink(t)}" target="_blank" rel="noopener">Confirm on WhatsApp</a></div>`;
  }

  async function pay() {
    if (!validate(true)) return say("Please fix the highlighted fields.", false);
    if (!/^FLWPUBK/.test(FLW_PUBLIC_KEY)) return say("Online payment isn’t set up yet. Add the Flutterwave key in script.js, or register via WhatsApp.", false);
    const d = data(), tx_ref = "CTC-" + Date.now() + "-" + Math.floor(Math.random() * 1e5);
    payBtn.disabled = true; say("Opening secure payment…");
    save({ ...d, tx_ref, status: "pending", amount: AMOUNT });
    try { await loadFlw(); } catch { payBtn.disabled = false; return say("Couldn’t load the payment window. Check your connection and retry.", false); }
    FlutterwaveCheckout({
      public_key: FLW_PUBLIC_KEY, tx_ref, amount: AMOUNT, currency: "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: { email: d.email, phone_number: d.phone, name: d.name },
      customizations: { title: "Code This Christmas", description: "December Web Development Bootcamp" },
      callback: r => {
        if (r.status === "successful" || r.status === "completed") { save({ ...d, tx_ref, transaction_id: r.transaction_id, status: "paid", amount: AMOUNT }); success(d, tx_ref); }
        else { say("Payment was not completed. Please try again.", false); payBtn.disabled = false; }
      },
      onclose: () => { payBtn.disabled = false; }
    });
  }

  async function viaWhatsApp() {
    if (!validate(false)) return say("Please fix the highlighted fields.", false);
    const d = data();
    save({ ...d, status: "whatsapp" });
    const t = `Hello! I'd like to register for Code This Christmas.\nName: ${d.name}\nPhone: ${d.phone}\nEmail: ${d.email || "-"}\nAge range: ${d.age}\nCategory: ${d.cat}\nDevice: ${d.device}\nReason: ${d.why || "-"}`;
    window.open(waLink(t), "_blank", "noopener");
    say("Opening WhatsApp to complete your registration…");
  }

  form.addEventListener("submit", e => { e.preventDefault(); pay(); });
  payBtn.addEventListener("click", pay);
  waBtn.addEventListener("click", viaWhatsApp);
}