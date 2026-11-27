import { jsPDF } from 'jspdf';
import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from 'docx';
import type { TemplateBlock } from './contracts';

export interface ContractExportMeta {
  contractReference: string;
  propertyAddress?: string;
  agreementDate?: string;
  landlordInitials?: string;
  tenantInitials?: string;
  disclaimer?: string;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Produce a text-based, multi-page PDF from an approved template.
 * Text stays selectable/searchable; page numbers and initials are added to every page.
 */
export function exportContractPdf(
  title: string,
  blocks: TemplateBlock[],
  meta: ContractExportMeta,
  filename: string,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const footerTop = pageHeight - 20;
  let y = margin + 6;

  const drawHeader = () => {
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text('JUMP LIVING  /  PROPERTY MANAGEMENT', margin, 10);
    doc.text('CONFIDENTIAL', pageWidth - margin, 10, { align: 'right' });
    doc.setDrawColor(205, 205, 205);
    doc.setLineWidth(0.3);
    doc.line(margin, 12.5, pageWidth - margin, 12.5);
  };

  const newPageIfNeeded = (needed: number) => {
    if (y + needed > footerTop) {
      doc.addPage();
      y = margin + 4;
      drawHeader();
    }
  };

  drawHeader();

  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), contentWidth) as string[];
  titleLines.forEach((line) => {
    newPageIfNeeded(8);
    doc.text(line, margin, y);
    y += 8;
  });

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  [
    `Contract Reference: ${meta.contractReference || '—'}`,
    meta.propertyAddress ? `Property Address: ${meta.propertyAddress}` : '',
    meta.agreementDate ? `Agreement Date: ${meta.agreementDate}` : '',
  ].filter(Boolean).forEach((line) => {
    newPageIfNeeded(5);
    doc.text(line, margin, y);
    y += 5;
  });

  y += 3;
  doc.setDrawColor(170, 170, 170);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  blocks.forEach((block) => {
    if (block.type === 'space') {
      y += 3;
      return;
    }

    const isHeading = block.type !== 'paragraph';
    doc.setFont('times', isHeading ? 'bold' : 'normal');
    doc.setFontSize(block.type === 'h1' ? 13 : block.type === 'h2' ? 11.5 : block.type === 'h3' ? 10 : 10);
    if (isHeading) y += 2.5;

    const text = block.text.replace(/\*\*/g, '');
    const lineHeight = isHeading ? 5.5 : 4.8;
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    lines.forEach((line) => {
      newPageIfNeeded(lineHeight);
      doc.setTextColor(15, 15, 15);
      doc.text(line, margin, y);
      y += lineHeight;
    });
    if (isHeading) y += 1.5;
  });

  if (meta.disclaimer) {
    y += 4;
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    const lines = doc.splitTextToSize(meta.disclaimer, contentWidth) as string[];
    lines.forEach((line) => {
      newPageIfNeeded(4);
      doc.text(line, margin, y);
      y += 4;
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(205, 205, 205);
    doc.line(margin, footerTop - 2, pageWidth - margin, footerTop - 2);
    doc.setFont('times', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(`Ref: ${meta.contractReference || '—'}`, margin, footerTop + 3);
    doc.text('CONFIDENTIAL — Legal review recommended', pageWidth / 2, footerTop + 3, { align: 'center' });
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, footerTop + 3, { align: 'right' });
    if (page === totalPages) {
      doc.text(`Landlord initials: ${meta.landlordInitials || '____'}`, margin, footerTop + 8);
      doc.text(`Tenant initials: ${meta.tenantInitials || '____'}`, pageWidth - margin, footerTop + 8, { align: 'right' });
    }
  }

  doc.save(filename);
}

/** Produce an editable DOCX from the same approved template content. */
export async function exportContractDocx(
  title: string,
  blocks: TemplateBlock[],
  meta: ContractExportMeta,
  filename: string,
): Promise<void> {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({ text: 'JUMP LIVING', bold: true, size: 20, color: '8A6D2F' }),
        new TextRun({ text: '\nPROPERTY MANAGEMENT', size: 14, color: '666666' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 28 })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `Contract Reference: ${meta.contractReference || '—'}`, size: 18 }),
        meta.propertyAddress
          ? new TextRun({ text: `\nProperty Address: ${meta.propertyAddress}`, size: 18 })
          : new TextRun({ text: '' }),
        meta.agreementDate
          ? new TextRun({ text: `\nAgreement Date: ${meta.agreementDate}`, size: 18 })
          : new TextRun({ text: '' }),
      ],
    }),
  ];

  blocks.forEach((block) => {
    if (block.type === 'space') {
      children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun('')] }));
      return;
    }
    const heading =
      block.type === 'h1'
        ? HeadingLevel.HEADING_1
        : block.type === 'h2'
          ? HeadingLevel.HEADING_2
          : block.type === 'h3'
            ? HeadingLevel.HEADING_3
            : undefined;
    children.push(
      new Paragraph({
        heading,
        spacing: { after: heading ? 140 : 120 },
        children: [new TextRun({ text: block.text.replace(/\*\*/g, ''), bold: Boolean(heading), size: heading ? 22 : 20 })],
      }),
    );
  });

  if (meta.disclaimer) {
    children.push(
      new Paragraph({
        spacing: { before: 240 },
        children: [new TextRun({ text: meta.disclaimer, italics: true, size: 16, color: '777777' })],
      }),
    );
  }

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // 20 mm in twips
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Ref: ${meta.contractReference || '—'}  |  CONFIDENTIAL  |  Page `, size: 14, color: '777777' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: '777777' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Landlord initials: ${meta.landlordInitials || '____'}     Tenant initials: ${meta.tenantInitials || '____'}`,
                    size: 14,
                    color: '777777',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, filename);
}
