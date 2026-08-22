import PDFDocument from 'pdfkit';

export const RESUME_TEMPLATES = ['classic', 'modern'];

function renderSectionHeading(doc, text, color) {
  doc.moveDown(0.6);
  doc.fillColor(color).fontSize(13).font('Helvetica-Bold').text(text.toUpperCase());
  doc
    .moveTo(doc.x, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .strokeColor(color)
    .stroke();
  doc.moveDown(0.4);
  doc.fillColor('#111111').font('Helvetica').fontSize(10.5);
}

function renderCommonBody(doc, data, accentColor) {
  const { education = [], skills = [], projects = [], experience = [], internships = [] } = data;

  if (skills.length) {
    renderSectionHeading(doc, 'Skills', accentColor);
    doc.text(skills.map((s) => s.name).join('  ·  '));
  }

  const workEntries = [...experience, ...internships];
  if (workEntries.length) {
    renderSectionHeading(doc, 'Experience', accentColor);
    for (const entry of workEntries) {
      doc.font('Helvetica-Bold').text(`${entry.role} — ${entry.company}`);
      doc.font('Helvetica').fontSize(9.5).fillColor('#555555');
      const start = entry.startDate ? new Date(entry.startDate).getFullYear() : '';
      const end = entry.endDate ? new Date(entry.endDate).getFullYear() : 'Present';
      doc.text(`${start} – ${end}`);
      doc.fillColor('#111111').fontSize(10.5);
      if (entry.description) doc.text(entry.description);
      doc.moveDown(0.4);
    }
  }

  if (projects.length) {
    renderSectionHeading(doc, 'Projects', accentColor);
    for (const project of projects) {
      doc.font('Helvetica-Bold').text(project.title);
      doc.font('Helvetica');
      if (project.techStack?.length) {
        doc.fontSize(9.5).fillColor('#555555').text(project.techStack.join(', '));
        doc.fillColor('#111111').fontSize(10.5);
      }
      if (project.description) doc.text(project.description);
      doc.moveDown(0.4);
    }
  }

  if (education.length) {
    renderSectionHeading(doc, 'Education', accentColor);
    for (const edu of education) {
      doc.font('Helvetica-Bold').text(`${edu.degree} — ${edu.institution}`);
      doc.font('Helvetica').fontSize(9.5).fillColor('#555555');
      doc.text(`${edu.startYear || ''}${edu.endYear ? `–${edu.endYear}` : ''}`);
      doc.fillColor('#111111').fontSize(10.5);
      doc.moveDown(0.3);
    }
  }
}

function renderClassicTemplate(doc, data) {
  const accent = '#0C1220';
  doc.font('Helvetica-Bold').fontSize(22).fillColor(accent).text(data.name);
  doc.font('Helvetica').fontSize(10).fillColor('#555555');
  doc.text(
    [data.email, data.phone, data.linkedinUrl, data.githubUrl].filter(Boolean).join('   |   ')
  );
  renderCommonBody(doc, data, accent);
}

function renderModernTemplate(doc, data) {
  const accent = '#4548C9';
  doc.rect(0, 0, doc.page.width, 90).fill(accent);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(24).text(data.name, 50, 30);
  doc.font('Helvetica').fontSize(10);
  doc.text(
    [data.email, data.phone, data.linkedinUrl, data.githubUrl].filter(Boolean).join('   |   '),
    50,
    62
  );
  doc.y = 110;
  doc.fillColor('#111111');
  renderCommonBody(doc, data, accent);
}

/**
 * Renders a resume PDF for the given structured data and returns it as a Buffer.
 * @param {object} data - { name, email, phone, linkedinUrl, githubUrl, education, skills, projects, experience, internships }
 * @param {'classic'|'modern'} template
 */
export function generateResumePdfBuffer(data, template = 'classic') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    if (template === 'modern') {
      renderModernTemplate(doc, data);
    } else {
      renderClassicTemplate(doc, data);
    }

    doc.end();
  });
}
