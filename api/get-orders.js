export default async function handler(req, res){
  const { from, to } = req.query;
  const BASE = "https://www.straightfreightsystems.com";

  const r = await fetch(
    `${BASE}/Axis/v3/Order/GetAllOrders?fromDate=${from}&toDate=${to}`,
    {
      headers:{
        Accept:"application/json",
        Authorization:req.headers.authorization
      }
    }
  );

  const data = await r.json();
  res.json(data);
}
