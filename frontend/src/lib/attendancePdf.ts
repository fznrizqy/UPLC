import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MeetingData {
  id: number;
  title: string;
  project_name: string;
  meeting_type: string;
  date_time: string;
  location?: string;
  description?: string;
  meeting_url?: string;
}

interface AttendanceItem {
  id: number;
  attended_at: string;
  user?: {
    display_name?: string;
    username?: string;
    position?: string;
  };
}

export async function exportAttendancePdf(meeting: MeetingData, attendances: AttendanceItem[]) {
  // A4 portrait dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Load and Add Logo SIG at top-left
  try {
    const logoImg = new Image();
    logoImg.src = '/logobrowsersig.png';
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });
    // Aspect ratio roughly 3:2, display width: 28mm, height: 18mm
    doc.addImage(logoImg, 'PNG', 14, 12, 28, 18);
  } catch (err) {
    // Fallback if logo fails to load: Draw styled text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Navy blue
    doc.text('SIG', 14, 24);
  }

  // 2. Right Header Box: Document control numbers
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text('No. 31.1/F-PP', 196, 16, { align: 'right' });
  doc.text('Revisi : 1', 196, 21, { align: 'right' });

  // 3. Center Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR HADIR RAPAT', 105, 32, { align: 'center' });

  // 4. Meeting Metadata Header Section
  const startY = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Agenda Label
  doc.text('Agenda', 14, startY);

  // Agenda content / Meeting Title (only title, without sharing ID)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const fullAgendaText = meeting.title;
  const agendaLines = doc.splitTextToSize(fullAgendaText, 182);
  doc.text(agendaLines, 14, startY + 5);

  const afterAgendaY = startY + 5 + agendaLines.length * 4.5 + 2;

  // Thin separator line below agenda
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, afterAgendaY, 196, afterAgendaY);

  // Tempat & Tanggal Fields
  const metadataY = afterAgendaY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  // Label Tempat
  doc.text('Tempat :', 14, metadataY);
  doc.setTextColor(30, 41, 59);
  const tempatVal = meeting.location?.trim()
    ? meeting.location.trim()
    : (meeting.meeting_url ? 'Virtual Meeting' : 'Virtual Meeting');
  doc.text(tempatVal, 34, metadataY);
  // Dotted/solid underline for Tempat
  doc.setDrawColor(203, 213, 225);
  doc.line(34, metadataY + 1.5, 120, metadataY + 1.5);

  // Label Tanggal
  const tanggalY = metadataY + 7;
  doc.setTextColor(71, 85, 105);
  doc.text('Tanggal :', 14, tanggalY);
  doc.setTextColor(30, 41, 59);
  const formattedDate = new Date(meeting.date_time).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(formattedDate, 34, tanggalY);
  doc.line(34, tanggalY + 1.5, 120, tanggalY + 1.5);

  // 5. Participants Attendance Table
  const tableStartY = tanggalY + 8;

  const tableBody = attendances.map((att, idx) => {
    const u = att.user;
    return [
      `${idx + 1}.`,
      u?.display_name || '-',
      u?.position || 'Analis Laboratorium',
      'E-Signed',
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14 },
    head: [['', 'Nama', 'Jabatan', 'Tanda Tangan']],
    body: tableBody.length > 0 ? tableBody : [['-', 'Belum ada kehadiran tercatat', '-', '-']],
    theme: 'plain',
    headStyles: {
      fillColor: [225, 230, 235], // Abu-abu persis seperti screenshot
      textColor: [0, 0, 0],
      font: 'helvetica',
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: { top: 3.5, right: 3, bottom: 3.5, left: 3 },
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 60 },
      3: { cellWidth: 40, halign: 'left' },
    },
    styles: {
      overflow: 'linebreak',
    },
    didDrawCell: (data) => {
      // Hanya gambar garis horizontal antar baris dan frame luar, tanpa border vertikal antar kolom
      const { cell, doc } = data;
      const x = cell.x;
      const y = cell.y;
      const w = cell.width;
      const h = cell.height;

      // Warna garis abu-abu gelap/hitam tipis
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);

      // Garis horizontal bawah setiap sel
      doc.line(x, y + h, x + w, y + h);

      // Garis horizontal atas hanya untuk header
      if (data.section === 'head') {
        doc.line(x, y, x + w, y);
      }

      // Border samping kiri hanya untuk kolom paling pertama
      if (data.column.index === 0) {
        doc.line(x, y, x, y + h);
      }

      // Border samping kanan hanya untuk kolom paling terakhir
      if (data.column.index === data.table.columns.length - 1) {
        doc.line(x + w, y, x + w, y + h);
      }
    },
    didDrawPage: (data) => {
      // Footer page numbering: e.g. "Halaman 1"
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const footerText = `Halaman ${data.pageNumber}`;
      doc.text(footerText, 196, 290, { align: 'right' });
    },
  });

  // Open PDF in a new browser tab for preview instead of directly triggering a download
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, '_blank');
}
