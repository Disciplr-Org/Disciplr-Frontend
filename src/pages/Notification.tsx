import Message from "@/components/Notification/Messages";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { transitionEnter } from "../utils/motion";
import { useNotification } from "@/Zustand/Store";
import { MdOutlineSettingsInputComposite } from "react-icons/md";
import { Link } from "react-router-dom";

export default function Notification() {
  const notifications = useNotification((state) => state.notification);
  const setNotifications = useNotification((state) => state.setNotification);
  const [currentNotification, setCurrentNotification] = useState(notifications);
  const [currentFilterReadSeletion, setCurrentFilterReadSeletion] =
    useState("all");
  const [currentFilterTypeSeletion, setCurrentFilterTypeSeletion] =
    useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPreferenceOpen, setIsPreferenceOpen] = useState(false);
  const itemsPerPage = 5;

  // 1. Calculate the data for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = currentNotification.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const containerRef = useRef<any>(null); // 1. Create a reference to the container

  useEffect(() => {
    // 2. Function to handle clicks
    const handleClickOutside = (event: any) => {
      // If the clicked element is NOT inside our container, close it
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsFilterOpen(false);
      }
    };

    // 3. Attach listener to the whole document
    document.addEventListener("mousedown", handleClickOutside);

    // 4. Cleanup listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filterNotification = () => {
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
  };
  useEffect(() => {
    filterNotification();
  }, [currentFilterReadSeletion, currentFilterTypeSeletion, notifications]);

  // 2. Calculate total pages
  const totalPages = Math.ceil(currentNotification.length / itemsPerPage);
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
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
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
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={transitionEnter}
                  className="absolute w-[300px] h-[200px] translate-x-[-100%] bg-white text-black px-3 py-2 rounded-md z-20"
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
        </div>
      </div>

      <div className="flex w-full flex-col gap-5 mt-5">
        {currentData.length > 0 ? (
          currentData.map((items) => (
            <div
              key={items.id}
              className="w-full px-2 border-[#00c389] border-1 rounded-md "
            >
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
          ))
        ) : (
          <p>No notifications found.</p>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col justify-end">
        <div className="flex justify-center gap-4 mt-8">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-4 py-2 bg-[#121a2a] rounded disabled:opacity-50 text-white"
          >
            Previous
          </button>

          <span className="flex items-center">
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-2 bg-[#00c389] rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
