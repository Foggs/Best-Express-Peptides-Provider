import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'recovery' },
      update: {},
      create: {
        name: 'Recovery',
        slug: 'recovery',
        description: 'Peptides for tissue repair and recovery research',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'longevity' },
      update: {},
      create: {
        name: 'Longevity',
        slug: 'longevity',
        description: 'Anti-aging and longevity research peptides',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'weight-loss' },
      update: {},
      create: {
        name: 'Weight Loss',
        slug: 'weight-loss',
        description: 'Metabolic and weight management research peptides',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'cognitive' },
      update: {},
      create: {
        name: 'Cognitive',
        slug: 'cognitive',
        description: 'Nootropic and cognitive enhancement research peptides',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'strength' },
      update: {},
      create: {
        name: 'Strength',
        slug: 'strength',
        description: 'Muscle and performance research peptides',
      },
    }),
  ])

  const [recovery, longevity, weightLoss, cognitive, strength] = categories

  const products = [
    {
      name: 'BPC-157',
      slug: 'bpc-157',
      shortDescription: 'Body Protection Compound for tissue repair research',
      description: `BPC-157, also known as Body Protection Compound-157, is a pentadecapeptide consisting of 15 amino acids. It is a partial sequence of body protection compound (BPC) that was discovered in human gastric juice.

Research has shown BPC-157 to exhibit various properties in laboratory settings, including:
- Accelerated wound healing in animal models
- Potential protective effects on various tissues
- Possible tendon and ligament repair promotion
- Gastric protective properties

This peptide has been extensively studied in various research contexts and continues to be of significant interest in the scientific community.`,
      research: `BPC-157 has been the subject of numerous research studies exploring its potential mechanisms and effects:

**Key Research Areas:**
1. Wound healing and tissue regeneration
2. Gastrointestinal protection
3. Tendon and ligament repair
4. Angiogenesis (blood vessel formation)

**Notable Studies:**
- Studies in animal models have demonstrated accelerated healing of various tissue types
- Research suggests potential interaction with growth factor systems
- Multiple studies have examined the peptide's stability and bioavailability`,
      shippingInfo: 'Ships within 1-2 business days. Includes cold pack for temperature protection.',
      faq: `**What purity level is your BPC-157?**
Our BPC-157 is verified at 99%+ purity via HPLC analysis.

**How should I store BPC-157?**
Store lyophilized peptide at -20°C for long-term storage. Reconstituted peptide should be refrigerated at 2-8°C.

**What is included with my order?**
Each order includes the peptide vial(s) and a Certificate of Analysis (COA).`,
      images: [],
      featured: true,
      categoryId: recovery.id,
      variants: [
        { name: '5mg', price: 3999, sku: 'BPC157-5MG' },
        { name: '10mg', price: 6999, sku: 'BPC157-10MG' },
      ],
    },
    {
      name: 'TB-500',
      slug: 'tb-500',
      shortDescription: 'Thymosin Beta-4 fragment for regeneration research',
      description: `TB-500 is a synthetic version of the naturally occurring peptide present in virtually all human and animal cells, Thymosin Beta-4. TB-500 is the part of Thymosin Beta-4 that promotes the most significant attributes of the naturally occurring peptide.

Research applications include:
- Cell migration studies
- Wound healing research
- Anti-inflammatory response investigation
- Angiogenesis research`,
      research: `TB-500 research has focused on several key areas:

**Mechanism of Action Studies:**
- Upregulation of actin
- Cell migration and proliferation
- Blood vessel formation research

**Research Applications:**
- Veterinary studies (extensively researched in horses)
- Tissue regeneration research
- Inflammatory response studies`,
      images: [],
      featured: true,
      categoryId: recovery.id,
      variants: [
        { name: '2mg', price: 2999, sku: 'TB500-2MG' },
        { name: '5mg', price: 5999, sku: 'TB500-5MG' },
      ],
    },
    {
      name: 'Semaglutide',
      slug: 'semaglutide',
      shortDescription: 'GLP-1 receptor agonist for metabolic research',
      description: `Semaglutide is a peptide analog of human glucagon-like peptide-1 (GLP-1) that acts as a GLP-1 receptor agonist. It has been extensively studied for metabolic research applications.

Research areas include:
- Glucose metabolism studies
- Appetite regulation research
- Metabolic pathway investigation
- Weight management research`,
      research: `Semaglutide has been the subject of extensive research:

**Research Focus Areas:**
- GLP-1 receptor activation mechanisms
- Metabolic effects in various models
- Cardiovascular research applications
- Appetite and satiety signaling

**Notable Properties:**
- Extended half-life compared to native GLP-1
- High receptor binding affinity
- Well-characterized pharmacological profile`,
      images: [],
      featured: true,
      categoryId: weightLoss.id,
      variants: [
        { name: '3mg', price: 12999, sku: 'SEMA-3MG' },
        { name: '5mg', price: 19999, sku: 'SEMA-5MG' },
      ],
    },
    {
      name: 'Tirzepatide',
      slug: 'tirzepatide',
      shortDescription: 'Dual GIP/GLP-1 receptor agonist for advanced metabolic research',
      description: `Tirzepatide is a novel dual glucose-dependent insulinotropic polypeptide (GIP) and glucagon-like peptide-1 (GLP-1) receptor agonist. This unique dual mechanism makes it a valuable research compound.

Research applications:
- Dual receptor activation studies
- Metabolic pathway research
- Comparative studies with GLP-1 only agonists
- Weight and glucose research`,
      research: `Tirzepatide represents a new class of dual-action peptides:

**Unique Properties:**
- First-in-class dual GIP/GLP-1 agonist
- Novel mechanism of action
- Extended duration of action

**Research Significance:**
- Comparative metabolic studies
- Receptor binding research
- Pathway interaction studies`,
      images: [],
      featured: true,
      categoryId: weightLoss.id,
      variants: [
        { name: '5mg', price: 14999, sku: 'TIRZ-5MG' },
        { name: '10mg', price: 24999, sku: 'TIRZ-10MG' },
      ],
    },
    {
      name: 'Retatrutide',
      slug: 'retatrutide',
      shortDescription: 'Triple agonist peptide for advanced research',
      description: `Retatrutide is an investigational triple hormone receptor agonist targeting GIP, GLP-1, and glucagon receptors. This triple mechanism represents the cutting edge of metabolic peptide research.

Research applications include:
- Triple receptor activation studies
- Advanced metabolic research
- Comparative studies with dual agonists
- Energy expenditure research`,
      images: [],
      featured: false,
      categoryId: weightLoss.id,
      variants: [
        { name: '5mg', price: 19999, sku: 'RETA-5MG' },
        { name: '10mg', price: 34999, sku: 'RETA-10MG' },
      ],
    },
    {
      name: 'GHK-Cu',
      slug: 'ghk-cu',
      shortDescription: 'Copper peptide for skin and wound healing research',
      description: `GHK-Cu is a naturally occurring copper complex of the tripeptide glycyl-L-histidyl-L-lysine. It was first identified in human plasma but has since been found in other tissues.

Research areas:
- Wound healing studies
- Skin regeneration research
- Anti-aging research
- Collagen synthesis studies`,
      research: `GHK-Cu has been extensively researched:

**Key Research Areas:**
- Gene expression modulation
- Wound healing mechanisms
- Skin structure research
- Antioxidant properties

**Mechanisms Studied:**
- Copper delivery to tissues
- Extracellular matrix interactions
- Growth factor stimulation`,
      images: [],
      featured: true,
      categoryId: longevity.id,
      variants: [
        { name: '50mg', price: 3499, sku: 'GHKCU-50MG' },
        { name: '100mg', price: 5999, sku: 'GHKCU-100MG' },
      ],
    },
    {
      name: 'Ipamorelin + CJC-1295',
      slug: 'ipamorelin-cjc-1295',
      shortDescription: 'Growth hormone secretagogue blend for GH research',
      description: `This combination of Ipamorelin and CJC-1295 (without DAC) is designed for research into growth hormone releasing systems. Both peptides work synergistically in laboratory settings.

Ipamorelin: A selective growth hormone secretagogue
CJC-1295: A growth hormone releasing hormone analog

Research applications:
- GH release studies
- Pulsatile hormone research
- Synergistic peptide interactions`,
      images: [],
      featured: true,
      categoryId: strength.id,
      variants: [
        { name: '5mg/5mg Blend', price: 5999, sku: 'IPA-CJC-5MG' },
        { name: '10mg/10mg Blend', price: 9999, sku: 'IPA-CJC-10MG' },
      ],
    },
    {
      name: 'SS-31 (Elamipretide)',
      slug: 'ss-31',
      shortDescription: 'Mitochondria-targeting peptide for cellular research',
      description: `SS-31 (also known as Elamipretide or Bendavia) is a mitochondria-targeting peptide that has been investigated for its potential effects on mitochondrial function.

Research applications:
- Mitochondrial function studies
- Cellular energy research
- Oxidative stress research
- Aging and longevity studies`,
      research: `SS-31 represents a unique class of mitochondria-targeting peptides:

**Research Focus:**
- Cardiolipin interaction
- ATP production studies
- Reactive oxygen species reduction
- Mitochondrial membrane potential

**Applications:**
- Aging research
- Cellular bioenergetics
- Neurodegenerative research models`,
      images: [],
      featured: false,
      categoryId: longevity.id,
      variants: [
        { name: '5mg', price: 8999, sku: 'SS31-5MG' },
        { name: '10mg', price: 15999, sku: 'SS31-10MG' },
      ],
    },
    {
      name: 'MOTS-c',
      slug: 'mots-c',
      shortDescription: 'Mitochondrial-derived peptide for metabolic research',
      description: `MOTS-c is a mitochondrial-derived peptide encoded within the 12S rRNA gene. It has emerged as an important research compound in metabolic studies.

Research areas include:
- Mitochondrial signaling
- Metabolic regulation studies
- Exercise mimetic research
- Insulin sensitivity studies`,
      images: [],
      featured: false,
      categoryId: longevity.id,
      variants: [
        { name: '5mg', price: 7999, sku: 'MOTSC-5MG' },
        { name: '10mg', price: 13999, sku: 'MOTSC-10MG' },
      ],
    },
    {
      name: 'Selank',
      slug: 'selank',
      shortDescription: 'Nootropic peptide for cognitive research',
      description: `Selank is a synthetic peptide derived from the natural tetrapeptide Tuftsin. It has been studied for its potential effects on cognitive function and anxiety-related research.

Research applications:
- Cognitive enhancement studies
- Anxiety research models
- BDNF expression studies
- Nootropic mechanism research`,
      images: [],
      featured: false,
      categoryId: cognitive.id,
      variants: [
        { name: '5mg', price: 3999, sku: 'SELANK-5MG' },
        { name: '10mg', price: 6999, sku: 'SELANK-10MG' },
      ],
    },
  ]

  for (const productData of products) {
    const { variants, ...product } = productData
    
    const createdProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    })

    for (const variant of variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: {
          ...variant,
          productId: createdProduct.id,
        },
        create: {
          ...variant,
          productId: createdProduct.id,
        },
      })
    }

    console.log(`Created/updated product: ${createdProduct.name}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
