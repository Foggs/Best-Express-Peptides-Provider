import { getUncachableGoogleSheetClient } from '../src/lib/googleSheets'

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!

const descriptions: Record<string, string> = {
  'retatrutide': `Retatrutide is a groundbreaking triple-agonist peptide targeting GLP-1, GIP, and glucagon receptors simultaneously. As the first compound to engage all three metabolic pathways, it represents a significant leap forward in metabolic research and has generated exceptional interest across the scientific community.

Early clinical studies have demonstrated unprecedented efficacy in body weight reduction and glycemic control, surpassing results seen with dual-agonist compounds. By activating glucagon receptors in addition to GLP-1 and GIP pathways, retatrutide enhances energy expenditure and hepatic lipid metabolism, offering researchers a powerful tool for studying integrated metabolic regulation.

Our retatrutide is supplied as a high-purity lyophilized powder (≥98% purity) with complete analytical documentation. Each batch undergoes HPLC and mass spectrometry verification. Ideal for advanced metabolic, endocrine, and obesity research programs. For research use only — not for human consumption.`,

  'tirzepatide': `Tirzepatide is a novel dual GIP/GLP-1 receptor agonist that represents a breakthrough in metabolic research. As the first peptide to simultaneously target both glucose-dependent insulinotropic polypeptide (GIP) and glucagon-like peptide-1 (GLP-1) receptors, it has opened new frontiers in the study of metabolic regulation and energy homeostasis.

Preclinical and clinical research has demonstrated tirzepatide's superior efficacy in glycemic control and body weight management compared to single-receptor agonists. Its dual mechanism of action enhances insulin sensitivity, improves lipid profiles, and modulates appetite through complementary signaling pathways. Researchers are actively exploring its implications for metabolic syndrome, cardiovascular health, and beyond.

Manufactured to pharmaceutical-grade standards, our tirzepatide is supplied as a high-purity lyophilized powder (≥98% purity) with full analytical documentation. Each batch undergoes HPLC analysis and mass spectrometry verification. Designed for advanced metabolic and endocrine research applications. For research use only — not for human consumption.`,

  'mazdutide': `Mazdutide (also known as LY3305677) is an innovative dual GLP-1/glucagon receptor agonist designed to harness the complementary metabolic benefits of both signaling pathways. This next-generation peptide has attracted significant attention for its differentiated mechanism compared to GLP-1-only compounds.

Research has shown that mazdutide's glucagon receptor activity contributes to increased energy expenditure, enhanced lipid oxidation, and improved hepatic fat metabolism — effects that complement the appetite suppression and glycemic control driven by GLP-1 receptor activation. Clinical studies have demonstrated promising results in both weight management and metabolic health outcomes.

Our mazdutide is manufactured to rigorous purity standards (≥98%) and supplied as a lyophilized powder with comprehensive Certificate of Analysis. Quality verified through HPLC, mass spectrometry, and amino acid analysis. Designed for metabolic and endocrine research applications. For research use only — not for human consumption.`,

  'dsip 15': `DSIP (Delta Sleep-Inducing Peptide) is a naturally occurring neuropeptide first isolated from cerebral venous blood during slow-wave sleep. This nonapeptide has become a subject of significant interest in sleep research, neuroendocrine studies, and stress physiology.

Research has demonstrated DSIP's ability to modulate sleep architecture, particularly enhancing delta-wave (deep sleep) activity without producing the sedative effects associated with pharmacological sleep aids. Studies have also revealed its potential roles in stress response modulation, pain perception, and endocrine regulation — including effects on ACTH, cortisol, and growth hormone release patterns.

Our DSIP is supplied as a high-purity lyophilized powder (≥98% purity) at a 15mg concentration, offering researchers an ample supply for comprehensive study protocols. Each batch includes full analytical documentation. Ideal for neuroscience, chronobiology, and neuroendocrine research. For research use only — not for human consumption.`,

  'pt141': `PT-141 (Bremelanotide) is a synthetic peptide analog of alpha-melanocyte-stimulating hormone (α-MSH) that activates melanocortin receptors, particularly MC3R and MC4R. It is the only known melanocortin-based compound studied for its effects on sexual function through central nervous system pathways rather than peripheral vascular mechanisms.

Research has demonstrated PT-141's unique ability to modulate desire and arousal responses by acting directly on the hypothalamus. Unlike vascular-targeted compounds, PT-141 works through neurological signaling pathways, making it a valuable tool for studying the melanocortin system's role in sexual behavior, mood regulation, and reward circuitry. Its mechanism provides researchers with insights into CNS-mediated physiological responses.

Our PT-141 is supplied as a lyophilized powder with verified purity of ≥98%. Each vial is manufactured under controlled conditions and accompanied by comprehensive analytical documentation including HPLC and MS data. Suitable for neuroscience and endocrine research applications. For research use only — not for human consumption.`,

  'll37': `LL-37 is the only human cathelicidin antimicrobial peptide, derived from the C-terminal domain of the hCAP18 protein. This 37-amino acid peptide plays a critical role in innate immune defense and has emerged as a leading subject of immunology and infectious disease research.

Beyond its direct antimicrobial activity against bacteria, viruses, and fungi, LL-37 functions as a potent immunomodulator. Research has revealed its ability to recruit immune cells, promote wound healing through angiogenesis and re-epithelialization, neutralize bacterial endotoxins, and modulate inflammatory responses. These diverse properties make it invaluable for studying host defense mechanisms and developing novel anti-infective strategies.

Our LL-37 is supplied as a high-purity lyophilized powder (≥98% purity) suitable for both in vitro and in vivo research applications. Each lot includes comprehensive quality documentation including HPLC purity analysis and endotoxin testing. For research use only — not for human consumption.`,

  'ipamorelin': `Ipamorelin is a highly selective growth hormone secretagogue peptide that stimulates GH release by mimicking ghrelin at the GHS-R receptor. Among growth hormone-releasing peptides, ipamorelin stands out for its remarkable selectivity — it promotes GH release without significantly affecting cortisol, prolactin, or ACTH levels.

This selectivity makes ipamorelin an exceptionally clean research tool for studying growth hormone physiology in isolation from other hormonal axes. Studies have demonstrated its consistent, dose-dependent GH release pattern, making it ideal for investigating GH dynamics, metabolic effects, bone density, and body composition. Its favorable side effect profile in research models has made it one of the most widely used GH secretagogues in the field.

Supplied as a high-purity lyophilized powder (≥98%), our ipamorelin undergoes comprehensive quality testing including HPLC, mass spectrometry, and sterility analysis. Each batch includes a detailed Certificate of Analysis. For research use only — not for human consumption.`,

  '4x alpha': `4X Alpha is a premium multi-peptide research blend formulated to investigate the synergistic effects of combining complementary growth-promoting and recovery-supporting peptides. This advanced formulation brings together four carefully selected compounds in optimized ratios for comprehensive research applications.

The synergistic combination targets multiple physiological pathways simultaneously, allowing researchers to study the interplay between growth hormone secretion, tissue repair mechanisms, and metabolic optimization in a single formulation. This multi-target approach reflects the growing scientific interest in combination peptide therapy and its potential advantages over single-peptide protocols.

Our 4X Alpha blend is precisely formulated under controlled conditions with each component verified for purity (≥98%). The blend is supplied as a lyophilized powder with full analytical documentation including individual component verification. Designed for advanced research into peptide synergy and multi-pathway activation. For research use only — not for human consumption.`,

  '2x alpha cjc/ipa': `The 2X Alpha CJC/IPA blend combines CJC-1295 and Ipamorelin — two of the most well-characterized growth hormone-releasing peptides — into a single optimized research formulation. This combination leverages their complementary mechanisms for studying synergistic GH release patterns.

CJC-1295, a GHRH analog, stimulates GH release at the hypothalamic level, while Ipamorelin acts as a ghrelin mimetic at the pituitary GHS receptor. Together, they produce amplified, pulsatile GH secretion that more closely mimics natural physiological patterns than either peptide alone. This combination has become a standard research tool for investigating growth hormone axis optimization, metabolic effects, and age-related hormone decline.

Supplied as a precisely formulated lyophilized powder, our 2X Alpha CJC/IPA blend features verified purity (≥98% per component) and includes comprehensive analytical documentation. Each batch is tested for identity, potency, and ratio accuracy. For research use only — not for human consumption.`,

  'thymosin alpha 1': `Thymosin Alpha 1 (Tα1) is a naturally occurring 28-amino acid peptide originally isolated from thymic tissue. It plays a fundamental role in immune system maturation and regulation, making it one of the most extensively studied immunomodulatory peptides in biomedical research.

Research has demonstrated Thymosin Alpha 1's ability to enhance T-cell function, promote dendritic cell maturation, and modulate cytokine production. It activates both innate and adaptive immune pathways through toll-like receptor signaling. Studies have explored its applications in infectious disease, vaccine enhancement, immunodeficiency states, and as an adjunct in oncology research where immune restoration is a key objective.

Our Thymosin Alpha 1 is manufactured to pharmaceutical-grade purity standards (≥98%) and supplied as a lyophilized powder ready for reconstitution. Each lot includes a detailed Certificate of Analysis with HPLC, mass spectrometry, and endotoxin testing results. For research use only — not for human consumption.`,

  'ghk-cu': `GHK-Cu (Copper Peptide) is a naturally occurring tripeptide-copper complex found in human plasma, saliva, and urine. First identified in the 1970s, this small but powerful peptide has become a central focus of regenerative medicine and anti-aging research due to its remarkably diverse biological activities.

Research has revealed that GHK-Cu modulates the expression of numerous genes involved in tissue repair, including those governing collagen synthesis, glycosaminoglycan production, and antioxidant enzyme activity. Studies demonstrate its ability to promote wound healing, stimulate hair follicle growth, reduce inflammation, and support skin remodeling. Its copper-binding properties are essential for activating key enzymes including superoxide dismutase and lysyl oxidase.

Our GHK-Cu is supplied as a high-purity lyophilized powder (≥98%) with verified copper content and peptide integrity. Each batch undergoes ICP-MS analysis for metal content and HPLC for peptide purity. Suitable for dermatological, regenerative, and anti-aging research applications. For research use only — not for human consumption.`,

  'epithalon': `Epithalon (also known as Epitalon or Epithalone) is a synthetic tetrapeptide based on the natural peptide Epithalamin, produced by the pineal gland. It has gained exceptional interest in longevity research for its demonstrated ability to activate telomerase — the enzyme responsible for maintaining telomere length, a key biomarker of cellular aging.

Pioneering research by Professor Vladimir Khavinson demonstrated that Epithalon can stimulate telomerase activity in human somatic cells, effectively extending the replicative lifespan of cell populations. Additional studies have shown its ability to regulate melatonin production, normalize circadian rhythms, and modulate neuroendocrine function. These properties position it as one of the most compelling peptides in gerontology and longevity research.

Supplied as a high-purity lyophilized powder (≥98%), our Epithalon undergoes rigorous quality control including HPLC analysis and amino acid sequencing. Each lot includes complete analytical documentation. Ideal for aging, telomere biology, and pineal gland research. For research use only — not for human consumption.`,

  'pinealon': `Pinealon is a synthetic tripeptide (Glu-Asp-Arg) designed to target and support central nervous system function. Developed through extensive bioregulatory peptide research, Pinealon has shown particular promise in neuroprotection studies and cognitive function research.

Research indicates that Pinealon can cross the blood-brain barrier and interact with DNA regulatory regions involved in neuronal survival and function. Studies have demonstrated its potential to protect neurons against oxidative stress, normalize neurotransmitter levels, and support cognitive processes including memory and learning. Its neuroprotective properties have been investigated in models of neurodegeneration, ischemia, and age-related cognitive decline.

Our Pinealon is manufactured to strict purity standards (≥98%) and supplied as a lyophilized powder with complete analytical documentation. Each batch is verified through HPLC and mass spectrometry. Designed for neuroscience and cognitive research applications. For research use only — not for human consumption.`,

  'ss31': `SS-31 (Elamipretide, also known as Bendavia) is a mitochondria-targeted tetrapeptide that selectively concentrates in the inner mitochondrial membrane. It represents a pioneering approach to studying mitochondrial dysfunction — a hallmark of aging and numerous degenerative conditions.

Research has demonstrated that SS-31 binds to cardiolipin, a phospholipid essential for electron transport chain efficiency, thereby optimizing mitochondrial bioenergetics and reducing reactive oxygen species (ROS) production at the source. Studies have shown its protective effects in models of cardiac ischemia-reperfusion injury, neurodegenerative disease, renal injury, and age-related muscle decline. Its ability to restore mitochondrial function makes it an invaluable tool in aging and metabolic research.

Our SS-31 is supplied as a high-purity lyophilized powder (≥98%) with full analytical documentation including HPLC, mass spectrometry, and peptide content analysis. Each lot is independently verified for quality and consistency. For research use only — not for human consumption.`,

  'nad': `NAD+ (Nicotinamide Adenine Dinucleotide) is a critical coenzyme present in every living cell, serving as a fundamental mediator of cellular energy metabolism and signaling. It plays an essential role in redox reactions, serves as a substrate for sirtuins and PARPs, and has emerged as a central focus of longevity and metabolic research.

Research has established that NAD+ levels decline significantly with age, contributing to mitochondrial dysfunction, impaired DNA repair, and metabolic deterioration. Supplementation studies demonstrate the potential to restore cellular NAD+ pools, activate sirtuin-mediated protective pathways, enhance mitochondrial function, and improve metabolic health markers. These findings have positioned NAD+ at the forefront of anti-aging and healthspan research.

Our NAD+ is supplied at pharmaceutical-grade purity with comprehensive quality documentation. Each batch undergoes rigorous identity and purity testing. Ideal for cellular metabolism, aging, and bioenergetics research. For research use only — not for human consumption.`,

  'glutathione': `Glutathione (GSH) is the body's most abundant and important endogenous antioxidant — a tripeptide composed of glutamate, cysteine, and glycine. It serves as the master regulator of cellular redox balance and plays essential roles in detoxification, immune function, and cellular protection.

Research has extensively documented glutathione's critical functions: neutralizing free radicals and reactive oxygen species, regenerating other antioxidants (vitamins C and E), supporting Phase II liver detoxification, modulating immune cell proliferation and function, and maintaining protein thiol status. Declining glutathione levels are associated with aging, neurodegeneration, and numerous chronic conditions, making GSH supplementation research a rapidly growing field.

Our glutathione is supplied as a high-purity lyophilized powder (≥98%) in reduced form (GSH) for maximum biological activity. Each batch includes comprehensive analytical testing results. Suitable for oxidative stress, immunology, detoxification, and aging research. For research use only — not for human consumption.`,

  'cartalax': `Cartalax is a synthetic tripeptide (Ala-Glu-Asp) developed through decades of bioregulatory peptide research. It is specifically designed to support cartilage and musculoskeletal tissue function, making it a valuable tool for studying age-related joint degeneration and tissue maintenance.

Research has demonstrated Cartalax's ability to regulate gene expression involved in cartilage matrix synthesis, including collagen and proteoglycan production. Studies suggest it can modulate chondrocyte metabolism, support cartilage homeostasis, and potentially slow the degenerative processes associated with aging joint tissue. Its bioregulatory mechanism targets the underlying cellular processes rather than merely addressing symptoms.

Our Cartalax is manufactured to high purity standards (≥98%) and supplied as a lyophilized powder with full analytical documentation. Each batch undergoes HPLC and mass spectrometry verification. Designed for musculoskeletal, gerontology, and regenerative medicine research. For research use only — not for human consumption.`,

  'tb500': `TB-500 (Thymosin Beta-4 Fragment) is a synthetic version of the naturally occurring 43-amino acid peptide Thymosin Beta-4, which plays a critical role in cell migration, proliferation, and tissue repair. This peptide has emerged as a leading subject of regeneration research due to its unique mechanism of action.

Research has shown that TB-500 upregulates actin, a cell-building protein essential for healing and repair processes. Studies demonstrate its ability to promote new blood vessel growth, reduce inflammation, and support the recovery of damaged tissue — particularly in cardiac, dermal, and corneal models. Its low molecular weight allows it to travel through tissues efficiently, reaching sites of injury with remarkable effectiveness.

Supplied as a high-purity lyophilized powder (≥98% purity), our TB-500 is ideal for in vitro and in vivo research applications. Every batch is verified through independent laboratory analysis for identity, purity, and sterility. For research use only — not for human consumption.`,

  'thymalin': `Thymalin is a bioregulatory peptide complex originally extracted from the thymus gland, consisting of a defined mixture of small peptides that modulate immune system function. It was developed through pioneering research in peptide bioregulation and has been studied extensively for its immunorestoration properties.

Research has demonstrated Thymalin's ability to normalize T-cell subpopulations, restore thymic function in aging models, and enhance both cellular and humoral immunity. Long-term studies by Professor Khavinson showed remarkable effects on immune competence, endocrine regulation, and even mortality rates in aged populations. These findings have positioned Thymalin as a key compound in immunogerontology research.

Our Thymalin is supplied as a high-purity lyophilized powder (≥98%) with complete analytical documentation. Each batch is verified for peptide content, purity, and sterility. Ideal for immunology, aging, and bioregulatory peptide research. For research use only — not for human consumption.`,

  'mots-c': `MOTS-c (Mitochondrial Open Reading Frame of the 12S rRNA-c) is a mitochondrial-derived peptide (MDP) that has emerged as a groundbreaking discovery in metabolic and exercise research. This 16-amino acid peptide is encoded in the mitochondrial genome and functions as a signaling molecule that regulates metabolic homeostasis.

Research has revealed that MOTS-c activates the AMPK pathway, enhances glucose uptake, promotes fatty acid oxidation, and improves insulin sensitivity. Remarkably, studies have shown it translocates to the nucleus during metabolic stress, directly regulating gene expression related to cellular metabolism. It has been described as an "exercise mimetic" due to its ability to replicate many of the metabolic benefits of physical activity at the cellular level.

Our MOTS-c is supplied as a high-purity lyophilized powder (≥98%) with comprehensive analytical documentation including HPLC and mass spectrometry data. Each lot undergoes rigorous quality verification. Designed for metabolic, mitochondrial, and exercise physiology research. For research use only — not for human consumption.`,

  'b12': `Vitamin B12 (Methylcobalamin) is an essential water-soluble vitamin that plays a critical role in neurological function, DNA synthesis, red blood cell formation, and cellular energy metabolism. As the most bioavailable form of B12, methylcobalamin serves as a direct methyl donor in the methionine-homocysteine metabolic cycle.

Research has extensively documented B12's essential functions in maintaining myelin sheath integrity, supporting methylation reactions throughout the body, and enabling proper mitochondrial function. Studies have explored its applications in neuroprotection, cognitive function preservation, energy metabolism optimization, and as an adjunct in research involving homocysteine metabolism and cardiovascular health markers.

Our B12 (Methylcobalamin) is supplied at pharmaceutical-grade purity with full analytical documentation. Each batch undergoes identity, potency, and purity verification. Suitable for nutritional biochemistry, neuroscience, and metabolic research applications. For research use only — not for human consumption.`,

  'bpc 157': `BPC-157 (Body Protection Compound-157) is a synthetic pentadecapeptide derived from a naturally occurring protein found in human gastric juice. This remarkable peptide has gained significant attention in the research community for its extraordinary regenerative properties and wide-ranging therapeutic potential.

Extensive preclinical studies have demonstrated BPC-157's ability to accelerate wound healing, promote angiogenesis (the formation of new blood vessels), and support tissue repair across multiple organ systems — including muscle, tendon, ligament, and gastrointestinal tissue. Researchers have observed its cytoprotective effects against various toxic agents, making it a compelling subject for studies in tissue regeneration and recovery.

Our BPC-157 is manufactured to the highest purity standards (≥98%) and is supplied as a lyophilized powder for reconstitution. Each vial undergoes rigorous third-party testing to ensure consistency and reliability for your laboratory research. For research use only — not for human consumption.`,

  'bpc 157 10mg/tb500 10 mg wolverine': `The BPC-157/TB-500 "Wolverine" blend is our premium high-dose combination of two powerhouse regenerative peptides — 10mg BPC-157 and 10mg TB-500 — formulated for researchers conducting intensive tissue repair and recovery studies. Named for its exceptional regenerative research profile, this blend delivers therapeutic-level doses of both compounds.

BPC-157 contributes its well-documented cytoprotective, angiogenic, and anti-inflammatory properties, while TB-500 adds potent cell-migration stimulation, actin upregulation, and systemic tissue repair support. At these elevated concentrations, researchers can explore dose-response relationships and investigate the full potential of this synergistic combination across musculoskeletal, cardiovascular, and wound healing models.

Our Wolverine blend is precisely formulated with pharmaceutical-grade components, each verified at ≥98% purity. The lyophilized powder is supplied with complete analytical documentation including individual component verification, ratio confirmation, and sterility testing. Designed for advanced regenerative medicine research. For research use only — not for human consumption.`,

  'fox04-dri': `FOX04-DRI is a D-retro-inverso peptide specifically designed to disrupt the interaction between FOXO4 and p53 — a critical signaling axis that maintains cellular senescence. This innovative peptide has generated significant excitement in the longevity and senolytics research community as a targeted approach to selectively eliminating senescent cells.

Research published in the journal Cell demonstrated that FOX04-DRI selectively induces apoptosis in senescent cells while sparing healthy cells. By competitively binding to p53 and preventing its sequestration by FOXO4, the peptide restores p53's ability to trigger programmed cell death in dysfunctional senescent cells. This senolytic activity has shown promise in improving physical fitness, renal function, and fur density in aged animal models.

Our FOX04-DRI features the D-retro-inverso modification for enhanced proteolytic stability and is supplied as a high-purity lyophilized powder (≥98%). Each batch includes comprehensive analytical documentation including HPLC and mass spectrometry data. Designed for senescence, aging, and longevity research. For research use only — not for human consumption.`,

  'semaglutide': `Semaglutide is a GLP-1 receptor agonist peptide that has become one of the most intensively studied compounds in metabolic research. Originally developed for glycemic control studies, semaglutide has demonstrated remarkable efficacy in preclinical and clinical research models focused on metabolic regulation and body composition.

This peptide works by mimicking the incretin hormone GLP-1, which stimulates insulin secretion, suppresses glucagon release, and slows gastric emptying. Research has revealed its potential to significantly influence appetite regulation and energy metabolism, making it a cornerstone compound in obesity and metabolic syndrome studies. Emerging research also explores its neuroprotective properties and cardiovascular benefits.

Our semaglutide is produced under stringent quality control conditions and supplied as a lyophilized powder with ≥98% verified purity. Each lot includes a Certificate of Analysis confirming identity and potency. Ideal for researchers investigating GLP-1 pathways, metabolic function, and related therapeutic targets. For research use only — not for human consumption.`,
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

  console.log(`✅ Done! Updated ${updates.length} product descriptions.`)
}

main().catch(console.error)
