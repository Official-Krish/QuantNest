import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";

export const Appbar = () => {
    const [hovered, setHovered] = useState<number | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();

    const navItems = [
        {
          name: "Pricing",
          link: "/pricing",
        },
        {
          name: "About",
          link: "/about",
        },
        {
          name: "Carrers",
          link: "/careers",
        },
        {
            name: "Blog",
            link: "/blog",
        }
    ];
    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 40){
            setScrolled(true);
        } else {
            setScrolled(false);
        }
    });
    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <motion.div 
                className={`w-full px-4 py-2 ${scrolled ? "rounded-full border border-neutral-800" : "rounded-xl border-b border-neutral-800"}`}
                animate={{
                    width: scrolled ? "60%" : "100%",
                    transition: { 
                        duration: 0.3,
                        ease: "easeInOut"
                    },
                    y: scrolled ? 20 : 0,
                }}
                style={{ position: "fixed", left: "0", right: "0", margin: "0 auto" }}
            >
                <div className="flex justify-between items-center shadow-sm px-20">
                    <div className="flex items-center gap-2 p-4 cursor-pointer"
                        onClick={() => window.location.href = "/"}
                    >
                        <img
                            src="/Logo.png"
                            className="rounded-full"
                            alt="logo"
                            width={30}
                            height={30}
                        />
                        <span className="font-medium text-white">N8n Trading</span>
                    </div>
                    <div className="flex items-center max-w-lg">
                        {navItems.map((item, idx) => (
                            <motion.div
                                key={item.name}
                                className="relative px-4 py-2 text-neutral-300 cursor-pointer"
                                onMouseEnter={() => setHovered(idx)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => item.link && (window.location.href = item.link)}
                            >
                                {hovered === idx && (
                                    <motion.div className="absolute inset-0 rounded-xl w-full h-full bg-neutral-800" layoutId="nav-item"/>
                                )}
                                <span className="relative z-10">{item.name}</span>
                            </motion.div>
                            
                        ))}
                    </div>
                    <div className="flex justify-center items-center">
                        <motion.button 
                            className="px-4 py-2 text-neutral-800 rounded-lg font-normal bg-neutral-200 cursor-pointer shadow-md shadow-neutral-200/30"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (localStorage.getItem("token")) {
                                    window.location.href = "/dashboard";
                                } else {
                                    window.location.href = "/signup";
                                }
                            }}
                        >
                            Start Building
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}