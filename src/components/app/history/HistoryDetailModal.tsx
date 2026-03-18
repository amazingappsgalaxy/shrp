import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, Maximize2, Sparkles, AlertCircle } from "lucide-react";
import { generateMediaFilename, downloadMedia } from "@/lib/media-filename";
import { IconWand, IconBadgeHd, IconCopy, IconCheck, IconVideo } from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { EditModal } from '@/components/app/edit/EditModal';

// Redefine locally for simplicity
type HistoryDetail = {
    id: string;
    taskId: string;
    outputUrls: Array<{ type: 'image' | 'video'; url: string }>;
    modelName: string;
    pageName: string;
    status: string;
    generationTimeMs: number | null;
    settings: {
        // Editor / upscaler fields
        style?: string | null;
        mode?: string | null;
        transformationStrength?: number | null;
        skinTextureSize?: number | null;
        detailLevel?: number | null;
        // Image generation fields (app/image)
        prompt?: string | null;
        aspect_ratio?: string | null;
        count?: number | null;
        failure_reason?: string;
    };
    createdAt: string;
};

interface HistoryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: HistoryDetail | null;
    detailsLoading?: boolean;
}

export function HistoryDetailModal({ isOpen, onClose, item, detailsLoading }: HistoryDetailModalProps) {
    const router = useRouter();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [meta, setMeta] = useState<{ width?: number; height?: number; size?: string }>({});
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [promptCopied, setPromptCopied] = useState(false);

    const handleAnimate = useCallback((url: string, type: 'image' | 'video') => {
        try { localStorage.setItem('sharpii_animate_input', JSON.stringify({ type, url, ts: Date.now() })) } catch {}
        router.push('/app/video');
        onClose();
    }, [router, onClose]);

    // Reset index when item opens
    useEffect(() => {
        if (isOpen) setSelectedIndex(0);
    }, [isOpen, item]);

    const currentOutput = item?.outputUrls?.[selectedIndex];
    const isVideo = currentOutput?.type === 'video';

    useEffect(() => {
        if (!currentOutput) return;


        setMeta({}); // Reset

        // Get Dimensions
        if (currentOutput.type === 'image') {
            const img = new Image();
            img.src = currentOutput.url;
            img.onload = () => {
                setMeta(prev => ({ ...prev, width: img.naturalWidth, height: img.naturalHeight }));
            };
        } else {
            // Video dimensions via hidden element or just metadata? 
            // Without loading the full video, hard to get dimensions immediately unless we use a hidden video element.
            // For now, let's leave video dimensions or try element.
            const video = document.createElement('video');
            video.src = currentOutput.url;
            video.onloadedmetadata = () => {
                setMeta(prev => ({ ...prev, width: video.videoWidth, height: video.videoHeight }));
            };
        }

        // Get File Size (approx via HEAD)
        fetch(currentOutput.url, { method: 'HEAD' })
            .then(res => {
                const size = res.headers.get('content-length');
                if (size) {
                    const bytes = parseInt(size, 10);
                    const k = 1024;
                    const sizes = ['B', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                    setMeta(prev => ({ ...prev, size: formatted }));
                }
            })
            .catch(() => { });

    }, [currentOutput]);

    const handleUpscale = async (imageUrl: string) => {
        if (isUpscaling) return
        setIsUpscaling(true)
        try {
            const res = await fetch('/api/enhance-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl, modelId: 'crisp-upscaler', settings: { pageName: 'app/history' } }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to start upscale')
            toast.success('Upscaling started — find the result in History shortly.')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to start upscale')
        } finally {
            setIsUpscaling(false)
        }
    }

    if (!item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-7xl h-[85vh] bg-[#0c0c0e] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col lg:flex-row"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* LEFT: Main Preview Area */}
                        <div className="flex-1 relative bg-black/50 flex flex-col">

                            {/* Main Image/Video */}
                            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative group">
                                {currentOutput ? (
                                    isVideo ? (
                                        <video
                                            src={currentOutput.url}
                                            controls
                                            autoPlay
                                            loop
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                            playsInline
                                            muted
                                        />
                                    ) : (
                                        <img
                                            src={currentOutput.url}
                                            alt="Output"
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                                        />
                                    )
                                ) : (
                                    <div className="text-white/30">No output available</div>
                                )}

                                {/* Navigation Arrows (if multiple) */}
                                {item.outputUrls?.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setSelectedIndex((prev) => (prev - 1 + item.outputUrls.length) % item.outputUrls.length)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronLeft className="w-6 h-6 text-white" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedIndex((prev) => (prev + 1) % item.outputUrls.length)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronRight className="w-6 h-6 text-white" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails Dock (Bottom) */}
                            <div className="h-24 border-t border-white/10 bg-[#09090b] flex items-center gap-3 px-6 overflow-x-auto custom-scrollbar">
                                {item.outputUrls?.map((output, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedIndex(idx)}
                                        className={cn(
                                            "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer",
                                            selectedIndex === idx ? "border-[#FFFF00] opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                                        )}
                                    >
                                        {output.type === 'video' ? (
                                            <video src={output.url} className="w-full h-full object-cover pointer-events-none" />
                                        ) : (
                                            <img src={output.url} alt="Thumbnail" className="w-full h-full object-cover" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Sidebar Details */}
                        <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0c0c0e] flex flex-col lg:h-full h-1/2 overflow-hidden">
                            <div className="p-6 border-b border-white/5 space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{item.modelName || ''}</h2>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{new Date(item.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="uppercase tracking-wider">{item.status}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 w-full">
                                    {item.status !== 'failed' && currentOutput && currentOutput.type === 'image' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditImageUrl(currentOutput.url);
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="w-full bg-white/[0.09] text-[#FFFF00] font-semibold h-10 rounded-md hover:bg-white/[0.15] transition-colors flex items-center justify-center gap-2 text-sm border border-white/10"
                                            >
                                                <IconWand className="w-4 h-4" /> Edit Image
                                            </button>
                                            <button
                                                onClick={() => handleAnimate(currentOutput.url, 'image')}
                                                className="w-full bg-white/[0.09] text-white/80 font-semibold h-10 rounded-md hover:bg-white/[0.15] hover:text-white transition-colors flex items-center justify-center gap-2 text-sm border border-white/10"
                                            >
                                                <IconVideo className="w-4 h-4" /> Animate
                                            </button>
                                            <button
                                                onClick={() => handleUpscale(currentOutput.url)}
                                                disabled={isUpscaling}
                                                className="w-full bg-white/[0.09] text-white/80 font-semibold h-10 rounded-md hover:bg-white/[0.15] hover:text-white transition-colors flex items-center justify-center gap-2 text-sm border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <IconBadgeHd className="w-4 h-4" />
                                                {isUpscaling ? 'Starting…' : 'Upscale'}
                                            </button>
                                        </>
                                    )}
                                    {item.status !== 'failed' && currentOutput && currentOutput.type === 'video' && (
                                        <button
                                            onClick={() => handleAnimate(currentOutput.url, 'video')}
                                            className="w-full bg-white/[0.09] text-white/80 font-semibold h-10 rounded-md hover:bg-white/[0.15] hover:text-white transition-colors flex items-center justify-center gap-2 text-sm border border-white/10"
                                        >
                                            <IconVideo className="w-4 h-4" /> Use as Motion Input
                                        </button>
                                    )}
                                    {item.status !== 'failed' && currentOutput && (
                                        <button
                                            onClick={() => {
                                                if (!currentOutput) return;
                                                const ext = currentOutput.type === 'video' ? 'mp4' : (currentOutput.url.match(/\.(\w+)(?:\?|$)/)?.[1]?.toLowerCase() || 'jpg');
                                                downloadMedia(currentOutput.url, generateMediaFilename(ext, item.settings?.prompt));
                                            }}
                                            className="w-full bg-white text-black font-semibold h-10 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Download className="w-4 h-4" /> Download
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {item.status === 'failed' && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3" /> Failed
                                        </h3>
                                        <p className="text-xs text-red-200/80 leading-relaxed">
                                            {item.settings?.failure_reason || "Unknown error occurred during processing."}
                                        </p>
                                    </div>
                                )}

                                {detailsLoading ? (
                                    <div className="space-y-3">
                                        <div className="h-3 w-24 bg-white/[0.07] rounded animate-pulse" />
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="flex justify-between items-center">
                                                <div className="h-2.5 bg-white/[0.05] rounded w-20 animate-pulse" />
                                                <div className="h-2.5 bg-white/[0.08] rounded w-28 animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {/* Settings Group */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" /> configuration
                                            </h3>
                                            <div className="grid gap-3">
                                                {item.settings?.prompt && (
                                                    <div className="flex justify-between items-start group">
                                                        <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">Prompt</span>
                                                        <div className="flex items-start gap-1.5 max-w-[180px]">
                                                            <span className="text-sm text-white/90 font-medium text-right break-words">{item.settings.prompt}</span>
                                                            <button
                                                                onClick={() => { navigator.clipboard.writeText(item.settings!.prompt!).catch(() => {}); setPromptCopied(true); setTimeout(() => setPromptCopied(false), 2000) }}
                                                                className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors mt-0.5"
                                                                title="Copy prompt"
                                                            >
                                                                {promptCopied ? <IconCheck className="w-3 h-3 text-green-400" /> : <IconCopy className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <DetailRow label="Aspect Ratio" value={item.settings?.aspect_ratio} />
                                                <DetailRow label="Count" value={item.settings?.count} />
                                                <DetailRow label="Style" value={item.settings?.style} />
                                                <DetailRow label="Mode" value={item.settings?.mode} />
                                                <DetailRow label="Texture Size" value={item.settings?.skinTextureSize} />
                                                <DetailRow label="Detail Level" value={item.settings?.detailLevel} />
                                                <DetailRow label="Strength" value={item.settings?.transformationStrength} />
                                            </div>
                                        </div>

                                        {/* Metadata Group */}
                                        <div className="space-y-3 pt-4 border-t border-white/5">
                                            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Metadata</h3>
                                            <div className="grid gap-3">
                                                <DetailRow label="Task ID" value={item.taskId} mono />
                                                <DetailRow label="Time" value={item.generationTimeMs ? `${(item.generationTimeMs / 1000).toFixed(2)}s` : null} />
                                                <DetailRow label="Source" value={item.pageName} />
                                                {meta.width && meta.height && (
                                                    <DetailRow label="Dimensions" value={`${meta.width} x ${meta.height}`} mono />
                                                )}
                                                {meta.size && (
                                                    <DetailRow label="File Size" value={meta.size} mono />
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                    </motion.div>

                    {/* Edit Modal */}
                    {isEditModalOpen && editImageUrl && (
                        <EditModal
                            isOpen={isEditModalOpen}
                            onClose={() => {
                                setIsEditModalOpen(false);
                                setEditImageUrl(null);
                            }}
                            initialImageUrl={editImageUrl}
                            sourceContext="history-page"
                            onGenerationComplete={() => {
                                // Just close the modal - generations are auto-added to history
                                setIsEditModalOpen(false);
                                setEditImageUrl(null);
                            }}
                        />
                    )}
                </div>
            )}
        </AnimatePresence>
    );
}

function DetailRow({ label, value, mono = false }: { label: string, value: any, mono?: boolean }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start group">
            <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
            <span className={cn(
                "text-sm text-white/90 font-medium text-right max-w-[180px] break-words",
                mono && "font-mono text-xs text-white/70"
            )}>
                {value}
            </span>
        </div>
    )
}
