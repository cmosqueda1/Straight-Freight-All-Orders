export default async function handler(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const BASE = "https://www.straightfreightsystems.com";

    // HARDCODED (server-side only)
    const USERNAME = "UNIS";
    const PASSWORD = "Capital12345!";
    const CALLER_ID = "27";

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    /* ---------------- LOGIN ---------------- */
    const loginRes = await fetch(`${BASE}/Axis/Login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: USERNAME,
        password: PASSWORD,
        callerid: CALLER_ID
      })
    });

    const loginJson = await loginRes.json();
    if (!loginJson.access_token) {
      return res.status(401).json({ error: "Login failed" });
    }

    const token = loginJson.access_token;

    /* ---------------- DATE LOOP ---------------- */
    const results = [];
    let cur = new Date(startDate);
    const end = new Date(endDate);

    while (cur <= end) {
      const chunkEnd = new Date(cur);
      chunkEnd.setDate(chunkEnd.getDate() + 29);
      if (chunkEnd > end) chunkEnd.setTime(end.getTime());

      const from = `${String(cur.getMonth()+1).padStart(2,"0")}/${String(cur.getDate()).padStart(2,"0")}/${cur.getFullYear()}`;
      const to   = `${String(chunkEnd.getMonth()+1).padStart(2,"0")}/${String(chunkEnd.getDate()).padStart(2,"0")}/${chunkEnd.getFullYear()}`;

      const url = `${BASE}/Axis/v3/Order/GetAllOrders?fromDate=${from}&toDate=${to}`;

      const ordersRes = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const contentType = ordersRes.headers.get("content-type") || "";

      // 🔴 HANDLE RATE LIMIT / NON-JSON RESPONSES
      if (!contentType.includes("application/json")) {
        const text = await ordersRes.text();
        console.warn(`Skipped ${from} → ${to}:`, text.slice(0, 80));

        // wait longer if rate limited
        await sleep(3000);
        cur.setDate(chunkEnd.getDate() + 1);
        continue;
      }

      const data = await ordersRes.json();
      if (Array.isArray(data)) {
        results.push(...data);
      }

      // ✅ REQUIRED: throttle between calls
      await sleep(1200);

      cur.setDate(chunkEnd.getDate() + 1);
    }

    res.status(200).json(results);

  } catch (err) {
    res.status(500).json({
      error: err.message,
      hint: "Likely rate-limited; delays now added"
    });
  }
}
