import PDFDocument from 'pdfkit';

/**
 * @param {{ studentName: string, assessmentTitle: string, percentage: number, date: Date }} data
 * @returns {Promise<Buffer>}
 */
export function generateCertificatePdfBuffer(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { width, height } = doc.page;
    const accent = '#4548C9';

    doc
      .rect(20, 20, width - 40, height - 40)
      .lineWidth(2)
      .strokeColor(accent)
      .stroke();
    doc
      .rect(28, 28, width - 56, height - 56)
      .lineWidth(0.75)
      .strokeColor('#8A93A6')
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(accent)
      .text('CAREERFLOW', 0, 70, { align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(30)
      .fillColor('#0C1220')
      .text('Certificate of Completion', 0, 100, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#4B5468')
      .text('This certifies that', 0, 160, { align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor('#0C1220')
      .text(data.studentName, 0, 185, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#4B5468')
      .text('has successfully completed', 0, 225, { align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(accent)
      .text(data.assessmentTitle, 0, 250, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#4B5468')
      .text(`Score: ${data.percentage}%`, 0, 290, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#8A93A6')
      .text(
        new Date(data.date).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        0,
        height - 70,
        {
          align: 'center',
        }
      );

    doc.end();
  });
}
