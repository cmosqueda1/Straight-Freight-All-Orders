import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: "Missing required query params: from, to"
      });
    }

    // 🔎 Log so you can verify sequential ranges in Vercel logs
    console.log(`GET-ORDERS invoked: ${from} → ${to}`);

    /* ======================================================
       LOGIN (SAFE FOR VERCEL)
    ====================================================== */

    const loginUrl = `https://${req.headers.host}/api/login`;

    const loginRes = await fetch(loginUrl);

    if (!loginRes.ok) {
      const text = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} ${text}`);
    }

    const loginData = await loginRes.json();

    if (!loginData.token) {
      throw new Error("Login response missing token");
    }

    const token = loginData.token;

    /* ======================================================
       FETCH ORDERS (USE EXACT DATE RANGE PASSED IN)
    ====================================================== */

    const ordersApiUrl =
      `https://straight-freight-api.example.com/orders` +
      `?from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}`;

    const ordersRes = await fetch(ordersApiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (!ordersRes.ok) {
      const text = await ordersRes.text();
      throw new Error(`Orders API failed: ${ordersRes.status} ${text}`);
    }

    const ordersData = await ordersRes.json();

    const orders = Array.isArray(ordersData)
      ? ordersData
      : ordersData?.orders || [];

    /* ======================================================
       SUCCESS RESPONSE
    ====================================================== */

    return res.status(200).json({
      from,
      to,
      count: orders.length,
      orders
    });

  } catch (err) {
    console.error("GET-ORDERS ERROR:", err);

    return res.status(500).json({
      error: "Failed to fetch orders",
      message: err.message
    });
  }
}
