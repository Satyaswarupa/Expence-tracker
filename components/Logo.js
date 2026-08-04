import Image from 'next/image'

/**
 * The MoneyJot mark. The artwork is a square PNG with the notepad centred and transparent
 * margins, so a single `size` keeps it aligned next to the wordmark at any scale.
 */
export default function Logo({ size = 36, className = '', priority = false }) {
  return (
    <Image
      src="/moneyjot-logo.png"
      alt="MoneyJot"
      width={size}
      height={size}
      priority={priority}
      className={className}
      style={{ width: size, height: size }}
    />
  )
}
