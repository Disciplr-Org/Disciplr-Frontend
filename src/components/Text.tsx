import React from 'react'
import { TypographyRole, getTypographyClass } from '../utils/typography'

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** Typography role determining size and weight */
  role: TypographyRole
  /** HTML element to render as (default: 'span') */
  as?: keyof JSX.IntrinsicElements
  /** Child content */
  children: React.ReactNode
}

/**
 * Text component for applying consistent typography scales
 * 
 * Automatically handles responsive sizing across sm/md/lg breakpoints.
 * Uses CSS variables that update based on viewport width.
 * 
 * @example
 * <Text role="display">Hero headline</Text>
 * <Text role="body" as="p">Body paragraph</Text>
 * <Text role="caption">Small helper text</Text>
 */
export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ role, as: Component = 'span', className, ...props }, ref) => {
    const typographyClass = getTypographyClass(role)
    const mergedClassName = className
      ? `${typographyClass} ${className}`
      : typographyClass

    return React.createElement(Component as any, {
      ref,
      className: mergedClassName,
      ...props,
    })
  }
)

Text.displayName = 'Text'
