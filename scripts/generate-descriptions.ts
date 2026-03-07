import { getUncachableGoogleSheetClient } from '../src/lib/googleSheets'

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!

const descriptions: Record<string, string> = {
  'retatrutide': `## Overview
Retatrutide is a groundbreaking **triple-agonist peptide** targeting GLP-1, GIP, and glucagon receptors simultaneously. As the first compound to engage all three metabolic pathways, it represents a significant leap forward in metabolic research.

## Research Applications
- **Metabolic regulation** — unprecedented efficacy in body weight reduction and glycemic control
- **Energy expenditure** — glucagon receptor activation enhances thermogenesis and hepatic lipid metabolism
- **Multi-pathway studies** — ideal for investigating integrated metabolic signaling

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC and mass spectrometry verified
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'tirzepatide': `## Overview
Tirzepatide is a novel **dual GIP/GLP-1 receptor agonist** that represents a breakthrough in metabolic research. As the first peptide to simultaneously target both glucose-dependent insulinotropic polypeptide (GIP) and glucagon-like peptide-1 (GLP-1) receptors, it has opened new frontiers in metabolic regulation.

## Research Applications
- **Glycemic control** — superior efficacy compared to single-receptor agonists
- **Body weight management** — enhanced appetite modulation through complementary pathways
- **Insulin sensitivity** — improved lipid profiles and metabolic markers
- **Cardiovascular research** — emerging data on cardioprotective effects

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC and mass spectrometry verified
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'mazdutide': `## Overview
Mazdutide (LY3305677) is an innovative **dual GLP-1/glucagon receptor agonist** designed to harness the complementary metabolic benefits of both signaling pathways. This next-generation peptide offers a differentiated mechanism compared to GLP-1-only compounds.

## Research Applications
- **Energy expenditure** — glucagon receptor activity increases thermogenesis
- **Lipid oxidation** — enhanced hepatic fat metabolism
- **Glycemic control** — GLP-1 receptor-driven appetite suppression and glucose regulation
- **Metabolic health** — promising results in weight management outcomes

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC, mass spectrometry, and amino acid analysis
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'dsip 15': `## Overview
DSIP (Delta Sleep-Inducing Peptide) is a naturally occurring **neuropeptide** first isolated from cerebral venous blood during slow-wave sleep. This nonapeptide has become a key subject in sleep research, neuroendocrine studies, and stress physiology.

## Research Applications
- **Sleep architecture** — enhances delta-wave (deep sleep) activity without sedative effects
- **Stress response** — modulates ACTH, cortisol, and stress hormone cascades
- **Pain perception** — investigated for analgesic properties
- **Endocrine regulation** — affects growth hormone release patterns

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Concentration:** 15mg
- **Form:** Lyophilized powder
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'pt141': `## Overview
PT-141 (Bremelanotide) is a synthetic peptide analog of **alpha-melanocyte-stimulating hormone (α-MSH)** that activates melanocortin receptors MC3R and MC4R. It is the only known melanocortin-based compound studied for its effects through **central nervous system pathways**.

## Research Applications
- **Melanocortin system** — unique CNS-mediated mechanism of action
- **Hypothalamic signaling** — modulates desire and arousal responses via neurological pathways
- **Mood regulation** — valuable tool for studying reward circuitry
- **Neuroscience** — insights into CNS-mediated physiological responses

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC and MS data included
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'll37': `## Overview
LL-37 is the only human **cathelicidin antimicrobial peptide**, derived from the C-terminal domain of the hCAP18 protein. This 37-amino acid peptide plays a critical role in innate immune defense and has become a leading subject in immunology research.

## Research Applications
- **Antimicrobial activity** — direct action against bacteria, viruses, and fungi
- **Immunomodulation** — recruits immune cells and modulates inflammatory responses
- **Wound healing** — promotes angiogenesis and re-epithelialization
- **Endotoxin neutralization** — neutralizes bacterial lipopolysaccharides
- **Anti-infective strategies** — valuable for novel therapeutic research

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Testing:** HPLC purity and endotoxin analysis
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'ipamorelin': `## Overview
Ipamorelin is a highly selective **growth hormone secretagogue** that stimulates GH release by mimicking ghrelin at the GHS-R receptor. It stands out for its remarkable selectivity — promoting GH release **without significantly affecting** cortisol, prolactin, or ACTH levels.

## Research Applications
- **GH physiology** — clean, isolated study of growth hormone dynamics
- **Dose-response studies** — consistent, dose-dependent GH release patterns
- **Body composition** — research on lean mass and fat metabolism
- **Bone density** — investigation of GH effects on skeletal health
- **Aging research** — age-related GH decline studies

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC, mass spectrometry, and sterility testing
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  '4x alpha': `## Overview
4X Alpha is a **premium multi-peptide research blend** formulated to investigate the synergistic effects of combining complementary growth-promoting and recovery-supporting peptides. This advanced formulation brings together four carefully selected compounds in optimized ratios.

## Research Applications
- **Peptide synergy** — study multi-pathway activation with a single formulation
- **Growth hormone secretion** — combined GH-releasing mechanisms
- **Tissue repair** — complementary recovery pathways
- **Metabolic optimization** — integrated metabolic support research

## Product Details
- **Purity:** ≥98% per component (verified)
- **Form:** Lyophilized powder
- **Analysis:** Individual component verification included
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  '2x alpha cjc/ipa': `## Overview
The 2X Alpha CJC/IPA blend combines **CJC-1295 and Ipamorelin** — two of the most well-characterized growth hormone-releasing peptides — into a single optimized research formulation. This combination leverages their complementary mechanisms for synergistic GH release.

## How It Works
- **CJC-1295** stimulates GH release at the hypothalamic level (GHRH analog)
- **Ipamorelin** acts as a ghrelin mimetic at the pituitary GHS receptor
- Together, they produce **amplified, pulsatile GH secretion** that closely mimics natural physiological patterns

## Research Applications
- Growth hormone axis optimization
- Metabolic effects of enhanced GH secretion
- Age-related hormone decline studies
- Body composition research

## Product Details
- **Purity:** ≥98% per component
- **Form:** Lyophilized powder
- **Testing:** Identity, potency, and ratio accuracy verified
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'thymosin alpha 1': `## Overview
Thymosin Alpha 1 (Tα1) is a naturally occurring **28-amino acid peptide** originally isolated from thymic tissue. It plays a fundamental role in immune system maturation and regulation, making it one of the most extensively studied immunomodulatory peptides.

## Research Applications
- **T-cell enhancement** — promotes T-cell maturation and function
- **Dendritic cell activation** — supports antigen presentation pathways
- **Cytokine modulation** — regulates immune signaling cascades
- **Toll-like receptor signaling** — activates innate and adaptive immunity
- **Vaccine research** — investigated as an immune adjuvant
- **Immunodeficiency** — restoring immune competence

## Product Details
- **Purity:** ≥98% (pharmaceutical-grade)
- **Form:** Lyophilized powder
- **Analysis:** HPLC, mass spectrometry, and endotoxin testing
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'ghk-cu': `## Overview
GHK-Cu (Copper Peptide) is a naturally occurring **tripeptide-copper complex** found in human plasma, saliva, and urine. First identified in the 1970s, this small but powerful peptide has become central to regenerative medicine and anti-aging research.

## Research Applications
- **Collagen synthesis** — upregulates genes involved in extracellular matrix production
- **Wound healing** — accelerates tissue repair and remodeling
- **Antioxidant activity** — activates superoxide dismutase and lysyl oxidase
- **Hair follicle research** — stimulates growth and thickness
- **Anti-inflammatory** — reduces chronic inflammation markers
- **Skin remodeling** — promotes glycosaminoglycan production

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** ICP-MS for copper content, HPLC for peptide purity
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'epithalon': `## Overview
Epithalon (Epitalon) is a synthetic tetrapeptide based on the natural peptide **Epithalamin**, produced by the pineal gland. It has gained exceptional interest in longevity research for its demonstrated ability to **activate telomerase** — the enzyme responsible for maintaining telomere length.

## Research Applications
- **Telomerase activation** — extends replicative lifespan of cell populations
- **Telomere biology** — maintains chromosomal stability and cellular youth
- **Melatonin regulation** — normalizes pineal gland function
- **Circadian rhythm** — supports healthy sleep-wake cycling
- **Neuroendocrine modulation** — regulates hormonal cascades
- **Longevity studies** — one of the most compelling compounds in gerontology

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC and amino acid sequencing
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'pinealon': `## Overview
Pinealon is a synthetic **tripeptide (Glu-Asp-Arg)** designed to target and support central nervous system function. Developed through extensive bioregulatory peptide research, it has shown particular promise in neuroprotection and cognitive function studies.

## Research Applications
- **Neuroprotection** — protects neurons against oxidative stress
- **Blood-brain barrier** — demonstrated ability to cross the BBB
- **Neurotransmitter regulation** — normalizes signaling balance
- **Cognitive function** — supports memory and learning processes
- **Neurodegeneration** — investigated in ischemia and aging models

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC and mass spectrometry
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'ss31': `## Overview
SS-31 (Elamipretide/Bendavia) is a **mitochondria-targeted tetrapeptide** that selectively concentrates in the inner mitochondrial membrane. It represents a pioneering approach to studying mitochondrial dysfunction — a hallmark of aging and degenerative conditions.

## Mechanism of Action
SS-31 binds to **cardiolipin**, a phospholipid essential for electron transport chain efficiency, thereby:
- Optimizing mitochondrial bioenergetics
- Reducing reactive oxygen species (ROS) at the source
- Restoring cellular energy production

## Research Applications
- **Cardiac protection** — ischemia-reperfusion injury models
- **Neurodegeneration** — mitochondrial dysfunction in brain aging
- **Renal injury** — kidney tissue protection studies
- **Muscle decline** — age-related sarcopenia research
- **Metabolic health** — cellular energy restoration

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC, mass spectrometry, and peptide content analysis
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'nad': `## Overview
NAD+ (Nicotinamide Adenine Dinucleotide) is a critical **coenzyme present in every living cell**, serving as a fundamental mediator of cellular energy metabolism and signaling. It has emerged as a central focus of longevity and metabolic research.

## Why NAD+ Matters
NAD+ levels **decline significantly with age**, contributing to:
- Mitochondrial dysfunction
- Impaired DNA repair
- Metabolic deterioration
- Reduced sirtuin activity

## Research Applications
- **Sirtuin activation** — substrate for SIRT1-7 protective pathways
- **DNA repair** — PARP enzyme activation and genomic stability
- **Mitochondrial function** — restoring cellular energy production
- **Anti-aging** — healthspan extension studies
- **Metabolic health** — improving metabolic markers in aging models

## Product Details
- **Purity:** Pharmaceutical-grade
- **Form:** Ready for research use
- **Testing:** Identity and purity verified
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'glutathione': `## Overview
Glutathione (GSH) is the body's most abundant and important **endogenous antioxidant** — a tripeptide composed of glutamate, cysteine, and glycine. It serves as the master regulator of cellular redox balance.

## Key Functions
- **Free radical neutralization** — scavenges ROS and reactive nitrogen species
- **Antioxidant regeneration** — recycles vitamins C and E
- **Liver detoxification** — essential for Phase II conjugation reactions
- **Immune modulation** — supports lymphocyte proliferation and function
- **Protein protection** — maintains thiol status of cellular proteins

## Research Applications
- Oxidative stress models
- Immunology and immune cell function
- Detoxification and hepatoprotection
- Neurodegeneration and cognitive decline
- Aging and cellular senescence

## Product Details
- **Purity:** ≥98% (reduced form GSH)
- **Form:** Lyophilized powder
- **Testing:** Comprehensive analytical verification
- **Storage:** Store at 2-8°C, protect from light

*For research use only — not for human consumption.*`,

  'cartalax': `## Overview
Cartalax is a synthetic **tripeptide (Ala-Glu-Asp)** developed through decades of bioregulatory peptide research. It is specifically designed to support cartilage and musculoskeletal tissue function.

## Research Applications
- **Cartilage matrix synthesis** — regulates collagen and proteoglycan production
- **Chondrocyte metabolism** — supports cartilage cell function and homeostasis
- **Joint degeneration** — studied in age-related degenerative models
- **Tissue maintenance** — targets underlying cellular repair processes
- **Bioregulatory mechanisms** — addresses root causes rather than symptoms

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC and mass spectrometry
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'tb500': `## Overview
TB-500 (Thymosin Beta-4 Fragment) is a synthetic version of the naturally occurring 43-amino acid peptide **Thymosin Beta-4**, which plays a critical role in cell migration, proliferation, and tissue repair.

## Mechanism of Action
TB-500 **upregulates actin**, a cell-building protein essential for healing processes. Its low molecular weight allows it to travel through tissues efficiently, reaching injury sites with remarkable effectiveness.

## Research Applications
- **Angiogenesis** — promotes new blood vessel growth
- **Anti-inflammatory** — reduces systemic inflammation
- **Cardiac repair** — studied in heart tissue regeneration models
- **Dermal healing** — wound closure and skin repair
- **Corneal repair** — ocular tissue regeneration studies

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** Independent lab verification for identity, purity, and sterility
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'thymalin': `## Overview
Thymalin is a **bioregulatory peptide complex** originally extracted from the thymus gland. Developed through pioneering research in peptide bioregulation, it has been studied extensively for its immunorestoration properties.

## Research Applications
- **T-cell normalization** — restores healthy T-cell subpopulations
- **Thymic function** — rejuvenates thymus gland activity in aging models
- **Cellular immunity** — enhances cell-mediated immune responses
- **Humoral immunity** — supports antibody production pathways
- **Longevity** — remarkable effects on immune competence and lifespan in studies by Professor Khavinson

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Testing:** Peptide content, purity, and sterility verified
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'mots-c': `## Overview
MOTS-c (Mitochondrial Open Reading Frame of the 12S rRNA-c) is a **mitochondrial-derived peptide** that has emerged as a groundbreaking discovery in metabolic and exercise research. This 16-amino acid peptide functions as a signaling molecule that regulates metabolic homeostasis.

## Mechanism of Action
MOTS-c activates the **AMPK pathway** and has been shown to translocate to the nucleus during metabolic stress, directly regulating gene expression. It has been described as an **"exercise mimetic"** — replicating many benefits of physical activity at the cellular level.

## Research Applications
- **Glucose metabolism** — enhances glucose uptake and insulin sensitivity
- **Fatty acid oxidation** — promotes lipid metabolism
- **Exercise physiology** — mimics exercise-induced metabolic changes
- **Mitochondrial signaling** — novel MDP research applications
- **Aging** — metabolic decline in aging models

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** HPLC and mass spectrometry
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'b12': `## Overview
Vitamin B12 (Methylcobalamin) is an essential water-soluble vitamin that plays a critical role in **neurological function, DNA synthesis, and cellular energy metabolism**. As the most bioavailable form of B12, methylcobalamin serves as a direct methyl donor.

## Key Functions
- **Myelin sheath integrity** — maintains neuronal protective coating
- **Methylation reactions** — essential for methionine-homocysteine cycling
- **DNA synthesis** — required for proper cell division
- **Red blood cell formation** — prevents megaloblastic anemia
- **Mitochondrial function** — supports cellular energy production

## Research Applications
- Neuroprotection and cognitive function
- Homocysteine metabolism and cardiovascular markers
- Energy metabolism optimization
- Nutritional biochemistry
- Methylation pathway studies

## Product Details
- **Purity:** Pharmaceutical-grade
- **Form:** Methylcobalamin (most bioavailable form)
- **Testing:** Identity, potency, and purity verified
- **Storage:** Store at room temperature, protect from light

*For research use only — not for human consumption.*`,

  'bpc 157': `## Overview
BPC-157 (Body Protection Compound-157) is a synthetic **pentadecapeptide** derived from a naturally occurring protein found in human gastric juice. It has gained significant attention for its extraordinary regenerative properties and wide-ranging therapeutic potential.

## Research Applications
- **Wound healing** — accelerates tissue repair across multiple organ systems
- **Angiogenesis** — promotes formation of new blood vessels
- **Tendon & ligament repair** — studied in musculoskeletal injury models
- **Gastrointestinal protection** — cytoprotective effects on gut tissue
- **Neuroprotection** — emerging research on CNS repair mechanisms
- **Detoxification** — protective effects against various toxic agents

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Testing:** Rigorous third-party verification for consistency and reliability
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'bpc 157 10mg/tb500 10 mg wolverine': `## Overview
The BPC-157/TB-500 **"Wolverine" blend** is our premium high-dose combination of two powerhouse regenerative peptides — **10mg BPC-157 and 10mg TB-500** — formulated for intensive tissue repair and recovery research.

## Synergistic Mechanism
- **BPC-157** contributes cytoprotective, angiogenic, and anti-inflammatory properties
- **TB-500** adds cell-migration stimulation, actin upregulation, and systemic repair support
- Together, they address **multiple stages of the tissue repair cascade**

## Research Applications
- Dose-response studies at therapeutic-level concentrations
- Musculoskeletal injury and recovery models
- Cardiovascular tissue repair research
- Advanced wound healing studies
- Synergistic peptide combination research

## Product Details
- **Purity:** ≥98% per component
- **Form:** Lyophilized powder
- **Analysis:** Individual component verification, ratio confirmation, sterility testing
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,

  'fox04-dri': `## Overview
FOX04-DRI is a **D-retro-inverso peptide** specifically designed to disrupt the FOXO4-p53 interaction — a critical signaling axis that maintains cellular senescence. This innovative peptide has generated significant excitement in the **longevity and senolytics** research community.

## Mechanism of Action
FOX04-DRI competitively binds to p53, preventing its sequestration by FOXO4. This restores p53's ability to trigger **apoptosis selectively in senescent cells** while sparing healthy cells. Published research in *Cell* demonstrated improvements in physical fitness, renal function, and tissue quality in aged models.

## Research Applications
- **Senolytics** — selective elimination of senescent cells
- **Aging reversal** — healthspan extension studies
- **Tissue rejuvenation** — organ function restoration in aged models
- **Senescence biology** — understanding FOXO4-p53 signaling
- **D-retro-inverso peptides** — enhanced proteolytic stability research

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder (D-retro-inverso modified)
- **Analysis:** HPLC and mass spectrometry
- **Storage:** Store at -20°C for long-term stability

*For research use only — not for human consumption.*`,

  'semaglutide': `## Overview
Semaglutide is a **GLP-1 receptor agonist** that has become one of the most intensively studied compounds in metabolic research. It has demonstrated remarkable efficacy in metabolic regulation and body composition studies.

## Mechanism of Action
Semaglutide mimics the incretin hormone GLP-1:
- **Stimulates insulin secretion** in a glucose-dependent manner
- **Suppresses glucagon release** to reduce hepatic glucose output
- **Slows gastric emptying** to modulate nutrient absorption
- **Activates appetite centers** in the hypothalamus

## Research Applications
- Obesity and metabolic syndrome studies
- GLP-1 pathway signaling research
- Neuroprotective properties investigation
- Cardiovascular benefit analysis
- Glycemic control mechanisms

## Product Details
- **Purity:** ≥98% (HPLC verified)
- **Form:** Lyophilized powder
- **Analysis:** Certificate of Analysis with identity and potency confirmation
- **Storage:** Store at 2-8°C

*For research use only — not for human consumption.*`,
}

async function main() {
  console.log('Connecting to Google Sheets...')
  const sheets = await getUncachableGoogleSheetClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Products!A:K',
  })

  const rows = response.data.values || []
  if (rows.length < 2) {
    console.error('No product data found in sheet')
    return
  }

  const headers = rows[0].map((h: string) => h.trim().toLowerCase())
  const slugCol = headers.indexOf('slug')
  const nameCol = headers.indexOf('name')
  const descCol = headers.indexOf('description')

  if (slugCol === -1 || descCol === -1) {
    console.error('Could not find slug or description columns')
    console.log('Headers found:', headers)
    return
  }

  console.log(`Found ${rows.length - 1} products. Description column index: ${descCol}`)
  console.log('---')

  const updates: { range: string; values: string[][] }[] = []
  let skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const slug = (rows[i][slugCol] || '').trim().toLowerCase()
    const name = (rows[i][nameCol] || '').trim()

    if (!slug) continue

    const newDesc = descriptions[slug]

    if (!newDesc) {
      console.log(`⚠ No description for "${name}" (slug: "${slug}") — skipping`)
      skipped++
      continue
    }

    const colLetter = String.fromCharCode(65 + descCol)
    const cellRange = `Products!${colLetter}${i + 1}`
    updates.push({
      range: cellRange,
      values: [[newDesc]],
    })
    console.log(`✅ "${name}" — description ready (${newDesc.length} chars)`)
  }

  if (skipped > 0) {
    console.log(`\n⚠ ${skipped} products had no matching description template`)
  }

  if (updates.length === 0) {
    console.log('\nNo updates to write.')
    return
  }

  console.log(`\nWriting ${updates.length} descriptions to Google Sheets...`)

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updates,
    },
  })

  console.log(`✅ Done! Updated ${updates.length} product descriptions with Markdown formatting.`)
}

main().catch(console.error)
