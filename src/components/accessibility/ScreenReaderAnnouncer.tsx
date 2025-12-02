"use client"

import { useEffect, useState } from "react"
import { useCartStore } from "@/store/cart"

export function ScreenReaderAnnouncer() {
  const [announcement, setAnnouncement] = useState("")
  const { items } = useCartStore()
  const [prevItemCount, setPrevItemCount] = useState(0)

  useEffect(() => {
    const currentCount = items.reduce((acc, item) => acc + item.quantity, 0)
    
    if (currentCount > prevItemCount) {
      setAnnouncement(`Item added to cart. Cart now has ${currentCount} ${currentCount === 1 ? 'item' : 'items'}.`)
    } else if (currentCount < prevItemCount && currentCount > 0) {
      setAnnouncement(`Item removed from cart. Cart now has ${currentCount} ${currentCount === 1 ? 'item' : 'items'}.`)
    } else if (currentCount === 0 && prevItemCount > 0) {
      setAnnouncement("Cart is now empty.")
    }
    
    setPrevItemCount(currentCount)
  }, [items, prevItemCount])

  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(""), 3000)
      return () => clearTimeout(timer)
    }
  }, [announcement])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}
