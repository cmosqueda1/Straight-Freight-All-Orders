global.jobs ||= {};

export default async function handler(req, res) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      error: "startDate and endDate are required"
    });
  }

  const jobId = crypto.randomUUID();

  global.jobs[jobId] = {
    status: "running",
    count: 0,
    results: []
  };

  runJob(jobId, startDate, endDate);
  res.json({ jobId });
}

async function runJob(jobId, startDate, endDate) {
  const BASE = "https://www.straightfreightsystems.com";

  // ⚠️ HARDCODED AS REQUESTED (SERVER ONLY)
  const USERNAME = "UNIS";
  const PASSWORD = "Capital12345!";
  const CALLER_ID = "27";

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  try {
    /* ---------- LOGIN ---------- */
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
      throw new Error("Login failed");
    }

    const token = loginJson.access_token;

    /* ---------- DATE LOOP ---------- */
    let cur = new Date(startDate);
    const end = new Date(endDate);

    while (cur <= end) {
      const chunkEnd = new Date(cur);
      chunkEnd.setDate(chunkEnd.getDate() + 29);
      if (chunkEnd > end) chunkEnd.setTime(end.getTime());

      const from = `${String(cur.getMonth()+1).padStart(2,"0")}/${String(cur.getDate()).padStart(2,"0")}/${cur.getFullYear()}`;
      const to   = `${String(chunkEnd.getMonth()+1).padStart(2,"0")}/${String(chunkEnd.getDate()).padStart(2,"0")}/${chunkEnd.getFullYear()}`;

      const url = `${BASE}/Axis/v3/Order/GetAllOrders?fromDate=${from}&toDate=${to}`;

      const resp = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const contentType = resp.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          global.jobs[jobId].results.push(...data);
          global.jobs[jobId].count = global.jobs[jobId].results.length;
        }
      } else {
        // rate limited / plain text response
        await resp.text();
        await sleep(3000);
      }

      await sleep(1200);
      cur.setDate(chunkEnd.getDate() + 1);
    }

    global.jobs[jobId].status = "done";
  } catch (err) {
    global.jobs[jobId].status = "error";
    global.jobs[jobId].error = err.message;
  }
}
