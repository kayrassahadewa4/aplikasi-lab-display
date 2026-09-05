import * as XLSX from 'xlsx'
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
 * 1. Generate and Download Microsoft Excel (.xlsx) Report
 */
export function exportReportToExcel(
  items: UsageReportItem[],
  metrics: ReportSummaryMetrics,
  filename = 'Laporan_Penggunaan_Laboratorium'
) {
  // Sheet 1: Summary Overview
  const summaryData = [
    ['SISTEM DISPLAY JADWAL PENGGUNAAN LABORATORIUM'],
    ['LAPORAN EKSEKUTIF PENGGUNAAN RUANG LABORATORIUM'],
    [],
    ['Periode Laporan', metrics.periodLabel],
    ['Tanggal Dibuat', formatDateTime(new Date())],
    ['Total Sesi Penggunaan', metrics.totalSessions],
    ['Total Jam Penggunaan', `${metrics.totalHours} Jam`],
    ['Tingkat Utilisasi Rata-rata', metrics.utilizationRate],
    [],
    ['--- RINCIAN LOG SESI PENGGUNAAN RUANGAN ---'],
  ]

  // Sheet 2: Detailed Session Data Table
  const tableData = items.map((item, idx) => ({
    No: idx + 1,
    'Kode Lab': item.laboratoryCode,
    'Nama Laboratorium': item.laboratoryName,
    'Aktivitas / Mata Kuliah': item.activityName,
    'Dosen / Penanggung Jawab': item.instructorName,
    Status: item.status,
    'Waktu Check-In': formatDateTime(item.checkInTime),
    'Waktu Check-Out': item.checkOutTime ? formatDateTime(item.checkOutTime) : 'Sedang Berlangsung',
    'Durasi (Menit)': item.durationMinutes || 0,
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.sheet_add_json(ws, tableData, { origin: 'A10' })

  // Auto-fit column widths
  ws['!cols'] = [
    { wch: 5 }, // No
    { wch: 12 }, // Kode Lab
    { wch: 28 }, // Nama Lab
    { wch: 32 }, // Aktivitas
    { wch: 25 }, // Dosen
    { wch: 14 }, // Status
    { wch: 22 }, // Check-In
    { wch: 22 }, // Check-Out
    { wch: 14 }, // Durasi
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Log Penggunaan Lab')
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
