import * as React from 'react'

import { cn } from '@/lib/utils'

interface TextareaProps extends React.ComponentProps<'textarea'> {
  activeBorderClassName?: string
}

function Textarea({ className, activeBorderClassName, ...props }: TextareaProps) {
  return (
    <div className="group relative w-full">
      <textarea
        data-slot="textarea"
        className={cn(
          'placeholder:text-muted-foreground/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          'flex field-sizing-content min-h-16 w-full bg-transparent px-3 py-2 text-base md:text-sm',
          'border-0 border-b border-[#424242] rounded-none shadow-none outline-none transition-all duration-300',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'focus:border-transparent',
          className,
        )}
        {...props}
      />
      {/* Animated Glowing Bottom Border */}
      <div className={cn(
        "absolute bottom-0 left-1/2 h-[1.5px] w-0 -translate-x-1/2 opacity-0 transition-all duration-300 ease-out group-focus-within:w-full group-focus-within:opacity-100",
        activeBorderClassName || "bg-heart-gradient"
      )} />
    </div>
  )
}

export { Textarea }
