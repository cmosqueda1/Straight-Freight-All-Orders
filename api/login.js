export default async function handler(req, res){
  const BASE = "https://www.straightfreightsystems.com";

  const r = await fetch(`${BASE}/Axis/Login`,{
    method:"POST",
    headers:{
      "Content-Type":"application/x-www-form-urlencoded",
      "Accept":"application/json"
    },
    body:new URLSearchParams({
      grant_type:"password",
      username:"UNIS",
      password:"Capital12345!",
      callerid:"27"
    })
  });

  const j = await r.json();
  res.json({ token:j.access_token });
}
