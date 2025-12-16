import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "Missing from/to dates" });
    }

    // 🔍 DEBUG LOG — YOU SHOULD SEE DIFFERENT DATES EACH CALL
    console.log("GET ORDERS:", from, "→", to);

    const tokenRes = await fetch(`https://${req.headers.host}/api/login`);
    const { token } = await tokenRes.json();

    const apiRes = await fetch(
      `https://straight-freight-api.example.com/orders?from=${from}&to=${to}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const orders = await apiRes.json();

    res.status(200).json({
      from,
      to,
      orders: orders || []
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}
