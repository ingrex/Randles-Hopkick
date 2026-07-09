import { Pill } from "../../../shared/adminUI";
import { statusColor, STATUS_LABELS } from "../utils/workforceHelpers";

export default function StatusBadge({ status }) {
  return <Pill label={STATUS_LABELS[status] ?? status} color={statusColor(status)} />;
}