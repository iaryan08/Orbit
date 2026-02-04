import * as React from 'react'

import { cn } from '@/lib/utils'

import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.ComponentProps<'input'> {
  activeBorderClassName?: string
}

function Input({ className, type, activeBorderClassName, ...props }: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = type === 'password'
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="group relative w-full">
      <input
        type={currentType}
        data-slot="input"
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground/50 selection:bg-primary selection:text-primary-foreground',
          'h-10 w-full min-w-0 bg-transparent px-3 py-2 text-base md:text-sm',
          'border-0 border-b border-[#424242] rounded-none shadow-none outline-none transition-all duration-300',
          'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          isPassword && 'pr-10', // Space for the eye icon
          '[appearance:none] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
          'focus:border-transparent',
          className,
        )}
        {...props}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-rose-300 transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}

      {/* Animated Glowing Bottom Border */}
      <div className={cn(
        "absolute bottom-0 left-1/2 h-[1.5px] w-0 -translate-x-1/2 opacity-0 transition-all duration-300 ease-out group-focus-within:w-full group-focus-within:opacity-100",
        activeBorderClassName || "bg-heart-gradient"
      )} />
    </div>
  )
}

export { Input }
