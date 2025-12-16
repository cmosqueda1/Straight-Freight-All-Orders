export default function handler(req, res) {
  const job = global.jobs?.[req.query.jobId];
  if (!job || job.status !== "done") {
    return res.status(400).json({ error: "Not ready" });
  }
  res.json(job.results);
}
