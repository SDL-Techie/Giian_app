import React, { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { dataTransferService } from '../../../services/dataTransfer.service';
import type { TransferModule } from '../../../services/dataTransfer.service';
import { useToast } from '../../../context/ToastContext';

interface DataTransferBarProps {
  module: TransferModule;
  onImported?: () => void | Promise<void>;
}

export default function DataTransferBar({ module, onImported }: DataTransferBarProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const exportExcel = async () => {
    try {
      setBusy(true);
      const blob = await dataTransferService.exportExcel(module);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${module}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Excel exported successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const importExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setBusy(true);
      const result = await dataTransferService.importExcel(module, file);
      toast.success(result?.message || 'Excel imported successfully');
      await onImported?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="data-transfer-bar" aria-label={`${module} data transfer`}>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        hidden
        onChange={importExcel}
      />
      <button className="btn btn-secondary btn-sm" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Upload size={15} /> <span>Import Excel</span>
      </button>
      <button className="btn btn-primary btn-sm" type="button" disabled={busy} onClick={exportExcel}>
        <Download size={15} /> <span>Export Excel</span>
      </button>
    </div>
  );
}
