const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, VerticalAlign, TableOfContents
} = require('docx');
const fs = require('fs');

const ACCENT = "1A56DB";       // Deep blue
const ACCENT2 = "0E9F6E";      // Teal/green
const DARK = "111827";         // Near black
const MID = "374151";          // Dark grey
const LIGHT = "F3F4F6";        // Light bg
const BORDER_COLOR = "D1D5DB";
const ACCENT_LIGHT = "EBF5FB"; // Light blue bg
const WARN = "D97706";         // Amber
const RED = "DC2626";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 6 } },
    children: [new TextRun({ text, font: "Georgia", size: 34, bold: true, color: DARK })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, font: "Georgia", size: 26, bold: true, color: ACCENT })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: 22, bold: true, color: MID })]
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 120, line: 320 },
    children: [new TextRun({ text, font: "Calibri", size: 22, color: opts.color || MID, bold: opts.bold || false, italics: opts.italic || false })]
  });
}

function bullet(text, level = 0, bold_prefix = null) {
  const children = bold_prefix
    ? [new TextRun({ text: bold_prefix + " ", font: "Calibri", size: 22, color: DARK, bold: true }),
       new TextRun({ text, font: "Calibri", size: 22, color: MID })]
    : [new TextRun({ text, font: "Calibri", size: 22, color: MID })];
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 60 },
    children
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 40, after: 60 },
    children: [new TextRun({ text, font: "Calibri", size: 22, color: MID })]
  });
}

function spacer(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun("")] }));
}

function callout(label, text, color = ACCENT) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [400, 8960],
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 400, type: WidthType.DXA },
          shading: { fill: color, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, font: "Calibri", size: 20, bold: true, color: "FFFFFF" })] })]
        }),
        new TableCell({
          width: { size: 8960, type: WidthType.DXA },
          shading: { fill: ACCENT_LIGHT, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text, font: "Calibri", size: 22, color: DARK })] })]
        })
      ]
    })]
  });
}

function headerRow(cells, widths) {
  return new TableRow({
    children: cells.map((c, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: ACCENT, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: c, font: "Calibri", size: 20, bold: true, color: "FFFFFF" })] })]
    }))
  });
}

function dataRow(cells, widths, shade = "FFFFFF") {
  return new TableRow({
    children: cells.map((c, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: shade, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 140, right: 100 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }
      },
      children: [new Paragraph({ children: [new TextRun({ text: c, font: "Calibri", size: 20, color: MID })] })]
    }))
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
        ]
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 34, bold: true, font: "Georgia", color: DARK }, paragraph: { spacing: { before: 480, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Georgia", color: ACCENT }, paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Calibri", color: MID }, paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
      }
    },
    children: [

      // ── COVER ──
      new Paragraph({ spacing: { before: 1440, after: 240 }, children: [new TextRun({ text: "UiPath IXP", font: "Georgia", size: 80, bold: true, color: ACCENT })] }),
      new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "Intelligent Xtraction & Processing", font: "Georgia", size: 36, color: DARK, italics: true })] }),
      new Paragraph({ spacing: { before: 0, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT2 } }, children: [new TextRun("")] }),
      ...spacer(1),
      new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "A Complete Technical & Strategic Reference", font: "Calibri", size: 24, color: MID })] }),
      new Paragraph({ spacing: { before: 60, after: 600 }, children: [new TextRun({ text: "Fundamentals · Architecture · Use Cases · Governance · Alternatives", font: "Calibri", size: 22, color: BORDER_COLOR })] }),

      new Paragraph({ children: [new PageBreak()] }),

      // ── TOC ──
      h1("Table of Contents"),
      new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════
      // 1. WHAT IS IXP
      // ═══════════════════════════════════════════
      h1("1. What Is UiPath IXP?"),
      body("UiPath IXP — Intelligent Xtraction and Processing — is the next evolution of enterprise Intelligent Document Processing (IDP). Officially launched at UiPath's Agentic AI Summit in March 2025, IXP is a multi-modal data classification and extraction platform that unifies three previously separate capabilities under a single governed framework."),
      ...spacer(1),
      callout("CORE DEFINITION", "IXP converts data from unstructured documents and communications into clean, structured outputs that flow directly into agentic workflows, automations, and analytics — at enterprise speed and scale."),
      ...spacer(1),
      body("The 'X' in IXP intentionally represents not just extraction, but the ever-growing diversity of content types, data formats, and extraction methods the platform supports. IXP is purpose-built for the agentic automation era, where AI agents need reliable, structured data fuel to act autonomously across complex enterprise processes."),

      h2("1.1 The Problem IXP Solves"),
      body("Most enterprise data is locked in unstructured or semi-structured form — buried in emails, PDFs, contracts, mortgage packets, engineering reports, and support tickets. Traditional IDP systems struggled with:"),
      bullet("Documents with multiple tables, nested tables, or heavy free-form text"),
      bullet("Documents requiring inference or deduction to understand content"),
      bullet("Long-form documents containing embedded sub-documents"),
      bullet("Communications (emails/tickets) with multiple interlocking requests"),
      bullet("Variable-format documents where no two look the same"),
      ...spacer(1),
      body("IXP addresses all of these through a combination of specialized ML models, foundation LLMs, prompt-driven generative extraction, and enterprise governance — replacing the need to stitch together multiple disconnected tools."),

      h2("1.2 Evolution Timeline"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 2000, 5360],
        rows: [
          headerRow(["Phase", "Technology", "Capability"], [2000, 2000, 5360]),
          dataRow(["Pre-2023", "Classic DU", "Template-based structured doc extraction"], [2000, 2000, 5360], "FFFFFF"),
          dataRow(["2023–2024", "Modern DU + Comm Mining", "ML models for semi-structured docs; NLP for email/ticket classification"], [2000, 2000, 5360], LIGHT),
          dataRow(["Early 2025", "IXP Launch", "Unified platform: DU + Communications Mining + Generative Extraction"], [2000, 2000, 5360], "FFFFFF"),
          dataRow(["Late 2025+", "Agentic IXP", "Extraction Agents, Validation Agents, agentic looping, fine-tunable LLM"], [2000, 2000, 5360], LIGHT),
        ]
      }),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════
      // 2. ARCHITECTURE & CORE CAPABILITIES
      // ═══════════════════════════════════════════
      h1("2. Architecture & Core Capabilities"),
      body("IXP is built on a three-pillar capability model, each optimized for a distinct content type. These capabilities share a common governance, licensing, and orchestration infrastructure within UiPath Automation Cloud."),

      h2("2.1 Capability Pillar 1 — Structured & Semi-Structured Documents"),
      body("Powered by: Document Understanding (DU)"),
      ...spacer(1),
      body("Document Understanding is IXP's engine for predictable, repeatable document formats. It supports:"),
      bullet("Classic experience: Template-based extraction using predefined field positions"),
      bullet("Modern experience: ML model-based extraction that generalizes across layout variations"),
      bullet("Pre-built models: Out-of-the-box extractors for invoices, purchase orders, receipts, passports, IDs, and more"),
      bullet("Validation Station: Human-in-the-loop review UI where low-confidence extractions are flagged for correction — and corrections feed back as training data"),
      bullet("Action Center integration: Validated exceptions route to human reviewers via task queues"),
      ...spacer(1),
      callout("BEST FOR", "Invoices, purchase orders, tax forms, identity documents, bank statements, insurance forms — any document with a consistent or semi-consistent structure."),

      h2("2.2 Capability Pillar 2 — Communications Data"),
      body("Powered by: Communications Mining (CM)"),
      ...spacer(1),
      body("Communications Mining applies specialized NLP and generative AI to short-form, conversational data. Key capabilities:"),
      bullet("Intent classification: Identifies what the sender wants (e.g., address change, refund, cancellation)"),
      bullet("Entity extraction: Pulls specific data points like policy numbers, dates, amounts, and addresses"),
      bullet("Multi-request handling: Recognizes when a single email contains multiple distinct requests, each requiring separate data extraction"),
      bullet("Generative Extraction (GenEx): Uses LLMs to understand complex relationships between intents and their associated data fields"),
      bullet("Relationship awareness: For example, in an address change email — identifies the policy number, old address, AND new address, and maps each to the correct request"),
      ...spacer(1),
      callout("BEST FOR", "Customer service emails, IT support tickets, insurance claims communications, HR requests, banking correspondence — any high-volume communication stream."),

      h2("2.3 Capability Pillar 3 — Unstructured & Complex Documents"),
      body("Powered by: Generative Extraction for Unstructured Documents"),
      ...spacer(1),
      body("This is IXP's newest and most powerful pillar, introduced specifically for documents that defeat traditional ML models. It uses:"),
      bullet("Prompt-driven extraction: Business users write natural language prompts to define what to extract — no annotating training data"),
      bullet("Foundation LLMs: Backed by OpenAI GPT-4o and other multimodal models for reasoning over complex content"),
      bullet("RAG (Retrieval-Augmented Generation): Dynamically chunks and retrieves relevant sections from long documents"),
      bullet("In-context learning: Few-shot examples can be embedded in prompts to guide model behavior without retraining"),
      bullet("Intelligent pre-processing: Automatically handles document splitting, layout analysis, and chunking for documents up to 50 pages (150 in preview)"),
      bullet("Agentic looping: Iterative reasoning loops for handling 500+ field documents with precision"),
      ...spacer(1),
      callout("BEST FOR", "Contracts, legal agreements, loan packets, engineering reports, brokerage statements, clinical trial documents, M&A due diligence packages — any complex, variable-format document."),

      h2("2.4 The Unified Architecture"),
      body("All three pillars share:"),
      ...spacer(1),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          headerRow(["Layer", "What It Provides"], [2800, 6560]),
          dataRow(["AI Trust Layer", "Security, auditability, model attribution, AI governance policies via Automation Ops"], [2800, 6560], "FFFFFF"),
          dataRow(["LLM Gateway", "Routes requests to the right model; enforces Automation Ops policies; blocks or allows external LLM calls"], [2800, 6560], LIGHT),
          dataRow(["Validation Station", "Universal human-review UI; confidence-based routing; corrections feed model retraining"], [2800, 6560], "FFFFFF"),
          dataRow(["Action Center", "Task queue for human-in-the-loop exceptions; triggers orchestration on new items"], [2800, 6560], LIGHT),
          dataRow(["Orchestrator Integration", "IXP outputs flow natively into UiPath workflows, agents, and robots"], [2800, 6560], "FFFFFF"),
          dataRow(["Governance Controls", "Model versioning, attribution logging, tenant-level quotas, role-based access"], [2800, 6560], LIGHT),
        ]
      }),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════
      // 3. HOW IXP WORKS — THE PROCESSING LIFECYCLE
      // ═══════════════════════════════════════════
      h1("3. How IXP Works — The Processing Lifecycle"),
      body("Every document or communication that flows through IXP follows a structured lifecycle, regardless of which capability handles it:"),
      ...spacer(1),
      numbered("INGESTION — Documents arrive via email, file system, API, or robotic process (any UiPath-connected channel)."),
      numbered("DIGITIZATION — Scanned images are OCR-processed; native PDFs are parsed. IXP applies layout analysis and intelligent pre-processing to segment complex documents."),
      numbered("CLASSIFICATION — The system identifies document type (invoice, contract, claim, etc.) using ML classifiers or LLM-based routing logic."),
      numbered("SPLITTING — Large document packets (e.g., a mortgage application containing 12 different document types) are split into logical sub-documents for separate processing."),
      numbered("EXTRACTION — The appropriate model (template, ML, or generative) extracts the defined fields. Generative capabilities use prompt + LLM; structured capabilities use trained ML models."),
      numbered("CONFIDENCE SCORING — Every extracted field receives a confidence score. Scores below a configurable threshold route to human review."),
      numbered("VALIDATION — Human reviewers in Validation Station or Action Center correct low-confidence extractions. Corrections are logged as ground truth for model improvement."),
      numbered("OUTPUT & INTEGRATION — Clean, structured data (JSON, XML, or tabular) is passed to downstream automation, agents, ERP systems, or analytics platforms."),
      numbered("CONTINUOUS LEARNING — A fine-tunable proprietary model learns from every annotation and correction, improving accuracy over time."),
      ...spacer(1),

      h2("3.1 Agentic IXP — The Latest Evolution"),
      body("As of late 2025, IXP introduced purpose-built agentic capabilities that transform it from a data extraction tool into an active participant in autonomous workflows:"),
      ...spacer(1),
      bullet("Extraction Agents: AI agents that autonomously navigate complex documents, applying dynamic reasoning to extract fields — not just matching patterns", 0, "Extraction Agents:"),
      bullet("Validation Agents: Agents that cross-check extracted data against reference systems (e.g., matching an invoice amount against a PO in SAP) and flag genuine discrepancies rather than routing everything to humans", 0, "Validation Agents:"),
      bullet("Native Tool Integration: IXP is exposed as a native tool for both low-code and coded agents in UiPath Studio, making document intelligence a first-class capability inside agentic workflows", 0, "Native Tool:"),
      bullet("Autopilot for Schema Creation: AI-assisted schema design where users describe what they want to extract in natural language and the system generates the extraction schema automatically", 0, "Autopilot Schema:"),
      ...spacer(1),
      callout("KEY INSIGHT", "Validation Agents are purpose-built for non-deterministic scenarios — cases where rules alone cannot determine correctness. They reduce manual review volume dramatically by handling intelligent cross-system verification autonomously."),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════
      // 4. USE CASES BY INDUSTRY
      // ═══════════════════════════════════════════
      h1("4. Use Cases by Industry"),
      body("IXP's multi-modal architecture means it applies across virtually every industry vertical where unstructured data is a bottleneck. Below are the key verticals and their highest-value scenarios."),

      h2("4.1 Banking & Financial Services"),
      bullet("Mortgage processing: IXP ingests multi-document loan packets (income docs, appraisals, title reports) and extracts all fields for automated underwriting systems"),
      bullet("Invoice processing & AP automation: Extracts line items, PO references, and payment terms from supplier invoices; matches against ERP purchase orders"),
      bullet("Know Your Customer (KYC): Extracts entity data from ID documents, utility bills, and corporate registration filings"),
      bullet("Brokerage statements: Processes complex multi-table statements with portfolio positions, transactions, and performance summaries"),
      bullet("Trade finance: Extracts data from letters of credit, bills of lading, and commercial invoices for cross-border trade workflows"),

      h2("4.2 Insurance"),
      bullet("Claims intake: Classifies claim types, extracts claimant details, policy numbers, and incident descriptions from emails and PDFs"),
      bullet("Policy endorsements: Reads policy change request communications and extracts the specific endorsement being requested"),
      bullet("Medical bill review: Extracts procedure codes, diagnosis codes, and provider details from EOBs and medical bills"),
      bullet("Fraud detection support: Flags inconsistencies between extracted claim data and policy data for investigator review"),

      h2("4.3 Healthcare & Life Sciences"),
      bullet("Clinical trial data extraction: Pulls patient data, dosage information, and adverse events from unstructured clinical notes and trial reports"),
      bullet("Prior authorization: Extracts diagnosis and treatment data from physician letters and routes to payer systems"),
      bullet("Medical record summarization: Processes lengthy patient histories into structured summaries for clinical decision support"),
      bullet("Referral management: Classifies and routes patient referral communications based on specialty and urgency"),

      h2("4.4 Legal & Compliance"),
      bullet("Contract analysis: Extracts key dates, obligations, parties, penalty clauses, and renewal terms from complex legal agreements"),
      bullet("Contract comparison: Compares extracted terms against standard templates to flag deviations requiring legal review"),
      bullet("Regulatory filing extraction: Pulls structured data from SEC filings, regulatory submissions, and compliance reports"),
      bullet("Due diligence automation: Processes M&A data room documents to extract material information for deal analysis"),

      h2("4.5 Manufacturing & Supply Chain"),
      bullet("Purchase order processing: Extracts line items, delivery dates, and vendor details from supplier POs across varied formats"),
      bullet("Quality inspection reports: Extracts measurement data, defect classifications, and test results from inspection documents"),
      bullet("Engineering drawings (text components): Extracts part numbers, tolerances, and material specifications from technical documents"),
      bullet("Logistics documentation: Processes bills of lading, customs declarations, and shipping manifests"),

      h2("4.6 Public Sector & Government"),
      bullet("Permit applications: Extracts applicant details, project descriptions, and location data from planning applications"),
      bullet("Grant applications: Classifies and extracts key criteria from funding requests for automated scoring"),
      bullet("Tax document processing: Handles diverse form types across different tax jurisdictions"),
      bullet("Benefits determination: Extracts supporting documentation for eligibility verification"),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════
      // 5. UNIQUE & CREATIVE IMPLEMENTATIONS
      // ═══════════════════════════════════════════
      h1("5. Unique & Creative Implementations"),
      body("Beyond standard document processing, IXP's agentic and generative capabilities open doors to implementations that go far beyond what traditional IDP tools could achieve."),

      h2("5.1 IXP as the Data Layer for AI Agents"),
      body("The most architecturally significant use of IXP is as the document intelligence layer within multi-agent systems. Rather than treating document processing as a pre-process step, IXP is embedded as a callable tool within agent workflows. An orchestrating agent can dynamically invoke IXP mid-workflow when it encounters a document it needs to reason over — enabling truly dynamic, context-aware document processing at runtime."),
      ...spacer(1),
      callout("EXAMPLE", "A Purchase-to-Pay agent receives an email with a PDF invoice attached. It calls IXP's Communications Mining capability to understand the email intent, then calls IXP's Document Understanding capability to extract invoice fields, then calls a Validation Agent to cross-check against the SAP PO — all within a single orchestrated agent loop."),

      h2("5.2 Autonomous Contract Lifecycle Management"),
      body("IXP's generative extraction plus contract comparison capabilities, combined with UiPath agents, enable a fully autonomous contract lifecycle: extract all obligations and key dates → compare against standard playbook terms → flag deviations → route only non-standard clauses for attorney review → auto-populate contract management systems. Legal teams report 70–80% reduction in manual contract review time in pilot deployments."),

      h2("5.3 Continuous Model Self-Improvement Loops"),
      body("IXP's fine-tunable model architecture enables a closed-loop learning system: every human correction in Validation Station feeds back as labeled training data to a proprietary LLM. Over time, the model becomes increasingly specialized to the organization's specific document vocabulary, formatting patterns, and edge cases. Unlike one-time model training, this creates a compounding accuracy improvement curve."),

      h2("5.4 Cross-System Document Reconciliation"),
      body("Validation Agents can be configured to extract data from two independent documents (e.g., a supplier invoice and a UiPath-retrieved PO from SAP) and perform automated reconciliation — identifying line-item discrepancies, unit price variances, and quantity mismatches without any human involvement, routing only genuine exceptions."),

      h2("5.5 Communications Triage at Scale"),
      body("For organizations receiving tens of thousands of emails daily (insurance companies, banks, utilities), IXP's Communications Mining can classify, extract, and route 100% of incoming communication volume in real time — replacing human email sorting teams and enabling sub-second response time for automated handling of the highest-confidence cases."),

      h2("5.6 SAP Joule + IXP Integration"),
      body("In SAP environments, IXP serves as the document intelligence backbone for SAP's Joule AI agents. When a Joule agent needs to process a document, it calls IXP via API, receives structured data, and uses it to update SAP records — with every interaction logged in UiPath's AI Trust Layer for a complete audit trail. This is particularly powerful for Accounts Payable, Procurement, and HR document flows within SAP S/4HANA."),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════
      // 6. GOVERNANCE & ENTERPRISE TRUST
      // ═══════════════════════════════════════════
      h1("6. Governance & Enterprise Trust"),
      body("One of IXP's core differentiators is its enterprise-grade governance architecture, built specifically for regulated industries where AI outputs must be traceable, auditable, and controllable."),

      h2("6.1 AI Trust Layer"),
      bullet("Every IXP prediction is attributed — the system records which model, which version, and which prompt configuration produced each output"),
      bullet("Full audit trail: all interactions between IXP, agents, robots, and downstream systems are logged"),
      bullet("Data residency controls: IXP is available in US, EU, Canada, Australia, and Japan regions with data sovereignty compliance"),

      h2("6.2 Model Versioning & Governance"),
      bullet("Models are versioned — organizations can pin to a specific model version for consistency and roll back if needed"),
      bullet("LLM Gateway: a centralized control plane that routes AI requests and enforces Automation Ops policies at user, group, or tenant level"),
      bullet("External LLM access can be selectively blocked via policy — critical for organizations with data classification requirements"),

      h2("6.3 Human-in-the-Loop Framework"),
      bullet("Confidence thresholds are configurable per field, per document type, and per workflow"),
      bullet("Low-confidence extractions are automatically queued in Action Center with full document context for efficient human review"),
      bullet("Human corrections are captured with attribution and fed back into model improvement pipelines"),
      bullet("Orchestration triggers can be defined on human task queues — when a new exception is added, a new orchestration process starts automatically"),

      h2("6.4 Licensing Model"),
      body("IXP uses a unit-based licensing model with two currency types:"),
      bullet("AI Units: Consumed by generative AI predictions (Unstructured Documents, GenEx in Communications Mining)"),
      bullet("Platform Units: Consumed by structured/semi-structured document processing (Document Understanding)"),
      body("Combining IXP capabilities (e.g., using both Modern DU and Unstructured Documents on the same workflow) applies separate pricing models for each capability consumed."),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════
      // 7. ALTERNATIVES & COMPETITIVE LANDSCAPE
      // ═══════════════════════════════════════════
      h1("7. Alternatives & Competitive Landscape"),
      body("IXP competes in the Intelligent Document Processing (IDP) market and increasingly in the agentic AI/automation market. Here is a structured comparison of the major alternatives:"),

      h2("7.1 Direct IDP Competitors"),
      ...spacer(1),

      h3("7.1.1 Automation Anywhere — IQ Bot / Document Automation"),
      bullet("Strengths: Fully cloud-native architecture; strong AI Agent integration (AutomationAnywhere AI + AARI); good pre-built model library; usage-based pricing"),
      bullet("Weaknesses: Less mature generative extraction for truly unstructured documents; smaller pre-built model catalog than UiPath; communications mining not as deep"),
      bullet("Best for: Organizations already in the AA ecosystem; cloud-first deployments"),

      h3("7.1.2 Microsoft Azure Form Recognizer / Azure AI Document Intelligence"),
      bullet("Strengths: Deep Microsoft 365 / Azure integration; powerful for structured forms; strong OCR backbone; pay-per-use API pricing; enterprise-grade security"),
      bullet("Weaknesses: Primarily an API/SDK — requires significant custom development for end-to-end workflows; no built-in orchestration; limited agentic capabilities; no communications mining analog"),
      bullet("Best for: Microsoft-first organizations building custom document pipelines; developers with Azure expertise"),

      h3("7.1.3 ABBYY Vantage"),
      bullet("Strengths: Industry-leading OCR accuracy; excellent support for complex layouts and handwriting; strong pre-built skill marketplace; proven in high-volume production environments; good compliance features"),
      bullet("Weaknesses: Less native RPA/agent orchestration than UiPath; generative capabilities are newer and less mature; UI is less modern; higher learning curve for custom skills"),
      bullet("Best for: Organizations prioritizing OCR accuracy and layout fidelity; existing ABBYY FlexiCapture users migrating to cloud"),

      h3("7.1.4 Hyperscience"),
      bullet("Strengths: Exceptional accuracy on structured and semi-structured forms through its human-machine collaboration model; strong in government and financial services; good SLA guarantees"),
      bullet("Weaknesses: Premium pricing; limited generative/unstructured document capability; less breadth of pre-built models; not integrated with a broader automation platform"),
      bullet("Best for: High-stakes, high-accuracy form processing where the cost of errors is very high"),

      h3("7.1.5 Reducto / LlamaExtract / Unstructured.io (API-first IDP)"),
      bullet("Strengths: Developer-friendly APIs; fast time to prototype; low cost; flexible LLM backends; good for greenfield development"),
      bullet("Weaknesses: No built-in governance, validation station, or human-in-the-loop framework; no communications mining; no orchestration; require significant engineering to productionize"),
      bullet("Best for: Engineering teams building custom AI pipelines; startups; document processing as a microservice"),

      h2("7.2 Broader RPA/Automation Platform Competitors"),
      ...spacer(1),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 2600, 2600, 2160],
        rows: [
          headerRow(["Platform", "IDP Capability", "Agentic AI", "Best Differentiator"], [2000, 2600, 2600, 2160]),
          dataRow(["UiPath IXP", "Best-in-class (Leader, Everest Group 2025)", "Strong — native Extraction/Validation Agents", "Unified IDP + Agent + Governance platform"], [2000, 2600, 2600, 2160], "FFFFFF"),
          dataRow(["Automation Anywhere", "Good — IQ Bot + Doc Automation", "Strong — AARI agents + CoE Manager", "Cloud-native; usage-based pricing"], [2000, 2600, 2600, 2160], LIGHT),
          dataRow(["Microsoft Power Automate", "Basic — Form Recognizer via connector", "Growing — Copilot Studio agents", "Microsoft ecosystem lock-in value"], [2000, 2600, 2600, 2160], "FFFFFF"),
          dataRow(["Blue Prism", "Limited — third-party IDP integrations", "Emerging", "Security & compliance in regulated industries"], [2000, 2600, 2600, 2160], LIGHT),
          dataRow(["Appian", "Moderate — via AI skills", "Moderate", "BPM + RPA + AI in one low-code platform"], [2000, 2600, 2600, 2160], "FFFFFF"),
        ]
      }),
      ...spacer(1),

      h2("7.3 When to Choose IXP vs. Alternatives"),
      ...spacer(1),
      callout("CHOOSE IXP WHEN", "You need to handle all three document types (structured, semi-structured, AND unstructured) in one governed platform; you have complex multi-document workflows; you need deep communications mining; you require enterprise governance, model versioning, and human-in-the-loop; you are already in the UiPath ecosystem; or you are building agentic automations that need document intelligence as a native capability."),
      ...spacer(1),
      callout("CONSIDER ALTERNATIVES WHEN", "You are Microsoft-first and primarily need structured form extraction (Azure AI Document Intelligence); you prioritize OCR accuracy above all else (ABBYY Vantage); you are building a lightweight custom API pipeline without governance requirements (API-first tools); or you are Automation Anywhere-native and your document types are not highly unstructured.", WARN),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════
      // 8. KEY STRENGTHS & LIMITATIONS
      // ═══════════════════════════════════════════
      h1("8. Key Strengths & Limitations"),

      h2("8.1 Strengths"),
      bullet("Unified platform: The only solution that handles structured docs, semi-structured docs, unstructured docs, AND communications mining in one governed interface"),
      bullet("Agentic-native: IXP is purpose-built for the agentic automation era — not retrofitted. Extraction and Validation Agents are first-class capabilities"),
      bullet("Governance depth: Model versioning, LLM Gateway policies, AI Trust Layer, and human-in-the-loop are built-in, not bolted on"),
      bullet("Continuous learning: Fine-tunable proprietary LLM learns from every human correction, improving accuracy compoundingly over time"),
      bullet("Everest Group Leader (2025): Recognized leader in IDP with strong client satisfaction scores for cognitive features and scalability"),
      bullet("SAP integration: Deep SAP Joule integration makes IXP the natural choice for SAP-heavy enterprises"),
      bullet("Speed to value: Prompt-driven generative extraction means new document types can go live without annotation campaigns — days, not months"),
      bullet("Multi-modal: Handles text, tables, graphics, handwriting, and mixed-format documents through the same workflow"),

      h2("8.2 Limitations & Considerations"),
      bullet("Page limits: Unstructured document capability currently supports up to 50 pages (150 in preview); very long documents still require Document Understanding Generative Extraction activities"),
      bullet("Generative AI dependency: The Unstructured Documents capability requires generative AI to be enabled — cannot be disabled at the field level (unlike Communications Mining)"),
      bullet("No learning from annotations (Unstructured): Unlike Classic/Modern DU, the Unstructured Documents capability does not yet learn from user annotations or corrections"),
      bullet("Pricing complexity: Combining capabilities triggers separate AI Unit and Platform Unit consumption — requires careful licensing planning for mixed workflows"),
      bullet("IXP mindshare decline: Per PeerSpot data (Jan 2026), IXP mindshare in the IDP category has declined from 15.1% to 7.3% year-over-year as the market expands"),
      bullet("Cloud-only: IXP capabilities run on UiPath Automation Cloud — organizations with strict on-premise requirements need alternative architectures"),
      ...spacer(1),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════
      // 9. QUICK REFERENCE DECISION GUIDE
      // ═══════════════════════════════════════════
      h1("9. Capability Selection Quick Reference"),
      body("Use this table to choose the right IXP capability for your document type:"),
      ...spacer(1),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 2200, 2200, 2560],
        rows: [
          headerRow(["Document Type", "Recommended Capability", "Training Required?", "Generative AI?"], [2400, 2200, 2200, 2560]),
          dataRow(["Invoices, POs, Forms (consistent format)", "Document Understanding — Modern", "Yes (ML annotation)", "Optional"], [2400, 2200, 2200, 2560], "FFFFFF"),
          dataRow(["ID documents, Passports, Receipts", "Document Understanding — Pre-built Models", "No (OOTB)", "No"], [2400, 2200, 2200, 2560], LIGHT),
          dataRow(["Contracts, Loan Packets, Legal Docs", "IXP Unstructured & Complex Docs", "No (prompt-based)", "Yes (required)"], [2400, 2200, 2200, 2560], "FFFFFF"),
          dataRow(["Documents > 50 pages", "DU Generative Extraction Activities", "No (prompt-based)", "Yes (required)"], [2400, 2200, 2200, 2560], LIGHT),
          dataRow(["Emails, Support Tickets", "IXP Communications Data (Comm Mining)", "Yes (intent training)", "Optional"], [2400, 2200, 2200, 2560], "FFFFFF"),
          dataRow(["Emails with complex multi-requests", "Comm Mining + GenEx", "Minimal", "Yes"], [2400, 2200, 2200, 2560], LIGHT),
          dataRow(["Mixed: Email + PDF attachment", "Both Communications Data + Document Understanding", "Varies", "Optional"], [2400, 2200, 2200, 2560], "FFFFFF"),
        ]
      }),
      ...spacer(2),

      // ═══════════════════════════════════════════
      // 10. SUMMARY
      // ═══════════════════════════════════════════
      h1("10. Summary"),
      body("UiPath IXP represents the maturation of enterprise document processing from a standalone ML-based extraction tool into a governed, agentic, multi-modal intelligence layer. Its core innovation is the unification of Document Understanding, Communications Mining, and Generative Extraction under a single platform with enterprise-grade governance — serving as the data foundation for the agentic automation era."),
      ...spacer(1),
      body("The platform's trajectory is clear: from extracting data out of documents, toward autonomous agents that reason over documents, validate extracted data against enterprise systems, and act on the results — with humans in the loop only for the edge cases that genuinely require judgment."),
      ...spacer(1),
      body("For enterprises with complex, document-heavy processes across Finance, Insurance, Legal, Healthcare, or Supply Chain — IXP is the most complete, governed, and agentic-ready IDP platform available in 2025–2026. Its primary competitors serve narrower use cases or lack the governance depth required for regulated industry deployments."),
      ...spacer(1),
      callout("BOTTOM LINE", "IXP is not just an IDP tool. It is the enterprise-grade document intelligence infrastructure layer that makes agentic automation viable for the most complex, document-intensive business processes in the world."),
      ...spacer(2),
      new Paragraph({ spacing: { before: 240, after: 80 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR } }, children: [new TextRun({ text: "Document prepared using UiPath official documentation, Everest Group IDP PEAK Matrix 2025, UiPath DevCon 2025, and SAP Insider / ASUG technical resources.", font: "Calibri", size: 18, color: "9CA3AF", italics: true })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('./outputs/UiPath_IXP_Complete_Guide.docx', buf);
  console.log('Done');
});