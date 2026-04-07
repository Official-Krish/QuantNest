import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 appearance-none rounded-md border border-neutral-600 bg-neutral-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors outline-none focus-visible:border-[#f17463] focus-visible:ring-[3px] focus-visible:ring-[#f17463]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=unchecked]:bg-neutral-900 data-[state=checked]:border-[#f17463] data-[state=checked]:bg-[#f17463] data-[state=checked]:text-white data-[state=checked]:shadow-[0_0_0_1px_rgba(241,116,99,0.3)] dark:bg-neutral-900 dark:data-[state=checked]:bg-[#f17463]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
