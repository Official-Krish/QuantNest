import { useEffect, useState } from "react";
import { MAINTENANCE_EVENT, isMaintenanceMode } from "@/http";

export function MaintenanceBanner() {
  const [show, setShow] = useState(isMaintenanceMode());

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener(MAINTENANCE_EVENT, handler);
    return () => window.removeEventListener(MAINTENANCE_EVENT, handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] bg-gradient-to-r from-amber-600 to-orange-600 text-white text-center py-2.5 px-4 text-sm font-medium shadow-lg">
      <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse mr-2 align-middle" />
      Quantnest is currently under maintenance. We'll be back shortly.
    </div>
  );
}
