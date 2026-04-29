import { CiBellOn, CiBellOff } from "react-icons/ci";

import Message from "./Messages";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { transitionEnter } from "../../utils/motion";

import { Link } from "react-router-dom";
import { useNotification } from "@/Zustand/Store";
export default function NotificationIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useNotification((state) => state.notification);
  const setNotifications = useNotification((state) => state.setNotification);
  const [unread, setUnread] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<
    typeof notifications
  >([]);
  const getNotificationStatus = () => {
    const recent = notifications.slice(0, 5);
    setRecentNotifications(recent);

    // FIX: Unread should be where isRead is FALSE
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    setUnread(unreadCount);
  };
  useEffect(() => {
    if (notifications.length <= 0) return;
    getNotificationStatus();
  }, [notifications]);

  const markAllAsRead = () => {
    console.log("marked all as read");

    // FIX: Create a NEW array with updated objects
    const updatedNotifications = notifications.map((n) => ({
      ...n,
      isRead: true,
    }));

    // Set the new state
    setNotifications(updatedNotifications);

    // getNotificationStatus will run automatically via your useEffect
    // because [notifications] is in the dependency array.
  };

  const setRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        // If this is the one we clicked, update isRead. Otherwise, return as is.
        n.id === id ? { ...n, isRead: true } : n,
      ),
    );
  };

  const containerRef = useRef<any>(null); // 1. Create a reference to the container

  useEffect(() => {
    // 2. Function to handle clicks
    const handleClickOutside = (event: any) => {
      // If the clicked element is NOT inside our container, close it
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    // 3. Attach listener to the whole document
    document.addEventListener("mousedown", handleClickOutside);

    // 4. Cleanup listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <>
      <div ref={containerRef} className="relative inline-block">
        <div
          onClick={() => {
            setIsOpen((prev) => !prev);
          }}
        >
          {notifications.filter((n) => !n.isRead).length > 0 ? (
            <CiBellOn size="2rem" />
          ) : (
            <CiBellOff size="2rem" />
          )}

          {notifications.length > 0 && (
            <div className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white flex items-center justify-center rounded-full text-[10px] font-bold transform translate-x-1/2 -translate-y-1/2">
              {unread}
            </div>
          )}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={transitionEnter}
              className="absolute w-[300px] h-[500px] bg-white shadow-2xl mt-2 -translate-x-[90%] z-50"
            >
              <div className="w-full h-full flex flex-col items-center justify-between pb-5">
                <div className="w-full flex flex-col justify-center items-center ">
                  <div className="flex justify-between items-center py-3 gap-10 px-2 bg-[#121a2a]">
                    <h2 className="text-white font-bold text-xl">
                      Notifications
                    </h2>
                    <button
                      onClick={markAllAsRead}
                      className="bg-white text-[#00c389] px-3 rounded-lg shadow-lg"
                    >
                      Mark All As Read
                    </button>
                  </div>
                  <div className="flex w-full flex-col gap-5 mt-5 max-h-[330px] overflow-y-auto">
                    {recentNotifications.map((items) => (
                      <div key={items.id} className="w-full px-2">
                        <Message
                          id={items.id}
                          title={items.title}
                          message={items.message}
                          timeAgo={items.timeAgo}
                          type={items.type}
                          read={items.isRead}
                          isFullPage={false}
                          setRead={setRead}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Link
                  to="/notification"
                  style={{
                    color: "var(--surface)",
                    background: "var(--accent)",
                    padding: "0.5rem 1rem",
                    borderRadius: "var(--radius-full)",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                  }}
                >
                  View All Notification
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
