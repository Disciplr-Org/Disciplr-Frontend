import { useEffect, useRef } from "react";
import { useOptionalWallet } from "../context/WalletContext";
import { getNotifications } from "../components/Notification/exampleNotification/example";
import { useNotification, useNotificationPreferences } from "../Zustand/Store";
import { listAllActivity, listVaults } from "../services/vaultService";
import { buildNotifications } from "../utils/buildNotifications";
import { loadNotificationState, saveNotificationState } from "../utils/notificationPersistence";

export function useNotificationSync(): void {
  const wallet = useOptionalWallet();
  const address = wallet?.address ?? null;
  const isDemo = wallet?.isDemo ?? false;
  const vaultOverrides = useNotificationPreferences((state) => state.vaultOverrides);
  const notifications = useNotification((state) => state.notification);
  const setNotification = useNotification((state) => state.setNotification);
  const readyOwnerRef = useRef<string | null>(null);
  const dismissedRef = useRef<Set<string>>(new Set());
  const previousIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    readyOwnerRef.current = null;
    setNotification([]);

    if (isDemo) {
      setNotification([...getNotifications()]);
      return () => { active = false; };
    }
    if (!address) return () => { active = false; };

    Promise.all([listAllActivity(), listVaults()]).then(([activity, vaults]) => {
      if (!active) return;
      const relevantVaults = vaults.filter((vault) =>
        vault.creatorAddress === address || vault.verifierAddress === address,
      );
      const names = new Set(relevantVaults.map((vault) => vault.name));
      const relevantActivity = activity.filter((item) => names.has(item.vault) || item.from === address || item.to === address);
      const built = buildNotifications(relevantActivity, relevantVaults, new Date(), { vaultOverrides });
      const persisted = loadNotificationState(address);
      const dismissed = new Set(persisted.dismissed);
      const read = new Set(persisted.read);
      const visible = built.filter((item) => !dismissed.has(item.id)).map((item) => ({ ...item, isRead: read.has(item.id) }));
      dismissedRef.current = dismissed;
      previousIdsRef.current = new Set(visible.map((item) => item.id));
      setNotification(visible);
      readyOwnerRef.current = address;
    }).catch(() => {
      if (active) {
        setNotification([]);
        readyOwnerRef.current = address;
      }
    });

    return () => { active = false; };
  }, [address, isDemo, setNotification, vaultOverrides]);

  useEffect(() => {
    if (isDemo || !address || readyOwnerRef.current !== address) return;
    for (const id of previousIdsRef.current) {
      if (!notifications.some((item) => item.id === id)) dismissedRef.current.add(id);
    }
    previousIdsRef.current = new Set(notifications.map((item) => item.id));
    saveNotificationState(address, {
      read: notifications.filter((item) => item.isRead).map((item) => item.id),
      dismissed: [...dismissedRef.current],
    });
  }, [address, isDemo, notifications]);
}
