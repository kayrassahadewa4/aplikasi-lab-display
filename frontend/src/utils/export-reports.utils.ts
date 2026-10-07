import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatTime, formatDateTime } from './format.utils'

export interface UsageReportItem {
  id: string
  laboratoryName: string
  laboratoryCode: string
  activityName: string
  instructorName: string
  status: string
  checkInTime: string
  checkOutTime?: string | null
  durationMinutes: number
}

export interface ReportSummaryMetrics {
  periodLabel: string
  totalSessions: number
  totalHours: number
  activeRoomsCount: number
  utilizationRate: string
}

/**
 * 1. Generate and Download Microsoft Excel (.xlsx) Report using ExcelJS
 */
export async function exportReportToExcel(
  items: UsageReportItem[],
  metrics: ReportSummaryMetrics,
  filename = 'Laporan_Penggunaan_Laboratorium'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistem Display Lab FIK UPNVJ'
  workbook.lastModifiedBy = 'Sistem Display Lab FIK UPNVJ'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Log Penggunaan Lab', {
    views: [{ showGridLines: true }],
  })

  // Executive Header Titles
  worksheet.addRow(['SISTEM DISPLAY JADWAL PENGGUNAAN LABORATORIUM'])
  worksheet.addRow(['LAPORAN EKSEKUTIF PENGGUNAAN RUANG LABORATORIUM'])
  worksheet.addRow([])

  // Summary Metrics Rows
  worksheet.addRow(['Periode Laporan', metrics.periodLabel])
  worksheet.addRow(['Tanggal Dibuat', formatDateTime(new Date())])
  worksheet.addRow(['Total Sesi Penggunaan', metrics.totalSessions])
  worksheet.addRow(['Total Jam Penggunaan', `${metrics.totalHours} Jam`])
  worksheet.addRow(['Tingkat Utilisasi Rata-rata', metrics.utilizationRate])
  worksheet.addRow([])
  worksheet.addRow(['--- RINCIAN LOG SESI PENGGUNAAN RUANGAN ---'])

  // Style Header Titles
  const titleRow1 = worksheet.getRow(1)
  titleRow1.font = { bold: true, size: 14, color: { argb: 'FF0C5A30' } }
  const titleRow2 = worksheet.getRow(2)
  titleRow2.font = { bold: true, size: 12, color: { argb: 'FF1F2937' } }

  // Detailed Table Header
  const headerRow = worksheet.addRow([
    'No',
    'Kode Lab',
    'Nama Laboratorium',
    'Aktivitas / Mata Kuliah',
    'Dosen / Penanggung Jawab',
    'Status',
    'Waktu Check-In',
    'Waktu Check-Out',
    'Durasi (Menit)',
  ])

  // Style Table Header (Brand Theme FIK UPNVJ Emerald)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0C5A30' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // Add Table Data Rows
  items.forEach((item, idx) => {
    const row = worksheet.addRow([
      idx + 1,
      item.laboratoryCode,
      item.laboratoryName,
      item.activityName,
      item.instructorName,
      item.status,
      formatDateTime(item.checkInTime),
      item.checkOutTime ? formatDateTime(item.checkOutTime) : 'Sedang Berlangsung',
      item.durationMinutes || 0,
    ])

    // Alternate row zebra striping
    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' },
      }
    }
  })

  // Set Column Widths
  worksheet.columns = [
    { width: 6 },
    { width: 14 },
    { width: 30 },
    { width: 35 },
    { width: 28 },
    { width: 16 },
    { width: 24 },
    { width: 24 },
    { width: 16 },
  ]

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`
  anchor.click()
  window.URL.revokeObjectURL(url)
}

/**
 * 2. Generate and Download Formal PDF Report
 */
export function exportReportToPdf(
  items: UsageReportItem[],
  metrics: ReportSummaryMetrics,
  filename = 'Laporan_Penggunaan_Laboratorium'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header Letterhead
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 50, 40)
  doc.text('FAKULTAS ILMU KOMPUTER - UPN VETERAN JAKARTA', 14, 15)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('Sistem Display & Manajemen Jadwal Penggunaan Laboratorium Komputer', 14, 21)

  doc.setDrawColor(108, 155, 118)
  doc.setLineWidth(0.8)
  doc.line(14, 25, 283, 25)

  // Report Metadata Grid
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(`Periode: ${metrics.periodLabel}`, 14, 32)
  doc.text(`Total Sesi: ${metrics.totalSessions} Sesi (${metrics.totalHours} Jam)`, 110, 32)
  doc.text(`Dicetak pada: ${formatDateTime(new Date())}`, 210, 32)

  // AutoTable for Session Logs
  const tableRows = items.map((item, idx) => [
    idx + 1,
    item.laboratoryCode,
    item.laboratoryName,
    item.activityName,
    item.instructorName,
    item.status,
    item.checkInTime ? formatTime(item.checkInTime, true) : '-',
    item.checkOutTime ? formatTime(item.checkOutTime, true) : 'Aktif',
    `${item.durationMinutes || 0} mnt`,
  ])

  autoTable(doc, {
    startY: 38,
    head: [
      [
        'No',
        'Kode',
        'Laboratorium',
        'Aktivitas / Praktikum',
        'Pengajar / User',
        'Status',
        'Check-In',
        'Check-Out',
        'Durasi',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [101, 126, 71], // #657E47 Chalet Dark Green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [248, 251, 248],
    },
    margin: { left: 14, right: 14 },
  })

  // Official Signature Block
  const lastAutoTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
  const finalY = lastAutoTable?.finalY ? lastAutoTable.finalY + 12 : 120

  if (finalY < 170) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Jakarta, ' + formatDate(new Date()), 220, finalY)
    doc.text('Kepala Laboratorium Komputer,', 220, finalY + 5)
    doc.setFont('helvetica', 'bold')
    doc.text('( ___________________________ )', 220, finalY + 24)
    doc.text('NIP. 198504122010121002', 220, finalY + 29)
  } else {
    doc.addPage()
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Jakarta, ' + formatDate(new Date()), 220, 25)
    doc.text('Kepala Laboratorium Komputer,', 220, 30)
    doc.setFont('helvetica', 'bold')
    doc.text('( ___________________________ )', 220, 49)
    doc.text('NIP. 198504122010121002', 220, 54)
  }

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
