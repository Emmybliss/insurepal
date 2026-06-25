import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Check, ChevronDown, Save, Settings, Trash2, Upload } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Shadcn UI elements
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Overlay {
    id: string;
    type: string;
    imageUrl?: string;
    content?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
}

interface Asset {
    id: number;
    name: string;
    type: string;
    url: string;
}

interface HeaderFooterConfig {
    assetId: number | null;
    scale: number; // percentage
    alignX: 'left' | 'center' | 'right';
    rotation: number;
    opacity: number; // 0.1 to 1.0
    layering: 'overlay' | 'underlay';
    pagesActive: 'all' | 'first' | 'last' | 'custom';
    customRange: string;
    previewPage: number;
}

const defaultHFConfig: HeaderFooterConfig = {
    assetId: null,
    scale: 100,
    alignX: 'center',
    rotation: 0,
    opacity: 1,
    layering: 'overlay',
    pagesActive: 'all',
    customRange: '',
    previewPage: 1,
};

export default function BrandingEditor({
    document: brandingDocument,
    originalFileUrl,
    // processedFileUrl: _processedFileUrl,
    // downloadUrl: _downloadUrl,
    brandingConfig,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document: any;
    originalFileUrl: string;
    processedFileUrl: string | null;
    downloadUrl: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    brandingConfig?: any;
}) {
    const { t } = useLang();
    const [numPages, setNumPages] = useState<number>(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [saving, setSaving] = useState(false);
    const [, setProcessingStatus] = useState<'idle' | 'validating' | 'processing' | 'done' | 'failed'>('idle');
    const [, setLastProcessedFile] = useState<File | null>(null);
    const [processedCache, setProcessedCache] = useState<Map<string, File>>(new Map());

    const [headerConfig, setHeaderConfig] = useState<HeaderFooterConfig>({ ...defaultHFConfig });
    const [footerConfig, setFooterConfig] = useState<HeaderFooterConfig>({ ...defaultHFConfig });

    const [isHFModalOpen, setIsHFModalOpen] = useState(false);
    const [hfActiveTab, setHfActiveTab] = useState<'header' | 'footer'>('header');

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hfFileInputRef = useRef<HTMLInputElement>(null);
    const [uploadType, setUploadType] = useState<string>('signature');

    // Canvas & Drag State
    const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
    // Stores actual PDF page dimensions in PDF points (populated after renderPage)
    const pdfPageDims = useRef<{ [page: number]: { w: number; h: number } }>({});
    const [cursorAsset, setCursorAsset] = useState<Asset | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                const loadingTask = pdfjsLib.getDocument(originalFileUrl);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setNumPages(pdf.numPages);
            } catch (error) {
                console.error('Error loading PDF', error);
                toast.error(t('Failed to load PDF preview.'));
            }
        };
        loadPdf();
        loadAssets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [originalFileUrl]);

    useEffect(() => {
        if (pdfDoc && numPages > 0) {
            for (let i = 1; i <= numPages; i++) {
                renderPage(i);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfDoc, numPages]);

    // ── Rehydrate saved branding config on load ──────────────────────────────
    const rehydrated = useRef(false);
    useEffect(() => {
        if (!brandingConfig || rehydrated.current) return;

        if (brandingConfig.overlays) setOverlays(brandingConfig.overlays);
        if (brandingConfig.header) setHeaderConfig({ ...defaultHFConfig, ...brandingConfig.header });
        if (brandingConfig.footer) setFooterConfig({ ...defaultHFConfig, ...brandingConfig.footer });

        rehydrated.current = true;
        console.info('[Restore] Branding config rehydrated from backend:', brandingConfig);
    }, [brandingConfig]);

    // Auto-save configuration to backend when state changes
    const saveConfig = async (newOverlays?: Overlay[], newHeader?: HeaderFooterConfig, newFooter?: HeaderFooterConfig) => {
        const savedOverlays = newOverlays ?? overlays;

        try {
            await axios.put(route('document-toolkit.branding.config.save', brandingDocument.id), {
                branding_config: {
                    overlays: savedOverlays,
                    header: newHeader ?? headerConfig,
                    footer: newFooter ?? footerConfig,
                },
            });
        } catch {
            console.error('Failed to auto-save config');
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (cursorAsset) {
                setMousePos({ x: e.clientX, y: e.clientY });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [cursorAsset]);

    // Refs so keyboard handler always reads current state
    const overlaysRef = useRef(overlays);
    const activeOverlayIdRef = useRef(activeOverlayId);
    useEffect(() => {
        overlaysRef.current = overlays;
    }, [overlays]);
    useEffect(() => {
        activeOverlayIdRef.current = activeOverlayId;
    }, [activeOverlayId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setCursorAsset(null);
                return;
            }

            const id = activeOverlayIdRef.current;
            if (!id) return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                const updated = overlaysRef.current.filter((o) => o.id !== id);
                setOverlays(updated);
                saveConfig(updated);
                setActiveOverlayId(null);
                return;
            }

            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (!arrowKeys.includes(e.key)) return;

            e.preventDefault();
            e.stopPropagation();

            const STEP = 0.005; // fraction per press
            const overlay = overlaysRef.current.find((o) => o.id === id);
            if (!overlay) return;

            const canvasEl = canvasRefs.current[overlay.page];
            if (!canvasEl) return;
            const rect = canvasEl.getBoundingClientRect();
            const cw = rect.width;
            const ch = rect.height;
            if (!cw || !ch) return;

            const dx = e.key === 'ArrowRight' ? STEP : e.key === 'ArrowLeft' ? -STEP : 0;
            const dy = e.key === 'ArrowDown' ? STEP : e.key === 'ArrowUp' ? -STEP : 0;

            updateOverlay(id, {
                x: Math.max(0, Math.min(1 - overlay.width, overlay.x + dx)),
                y: Math.max(0, Math.min(1 - overlay.height, overlay.y + dy)),
            });
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadAssets = async () => {
        try {
            const response = await axios.get(route('document-toolkit.branding.assets'));
            setAssets(response.data);
        } catch (error) {
            console.error('Failed to load assets', error);
        }
    };

    const processImageRemoveBackground = async (file: File): Promise<{ result: File; wasProcessed: boolean; reason?: string }> => {
        // ── 1. Input Validation ──────────────────────────────────────────────
        const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        const MAX_SIZE_MB = 10;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            console.warn('[BgRemover] Unsupported format:', file.type);
            return { result: file, wasProcessed: false, reason: `Unsupported format: ${file.type}` };
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            console.warn('[BgRemover] File too large:', (file.size / 1024 / 1024).toFixed(1) + 'MB');
            return { result: file, wasProcessed: false, reason: 'File exceeds 10MB limit. Uploading original.' };
        }

        // ── 2. Cache check ──────────────────────────────────────────────────
        const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
        if (processedCache.has(cacheKey)) {
            console.info('[BgRemover] Returning cached result for', file.name);
            return { result: processedCache.get(cacheKey)!, wasProcessed: true };
        }

        // ── 3. Processing ───────────────────────────────────────────────────
        console.info('[BgRemover] Starting processing for', file.name, '(' + (file.size / 1024).toFixed(1) + 'KB)');
        setProcessingStatus('processing');

        const processPromise = new Promise<{ result: File; wasProcessed: boolean }>((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const img = new window.Image();

            img.onload = () => {
                console.info('[BgRemover] Image loaded:', img.width, 'x', img.height, 'px');

                // Downsample very large images for speed (max 2000px on longest side)
                const MAX_DIM = 2000;
                let targetW = img.width;
                let targetH = img.height;
                if (targetW > MAX_DIM || targetH > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / targetW, MAX_DIM / targetH);
                    targetW = Math.round(targetW * ratio);
                    targetH = Math.round(targetH * ratio);
                    console.info('[BgRemover] Downsampling to', targetW, 'x', targetH);
                }

                // ── CRITICAL FIX: use window.document, not prop ──
                const canvas = window.document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    URL.revokeObjectURL(objectUrl);
                    return reject('No 2D canvas context available');
                }

                ctx.drawImage(img, 0, 0, targetW, targetH);
                URL.revokeObjectURL(objectUrl);

                const imageData = ctx.getImageData(0, 0, targetW, targetH);
                const data = imageData.data;

                // ── Tuned for signatures: high-contrast dark-ink on white ──
                // Step 1: detect near-white and near-grey backgrounds aggressively
                // Step 2: boost dark ink pixels for clean PDF rendering
                let removedCount = 0;
                const totalPixels = data.length / 4;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Luminance (perceptual weighting)
                    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    // Colour saturation check — avoids removing coloured stamps
                    const maxC = Math.max(r, g, b);
                    const minC = Math.min(r, g, b);
                    const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;

                    if (lum > 200 && saturation < 0.15) {
                        // Near-white or near-grey → fully transparent
                        data[i + 3] = 0;
                        removedCount++;
                    } else if (lum > 160 && saturation < 0.08) {
                        // Light grey border pixels → partial transparency
                        data[i + 3] = Math.round(((200 - lum) / 40) * 255);
                    } else {
                        // Ink pixel: darken slightly for visual density on white PDF paper
                        data[i] = Math.max(0, Math.round(r * 0.75));
                        data[i + 1] = Math.max(0, Math.round(g * 0.75));
                        data[i + 2] = Math.max(0, Math.round(b * 0.8));
                        data[i + 3] = Math.min(255, data[i + 3] + 20);
                    }
                }

                console.info(
                    `[BgRemover] Processed ${totalPixels} pixels, removed ${removedCount} (${((removedCount / totalPixels) * 100).toFixed(1)}% background)`,
                );

                ctx.putImageData(imageData, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return reject('canvas.toBlob() returned null — canvas may be tainted or empty');
                        }
                        const newName = file.name.replace(/\.[^/.]+$/, '') + '_transparent.png';
                        const processedFile = new File([blob], newName, { type: 'image/png' });
                        console.info('[BgRemover] Output blob size:', (blob.size / 1024).toFixed(1) + 'KB');

                        // Cache result
                        setProcessedCache((prev) => new Map(prev).set(cacheKey, processedFile));
                        resolve({ result: processedFile, wasProcessed: true });
                    },
                    'image/png',
                    0.95,
                );
            };

            img.onerror = (err) => {
                URL.revokeObjectURL(objectUrl);
                console.error('[BgRemover] Failed to load image:', err);
                reject('Image failed to load into processing canvas');
            };

            img.src = objectUrl;
        });

        // ── 4. Timeout race — 8s for large images ───────────────────────────
        const timeoutPromise = new Promise<{ result: File; wasProcessed: boolean }>((resolve) => {
            setTimeout(() => {
                console.warn('[BgRemover] Processing timed out after 8s for', file.name);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                resolve({ result: file, wasProcessed: false, reason: 'timeout' } as any);
            }, 8000);
        });

        try {
            const outcome = await Promise.race([processPromise, timeoutPromise]);
            return outcome;
        } catch (err) {
            console.error('[BgRemover] Processing threw an error:', err);
            return { result: file, wasProcessed: false, reason: String(err) };
        }
    };

    const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, isHF: boolean = false) => {
        const fileRaw = e.target.files?.[0];
        if (!fileRaw) return;

        setIsUploading(true);
        setProcessingStatus('validating');
        setLastProcessedFile(fileRaw);

        const processingToastId = toast.loading(t('Validating image…'));

        try {
            // Step 1: Validate & process
            toast.loading(t('Removing background…'), { id: processingToastId });
            setProcessingStatus('processing');

            const { result: processedFile, wasProcessed, reason } = await processImageRemoveBackground(fileRaw);

            if (wasProcessed) {
                toast.loading(t('Background removed. Uploading…'), { id: processingToastId });
                console.info('[Upload] Using processed file:', processedFile.name, (processedFile.size / 1024).toFixed(1) + 'KB');
            } else {
                const msg =
                    reason === 'timeout'
                        ? t('Processing took too long. Uploading original image.')
                        : reason
                          ? t(`Background removal skipped: ${reason}`)
                          : t('Background removal failed. Uploading original image.');
                toast.loading(msg, { id: processingToastId });
                console.warn('[Upload] Falling back to raw file. Reason:', reason);
            }

            // Step 2: Upload to server
            const formData = new FormData();
            formData.append('file', processedFile);
            formData.append('type', uploadType);
            formData.append('name', processedFile.name);

            console.info('[Upload] POSTing to assets.store...');
            const response = await axios.post(route('document-toolkit.branding.assets.store'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.info('[Upload] Server response:', response.data);

            // Step 3: Success
            setProcessingStatus('done');
            toast.success(wasProcessed ? t('Background removed & asset saved!') : t('Asset uploaded (original).'), { id: processingToastId });
            loadAssets();

            if (isHF) {
                if (uploadType === 'letterhead') {
                    const newHeader = { ...headerConfig, assetId: response.data.id };
                    setHeaderConfig(newHeader);
                    saveConfig(overlays, newHeader, footerConfig);
                } else {
                    const newFooter = { ...footerConfig, assetId: response.data.id };
                    setFooterConfig(newFooter);
                    saveConfig(overlays, headerConfig, newFooter);
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setProcessingStatus('failed');
            console.error('[Upload] Caught error during upload pipeline:', error);
            const msg = error?.response?.data?.message || error?.message || t('Unknown error');
            toast.error(t(`Upload failed: ${msg}`), { id: processingToastId });
        } finally {
            setIsUploading(false);
            setProcessingStatus('idle');
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (hfFileInputRef.current) hfFileInputRef.current.value = '';
        }
    };

    const deleteAsset = async (assetId: number) => {
        try {
            await axios.delete(route('document-toolkit.branding.assets.delete', assetId));
            setAssets(assets.filter((a) => a.id !== assetId));
            toast.success(t('Asset deleted.'));

            let updatedHeader = headerConfig;
            let updatedFooter = footerConfig;
            if (headerConfig.assetId === assetId) updatedHeader = { ...headerConfig, assetId: null };
            if (footerConfig.assetId === assetId) updatedFooter = { ...footerConfig, assetId: null };

            setHeaderConfig(updatedHeader);
            setFooterConfig(updatedFooter);
            saveConfig(overlays, updatedHeader, updatedFooter);
        } catch {
            toast.error(t('Failed to delete asset.'));
        }
    };

    const renderPage = async (pageNum: number) => {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = canvasRefs.current[pageNum];
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Store PDF page dimensions (pts) — these are the ground truth for coords
        pdfPageDims.current[pageNum] = { w: viewport.width, h: viewport.height };

        const renderContext = { canvasContext: context, viewport };
        await page.render(renderContext).promise;
    };

    const startDragAsset = (asset: Asset) => {
        setCursorAsset(asset);
        setActiveOverlayId(null);
    };

    /**
     * Returns the CSS layout dimensions of the rendered canvas.
     * Uses offsetWidth/offsetHeight — stable, scroll-independent, matches the
     * positioned ancestor used by absolute overlays.
     */
    const getCanvasDisplaySize = (canvas: HTMLCanvasElement): { width: number; height: number } => {
        return { width: canvas.offsetWidth, height: canvas.offsetHeight };
    };

    const handleCanvasClick = (e: React.MouseEvent, pageNum: number) => {
        if (!cursorAsset) {
            setActiveOverlayId(null);
            return;
        }

        const canvasEl = canvasRefs.current[pageNum];
        if (!canvasEl) return;

        // Use the canvas wrapper div (e.currentTarget) as the coordinate origin —
        // this is the same element that overlays are absolute-positioned inside.
        const wrapperRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const canvasW = canvasEl.offsetWidth;
        const canvasH = canvasEl.offsetHeight;
        if (!canvasW || !canvasH) return;

        // Pixel offset from the wrapper top-left (= canvas top-left, they share the same origin)
        const rawXPx = e.clientX - wrapperRect.left;
        const rawYPx = e.clientY - wrapperRect.top;

        // Default sizes as fractions — height uses the PDF page aspect so the box
        // represents the same physical proportion in both editor and exported PDF.
        const pdfDims = pdfPageDims.current[pageNum];
        const pageAspect = pdfDims ? pdfDims.w / pdfDims.h : canvasW / canvasH;
        const widthPct = cursorAsset.type === 'signature' ? 0.25 : 0.15;
        const heightPct = cursorAsset.type === 'signature' ? widthPct * 0.5 * pageAspect : widthPct * pageAspect;

        // Normalize to 0-1 fractions
        const xPct = rawXPx / canvasW;
        const yPct = rawYPx / canvasH;

        // Clamp so overlay stays within bounds
        const clampedX = Math.max(0, Math.min(1 - widthPct, xPct));
        const clampedY = Math.max(0, Math.min(1 - heightPct, yPct));

        const newOverlay: Overlay = {
            id: Math.random().toString(36).substr(2, 9),
            type: cursorAsset.type,
            imageUrl: cursorAsset.url,
            x: clampedX,
            y: clampedY,
            width: widthPct,
            height: heightPct,
            page: pageNum,
        };

        const newOverlays = [...overlays, newOverlay];
        setOverlays(newOverlays);
        setActiveOverlayId(newOverlay.id);
        setCursorAsset(null);

        saveConfig(newOverlays);
    };

    const updateOverlay = (id: string, updates: Partial<Overlay>) => {
        const newOverlays = overlays.map((o) => (o.id === id ? { ...o, ...updates } : o));
        setOverlays(newOverlays);
        saveConfig(newOverlays);
    };

    const isPageActive = (pageNum: number, config: HeaderFooterConfig) => {
        if (!config.assetId) return false;
        if (config.pagesActive === 'all') return true;
        if (config.pagesActive === 'first' && pageNum === 1) return true;
        if (config.pagesActive === 'last' && pageNum === numPages) return true;
        if (config.pagesActive === 'custom') {
            const ranges = config.customRange.split(',');
            for (const r of ranges) {
                const parts = r.split('-').map((str) => parseInt(str.trim(), 10));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    if (pageNum >= parts[0] && pageNum <= parts[1]) return true;
                } else if (parts.length === 1 && !isNaN(parts[0])) {
                    if (pageNum === parts[0]) return true;
                }
            }
        }
        return false;
    };

    const generatePdf = async () => {
        setSaving(true);
        try {
            const existingPdfBytes = await fetch(originalFileUrl).then((res) => res.arrayBuffer());
            const pdfGenDoc = await PDFDocument.load(existingPdfBytes);
            const pdfPages = pdfGenDoc.getPages();

            const imageBlobCache: Record<string, Uint8Array> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pdfImageCache: Record<string, any> = {};

            const getPdfImage = async (url: string) => {
                if (pdfImageCache[url]) return pdfImageCache[url];
                if (!imageBlobCache[url]) {
                    const response = await fetch(url);
                    const buffer = await response.arrayBuffer();
                    imageBlobCache[url] = new Uint8Array(buffer as ArrayBuffer);
                }
                let embeddedImage;
                try {
                    embeddedImage = await pdfGenDoc.embedPng(imageBlobCache[url]);
                } catch {
                    embeddedImage = await pdfGenDoc.embedJpg(imageBlobCache[url]);
                }
                pdfImageCache[url] = embeddedImage;
                return embeddedImage;
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const drawHF = async (config: HeaderFooterConfig, i: number, targetPage: any, type: string) => {
                if (!isPageActive(i + 1, config)) return;
                const asset = assets.find((a) => a.id === config.assetId);
                if (!asset) return;

                const embeddedImage = await getPdfImage(asset.url);
                if (!embeddedImage) return;

                const { width: pageWidth, height: pageHeight } = targetPage.getSize();

                const scaleFactor = config.scale / 100;
                const finalImgWidth = pageWidth * scaleFactor;
                const finalImgHeight = finalImgWidth / (embeddedImage.width / embeddedImage.height);

                let finalX = 0;
                if (config.alignX === 'left') finalX = 20;
                else if (config.alignX === 'center') finalX = pageWidth / 2 - finalImgWidth / 2;
                else if (config.alignX === 'right') finalX = pageWidth - finalImgWidth - 20;

                const finalY = type === 'header' ? pageHeight - finalImgHeight : 0;

                // Fix rotation behavior to rotate from center like CSS
                const rotationAngle = config.rotation ? degrees(-config.rotation) : undefined;
                let drawX = finalX;
                let drawY = finalY;

                if (config.rotation) {
                    const cx = finalX + finalImgWidth / 2;
                    const cy = finalY + finalImgHeight / 2;
                    const rad = (-config.rotation * Math.PI) / 180;

                    const dx = finalX - cx;
                    const dy = finalY - cy;

                    const rdx = dx * Math.cos(rad) - dy * Math.sin(rad);
                    const rdy = dx * Math.sin(rad) + dy * Math.cos(rad);

                    drawX = cx + rdx;
                    drawY = cy + rdy;
                }

                targetPage.drawImage(embeddedImage, {
                    x: drawX,
                    y: drawY,
                    width: finalImgWidth,
                    height: finalImgHeight,
                    opacity: config.layering === 'underlay' ? config.opacity * 0.5 : config.opacity,
                    rotate: rotationAngle,
                });
            };

            for (let i = 0; i < pdfPages.length; i++) {
                const targetPage = pdfPages[i];

                if (headerConfig.layering === 'underlay') await drawHF(headerConfig, i, targetPage, 'header');
                if (footerConfig.layering === 'underlay') await drawHF(footerConfig, i, targetPage, 'footer');

                const pageOverlays = overlays.filter((o) => o.page === i + 1);
                for (const overlay of pageOverlays) {
                    if (!overlay.imageUrl) continue;

                    const embeddedImage = await getPdfImage(overlay.imageUrl);
                    if (!embeddedImage) continue;

                    const { width: pageWidth, height: pageHeight } = targetPage.getSize();

                    // Convert normalized fractions → PDF points for the bounding box
                    const boxW = overlay.width * pageWidth;
                    const boxH = overlay.height * pageHeight;
                    const pdfX = overlay.x * pageWidth;
                    const pdfY_top = overlay.y * pageHeight;

                    const imgAspect = embeddedImage.width / embeddedImage.height;
                    const boxAspect = boxW / boxH;

                    let drawW, drawH;
                    if (imgAspect > boxAspect) {
                        drawW = boxW;
                        drawH = boxW / imgAspect;
                    } else {
                        drawH = boxH;
                        drawW = boxH * imgAspect;
                    }

                    // Center within the box exactly like object-contain
                    const drawX = pdfX + (boxW - drawW) / 2;
                    const boxBottomY = pageHeight - pdfY_top - boxH;
                    const drawY = boxBottomY + (boxH - drawH) / 2;

                    targetPage.drawImage(embeddedImage, {
                        x: drawX,
                        y: drawY,
                        width: drawW,
                        height: drawH,
                    });
                }

                if (headerConfig.layering === 'overlay') await drawHF(headerConfig, i, targetPage, 'header');
                if (footerConfig.layering === 'overlay') await drawHF(footerConfig, i, targetPage, 'footer');
            }

            const pdfBytes = await pdfGenDoc.save();
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

            // Download the file immediately for the user
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = brandingDocument.name + '_branded.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            // Also post to server to save changes
            const formData = new FormData();
            formData.append('file', blob, brandingDocument.name + '_processed.pdf');
            formData.append(
                'branding_config',
                JSON.stringify({
                    overlays,
                    header: headerConfig,
                    footer: footerConfig,
                }),
            );

            router.post(route('document-toolkit.branding.process', brandingDocument.id), formData, {
                onSuccess: () => toast.success(t('PDF Generated and Saved!')),
                onError: () => toast.error(t('Failed to save PDF to server.')),
                onFinish: () => setSaving(false),
            });
        } catch (error) {
            console.error(error);
            toast.error(t('Failed to generate PDF.'));
            setSaving(false);
        }
    };

    const handleSaveProgress = async () => {
        setSaving(true);
        try {
            await axios.put(route('document-toolkit.branding.config.save', brandingDocument.id), {
                branding_config: {
                    overlays,
                    header: headerConfig,
                    footer: footerConfig,
                },
            });
            toast.success(t('Editor progress saved successfully!'));
        } catch (error) {
            console.error('Failed to save progress', error);
            toast.error(t('Failed to save progress.'));
        } finally {
            setSaving(false);
        }
    };

    const openHFModal = () => {
        setIsHFModalOpen(true);
    };

    const updateHFConfig = (type: 'header' | 'footer', newConfig: HeaderFooterConfig) => {
        if (type === 'header') {
            setHeaderConfig(newConfig);
            saveConfig(overlays, newConfig, footerConfig);
        } else {
            setFooterConfig(newConfig);
            saveConfig(overlays, headerConfig, newConfig);
        }
    };

    const renderHFPanel = (config: HeaderFooterConfig, setConfig: (c: HeaderFooterConfig) => void, typeName: string) => {
        return (
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t('Image Asset')}</Label>
                        <Select value={config.assetId?.toString() || ''} onValueChange={(v) => setConfig({ ...config, assetId: parseInt(v) })}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select an asset...')} />
                            </SelectTrigger>
                            <SelectContent>
                                {assets.map((a) => (
                                    <SelectItem key={a.id} value={a.id.toString()}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => {
                                setUploadType(typeName === 'header' ? 'letterhead' : 'footer');
                                hfFileInputRef.current?.click();
                            }}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {t(`Upload New ${typeName === 'header' ? 'Header' : 'Footer'}`)}
                        </Button>
                        <input
                            type="file"
                            ref={hfFileInputRef}
                            accept="image/png, image/jpeg"
                            className="hidden"
                            onChange={(e) => handleAssetUpload(e, true)}
                        />
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label>
                            {t('Scale')} ({config.scale}%)
                        </Label>
                        <input
                            type="range"
                            min="10"
                            max="200"
                            value={config.scale}
                            onChange={(e) => setConfig({ ...config, scale: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="mb-4 space-y-2">
                        <Label>{t('Horizontal Align')}</Label>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Select value={config.alignX} onValueChange={(v: string) => setConfig({ ...config, alignX: v as any })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="left">{t('Left')}</SelectItem>
                                <SelectItem value="center">{t('Center')}</SelectItem>
                                <SelectItem value="right">{t('Right')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>
                                {t('Rotation')} ({config.rotation}°)
                            </Label>
                            <Input
                                type="number"
                                value={config.rotation}
                                onChange={(e) => setConfig({ ...config, rotation: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                {t('Opacity')} ({Math.round(config.opacity * 100)}%)
                            </Label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={config.opacity * 100}
                                onChange={(e) => setConfig({ ...config, opacity: parseInt(e.target.value) / 100 })}
                                className="mt-2 w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('Apply Layer')}</Label>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Select value={config.layering} onValueChange={(v: string) => setConfig({ ...config, layering: v as any })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="overlay">{t('Overlay (Above Content)')}</SelectItem>
                                <SelectItem value="underlay">{t('Underlay (Behind Content)')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('Apply to Pages')}</Label>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Select value={config.pagesActive} onValueChange={(v: string) => setConfig({ ...config, pagesActive: v as any })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Pages')}</SelectItem>
                                <SelectItem value="first">{t('First Page Only')}</SelectItem>
                                <SelectItem value="last">{t('Last Page Only')}</SelectItem>
                                <SelectItem value="custom">{t('Custom Range')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {config.pagesActive === 'custom' && (
                            <Input
                                placeholder="e.g. 1, 3, 5-7"
                                value={config.customRange}
                                onChange={(e) => setConfig({ ...config, customRange: e.target.value })}
                                className="mt-2"
                            />
                        )}
                    </div>
                </div>

                {/* Right Panel: Preview Area */}
                <div className="col-span-1 flex flex-col rounded-md border bg-muted/20 p-4 shadow-inner">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold">{t('Preview')}</span>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs">{t('Page:')}</Label>
                            <Input
                                type="number"
                                min="1"
                                max={numPages || 1}
                                value={config.previewPage || 1}
                                onChange={(e) => setConfig({ ...config, previewPage: parseInt(e.target.value) || 1 })}
                                className="h-7 w-14 text-xs"
                            />
                        </div>
                    </div>
                    {/* Aspect ratio block mimicking paper */}
                    <div
                        className="relative mx-auto flex min-h-[220px] w-full flex-1 items-center justify-center overflow-hidden border border-border bg-white shadow-sm transition-all"
                        style={{ maxWidth: '200px' }}
                    >
                        <div
                            className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-darken"
                            style={{
                                backgroundImage: canvasRefs.current[config.previewPage]?.toDataURL()
                                    ? `url(${canvasRefs.current[config.previewPage]?.toDataURL()})`
                                    : 'none',
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                            }}
                        />

                        {config.assetId && (
                            <div
                                className={`pointer-events-none absolute flex items-center justify-center transition-all ${config.layering === 'underlay' ? 'z-0 mix-blend-multiply' : 'z-50'}`}
                                style={{
                                    width: `${config.scale > 100 ? 100 : config.scale}%`, // Rough CSS bounding preview
                                    left: config.alignX === 'left' ? '5%' : config.alignX === 'center' ? '50%' : 'auto',
                                    right: config.alignX === 'right' ? '5%' : 'auto',
                                    transform: `translate(${config.alignX === 'center' ? '-50%' : '0'}, 0) rotate(${config.rotation}deg)`,
                                    top: typeName === 'header' ? '0%' : 'auto',
                                    bottom: typeName === 'footer' ? '0%' : 'auto',
                                    opacity: config.opacity,
                                }}
                            >
                                <img
                                    src={assets.find((a) => a.id === config.assetId)?.url}
                                    className="pointer-events-none h-full w-full object-contain"
                                />
                            </div>
                        )}

                        {!isPageActive(config.previewPage, config) && config.assetId && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 p-4 text-center">
                                <span className="rotate-[-45deg] border border-destructive bg-white px-2 py-1 text-[10px] leading-none font-bold tracking-widest text-destructive uppercase opacity-70">
                                    {t('Filtered Out')}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="mt-2 text-center text-[10px] leading-tight text-muted-foreground">
                        {t('Approximation only. Boundaries mathematically adhere cleanly preventing overflow.')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: t('Document Toolkit'), href: route('document-toolkit.index') },
                { title: t('PDF Branding'), href: route('document-toolkit.branding.index') },
                { title: brandingDocument.name, href: '#' },
            ]}
        >
            <Head title={`${brandingDocument.name} - ${t('Editor')}`} />

            {/* Global Figma-Style Cursor Follower */}
            {cursorAsset && (
                <div
                    className="pointer-events-none fixed z-[100] opacity-70"
                    style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%, -50%)' }}
                >
                    <img
                        src={cursorAsset.url}
                        className="rounded border-2 border-primary/50 shadow-xl"
                        style={{
                            width: cursorAsset.type === 'signature' ? 200 : 150,
                            height: cursorAsset.type === 'signature' ? 100 : 150,
                            objectFit: 'contain',
                        }}
                    />
                </div>
            )}

            <div
                className="flex flex-col overflow-hidden md:flex-row"
                style={{ height: 'calc(100vh - 4rem)' }}
                onClick={() => activeOverlayId && setActiveOverlayId(null)}
            >
                {/* TOOLBAR SIDEBAR */}
                <div
                    className="flex w-full shrink-0 flex-col justify-between overflow-y-auto border-r border-border bg-card p-4 md:w-80"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="space-y-6">
                        <div>
                            {/* Advanced Nitro-PDF Features */}
                            <div className="mb-8 border-b pb-6">
                                <h2 className="mb-2 text-lg font-semibold">{t('Global Document Settings')}</h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="default" className="flex w-full justify-between">
                                            {t('Header & Footer')}
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="z-50 w-64">
                                        <DropdownMenuItem onClick={openHFModal}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            {t('Manage Header & Footer')}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => {
                                                if (confirm(t('Are you sure you want to remove all headers and footers?'))) {
                                                    setHeaderConfig({ ...defaultHFConfig });
                                                    setFooterConfig({ ...defaultHFConfig });
                                                    saveConfig(overlays, { ...defaultHFConfig }, { ...defaultHFConfig });
                                                    toast.success(t('Headers and Footers removed.'));
                                                }
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('Remove Header & Footer')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <h2 className="text-lg font-semibold">{t('My Signatures & Stamps')}</h2>
                            <p className="mb-4 text-sm text-muted-foreground">{t('Select an item to place it.')}</p>

                            {/* Custom Uploads */}
                            <div className="mb-4 flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    disabled={isUploading}
                                    onClick={() => {
                                        setUploadType('signature');
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    {isUploading && uploadType === 'signature' ? (
                                        <span className="mr-2 animate-spin">⏳</span>
                                    ) : (
                                        <Upload className="mr-2 h-4 w-4" />
                                    )}
                                    {t('Signature')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    disabled={isUploading}
                                    onClick={() => {
                                        setUploadType('stamp');
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    {isUploading && uploadType === 'stamp' ? (
                                        <span className="mr-2 animate-spin">⏳</span>
                                    ) : (
                                        <Upload className="mr-2 h-4 w-4" />
                                    )}
                                    {t('Stamp')}
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/png, image/jpeg"
                                    className="hidden"
                                    onChange={handleAssetUpload}
                                />
                            </div>

                            {/* Gallery */}
                            <div className="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto pr-1">
                                {assets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        className={`group relative cursor-pointer overflow-hidden rounded border border-border p-2 transition hover:border-primary ${cursorAsset?.id === asset.id ? 'border-primary bg-primary/10' : 'bg-muted/30'}`}
                                        onClick={() => startDragAsset(asset)}
                                    >
                                        <div className="flex h-16 items-center justify-center">
                                            <img src={asset.url} alt={asset.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <div className="mt-2 truncate text-center text-[11px] leading-tight text-muted-foreground">{asset.name}</div>

                                        <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/90 text-white hover:bg-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteAsset(asset.id);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {assets.length === 0 && (
                                    <div className="col-span-2 rounded border border-dashed p-4 text-center text-sm text-muted-foreground">
                                        {t('No assets found. Upload some to get started.')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                        <Button onClick={handleSaveProgress} variant="outline" className="w-full font-semibold" disabled={saving}>
                            {saving ? <span className="mr-2 animate-spin">⏳</span> : <Save className="mr-2 h-4 w-4" />}
                            {t('Save Progress')}
                        </Button>
                        <Button onClick={generatePdf} className="w-full font-semibold" disabled={saving}>
                            {saving ? <span className="mr-2 animate-spin">⏳</span> : <Check className="mr-2 h-4 w-4" />}
                            {t('Download PDF')}
                        </Button>
                    </div>
                </div>

                {/* PDF CANVAS AREA */}
                <div className={`flex-1 overflow-auto bg-muted/30 p-8 shadow-inner ${cursorAsset ? 'cursor-crosshair' : ''}`}>
                    <div className="mx-auto flex max-w-4xl flex-col items-center space-y-8 pb-12">
                        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                            <Card key={pageNum} data-page-card={pageNum} className="w-fit overflow-hidden shadow-md ring-1 ring-border">
                                {/*
                                 * Canvas wrapper — THIS is the positioning parent for all overlays.
                                 * Every absolute overlay is positioned relative to this div,
                                 * which is sized to exactly match the canvas dimensions.
                                 * The click handler lives here so e.currentTarget rect === overlay origin.
                                 */}
                                <div
                                    className={`relative block ${cursorAsset ? 'cursor-crosshair' : ''}`}
                                    style={{ lineHeight: 0 }}
                                    onClick={(e) => handleCanvasClick(e, pageNum)}
                                >
                                    {/* Page number badge — inside the relative wrapper so it overlays the canvas correctly */}
                                    <div
                                        data-html2canvas-ignore
                                        className="pointer-events-none absolute top-2 left-2 z-50 rounded bg-black/60 px-2 py-0.5 text-xs text-white"
                                    >
                                        {t('Page')} {pageNum}
                                    </div>

                                    <canvas
                                        ref={(el) => {
                                            canvasRefs.current[pageNum] = el;
                                        }}
                                        className="block max-w-full"
                                    />

                                    {/* VISUAL HEADER/FOOTER DOM RENDERING OVERLAYS */}
                                    {isPageActive(pageNum, headerConfig) && headerConfig.assetId && (
                                        <div
                                            className={`pointer-events-none absolute ${headerConfig.layering === 'underlay' ? 'z-0 opacity-50' : 'z-40'}`}
                                            style={{
                                                width: `${headerConfig.scale > 100 ? 100 : headerConfig.scale}%`,
                                                left: headerConfig.alignX === 'left' ? '20px' : headerConfig.alignX === 'center' ? '50%' : 'auto',
                                                right: headerConfig.alignX === 'right' ? '20px' : 'auto',
                                                transform: `translate(${headerConfig.alignX === 'center' ? '-50%' : '0'}, 0) rotate(${headerConfig.rotation}deg)`,
                                                top: 0,
                                                opacity: headerConfig.opacity,
                                            }}
                                        >
                                            <img
                                                src={assets.find((a) => a.id === headerConfig.assetId)?.url}
                                                className="pointer-events-none h-full w-full object-contain"
                                            />
                                        </div>
                                    )}

                                    {isPageActive(pageNum, footerConfig) && footerConfig.assetId && (
                                        <div
                                            className={`pointer-events-none absolute ${footerConfig.layering === 'underlay' ? 'z-0 opacity-50' : 'z-40'}`}
                                            style={{
                                                width: `${footerConfig.scale > 100 ? 100 : footerConfig.scale}%`,
                                                left: footerConfig.alignX === 'left' ? '20px' : footerConfig.alignX === 'center' ? '50%' : 'auto',
                                                right: footerConfig.alignX === 'right' ? '20px' : 'auto',
                                                transform: `translate(${footerConfig.alignX === 'center' ? '-50%' : '0'}, 0) rotate(${footerConfig.rotation}deg)`,
                                                bottom: 0,
                                                opacity: footerConfig.opacity,
                                            }}
                                        >
                                            <img
                                                src={assets.find((a) => a.id === footerConfig.assetId)?.url}
                                                className="pointer-events-none h-full w-full object-contain"
                                            />
                                        </div>
                                    )}

                                    {/* DRAGGABLE OVERLAYS FOR THIS PAGE */}
                                    {overlays
                                        .filter((o) => o.page === pageNum)
                                        .map((overlay) => {
                                            const canvasEl = canvasRefs.current[pageNum];
                                            if (!canvasEl) return null;

                                            // offsetWidth/offsetHeight = stable CSS layout size, no scroll sensitivity
                                            const { width: canvasW, height: canvasH } = getCanvasDisplaySize(canvasEl);
                                            if (!canvasW || !canvasH) return null;

                                            const displayX = overlay.x * canvasW;
                                            const displayY = overlay.y * canvasH;
                                            const displayW = overlay.width * canvasW;
                                            const displayH = overlay.height * canvasH;

                                            return (
                                                <DraggableOverlay
                                                    key={overlay.id}
                                                    id={overlay.id}
                                                    x={displayX}
                                                    y={displayY}
                                                    width={displayW}
                                                    height={displayH}
                                                    isActive={activeOverlayId === overlay.id}
                                                    imageUrl={overlay.imageUrl}
                                                    type={overlay.type}
                                                    onSelect={() => setActiveOverlayId(overlay.id)}
                                                    onDelete={() => {
                                                        const updated = overlays.filter((o) => o.id !== overlay.id);
                                                        setOverlays(updated);
                                                        saveConfig(updated);
                                                    }}
                                                    onDragEnd={(dx, dy) => {
                                                        updateOverlay(overlay.id, {
                                                            x: Math.max(0, Math.min(1 - overlay.width, (displayX + dx) / canvasW)),
                                                            y: Math.max(0, Math.min(1 - overlay.height, (displayY + dy) / canvasH)),
                                                        });
                                                    }}
                                                    onResizeEnd={(newW, newH, newX, newY) => {
                                                        updateOverlay(overlay.id, {
                                                            width: Math.min(1, newW / canvasW),
                                                            height: Math.min(1, newH / canvasH),
                                                            ...(newX !== undefined && {
                                                                x: Math.max(0, Math.min(1 - newW / canvasW, newX / canvasW)),
                                                            }),
                                                            ...(newY !== undefined && {
                                                                y: Math.max(0, Math.min(1 - newH / canvasH, newY / canvasH)),
                                                            }),
                                                        });
                                                    }}
                                                    onDragStart={() => setActiveOverlayId(overlay.id)}
                                                />
                                            );
                                        })}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* MODAL WINDOW FOR HEADER/FOOTER CONFIG */}
                <Dialog open={isHFModalOpen} onOpenChange={setIsHFModalOpen}>
                    <DialogContent className="sm:max-w-[850px]">
                        <DialogHeader>
                            <DialogTitle>{t('Manage Header & Footer Settings')}</DialogTitle>
                            <DialogDescription>
                                {t('Configure visual structural rules for stamping across the document dynamically.')}
                            </DialogDescription>
                        </DialogHeader>

                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Tabs value={hfActiveTab} onValueChange={(v: string) => setHfActiveTab(v as any)} className="mt-2 w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="header">{t('Document Header')}</TabsTrigger>
                                <TabsTrigger value="footer">{t('Document Footer')}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="header" className="rounded-md border p-0">
                                {renderHFPanel(headerConfig, (c) => updateHFConfig('header', c), 'header')}
                            </TabsContent>
                            <TabsContent value="footer" className="rounded-md border p-0">
                                {renderHFPanel(footerConfig, (c) => updateHFConfig('footer', c), 'footer')}
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="mt-4 flex justify-end">
                            <Button variant="default" onClick={() => setIsHFModalOpen(false)}>
                                <Check className="mr-2 h-4 w-4" />
                                {t('Done')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppSidebarLayout>
    );
}

interface DraggableOverlayProps {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isActive: boolean;
    imageUrl?: string;
    type: string;
    onSelect: () => void;
    onDelete: () => void;
    onDragEnd: (dx: number, dy: number) => void;
    onResizeEnd: (newW: number, newH: number, newX?: number, newY?: number) => void;
    onDragStart: () => void;
}

function DraggableOverlay({
    x,
    y,
    width,
    height,
    isActive,
    imageUrl,
    type,
    onSelect,
    onDelete,
    onDragEnd,
    onResizeEnd,
    onDragStart,
}: DraggableOverlayProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDir, setResizeDir] = useState<string | null>(null);
    const [pos, setPos] = useState({ x, y });
    const [size, setSize] = useState({ w: width, h: height });
    const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
    const resizeStart = useRef({ mx: 0, my: 0, ow: 0, oh: 0, ox: 0, oy: 0 });
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        setPos({ x, y });
        setSize({ w: width, h: height });
    }, [x, y, width, height]);

    const handleDragMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect();
        onDragStart();
        setIsDragging(true);
        dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
    };

    const handleResizeMouseDown = (e: React.MouseEvent, dir: string) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect();
        onDragStart();
        setIsResizing(true);
        setResizeDir(dir);
        resizeStart.current = { mx: e.clientX, my: e.clientY, ow: size.w, oh: size.h, ox: pos.x, oy: pos.y };
    };

    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = e.clientX - dragStart.current.mx;
                const dy = e.clientY - dragStart.current.my;
                setPos({
                    x: Math.max(0, dragStart.current.ox + dx),
                    y: Math.max(0, dragStart.current.oy + dy),
                });
            } else if (isResizing) {
                const dx = e.clientX - resizeStart.current.mx;
                const dy = e.clientY - resizeStart.current.my;

                let newW = resizeStart.current.ow;
                let newH = resizeStart.current.oh;
                let newX = resizeStart.current.ox;
                let newY = resizeStart.current.oy;

                if (resizeDir === 'se') {
                    // Proportional scaling to lock aspect ratio (since object-contain preserves it)
                    const scaleX = (resizeStart.current.ow + dx) / resizeStart.current.ow;
                    const scaleY = (resizeStart.current.oh + dy) / resizeStart.current.oh;
                    const scale = Math.max(scaleX, scaleY);

                    newW = Math.max(20, resizeStart.current.ow * scale);
                    newH = Math.max(20, resizeStart.current.oh * scale);
                } else if (resizeDir) {
                    if (resizeDir.includes('e')) newW = Math.max(20, resizeStart.current.ow + dx);
                    if (resizeDir.includes('s')) newH = Math.max(20, resizeStart.current.oh + dy);
                    if (resizeDir.includes('w')) {
                        const potentialW = resizeStart.current.ow - dx;
                        if (potentialW >= 20) {
                            newW = potentialW;
                            newX = resizeStart.current.ox + dx;
                        }
                    }
                    if (resizeDir.includes('n')) {
                        const potentialH = resizeStart.current.oh - dy;
                        if (potentialH >= 20) {
                            newH = potentialH;
                            newY = resizeStart.current.oy + dy;
                        }
                    }
                }

                setSize({ w: newW, h: newH });
                setPos({ x: newX, y: newY });
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isDragging) {
                const dx = e.clientX - dragStart.current.mx;
                const dy = e.clientY - dragStart.current.my;
                setIsDragging(false);
                onDragEnd(dx, dy);
            } else if (isResizing) {
                const dx = e.clientX - resizeStart.current.mx;
                const dy = e.clientY - resizeStart.current.my;

                let newW = resizeStart.current.ow;
                let newH = resizeStart.current.oh;
                let newX = resizeStart.current.ox;
                let newY = resizeStart.current.oy;

                if (resizeDir === 'se') {
                    const scaleX = (resizeStart.current.ow + dx) / resizeStart.current.ow;
                    const scaleY = (resizeStart.current.oh + dy) / resizeStart.current.oh;
                    const scale = Math.max(scaleX, scaleY);
                    newW = Math.max(20, resizeStart.current.ow * scale);
                    newH = Math.max(20, resizeStart.current.oh * scale);
                } else if (resizeDir) {
                    if (resizeDir.includes('e')) newW = Math.max(20, resizeStart.current.ow + dx);
                    if (resizeDir.includes('s')) newH = Math.max(20, resizeStart.current.oh + dy);
                    if (resizeDir.includes('w')) {
                        const potentialW = resizeStart.current.ow - dx;
                        if (potentialW >= 20) {
                            newW = potentialW;
                            newX = resizeStart.current.ox + dx;
                        }
                    }
                    if (resizeDir.includes('n')) {
                        const potentialH = resizeStart.current.oh - dy;
                        if (potentialH >= 20) {
                            newH = potentialH;
                            newY = resizeStart.current.oy + dy;
                        }
                    }
                }

                setIsResizing(false);
                setResizeDir(null);
                onResizeEnd(newW, newH, newX, newY);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, isResizing, size.w, size.h]);

    return (
        <div
            ref={overlayRef}
            className={`group absolute flex cursor-move items-center justify-center transition-shadow ${
                isActive
                    ? 'z-40 bg-primary/5 outline outline-2 outline-primary outline-dashed'
                    : 'z-30 hover:outline hover:outline-2 hover:outline-primary/30 hover:outline-dashed'
            }`}
            style={{
                left: pos.x,
                top: pos.y,
                width: size.w,
                height: size.h,
            }}
            onMouseDown={handleDragMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onMouseEnter={() => setShowDelete(true)}
            onMouseLeave={() => setShowDelete(false)}
        >
            <button
                className={`absolute -top-3 -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs text-white shadow-md transition-opacity ${
                    isActive || showDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            >
                ✕
            </button>

            {/* Edge Resizers */}
            <div
                className="absolute top-0 right-0 left-0 z-50 h-2 -translate-y-1/2 cursor-ns-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            />
            <div
                className="absolute right-0 bottom-0 left-0 z-50 h-2 translate-y-1/2 cursor-ns-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            />
            <div
                className="absolute top-0 bottom-0 left-0 z-50 w-2 -translate-x-1/2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            />
            <div
                className="absolute top-0 right-0 bottom-0 z-50 w-2 translate-x-1/2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            />

            {/* Corner Resizers */}
            <div
                className="absolute top-0 left-0 z-50 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            />
            <div
                className="absolute top-0 right-0 z-50 h-3 w-3 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            />
            <div
                className="absolute bottom-0 left-0 z-50 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            />

            <div
                className="absolute right-0 bottom-0 z-50 cursor-nwse-resize p-1 opacity-0 group-hover:opacity-100"
                onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </div>

            {imageUrl ? (
                <div className="h-full w-full">
                    <img src={imageUrl} alt={type} className="pointer-events-none h-full w-full object-contain" />
                </div>
            ) : (
                <span className="font-semibold text-primary">{type.toUpperCase()}</span>
            )}
        </div>
    );
}
