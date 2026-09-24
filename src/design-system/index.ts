export const typeStyles = [
  'display',
  'title',
  'heading',
  'body',
  'body-sm',
  'label',
  'caption',
  'mono',
] as const

export type TypeStyle = (typeof typeStyles)[number]

export const breakpoints = {
  tablet: '48rem',
  desktop: '64rem',
  'desktop-plus': '90rem',
} as const
