import { vaults } from "@/components/Notification/exampleNotification/example";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function NotificationSettings() {
  const [emailNotification, setEmailNotification] = useState(true);
  const [pushNotification, setPushNotification] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [quietHours, setQuietHours] = useState("12:00");
  return (
    <>
      <div className="w-full bg-white text-black rounded-md z-20 px-3">
        <h2 className="text-xl font-bold">Notification Setting </h2>
        <div>
          <div className="grid grid-cols-2 justify-center items-center mt-5">
            <p>Email Notification</p>
            <div className="flex flex-col items-end justify-end gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                {/* Hidden Checkbox */}
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailNotification}
                  onChange={(e) => {
                    setEmailNotification(e.target.checked);
                  }}
                />

                {/* The Track (Background) */}
                <div className="w-8 h-3 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[-6px] after:start-[-4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>

                {/* Optional Label Text */}
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 justify-center items-center mt-5">
            <p>Push Notification</p>
            <div className="flex flex-col items-end justify-end gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                {/* Hidden Checkbox */}
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pushNotification}
                  onChange={(e) => {
                    setPushNotification(e.target.checked);
                  }}
                />

                {/* The Track (Background) */}
                <div className="w-8 h-3 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[-6px] after:start-[-4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>

                {/* Optional Label Text */}
              </label>
            </div>
          </div>
          <div className="flex justify-between items-center mt-5">
            <p>Notification Frequency</p>
            <select
              className="w-[200px]"
              value={frequency}
              onChange={(e) => {
                setFrequency(e.target.value);
              }}
              name=""
              id=""
            >
              <option value="1">Occurance</option>
              <option value="2">Daily</option>
              <option value="3">Weekly</option>
              <option value="4">Never</option>
            </select>
          </div>
          <div className="flex justify-between items-center mt-5">
            <p>Quiet Hours</p>
            <input
              className="w-[200px]"
              type="time"
              value={quietHours}
              onChange={(e) => {
                setQuietHours(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      <div className="w-full bg-white text-black rounded-md z-20 px-3 mt-5">
        <h2 className="text-xl font-bold">Vault Notifications</h2>
        {vaults.map((v) => (
          <div className="grid grid-cols-2 justify-center items-center mt-5">
            <p>{v.name}</p>
            <div className="flex flex-col items-end justify-end gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                {/* Hidden Checkbox */}
                <input type="checkbox" className="sr-only peer" />

                {/* The Track (Background) */}
                <div className="w-8 h-3 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[-6px] after:start-[-4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>

                {/* Optional Label Text */}
              </label>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
