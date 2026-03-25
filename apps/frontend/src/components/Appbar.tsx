import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "motion/react";
import { ProfileDropDown } from "./Profile-Dropdown";
import {
  AUTH_STATE_EVENT,
  apiVerifyToken,
  clearAuthSession,
  hasAuthSession,
  setAuthSession,
} from "@/http";

interface NavItem { name: string; link: string }

const NAV_PUBLIC: NavItem[] = [
  { name: "Pricing",  link: "/pricing"  },
  { name: "Examples", link: "/examples" },
  { name: "About",    link: "/about"    },
];

const NAV_AUTH: NavItem[] = [
  { name: "Dashboard",       link: "/dashboard"         },
  { name: "Profile",         link: "/profile"           },
  { name: "Create Workflow", link: "/create/onboarding" },
];

export const Appbar = () => {
  const [hovered,         setHovered]         = useState<number | null>(null);
  const [scrolled,        setScrolled]        = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasAuthSession());
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  useEffect(() => {
    const sync = async () => {
      try   { await apiVerifyToken(); setAuthSession();   setIsAuthenticated(true);  }
      catch { clearAuthSession();                          setIsAuthenticated(false); }
    };
    void sync();
    const handler = (e: Event) => {
      setIsAuthenticated((e as CustomEvent<{isAuthenticated?:boolean}>).detail?.isAuthenticated === true);
    };
    window.addEventListener(AUTH_STATE_EVENT, handler as EventListener);
    return () => window.removeEventListener(AUTH_STATE_EVENT, handler as EventListener);
  }, []);

  const items = isAuthenticated ? NAV_AUTH : NAV_PUBLIC;

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1,  y:  0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Backdrop — only appears after scroll */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              background: "rgba(4, 4, 4, 0.82)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.055)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between px-25 h-[60px] border-b border-neutral-800">

        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 shrink-0 no-underline group"
        >
          <img
            src="/Logo.png"
            alt="QuantNest"
            width={32}
            height={32}
            className="rounded-full opacity-90 group-hover:opacity-100 transition-opacity duration-200"
          />
          <span className="text-[16px] font-medium text-white/90 tracking-[-0.01em] group-hover:text-white transition-colors duration-200">
            QuantNest
          </span>
        </a>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {items.map((item, idx) => (
            <div key={item.name} className="relative">
              <a
                href={item.link}
                className="relative block px-3.5 py-1.5 text-[14px] font-normal tracking-[-0.01em] no-underline transition-colors duration-150"
                style={{ color: hovered === idx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Hover bg */}
                <AnimatePresence>
                  {hovered === idx && (
                    <motion.span
                      className="absolute inset-0 rounded-md"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{    opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    />
                  )}
                </AnimatePresence>
                <span className="relative z-10">{item.name}</span>
              </a>
            </div>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          {!isAuthenticated ? (
            <>
              <a
                href="/signin"
                className="text-[14px] font-normal text-white/40 hover:text-white/70 transition-colors duration-150 no-underline"
              >
                Sign in
              </a>

              <motion.a
                href="/signup"
                className="relative rounded-lg px-4 py-1.5 text-[14px] font-medium text-neutral-900 no-underline overflow-hidden"
                style={{ background: "#f0ede8" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{  scale: 0.98 }}
                transition={{ duration: 0.12 }}
              >
                Start Building
              </motion.a>
            </>
          ) : (
            <ProfileDropDown />
          )}
        </div>
      </div>
    </motion.header>
  );
};