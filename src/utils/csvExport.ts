import { JournalEntry } from '../types';
import { soundEngine } from './soundEngine';

/**
 * Escapes an individual cell value according to RFC 4180:
 * - Wrap in double quotes if it contains commas, double quotes, or newlines (\n, \r)
 * - Any double quotes inside must be doubled (" -> "")
 */
function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvExportResult {
  success: boolean;
  message?: string;
  filename?: string;
}

export function exportJournalToCsv(entries: JournalEntry[]): CsvExportResult {
  if (!entries || entries.length === 0) {
    soundEngine.play('warning');
    return {
      success: false,
      message: 'No journal records to export.',
    };
  }

  // Exact required columns:
  // Date, Time, Pair, Strategy, Session, Direction, Entry, Stop Loss, Take Profit, Risk %, RRR, Position Size, Outcome, P/L, Notes, Reason, Gate Status
  const headers = [
    'Date',
    'Time',
    'Pair',
    'Strategy',
    'Session',
    'Direction',
    'Entry',
    'Stop Loss',
    'Take Profit',
    'Risk %',
    'RRR',
    'Position Size',
    'Outcome',
    'P/L ($)',
    'Notes',
    'Reason',
    'Gate Status',
  ];

  const rows = entries.map((entry) => {
    // Calculate P/L in cash if outcome is determined
    let plStr = '0.00';
    if (entry.outcome === 'WIN') {
      const pl = (entry.cashRisk || 0) * (entry.rrRatio || 0);
      plStr = `+${pl.toFixed(2)}`;
    } else if (entry.outcome === 'LOSS') {
      plStr = `-${(entry.cashRisk || 0).toFixed(2)}`;
    } else if (entry.outcome === 'BREAKEVEN') {
      plStr = '0.00';
    } else if (entry.outcome === 'NO_TRADE') {
      plStr = '0.00 (No Trade)';
    } else {
      plStr = 'OPEN';
    }

    return [
      escapeCsvCell(entry.dateStr || ''),
      escapeCsvCell(entry.timeStr || ''),
      escapeCsvCell(entry.pair || ''),
      escapeCsvCell(entry.strategy === 'ICT_SILVER_BULLET' ? 'ICT Silver Bullet (M1/M5)' : '9/20 EMA Swing (H1/H4)'),
      escapeCsvCell(entry.session || 'Off-Session'),
      escapeCsvCell(entry.direction || ''),
      escapeCsvCell(entry.entryPrice ? entry.entryPrice.toFixed(5) : '0'),
      escapeCsvCell(entry.stopLossPrice ? entry.stopLossPrice.toFixed(5) : '0'),
      escapeCsvCell(entry.takeProfitPrice ? entry.takeProfitPrice.toFixed(5) : '0'),
      escapeCsvCell(entry.riskPercentage ? `${entry.riskPercentage.toFixed(1)}%` : '0%'),
      escapeCsvCell(entry.rrRatio ? `1:${entry.rrRatio.toFixed(2)}` : 'N/A'),
      escapeCsvCell(entry.positionSizeLots ? `${entry.positionSizeLots.toFixed(2)} Lots` : '0 Lots'),
      escapeCsvCell(entry.outcome || 'OPEN'),
      escapeCsvCell(plStr),
      escapeCsvCell(entry.notes || ''),
      escapeCsvCell(entry.reason || entry.noTradeReason || ''),
      escapeCsvCell(entry.status || 'APPROVED'),
    ].join(',');
  });

  // Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel & Sheets open international characters flawlessly
  const csvContent = '\uFEFF' + headers.join(',') + '\r\n' + rows.join('\r\n');

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Format YYYY-MM-DD
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const filename = `trade-gate-journal-${yyyy}-${mm}-${dd}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);

    soundEngine.play('csv_export_completed');
    return {
      success: true,
      filename,
      message: `Exported ${entries.length} journal records to ${filename}`,
    };
  } catch (err: any) {
    console.error('CSV export failed:', err);
    return {
      success: false,
      message: 'Browser download restriction encountered. Please check browser permissions.',
    };
  }
}
