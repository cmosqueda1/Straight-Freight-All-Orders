global.jobs ||= {};

export default async function handler(req, res) {
  const id = crypto.randomUUID();

  global.jobs[id] = {
    status: "running",
    count: 0,
    results: []
  };

  // fire-and-forget async work
  runJob(id, req.query.startDate, req.query.endDate);

  res.json({ jobId: id });
}

async function runJob(id, startDate, endDate) {
  const BASE = "https://www.straightfreightsystems.com";
  const USERNAME = "UNIS";
  const PASSWORD = "Capital12345!";
  const CALLER_ID = "27";
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  try {
    // LOGIN
    const login = await fetch(`${BASE}/Axis/Login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        username: USERNAME,
        password: PASSWORD,
        callerid: CALLER_ID
      })
    }).then(r => r.json());

    const token = login.access_token;

    let cur = new Date(startDate);
    const end = new Date(endDate);

    while (cur <= end) {
      const chunkEnd = new Date(cur);
      chunkEnd.setDate(chunkEnd.getDate() + 29);
      if (chunkEnd > end) chunkEnd.setTime(end.getTime());

      const from = cur.toLocaleDateString("en-US");
      const to = chunkEnd.toLocaleDateString("en-US");

      const res = await fetch(
        `${BASE}/Axis/v3/Order/GetAllOrders?fromDate=${from}&toDate=${to}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const type = res.headers.get("content-type") || "";
      if (type.includes("application/json")) {
        const data = await res.json();
        if (Array.isArray(data)) {
          global.jobs[id].results.push(...data);
          global.jobs[id].count = global.jobs[id].results.length;
        }
      }

      await sleep(1200);
      cur.setDate(chunkEnd.getDate() + 1);
    }

    global.jobs[id].status = "done";
  } catch (e) {
    global.jobs[id].status = "error";
    global.jobs[id].error = e.message;
  }
}
