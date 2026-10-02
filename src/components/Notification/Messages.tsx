import { useState } from "react";
import { getNotificationTypeMapping } from "./notificationType";
import { formatRelativeTime } from "../../utils/relativeTime";
import "./Messages.css";

const MAX_PREVIEW_LENGTH = 30;

interface MessageProps {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  isFullPage: boolean;
  setRead: (id: string) => void;
  onDismiss: (id: string) => void;
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
  onDismiss,
}: MessageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mapping = getNotificationTypeMapping(type);
  const Icon = mapping?.icon;
  const color = mapping?.color ?? "var(--muted)";
  const label = mapping?.label ?? "Notification";
  const safeTimestamp =
    typeof timestamp === "string" && timestamp.trim().length > 0
      ? timestamp
      : "";
  const timeAgo = safeTimestamp ? formatRelativeTime(safeTimestamp) : "";
  const safeTitle =
    typeof title === "string" && title.trim().length > 0
      ? title
      : "Untitled notification";
  const safeMessage = typeof message === "string" ? message : "";
  const safeRead = Boolean(read);
  const previewMessage =
    safeMessage.length > MAX_PREVIEW_LENGTH
      ? `${safeMessage.slice(0, MAX_PREVIEW_LENGTH)}...`
      : safeMessage;

  const handleOpen = () => {
    if (typeof id !== "string" || id.length === 0) {
      return;
    }
    setIsOpen(true);
    setRead(id);
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
                  className={`font-bold ${
                    safeRead
                      ? "message-title--read"
                      : "message-title--unread"
                  }`}
                >
                  {safeTitle}
                </h2>
                <p className="message-preview text-sm">
                  {previewMessage}
                </p>
              </div>

              {isFullPage && (
                <button
                  type="button"
                  onClick={() => onDismiss(id)}
                  className="message-delete-button px-2 py-1 rounded-md"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="flex justify-between w-full">
              <div
                className={`message-new-badge rounded-md mb-1 px-2${
                  safeRead ? " message-new-badge--read" : ""
                }`}
              >
                <p className="font-bold">{safeRead ? "" : "New"}</p>
              </div>

              <p
                className="message-timestamp text-sm"
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
          className={`message-overlay fixed ${
            isFullPage
              ? "w-[90%] lg:w-[40%] h-auto min-h-[40%] left-[50%] translate-x-[-50%] top-[5%]"
              : "w-full h-full left-0 top-0"
          }`}
        >
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close message"
              className="message-overlay-close rounded-full w-7 h-7 flex items-center justify-center"
            >
              <span aria-hidden="true">X</span>
            </button>
          </div>

          <div className="px-2">
            <h2 className="message-overlay-title font-bold text-xl">
              {safeTitle}
            </h2>
            <p className="message-overlay-body mt-5">{safeMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}