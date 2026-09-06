import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { spawn } from "child_process";

const run = (command, args) => new Promise((resolve, reject) => {
  const timeoutMs = Math.max(5000, Number(process.env.PDF_COMPRESSION_TIMEOUT_MS || 45000));
  const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
  let settled = false;
  let stderr = "";
  child.stderr.on("data", (d) => { stderr += d.toString(); });
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    child.kill("SIGKILL");
    const error = new Error(`PDF compression timed out after ${timeoutMs}ms`);
    error.code = "PDF_COMPRESSION_TIMEOUT";
    reject(error);
  }, timeoutMs);
  timer.unref?.();
  child.on("error", (error) => {
    if (settled) return;
    settled = true; clearTimeout(timer); reject(error);
  });
  child.on("close", (code) => {
    if (settled) return;
    settled = true; clearTimeout(timer);
    if (code === 0) resolve();
    else reject(new Error(`PDF compression process failed (${code}): ${stderr.slice(-1200)}`));
  });
});

const compressorCommand = () => process.env.PDF_COMPRESSOR_PATH || "gs";
const targetBytes = () => Math.max(20, Number(process.env.PDF_TARGET_KB || 80)) * 1024;

/**
 * Best-effort scanned-PDF optimisation. The target is not a hard guarantee: a
 * text-heavy/encrypted/already-optimised PDF may not safely reach it. We keep
 * the smallest valid result and never replace the input with a larger file.
 * Ghostscript is intentionally used because gzip usually gives little benefit
 * for PDFs whose images/streams are already compressed.
 */
export const compressPdfBuffer = async (inputBuffer) => {
  if (!Buffer.isBuffer(inputBuffer) || inputBuffer.length === 0) {
    throw Object.assign(new Error("PDF buffer is empty"), { statusCode: 400 });
  }

  const required = String(process.env.PDF_COMPRESSION_REQUIRED ?? "true").toLowerCase() !== "false";
  const dir = await mkdtemp(path.join(os.tmpdir(), "giian-pdf-"));
  const inputPath = path.join(dir, `${randomUUID()}.pdf`);
  const target = targetBytes();
  let best = inputBuffer;

  // Ordered from readable/business-document quality to increasingly aggressive.
  const passes = [
    { dpi: 110, jpegq: 70 },
    { dpi: 96, jpegq: 62 },
    { dpi: 80, jpegq: 55 },
    { dpi: 72, jpegq: 48 },
    { dpi: 60, jpegq: 42 },
    { dpi: 50, jpegq: 35 },
  ];

  try {
    await writeFile(inputPath, inputBuffer);
    for (let i = 0; i < passes.length; i += 1) {
      const { dpi, jpegq } = passes[i];
      const outputPath = path.join(dir, `compressed-${i}.pdf`);
      const args = [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-dSAFER",
        "-dDetectDuplicateImages=true",
        "-dCompressFonts=true",
        "-dSubsetFonts=true",
        "-dDownsampleColorImages=true",
        "-dDownsampleGrayImages=true",
        "-dDownsampleMonoImages=true",
        "-dColorImageDownsampleType=/Bicubic",
        "-dGrayImageDownsampleType=/Bicubic",
        `-dColorImageResolution=${dpi}`,
        `-dGrayImageResolution=${dpi}`,
        `-dMonoImageResolution=${Math.max(150, dpi * 2)}`,
        `-dJPEGQ=${jpegq}`,
        `-sOutputFile=${outputPath}`,
        inputPath,
      ];
      await run(compressorCommand(), args);
      const candidate = await readFile(outputPath);
      if (candidate.length > 0 && candidate.length < best.length) best = candidate;
      if (best.length <= target) break;
    }

    return {
      buffer: best,
      originalSize: inputBuffer.length,
      storedSize: best.length,
      targetSize: target,
      reduced: best.length < inputBuffer.length,
      targetReached: best.length <= target,
      compression: "ghostscript-pdfwrite",
    };
  } catch (error) {
    if (!required) {
      return {
        buffer: inputBuffer,
        originalSize: inputBuffer.length,
        storedSize: inputBuffer.length,
        targetSize: target,
        reduced: false,
        targetReached: inputBuffer.length <= target,
        compression: "none",
        warning: error.message,
      };
    }
    const e = new Error("PDF compression is unavailable. Install Ghostscript or configure PDF_COMPRESSOR_PATH before accepting customer PDFs.");
    e.statusCode = 503;
    e.cause = error;
    throw e;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
};
