import { SiInternetarchive } from "react-icons/si";
import { HiOutlineCheckBadge } from "react-icons/hi2";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { FaSquareArrowUpRight, FaUserCheck } from "react-icons/fa6";
import { IoMegaphoneOutline } from "react-icons/io5";
import { CiBellOn } from "react-icons/ci";
import { IconType } from "react-icons";

export type NotificationTypeKey =
  | "vault_created_successfully"
  | "milestone_validated"
  | "vault_deadline_approaching"
  | "funds_released"
  | "funds_redirected"
  | "verification_requested"
  | "system_announcement";

export interface NotificationTypeMapping {
  icon: IconType;
  /** CSS color value (hex, named, or var(--token)) */
  color: string;
  /** Accessible screen-reader label for this notification category */
  label: string;
}

const FALLBACK_MAPPING: NotificationTypeMapping = {
  icon: CiBellOn,
  color: "#667589",
  label: "Notification",
};

const NOTIFICATION_TYPE_MAP: Record<NotificationTypeKey, NotificationTypeMapping> = {
  vault_created_successfully: {
    icon: SiInternetarchive,
    color: "#667589",
    label: "Vault created successfully",
  },
  milestone_validated: {
    icon: HiOutlineCheckBadge,
    color: "#f97316",
    label: "Milestone validated",
  },
  vault_deadline_approaching: {
    icon: FiAlertTriangle,
    color: "#ef4444",
    label: "Vault deadline approaching",
  },
  funds_released: {
    icon: FaSquareArrowUpRight,
    color: "#00c389",
    label: "Funds released",
  },
  funds_redirected: {
    icon: FiRefreshCw,
    color: "#f59e0b",
    label: "Funds redirected",
  },
  verification_requested: {
    icon: FaUserCheck,
    color: "#3b82f6",
    label: "Verification requested",
  },
  system_announcement: {
    icon: IoMegaphoneOutline,
    color: "#667589",
    label: "System announcement",
  },
};

/**
 * Returns the icon, color, and accessible label for a given notification type.
 * Falls back to a safe default for any unknown or missing type.
 */
export function getNotificationTypeMapping(type: string): NotificationTypeMapping {
  return (
    NOTIFICATION_TYPE_MAP[type as NotificationTypeKey] ?? FALLBACK_MAPPING
  );
}

export { FALLBACK_MAPPING, NOTIFICATION_TYPE_MAP };
