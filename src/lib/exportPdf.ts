import type { ListingWithState } from "@/lib/types";

export async function exportListingsPdf(listings: ListingWithState[], sortLabel: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const PAGE_H = 297;
  const BOTTOM_MARGIN = 18;

  let y = MARGIN;

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > PAGE_H - BOTTOM_MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  }

  // ── Cover header ──────────────────────────────────────────────────────────
  doc.setFillColor(30, 20, 60);
  doc.rect(0, 0, PAGE_W, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Car Flip Finder — Deal Export", MARGIN, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${listings.length} listing${listings.length !== 1 ? "s" : ""}  ·  Sorted by: ${sortLabel}  ·  ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
    MARGIN,
    20
  );

  y = 36;

  // ── Listings ──────────────────────────────────────────────────────────────
  listings.forEach((listing, idx) => {
    const justification = listing.raw_json?._llm_justification as string | null ?? null;
    const conditionText = listing.condition_text;
    const displayTitle =
      listing.title ??
      [listing.year, listing.make, listing.model].filter(Boolean).join(" ") ??
      "Unknown Vehicle";

    // Estimate block height before drawing so we can page-break cleanly
    const titleLines = wrapText(displayTitle, CONTENT_W - 20, 12);
    const descLines = conditionText
      ? wrapText(`Description: ${conditionText}`, CONTENT_W - 4, 8)
      : [];
    const justLines = justification
      ? wrapText(`AI Reasoning: ${justification}`, CONTENT_W - 4, 8)
      : [];

    const blockH =
      6 +            // title row
      titleLines.length * 5 +
      6 +            // meta row
      10 +           // price row
      (descLines.length ? descLines.length * 4 + 5 : 0) +
      (justLines.length ? justLines.length * 4 + 5 : 0) +
      4;             // bottom padding

    checkPageBreak(blockH);

    // Card background
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(MARGIN - 2, y, CONTENT_W + 4, blockH, 2, 2, "F");

    // Index badge
    doc.setFillColor(80, 50, 160);
    doc.roundedRect(MARGIN, y + 2, 10, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(String(idx + 1), MARGIN + 5, y + 6.2, { align: "center" });

    // Title
    doc.setTextColor(20, 20, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    titleLines.forEach((line: string, i: number) => {
      doc.text(line, MARGIN + 13, y + 6.5 + i * 5);
    });

    let rowY = y + 6 + titleLines.length * 5;

    // Score badge
    const score = listing.score;
    if (score !== null) {
      const scoreColor =
        score >= 75 ? [16, 185, 129] :
        score >= 50 ? [59, 130, 246] :
        [120, 120, 130];
      doc.setFillColor(...(scoreColor as [number, number, number]));
      doc.roundedRect(CONTENT_W - 10 + MARGIN, y + 2, 14, 7, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${score}`, CONTENT_W - 3 + MARGIN, y + 7, { align: "center" });
    }

    // Meta: mileage + location + link
    doc.setTextColor(90, 90, 110);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const metaParts: string[] = [];
    if (listing.mileage) metaParts.push(`${listing.mileage.toLocaleString()} mi`);
    if (listing.location) metaParts.push(listing.location);
    if (metaParts.length) doc.text(metaParts.join("  ·  "), MARGIN, rowY + 4);

    // Link (right-aligned)
    if (listing.url) {
      doc.setTextColor(100, 80, 200);
      doc.textWithLink("View listing →", PAGE_W - MARGIN, rowY + 4, {
        url: listing.url,
        align: "right",
      });
    }

    rowY += 8;

    // Price row
    const priceStr = listing.price !== null ? `$${listing.price.toLocaleString()}` : "—";
    const mvStr = listing.market_value !== null ? `$${listing.market_value.toLocaleString()}` : "—";
    const profitStr =
      listing.estimated_profit !== null
        ? `${listing.estimated_profit >= 0 ? "+" : ""}$${listing.estimated_profit.toLocaleString()}`
        : "—";
    const profitPositive = (listing.estimated_profit ?? 0) >= 0;

    const col = CONTENT_W / 3;

    [
      { label: "Asking Price", value: priceStr, color: [20, 20, 30] as [number, number, number] },
      { label: "Market Value", value: mvStr, color: [60, 60, 90] as [number, number, number] },
      { label: "Est. Profit", value: profitStr, color: (profitPositive ? [16, 185, 129] : [220, 80, 80]) as [number, number, number] },
    ].forEach(({ label, value, color }, ci) => {
      const cx = MARGIN + ci * col;
      doc.setTextColor(130, 130, 150);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(label.toUpperCase(), cx, rowY);

      doc.setTextColor(...color);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(value, cx, rowY + 5.5);
    });

    rowY += 10;

    // Description
    if (descLines.length) {
      doc.setTextColor(60, 60, 80);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      descLines.forEach((line: string, i: number) => {
        doc.text(line, MARGIN, rowY + i * 4);
      });
      rowY += descLines.length * 4 + 3;
    }

    // AI reasoning
    if (justLines.length) {
      doc.setTextColor(80, 60, 140);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      justLines.forEach((line: string, i: number) => {
        doc.text(line, MARGIN, rowY + i * 4);
      });
      rowY += justLines.length * 4 + 3;
    }

    y += blockH + 4;
  });

  // ── Page numbers ──────────────────────────────────────────────────────────
  const totalPages = (doc as typeof doc & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setTextColor(160, 160, 180);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W / 2, PAGE_H - 8, { align: "center" });
  }

  doc.save(`car-flip-deals-${Date.now()}.pdf`);
}
