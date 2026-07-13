import { useParams } from "react-router-dom";

export function JobHistoryPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const decodedJobId = decodeURIComponent(jobId ?? "");

  return (
    <div>
      <h2>Job History</h2>
      <p>
        Showing history for: <strong>{decodedJobId}</strong>
      </p>
    </div>
  );
}
