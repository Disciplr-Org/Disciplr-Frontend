import { useState } from "react";
import { getNotificationTypeMapping } from "./notificationType";
import { formatRelativeTime } from "../../utils/relativeTime";

/**
 * Invariants enforced by this component:
 * - `id` must be a non-empty string; `setRead` is only invoked with a valid id.
 * - `setRead` is invoked at most once per message open transition (idempotent
 *   for already-read messages) so retries/duplicate clicks cannot double-fire.
 * - `title`/`message`/`timestamp` are coerced to safe strings before render so
 *   malformed upstream data cannot crash the tree or leak `undefined`.
 * - `type` is resolved through `getNotificationTypeMapping`, which is expected
 *   to return a safe fallback for unknown types.
 */

const MAX_PREVIEW_LENGTH = 30;

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function isValidId(id: unknown): id is string {
  return typeof id === "string" && id.trim().length > 0;
}

interface MessageProps {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  isFullPage: boolean;
  setRead: (id: string) => void;
}

export default function Message({
  id,
  type,
  title,
  message,
  timestamp,
  read,
  isFullPage,
  setRead,
}: MessageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { icon: Icon, color, label } = getNotificationTypeMapping(
    safeString(type)
  );
  const safeTitle = safeString(title);
  const safeMessage = safeString(message);
  const timeAgo = formatRelativeTime(safeString(timestamp));

  const handleOpen = () => {
    setIsOpen(true);
    // Only mark as read when we have a valid id and it is not already read.
    // This keeps the transition idempotent under duplicate clicks/retries.
    if (!read && isValidId(id) && typeof setRead === "function") {
      setRead(id);
    }
  };

  return (
    <>
      <div className="cursor-pointer w-full">
        <div className="flex gap-5">
          <Icon
            size={30}
            color={color}
            aria-label={label}
            role="img"
          />
          <div className="w-full">
            <div className="flex justify-between items-center">
              <div
                onClick={handleOpen}
                className="w-full"
              >
                <h2
                  className={`${
                    read
                      ? "text-[#667589]"
                      : isFullPage
                      ? "text-white"
                      : "text-black"
                  } font-bold`}
                >
                  {safeTitle}
                </h2>
                <p className="text-sm text-[#667589]">
                  {safeMessage.length > MAX_PREVIEW_LENGTH
                    ? `${safeMessage.slice(0, MAX_PREVIEW_LENGTH)}...`
                    : safeMessage}
                </p>
              </div>

              {isFullPage && (
                <button className="bg-[#00c389] px-2 py-1 rounded-md">
                  Delete
                </button>
              )}
            </div>

            <div className="flex justify-between w-full">
              <div
                className={`${
                  !read ? "bg-[#00c389]" : ""
                } rounded-md mb-1 px-2`}
              >
                <p className="font-bold">{read ? "" : "New"}</p>
              </div>

              <p
                className="text-sm text-[#667589]"
                data-testid="message-time-ago"
              >
                {timeAgo}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className={`fixed ${
            isFullPage
              ? "w-[90%] lg:w-[40%] h-auto min-h-[40%] bg-white left-[50%] translate-x-[-50%] top-[5%]"
              : "w-full h-full bg-white left-0 top-0"
          }`}
        >
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close message"
              className="bg-red-500 rounded-full text-white w-7 h-7 flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <span aria-hidden="true">X</span>
            </button>
          </div>

          <div className="px-2">
            <h2 className="text-black font-bold text-xl">{safeTitle}</h2>
            <p className="mt-5 text-[#667589]">{safeMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}