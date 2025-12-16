export default function handler(req, res) {
  const job = global.jobs?.[req.query.jobId];
  if (!job) return res.status(404).json({ error: "Job not found" });

  res.json({
    status: job.status,
    count: job.count
  });
}
