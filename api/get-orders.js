export default async function handler(req, res) {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: "Missing required query params: from, to"
      });
    }

    console.log(`GET-ORDERS: ${from} → ${to}`);

    /* ======================================================
       LOGIN (CALL LOCAL API SAFELY)
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
       FETCH ORDERS (EXACT DATE RANGE)
    ====================================================== */

    const ordersUrl =
      `https://straight-freight-api.example.com/orders` +
      `?from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}`;

    const ordersRes = await fetch(ordersUrl, {
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
