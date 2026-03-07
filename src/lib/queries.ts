import { cache } from 'react'
import { prisma } from './prisma'

export const getOrdersByUser = cache(async (userId: string) => {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, slug: true, images: true }
          },
          variant: {
            select: { name: true }
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
})
