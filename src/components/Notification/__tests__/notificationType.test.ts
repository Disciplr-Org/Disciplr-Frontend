import { describe, it, expect } from "vitest";
import {
  getNotificationTypeMapping,
  NOTIFICATION_TYPE_MAP,
  FALLBACK_MAPPING,
  NotificationTypeKey,
} from "../notificationType";

const KNOWN_TYPES: NotificationTypeKey[] = [
  "vault_created_successfully",
  "milestone_validated",
  "vault_deadline_approaching",
  "funds_released",
  "funds_redirected",
  "verification_requested",
  "system_announcement",
];

describe("getNotificationTypeMapping", () => {
  it.each(KNOWN_TYPES)(
    "resolves '%s' to a defined icon, non-empty color, and non-empty label",
    (type) => {
      const mapping = getNotificationTypeMapping(type);
      expect(mapping.icon).toBeDefined();
      expect(typeof mapping.icon).toBe("function");
      expect(mapping.color).toBeTruthy();
      expect(mapping.label).toBeTruthy();
    },
  );

  it.each(KNOWN_TYPES)(
    "resolves '%s' to the exact entry in NOTIFICATION_TYPE_MAP",
    (type) => {
      const mapping = getNotificationTypeMapping(type);
      expect(mapping).toBe(NOTIFICATION_TYPE_MAP[type]);
    },
  );

  it("returns the fallback mapping for an unknown type string", () => {
    const mapping = getNotificationTypeMapping("totally_unknown_type");
    expect(mapping).toBe(FALLBACK_MAPPING);
  });

  it("returns the fallback mapping for an empty string", () => {
    const mapping = getNotificationTypeMapping("");
    expect(mapping).toBe(FALLBACK_MAPPING);
  });

  it("returns the fallback mapping for a near-miss type (typo)", () => {
    const mapping = getNotificationTypeMapping("funds_release"); // missing 'd'
    expect(mapping).toBe(FALLBACK_MAPPING);
  });

  it("fallback has a valid icon, color, and label", () => {
    expect(FALLBACK_MAPPING.icon).toBeDefined();
    expect(typeof FALLBACK_MAPPING.icon).toBe("function");
    expect(FALLBACK_MAPPING.color).toBeTruthy();
    expect(FALLBACK_MAPPING.label).toBeTruthy();
  });

  it("every known type has a unique label", () => {
    const labels = KNOWN_TYPES.map(
      (t) => NOTIFICATION_TYPE_MAP[t].label,
    );
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });
});
