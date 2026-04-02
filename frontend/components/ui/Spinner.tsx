import * as React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={twMerge(
        clsx(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size],
          className
        )
      )}
      {...props}
    >
      <span className="sr-only">加载中...</span>
    </div>
  )
)
Spinner.displayName = 'Spinner'

export { Spinner }
