import React, { useEffect, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import Modal from '../modal/Modal';
import Button from '../button/Button';
import './PdfActionModal.css';
import { downloadProtectedFile, fetchProtectedFile } from '../../../utils/fileDownload';

type SheetSize = 'A4' | 'A5';
interface Props { isOpen:boolean; onClose:()=>void; documentLabel:string; fileName:string; generate:(size:SheetSize)=>Promise<string>; }
export default function PdfActionModal({isOpen,onClose,documentLabel,fileName,generate}:Props){
 const [size,setSize]=useState<SheetSize|null>(null);const [previewUrl,setPreviewUrl]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!isOpen){if(previewUrl)URL.revokeObjectURL(previewUrl);setSize(null);setPreviewUrl('');setBusy(false)}},[isOpen]);
 const preview=async()=>{if(!size)return;setBusy(true);try{const url=await generate(size);const blob=await fetchProtectedFile(url);setPreviewUrl(URL.createObjectURL(blob))}finally{setBusy(false)}};
 const download=async()=>{if(!size)return;setBusy(true);try{const u=await generate(size);await downloadProtectedFile(u,`${fileName}-${size}.pdf`);onClose()}finally{setBusy(false)}};
 return <Modal isOpen={isOpen} onClose={onClose} title={`${documentLabel} PDF`} size={previewUrl?'lg':'sm'}>
  {!size?<div className="pdf-choice-panel"><div className="pdf-choice-icon"><FileText size={22}/></div><div><h3>Choose document size</h3><p>Select A4 or A5, then choose preview or direct download.</p></div><div className="pdf-size-grid"><button type="button" className="pdf-size-card" onClick={()=>setSize('A4')}><span className="pdf-sheet a4"/><strong>A4</strong><small>210 × 297 mm</small></button><button type="button" className="pdf-size-card" onClick={()=>setSize('A5')}><span className="pdf-sheet a5"/><strong>A5</strong><small>148 × 210 mm</small></button></div></div>:
  previewUrl?<div className="pdf-preview-panel"><div className="pdf-preview-toolbar"><Button type="button" variant="secondary" size="sm" onClick={()=>{setPreviewUrl('');setSize(null)}}>Change Size</Button><Button type="button" variant="primary" size="sm" icon={<Download size={15}/>} isLoading={busy} onClick={download}>Download {size}</Button></div><div className={`pdf-preview-frame ${size.toLowerCase()}`}><iframe src={previewUrl} title={`${documentLabel} ${size} preview`}/></div></div>:
  <div className="pdf-choice-panel"><div><h3>{size} selected</h3><p>Preview in the selected paper ratio or download directly.</p></div><div className="pdf-action-grid"><Button type="button" variant="secondary" icon={<Eye size={16}/>} isLoading={busy} onClick={preview}>Preview</Button><Button type="button" variant="primary" icon={<Download size={16}/>} isLoading={busy} onClick={download}>Download</Button></div><button type="button" className="pdf-change-size" onClick={()=>setSize(null)}>Choose a different size</button></div>}
 </Modal>;
}
