export default async function handler(req, res) {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: "Missing required query params: from, to"
      });
    }

    // Convert YYYY-MM-DD → MM/DD/YYYY
    const toMDY = (iso) => {
      const [y, m, d] = iso.split("-");
      return `${m}/${d}/${y}`;
    };

    const fromDate = toMDY(from);
    const toDate = toMDY(to);

    console.log(`GET-ORDERS ${fromDate} → ${toDate}`);

    /* ======================================================
       LOGIN (reuse existing login.js)
    ====================================================== */

    const loginRes = await fetch(
      `https://${req.headers.host}/api/login`
    );

    if (!loginRes.ok) {
      const text = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} ${text}`);
    }

    const { token } = await loginRes.json();

    if (!token) {
      throw new Error("Login did not return token");
    }

    /* ======================================================
       GET ALL ORDERS (Straight Freight Axis API)
    ====================================================== */

    const ordersUrl =
      `https://www.straightfreightsystems.com/Axis/v3/Order/GetAllOrders` +
      `?fromDate=${encodeURIComponent(fromDate)}` +
      `&toDate=${encodeURIComponent(toDate)}`;

    const ordersRes = await fetch(ordersUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!ordersRes.ok) {
      const text = await ordersRes.text();
      throw new Error(`Orders API failed: ${ordersRes.status} ${text}`);
    }

    const orders = await ordersRes.json();

    return res.status(200).json({
      from: fromDate,
      to: toDate,
      count: Array.isArray(orders) ? orders.length : 0,
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
