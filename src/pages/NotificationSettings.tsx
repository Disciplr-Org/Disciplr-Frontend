import { useState } from 'react';
import { vaults } from "@/components/Notification/exampleNotification/example";
import { Text } from "@/components/Text";
import { Switch } from "@/components/Switch";
import { useNotificationPreferences } from "../Zustand/Store";

export default function NotificationSettings() {
  const {
    email: emailNotification,
    push: pushNotification,
    frequency,
    quietHours,
    setEmail: setEmailNotification,
    setPush: setPushNotification,
    setFrequency,
    setQuietHours,
    reset,
  } = useNotificationPreferences();

  // Local state for vault-specific notification toggles (uncontrolled by store)
  const [vaultToggles, setVaultToggles] = useState<Record<string, boolean>>({});

  function handleVaultToggle(name: string, checked: boolean) {
    setVaultToggles((prev) => ({ ...prev, [name]: checked }));
  }

  return (
    <>
      <div
        className="w-full rounded-md px-3 py-3 notification-settings-panel"
        style={{ zIndex: 'var(--z-index-base)' }}
      >
        <Text role="title" as="h2">Notification Settings</Text>
        <div>
          <div className="grid grid-cols-2 justify-center items-center mt-5">
            <Text role="body" as="p">Email Notification</Text>
            <div className="flex flex-col items-end justify-end gap-4">
              <Switch
                label="Email Notification"
                checked={emailNotification ?? false}
                onChange={setEmailNotification}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 justify-center items-center mt-5">
            <Text role="body" as="p">Push Notification</Text>
            <div className="flex flex-col items-end justify-end gap-4">
              <Switch
                label="Push Notification"
                checked={pushNotification ?? false}
                onChange={setPushNotification}
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-5">
            <label htmlFor="notification-frequency">
              <Text role="body" as="span">Notification Frequency</Text>
            </label>
            <select
              className="w-[200px] notification-settings-field"
              value={frequency}
              onChange={(e) => {
                setFrequency(e.target.value);
              }}
              name="notification-frequency"
              id="notification-frequency"
            >
              <option value="1">Occurance</option>
              <option value="2">Daily</option>
              <option value="3">Weekly</option>
              <option value="4">Never</option>
            </select>
          </div>
          <div className="flex justify-between items-center mt-5">
            <label htmlFor="quiet-hours">
              <Text role="body" as="span">Quiet Hours</Text>
            </label>
            <input
              className="w-[200px] notification-settings-field"
              type="time"
              id="quiet-hours"
              value={quietHours}
              onChange={(e) => {
                setQuietHours(e.target.value);
              }}
            />
          </div>
          <div className="flex justify-end items-center mt-5">
            <button
              className="px-4 py-2 font-medium rounded transition notification-settings-reset"
              onClick={reset}
            >
              Reset Preferences
            </button>
          </div>
        </div>
      </div>

      <div
        className="w-full rounded-md px-3 py-3 mt-5 notification-settings-panel"
        style={{ zIndex: 'var(--z-index-base)' }}
      >
        <Text role="title" as="h2">Vault Notifications</Text>
        {vaults.map((v) => (
          <div className="grid grid-cols-2 justify-center items-center mt-5" key={v.name}>
            <Text role="body" as="p">{v.name}</Text>
            <div className="flex flex-col items-end justify-end gap-4">
              <Switch
                label={`${v.name} notifications`}
                checked={vaultToggles[v.name] ?? false}
                onChange={(checked) => handleVaultToggle(v.name, checked)}
              />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .notification-settings-panel {
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .notification-settings-field {
          background: var(--surface-raised);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--spacing-1) var(--spacing-2);
        }

        .notification-settings-field:focus {
          border-color: var(--accent);
          outline: 2px solid var(--accent-transparent);
          outline-offset: 2px;
        }

        .notification-settings-reset {
          background: var(--surface-raised);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
        }

        .notification-settings-reset:hover {
          background: var(--border);
        }
      `}</style>
    </>
  );
}
