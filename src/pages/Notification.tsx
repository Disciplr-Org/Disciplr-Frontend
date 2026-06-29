import Message from "@/components/Notification/Messages";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { transitionEnter } from "../utils/motion";
import { useNotification } from "@/Zustand/Store";
import { MdOutlineSettingsInputComposite } from "react-icons/md";
import { Link } from "react-router-dom";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { X } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { paginate } from "@/utils/paginate";

export default function Notification() {
  const notifications = useNotification((state) => state.notification);
  const setNotifications = useNotification((state) => state.setNotification);
  const dismiss = useNotification((state) => state.dismiss);
  const clearAll = useNotification((state) => state.clearAll);
  const [currentNotification, setCurrentNotification] = useState(notifications);
  const [currentFilterReadSeletion, setCurrentFilterReadSeletion] =
    useState("all");
  const [currentFilterTypeSeletion, setCurrentFilterTypeSeletion] =
    useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPreferenceOpen, setIsPreferenceOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const itemsPerPage = 5;

  const pagination = paginate(currentNotification, currentPage, itemsPerPage);
  const currentData = pagination.items;

  const containerRef = useRef<HTMLDivElement | null>(null); // 1. Create a reference to the container
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  useEffect(() => {
    // 2. Function to handle clicks
    const handleClickOutside = (event: MouseEvent) => {
      // If the clicked element is NOT inside our container, close it
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen((open) => {
          if (open) {
            // Restore focus to filter button if focus is currently inside the filter panel
            if (filterPanelRef.current?.contains(document.activeElement)) {
              filterButtonRef.current?.focus();
            }
            return false;
          }
          return open;
        });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterOpen((open) => {
          if (open) {
            // Restore focus to filter button if focus is currently inside the filter panel
            if (filterPanelRef.current?.contains(document.activeElement)) {
              filterButtonRef.current?.focus();
            }
            return false;
          }
          return open;
        });
      }
    };

    // 3. Attach listener to the whole document
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    // 4. Cleanup listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let filtered = notifications;

    if (!filtered) return;

    if (currentFilterReadSeletion !== "all") {
      filtered = filtered.filter(
        (noti) => noti.isRead === Boolean(Number(currentFilterReadSeletion)),
      );
    }

    if (currentFilterTypeSeletion !== "all") {
      filtered = filtered.filter(
        (noti) => noti.category === currentFilterTypeSeletion,
      );
    }
    setCurrentNotification(filtered);
    setCurrentPage(1);
  }, [currentFilterReadSeletion, currentFilterTypeSeletion, notifications]);

  // Reset to page 1 when the underlying notification list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [notifications.length]);

  useEffect(() => {
    const readLabel =
      currentFilterReadSeletion === "all"
        ? "all"
        : currentFilterReadSeletion === "0"
        ? "unread"
        : "read";
    const typeLabel =
      currentFilterTypeSeletion === "all"
        ? "all categories"
        : currentFilterTypeSeletion;

    const count = currentNotification.length;
    const countText = count === 1 ? "1 notification" : `${count} notifications`;

    if (count === 0) {
      setLiveAnnouncement(
        `No notifications found. Active filters: status ${readLabel}, category ${typeLabel}.`
      );
    } else {
      setLiveAnnouncement(
        `Showing ${countText}. Active filters: status ${readLabel}, category ${typeLabel}.`
      );
    }
  }, [currentFilterReadSeletion, currentFilterTypeSeletion, currentNotification.length]);

  const handleDismiss = (id: string) => {
    dismiss(id);
    setCurrentNotification((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    clearAll();
    setCurrentNotification([]);
    setShowClearModal(false);
    setCurrentPage(1);
  };

  const setRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        // If this is the one we clicked, update isRead. Otherwise, return as is.
        n.id === id ? { ...n, isRead: true } : n,
      ),
    );
    setCurrentNotification((prev) =>
      prev.map((n) =>
        // If this is the one we clicked, update isRead. Otherwise, return as is.
        n.id === id ? { ...n, isRead: true } : n,
      ),
    );
  };
  return (
    <>
      <div ref={containerRef} className="flex justify-between items-center">
        <div className="text-xl font-bold">Notification Page </div>
        <div className="flex gap-5 items-center justify-center">
          <div className="relative">
            <Link
              to="/notification/settings"
              aria-label="Notification Preferences"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-full)",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
            >
              <MdOutlineSettingsInputComposite size={"2rem"} />
            </Link>
          </div>

          <div className="relative">
            <button
              ref={filterButtonRef}
              aria-label="Filter notifications"
              aria-expanded={isFilterOpen}
              aria-controls="notification-filter-panel"
              onClick={() => {
                if (isPreferenceOpen) {
                  setIsPreferenceOpen(false);
                }
                setIsFilterOpen((prev) => !prev);
              }}
              className="bg-[#00c389] px-3 py-2 rounded-md"
            >
              Filter
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  ref={filterPanelRef}
                  id="notification-filter-panel"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={transitionEnter}
                  className="absolute w-[300px] h-[200px] translate-x-[-100%] bg-white text-black px-3 py-2 rounded-md"
                  style={{ zIndex: "var(--z-index-drawer)" }}
                >
                  <h2>Filter By : </h2>
                  <div className="flex justify-between">
                    <select
                      onChange={(e) => {
                        setCurrentFilterReadSeletion(e.target.value);
                      }}
                      value={currentFilterReadSeletion}
                      name="filter_by_read"
                      id="read"
                    >
                      <option value="all">All</option>
                      <option value="0">Unread</option>
                      <option value="1">Read</option>
                    </select>
                    <select
                      onChange={(e) => {
                        setCurrentFilterTypeSeletion(e.target.value);
                      }}
                      value={currentFilterTypeSeletion}
                      name="filter_by_type"
                      id="type"
                    >
                      <option value="all">All</option>
                      <option value="vault">Vault</option>
                      <option value="funds">Funds</option>
                      <option value="verification">Verification</option>
                      <option value="milestone">Milestone</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="bg-red-500 px-3 py-2 rounded-md text-white text-sm"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-5 mt-5">
        {currentData.length > 0 ? (
          currentData.map((items) => (
            <div
              key={items.id}
              className="w-full px-2 border-[#00c389] border-1 rounded-md "
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Message
                    id={items.id}
                    title={items.title}
                    message={items.message}
                    timeAgo={items.timeAgo}
                    type={items.type}
                    read={items.isRead}
                    isFullPage={true}
                    setRead={setRead}
                  />
                </div>
                <button
                  onClick={() => handleDismiss(items.id)}
                  className="mt-2 p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-100"
                  aria-label={`Dismiss notification ${items.id}`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No notifications found.</p>
        )}
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={setCurrentPage}
        ariaLabel="Notifications pagination"
        className="mt-8"
      />

      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAll}
        simpleConfirm={{
          title: "Clear all notifications",
          message: `Are you sure you want to clear all ${notifications.length} notifications? This action cannot be undone.`,
          confirmLabel: "Clear all",
        }}
      />

      {/* Screen Reader Announcements for filter updates and notification counts */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>
    </>
  );
}
