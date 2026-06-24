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
  const unreadCount = useNotification((state) => state.unreadCount);
  const markRead = useNotification((state) => state.markRead);
  const markAllRead = useNotification((state) => state.markAllRead);
  const recentNotifications = notifications.slice(0, 5);

  const containerRef = useRef<HTMLDivElement | null>(null); // 1. Create a reference to the container

  useEffect(() => {
    // 2. Function to handle clicks
    const handleClickOutside = (event: MouseEvent) => {
      // If the clicked element is NOT inside our container, close it
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
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
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Open notifications, ${unreadCount} unread`
              : "Open notifications, no unread"
          }
          onClick={() => {
            setIsOpen((prev) => !prev);
          }}
          className="relative border-0 bg-transparent p-0 text-inherit cursor-pointer"
        >
          {unreadCount > 0 ? (
            <CiBellOn size="2rem" />
          ) : (
            <CiBellOff size="2rem" />
          )}

          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white flex items-center justify-center rounded-full text-[10px] font-bold transform translate-x-1/2 -translate-y-1/2">
              {unreadCount}
            </div>
          )}
        </button>

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
                      onClick={markAllRead}
                      disabled={unreadCount === 0}
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
                          setRead={markRead}
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
