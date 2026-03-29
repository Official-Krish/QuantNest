import type { IconType } from "react-icons";
import { HiOutlineBolt } from "react-icons/hi2";
import { SiDiscord, SiGmail, SiGoogledrive, SiNotion, SiSlack, SiTelegram, SiWhatsapp, SiZerodha } from "react-icons/si";
import { TbChartCandleFilled, TbPlugConnected } from "react-icons/tb";

type ServiceBrand = {
  icon: IconType;
  colorClassName: string;
  tintClassName: string;
  borderClassName: string;
};

const SERVICE_BRANDS: Record<string, ServiceBrand> = {
  zerodha: {
    icon: SiZerodha,
    colorClassName: "text-[#387ed1]",
    tintClassName: "bg-[#387ed1]/12",
    borderClassName: "border-[#387ed1]/25",
  },
  groww: {
    icon: TbChartCandleFilled,
    colorClassName: "text-emerald-300",
    tintClassName: "bg-emerald-400/12",
    borderClassName: "border-emerald-400/25",
  },
  lighter: {
    icon: HiOutlineBolt,
    colorClassName: "text-amber-300",
    tintClassName: "bg-amber-400/12",
    borderClassName: "border-amber-400/25",
  },
  gmail: {
    icon: SiGmail,
    colorClassName: "text-[#ea4335]",
    tintClassName: "bg-[#ea4335]/12",
    borderClassName: "border-[#ea4335]/25",
  },
  slack: {
    icon: SiSlack,
    colorClassName: "text-[#e87bc1]",
    tintClassName: "bg-[#4A154B]/18",
    borderClassName: "border-[#4A154B]/25",
  },
  telegram: {
    icon: SiTelegram,
    colorClassName: "text-[#229ED9]",
    tintClassName: "bg-[#229ED9]/12",
    borderClassName: "border-[#229ED9]/25",
  },
  discord: {
    icon: SiDiscord,
    colorClassName: "text-[#8190ff]",
    tintClassName: "bg-[#5865f2]/12",
    borderClassName: "border-[#5865f2]/25",
  },
  whatsapp: {
    icon: SiWhatsapp,
    colorClassName: "text-[#25D366]",
    tintClassName: "bg-[#25D366]/12",
    borderClassName: "border-[#25D366]/25",
  },
  "notion-daily-report": {
    icon: SiNotion,
    colorClassName: "text-neutral-100",
    tintClassName: "bg-white/6",
    borderClassName: "border-white/12",
  },
  "google-drive-daily-csv": {
    icon: SiGoogledrive,
    colorClassName: "text-[#8ab4f8]",
    tintClassName: "bg-[#8ab4f8]/12",
    borderClassName: "border-[#8ab4f8]/25",
  },
};

const DEFAULT_BRAND: ServiceBrand = {
  icon: TbPlugConnected,
  colorClassName: "text-neutral-200",
  tintClassName: "bg-white/6",
  borderClassName: "border-white/12",
};

export function getServiceBrand(service: string): ServiceBrand {
  return SERVICE_BRANDS[service.toLowerCase()] || DEFAULT_BRAND;
}

export function ServiceLogo({
  service,
  size = 16,
  className = "",
}: {
  service: string;
  size?: number;
  className?: string;
}) {
  const brand = getServiceBrand(service);
  const Icon = brand.icon;

  return <Icon size={size} className={`${brand.colorClassName} ${className}`.trim()} />;
}
