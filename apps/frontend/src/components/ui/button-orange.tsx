import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface OrangeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

export const OrangeButton = forwardRef<HTMLButtonElement, OrangeButtonProps>(
  ({ className, size = "md", fullWidth = false, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    }

    return (
      <button
        ref={ref}
        className={cn(
          "rounded-lg bg-[#f17463] text-white font-medium transition hover:bg-[#f17463]/90 cursor-pointer",
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    )
  }
)

OrangeButton.displayName = "OrangeButton"
