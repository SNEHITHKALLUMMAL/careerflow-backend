import PDFDocument from 'pdfkit';

/**
 * @param {{ studentName: string, companyName: string, position: string, salary?: string, startDate: Date, issuedDate: Date }} data
 * @returns {Promise<Buffer>}
 */
export function generateOfferLetterPdfBuffer(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0C1220').text(data.companyName);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#8A93A6')
      .text(
        new Date(data.issuedDate).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );

    doc.moveDown(1.5);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111').text('Offer of Employment');
    doc.moveDown(0.8);

    doc.font('Helvetica').fontSize(11).fillColor('#111111');
    doc.text(`Dear ${data.studentName},`);
    doc.moveDown(0.6);
    doc.text(
      `We are pleased to offer you the position of ${data.position} at ${data.companyName}. ` +
        `We were impressed by your skills and experience and believe you will be a valuable addition to our team.`
    );
    doc.moveDown(0.6);

    if (data.salary) {
      doc.text(`Compensation: ${data.salary}`);
    }
    doc.text(
      `Start date: ${new Date(data.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`
    );
    doc.moveDown(0.8);

    doc.text(
      'This letter is a summary of the offer discussed and is subject to formal terms in your employment contract. ' +
        'Please reach out if you have any questions.'
    );
    doc.moveDown(1.2);
    doc.text('We look forward to welcoming you to the team.');
    doc.moveDown(1.5);
    doc.text('Sincerely,');
    doc.text(`${data.companyName} Hiring Team`);

    doc.end();
  });
}
