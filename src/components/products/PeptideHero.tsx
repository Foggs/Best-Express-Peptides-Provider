import Image from "next/image"

interface PeptideHeroProps {
  name: string
  priority?: boolean
}

export function PeptideHero({ name, priority = false }: PeptideHeroProps) {
  return (
    <div className="relative w-full">
      <Image
        src="/images/peptide-bckgrd.png"
        alt={name}
        width={700}
        height={736}
        className="w-full h-auto"
        priority={priority}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold uppercase text-white text-center text-2xl sm:text-3xl md:text-4xl lg:text-[48px] drop-shadow-lg px-4">
          {name}
        </span>
      </div>
    </div>
  )
}
