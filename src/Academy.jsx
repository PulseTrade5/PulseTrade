import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const COURSES = [
  {
    id: "complete-stock-market-course",
    emoji: "🎓",
    title: "PulseTrade Complete Stock Market Course",
    description: "Basic se Advance tak — 9 chapters mein poora stock market: Share Market basics, Market Capital, Fundamental Analysis, Candlestick Patterns, Support/Resistance, Risk Management aur Trading vs Investing.",
    price: 399,
    pages: "9 Chapters",
    level: "Beginner to Advance",
    available: true,
    pdfKey: "pulsetrade_complete_course.pdf",
  },
  {
    id: "rsi-mastery",
    emoji: "📊",
    title: "RSI Mastery",
    description: "RSI ke saath overbought/oversold zones, divergence, aur entry/exit signals.",
    price: 299,
    pages: "25+ pages",
    level: "Intermediate",
    available: true,
    pdfKey: "rsi_mastery.pdf",
  },
  {
    id: "macd-trading",
    emoji: "📈",
    title: "MACD Trading",
    description: "MACD crossover strategy, signal line, histogram — live NSE examples ke saath.",
    price: 299,
    pages: "25+ pages",
    level: "Intermediate",
    available: false,
    pdfKey: "macd_trading.pdf",
  },
  {
    id: "supertrend-strategy",
    emoji: "🎯",
    title: "Supertrend Strategy",
    description: "Supertrend indicator ke saath trend following — buy/sell signals aur trailing stop loss.",
    price: 299,
    pages: "20+ pages",
    level: "Intermediate",
    available: false,
    pdfKey: "supertrend_strategy.pdf",
  },
  {
    id: "trading-psychology",
    emoji: "🧠",
    title: "Trading Psychology",
    description: "Fear, greed, FOMO — psychological traps se kaise bachein. Winning mindset build karo.",
    price: 399,
    pages: "35+ pages",
    level: "Advanced",
    available: false,
    pdfKey: "trading_psychology.pdf",
  },
  {
    id: "position-sizing",
    emoji: "💰",
    title: "Position Sizing",
    description: "Capital protect karo — risk per trade calculate karo, lot size nikalo, drawdown avoid karo.",
    price: 199,
    pages: "15+ pages",
    level: "Beginner",
    available: false,
    pdfKey: "position_sizing.pdf",
  },
];

const LEVEL_COLOR = {
  "Beginner to Advance": "#7C3AED",
  Beginner: "#22c55e",
  Intermediate: "#f59e0b",
  Advanced: "#ef4444",
};

export default function Academy({ isDark }) {
  const [user, setUser] = useState(null);
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loadingPayment, setLoadingPayment] = useState(null);
  const [toast, setToast] = useState(null);

  const bg = isDark ? "#0f0f1a" : "#f8f9ff";
  const card = isDark ? "#1a1a2e" : "#ffffff";
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const subtext = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#2d2d44" : "#e2e8f0";
  const gold = "#f59e0b";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    loadPurchases();
  }, []);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadPurchases = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("course_purchases")
        .select("course_id")
        .eq("user_id", session.user.id)
        .eq("status", "paid");
      if (data) setPurchasedCourses(data.map((d) => d.course_id));
    } catch (e) {
      console.error("Purchase load error:", e);
    }
  };

  const handleBuy = async (course) => {
    if (!user) {
      showToast("Pehle login karo! 🔐", "error");
      return;
    }
    if (!course.available) {
      showToast("Yeh course jald aa raha hai! 🚀", "info");
      return;
    }

    setLoadingPayment(course.id);
    try {
      const orderId = `ACADEMY_${course.id}_${user.id}_${Date.now()}`;

      const { error: insertError } = await supabase.from("course_purchases").insert({
        user_id: user.id,
        course_id: course.id,
        order_id: orderId,
        amount: course.price,
        status: "pending",
      });

      if (insertError) throw insertError;

      const orderRes = await fetch("/api/cashfree-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: course.title,
          amount: course.price,
          userEmail: user.email,
          userId: user.id,
          orderId: orderId,
          returnUrl: `${window.location.origin}/?academy_order=${orderId}&course=${course.id}`,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.payment_session_id) throw new Error("Payment session failed");

      if (!window.Cashfree) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const cashfree = window.Cashfree({ mode: "production" });
      cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_self",
      });
    } catch (err) {
      console.error("Payment error:", err);
      showToast("Payment mein error aaya. Dobara try karo. ❌", "error");
    } finally {
      setLoadingPayment(null);
    }
  };

  const handleDownload = async (course) => {
    showToast("PDF download ho rahi hai... 📥", "info");
    try {
      const { data, error } = await supabase.storage
        .from("academy-pdfs")
        .createSignedUrl(course.pdfKey, 60);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e) {
      showToast("PDF abhi upload nahi hui. Jald milegi! 🙏", "error");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("academy_order");
    const courseId = params.get("course");
    if (orderId && courseId) {
      verifyPayment(orderId, courseId);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const verifyPayment = async (orderId, courseId) => {
    try {
      const res = await fetch(`/api/verify-payment?order_id=${orderId}`);
      const data = await res.json();
      if (data.status === "PAID") {
        await supabase
          .from("course_purchases")
          .update({ status: "paid" })
          .eq("order_id", orderId);
        setPurchasedCourses((prev) => [...prev, courseId]);
        showToast("Payment successful! PDF download karo 🎉", "success");
      } else {
        showToast("Payment pending hai. Thodi der baad check karo.", "info");
      }
    } catch (e) {
      console.error("Verify error:", e);
    }
  };

  const isPurchased = (courseId) => purchasedCourses.includes(courseId);

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: "90px" }}>
      {toast && (
        <div style={{
          position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#22c55e" : toast.type === "error" ? "#ef4444" : "#3b82f6",
          color: "#fff", padding: "10px 20px", borderRadius: "12px",
          fontSize: "14px", fontWeight: "600", zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)", maxWidth: "320px", textAlign: "center"
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{
        background: isDark
          ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
          : "linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)",
        padding: "24px 16px 20px",
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "28px" }}>🎓</span>
          <h1 style={{ color: gold, fontSize: "22px", fontWeight: "800", margin: 0, letterSpacing: "-0.3px" }}>
            PulseTrade Academy
          </h1>
        </div>
        <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
          Trading seekho — apni bhasha mein, apni pace mein 🚀
        </p>
        <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[{ label: "Complete Course", icon: "🎓" }, { label: "Hindi PDFs", icon: "📄" }, { label: "NSE/BSE Focus", icon: "📈" }].map((tag) => (
            <span key={tag.label} style={{
              background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
              color: gold, fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px"
            }}>
              {tag.icon} {tag.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        <p style={{ color: subtext, fontSize: "12px", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>
          All Courses
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {COURSES.map((course) => {
            const bought = isPurchased(course.id);
            const isLoading = loadingPayment === course.id;

            return (
              <div key={course.id} style={{
                background: card,
                border: `1px solid ${bought ? "rgba(34,197,94,0.4)" : border}`,
                borderRadius: "16px", overflow: "hidden",
                boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                position: "relative",
                opacity: !course.available && !bought ? 0.85 : 1,
              }}>
                {!course.available && !bought && (
                  <div style={{
                    position: "absolute", top: "12px", right: "12px",
                    background: "rgba(100,116,139,0.2)", border: "1px solid rgba(100,116,139,0.3)",
                    color: subtext, fontSize: "10px", fontWeight: "700",
                    padding: "3px 8px", borderRadius: "8px", letterSpacing: "0.5px"
                  }}>COMING SOON</div>
                )}
                {bought && (
                  <div style={{
                    position: "absolute", top: "12px", right: "12px",
                    background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)",
                    color: "#22c55e", fontSize: "10px", fontWeight: "700",
                    padding: "3px 8px", borderRadius: "8px"
                  }}>✅ PURCHASED</div>
                )}

                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "12px",
                      background: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "22px", flexShrink: 0
                    }}>{course.emoji}</div>
                    <div style={{ flex: 1, paddingRight: bought || !course.available ? "80px" : "0" }}>
                      <h3 style={{ color: text, fontSize: "15px", fontWeight: "700", margin: "0 0 4px" }}>
                        {course.title}
                      </h3>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ color: LEVEL_COLOR[course.level], fontSize: "10px", fontWeight: "700", letterSpacing: "0.5px" }}>
                          ● {course.level.toUpperCase()}
                        </span>
                        <span style={{ color: subtext, fontSize: "10px" }}>•</span>
                        <span style={{ color: subtext, fontSize: "10px" }}>{course.pages}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ color: subtext, fontSize: "13px", lineHeight: "1.5", margin: "0 0 14px" }}>
                    {course.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      {bought ? (
                        <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: "600" }}>Unlocked 🔓</span>
                      ) : (
                        <div>
                          <span style={{ color: gold, fontSize: "20px", fontWeight: "800" }}>₹{course.price}</span>
                          <span style={{ color: subtext, fontSize: "12px", marginLeft: "4px" }}>one-time</span>
                        </div>
                      )}
                    </div>

                    {bought ? (
                      <button onClick={() => handleDownload(course)} style={{
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "#fff", border: "none", borderRadius: "10px",
                        padding: "10px 18px", fontSize: "13px", fontWeight: "700",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                      }}>📥 Download PDF</button>
                    ) : course.available ? (
                      <button onClick={() => handleBuy(course)} disabled={isLoading} style={{
                        background: isLoading ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg, #f59e0b, #d97706)",
                        color: isLoading ? "#94a3b8" : "#fff",
                        border: "none", borderRadius: "10px",
                        padding: "10px 18px", fontSize: "13px", fontWeight: "700",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: "6px",
                        minWidth: "110px", justifyContent: "center"
                      }}>{isLoading ? "Loading..." : `🛒 Buy ₹${course.price}`}</button>
                    ) : (
                      <button onClick={() => showToast("Jald aa raha hai! Notify karenge 🔔", "info")} style={{
                        background: "rgba(100,116,139,0.15)",
                        color: subtext, border: `1px solid ${border}`,
                        borderRadius: "10px", padding: "10px 18px",
                        fontSize: "13px", fontWeight: "600", cursor: "pointer"
                      }}>🔔 Notify Me</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: "20px", padding: "14px",
          background: isDark ? "rgba(245,158,11,0.05)" : "rgba(245,158,11,0.04)",
          border: `1px solid rgba(245,158,11,0.15)`, borderRadius: "12px", textAlign: "center"
        }}>
          <p style={{ color: subtext, fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
            🔒 Secure payment via Cashfree • PDF lifetime access • SEBI disclaimer: Yeh educational content hai, investment advice nahi.
          </p>
        </div>
      </div>
    </div>
  );
}
