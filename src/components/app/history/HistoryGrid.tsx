import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HistoryListItem } from "@/app/app/history/page";
import { ProcessingGradient } from "./ProcessingGradient";
import { IconDownload, IconPlayerPlay, IconAlertCircle } from "@tabler/icons-react";
import { generateMediaFilename, downloadMedia } from "@/lib/media-filename";
import { motion } from "framer-motion";

type Item = {
    id: string;
    outputUrls: Array<{ type: 'image' | 'video'; url: string; thumbnail_url?: string }>;
    status: string;
    createdAt: string;
};

interface HistoryGridProps {
    items: Item[];
    onSelect: (id: string) => void;
    onDelete?: (id: string) => void;
    loadingItemId?: string | null;
}

/** Returns the CSS-grid column count for the given container width */
function getColCount(width: number): number {
    if (width >= 1280) return 5
    if (width >= 1024) return 4
    if (width >= 640)  return 3
    return 2
}

export function HistoryGrid({ items, onSelect, onDelete, loadingItemId }: HistoryGridProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [cols, setCols] = useState(4)

    useEffect(() => {
        const el = containerRef.current; if (!el) return
        const ro = new ResizeObserver(entries => setCols(getColCount(entries[0]!.contentRect.width)))
        ro.observe(el)
        setCols(getColCount(el.getBoundingClientRect().width))
        return () => ro.disconnect()
    }, [])

    // How many phantom cells needed to fill the last row
    const remainder = items.length % cols
    const phantomCount = remainder === 0 ? 0 : cols - remainder

    return (
        <div
            ref={containerRef}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        >
            {items.map((item, idx) => (
                <HistoryCard key={item.id} item={item} onSelect={onSelect} index={idx} isLoading={loadingItemId === item.id} />
            ))}
            {/* Invisible phantom cells so the last row is always full */}
            {Array.from({ length: phantomCount }).map((_, i) => (
                <div key={`ph-${i}`} className="aspect-[4/5] invisible" aria-hidden />
            ))}
        </div>
    );
}

function HistoryCard({ item, onSelect, index, isLoading }: { item: Item; onSelect: (id: string) => void; index: number; isLoading?: boolean }) {
    const primaryOutput = item.outputUrls?.find((o) => o.type === "image") || item.outputUrls?.[0];
    const primary = primaryOutput?.url;
    const primaryThumb = primaryOutput?.thumbnail_url || primary;
    const isVideo = item.outputUrls?.some((o) => o.type === "video");
    const isProcessing = item.status === "processing";
    const isFailed = item.status === "failed";

    return (
        <motion.div
            data-history-id={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: Math.min(index, 15) * 0.03 }}
            className={cn(
                "group relative aspect-[4/5] rounded-xl overflow-hidden bg-white/[0.05] transition-all duration-300",
                isProcessing ? "cursor-default" : "cursor-pointer"
            )}
            onClick={() => !isProcessing && onSelect(item.id)}
        >
            {/* Background / Image */}
            {isProcessing ? (
                <ProcessingGradient />
            ) : primary ? (
                <div className="absolute inset-0 w-full h-full">
                    {isVideo ? (
                        <video
                            src={primary}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                        />
                    ) : (
                        <img
                            src={primaryThumb}
                            alt="History Item"
                            className="w-full h-full object-cover transition-transform duration-700"
                        />
                    )}
                </div>
            ) : (
                <div className="absolute inset-0 bg-white/[0.05] flex items-center justify-center text-white/20">
                    {isFailed ? (
                        <IconAlertCircle size={28} className="text-white/[0.12]" strokeWidth={1.5} />
                    ) : (
                        "No Preview"
                    )}
                </div>
            )}

            {/* Video badge */}
            {isVideo && !isProcessing && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <IconPlayerPlay size={14} className="fill-white text-white ml-0.5" />
                </div>
            )}

            {/* Loading overlay (while detail is fetching) */}
            {isLoading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-30 rounded-xl">
                    <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                </div>
            )}

            {/* Footer — date + download on hover */}
            {!isProcessing && (
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 cursor-default">
                    <span className="text-[10px] font-medium text-white/70 uppercase tracking-widest pl-1 mb-1">
                        {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    {!isFailed && primary && (
                        <button
                            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg cursor-pointer z-20"
                            onClick={(e) => {
                                e.stopPropagation();
                                const ext = primary.match(/\.(\w+)(?:\?|$)/)?.[1]?.toLowerCase() || 'jpg';
                                downloadMedia(primary, generateMediaFilename(ext));
                            }}
                        >
                            <IconDownload size={14} />
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
