import { Pill } from "../../../shared/adminUI";
import { skillLevelColor } from "../utils/workforceHelpers";

export default function SkillLevelBadge({ level }) {
  return <Pill label={level ?? "Unassigned"} color={level ? skillLevelColor(level) : "gray"} />;
}