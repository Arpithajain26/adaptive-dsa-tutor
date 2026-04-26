import { useEffect, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, X, Loader2 } from "lucide-react";

export type VizFrame = {
  type: "array" | "list" | "tree" | "sort" | "search" | "generic";
  title: string;
  narration: string;
  state: any;
};

export type VizData = {
  topic_kind: string;
  frames: VizFrame[];
  summary: string;
};

const COLOR_MAP: Record<string, string> = {
  primary: "bg-primary text-primary-foreground border-primary shadow-[0_0_16px_hsl(var(--primary)/0.6)]",
  success: "bg-success text-success-foreground border-success shadow-[0_0_16px_hsl(var(--success)/0.6)]",
  hint: "bg-hint text-hint-foreground border-hint shadow-[0_0_16px_hsl(var(--hint)/0.6)]",
  explain: "bg-explain text-explain-foreground border-explain shadow-[0_0_16px_hsl(var(--explain)/0.6)]",
};

interface Props {
  loading?: boolean;
  data?: VizData | null;
  onClose: () => void;
}

export default function Visualizer({ loading, data, onClose }: Props) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setI(0);
  }, [data]);

  useEffect(() => {
    if (!playing || !data) return;
    if (i >= data.frames.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setI((x) => x + 1), 1400);
    return () => clearTimeout(t);
  }, [playing, i, data]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="glass-strong rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-xs uppercase tracking-wide text-explain font-bold">🎬 Algorithm Visualization</div>
            <h2 className="text-lg font-bold">{data ? data.frames[i]?.title : "Generating..."}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl glass hover:border-foreground/40 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center min-h-[280px]">
          {loading || !data ? (
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-explain mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground">Building animation frames...</p>
            </div>
          ) : (
            <FrameView frame={data.frames[i]} />
          )}
        </div>

        {data && (
          <>
            <div className="px-6 pb-3">
              <div className="text-sm text-foreground/90 italic min-h-[2.5rem]">
                "{data.frames[i]?.narration ?? ""}"
              </div>
            </div>

            {/* Progress dots */}
            <div className="px-6 pb-3 flex gap-1.5 justify-center">
              {data.frames.map((_, k) => (
                <button
                  key={k}
                  onClick={() => { setI(k); setPlaying(false); }}
                  className={`h-1.5 rounded-full transition-all ${
                    k === i ? "w-8 bg-explain" : k < i ? "w-2 bg-success/60" : "w-2 bg-secondary/60"
                  }`}
                />
              ))}
            </div>

            <footer className="border-t border-border p-4 flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Step {i + 1} / {data.frames.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setI(Math.max(0, i - 1)); setPlaying(false); }}
                  disabled={i === 0}
                  className="w-10 h-10 rounded-xl glass hover:border-primary/60 disabled:opacity-40 flex items-center justify-center"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="w-12 h-12 rounded-xl bg-explain text-explain-foreground hover:brightness-110 flex items-center justify-center"
                >
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => { setI(Math.min(data.frames.length - 1, i + 1)); setPlaying(false); }}
                  disabled={i >= data.frames.length - 1}
                  className="w-10 h-10 rounded-xl glass hover:border-primary/60 disabled:opacity-40 flex items-center justify-center"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
              {i === data.frames.length - 1 && (
                <div className="text-xs text-success font-semibold animate-fade-in">✓ Done</div>
              )}
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function FrameView({ frame }: { frame: VizFrame }) {
  if (!frame) return null;
  const s = frame.state ?? {};
  switch (frame.type) {
    case "array":
    case "sort":
    case "search":
      return <ArrayView arr={s.array ?? []} pointers={s.pointers ?? []} swap={s.swap} />;
    case "list":
      return <ListView nodes={s.nodes ?? []} pointers={s.pointers ?? []} />;
    case "tree":
      return <TreeView node={s.tree} />;
    default:
      return (
        <div className="text-center max-w-md text-foreground/90 font-mono text-sm whitespace-pre-wrap">
          {s.text ?? "(no content)"}
        </div>
      );
  }
}

function pointerColorFor(arr: any[], idx: number, pointers: { name: string; index: number; color?: string }[]) {
  const p = pointers.find((x) => x.index === idx);
  if (!p) return null;
  return p;
}

function ArrayView({
  arr,
  pointers,
  swap,
}: {
  arr: number[];
  pointers: { name: string; index: number; color?: string }[];
  swap?: [number, number];
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-2">
        {arr.map((v, i) => {
          const p = pointerColorFor(arr, i, pointers);
          const cls = p ? COLOR_MAP[p.color ?? "primary"] : "bg-secondary/60 border-border";
          const swapped = swap && (swap[0] === i || swap[1] === i);
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center font-mono text-lg font-bold transition-all duration-500 ${cls} ${
                  swapped ? "animate-pulse-glow" : ""
                }`}
              >
                {v}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">{i}</div>
              {p && (
                <div className="text-[10px] font-bold uppercase tracking-wide text-foreground">{p.name}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ nodes, pointers }: { nodes: { value: any }[]; pointers: { name: string; index: number; color?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {nodes.map((n, i) => {
        const p = pointerColorFor(nodes, i, pointers);
        const cls = p ? COLOR_MAP[p.color ?? "primary"] : "bg-secondary/60 border-border";
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`px-4 py-3 rounded-xl border-2 font-mono font-bold transition-all duration-500 ${cls}`}>
                {String(n.value)}
              </div>
              {p && <div className="text-[10px] font-bold uppercase text-foreground">{p.name}</div>}
            </div>
            {i < nodes.length - 1 && <span className="text-muted-foreground text-xl">→</span>}
          </div>
        );
      })}
    </div>
  );
}

type TreeNode = { value: any; left?: TreeNode; right?: TreeNode; highlight?: string };

function TreeView({ node }: { node?: TreeNode }) {
  if (!node) return <div className="text-muted-foreground">No tree</div>;
  return <div className="flex justify-center"><TreeNodeView node={node} /></div>;
}

function TreeNodeView({ node }: { node: TreeNode }) {
  const cls = node.highlight ? COLOR_MAP[node.highlight] : "bg-secondary/60 border-border";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-bold transition-all duration-500 ${cls}`}>
        {String(node.value)}
      </div>
      {(node.left || node.right) && (
        <div className="flex gap-4 pt-1 relative">
          {node.left && (
            <div className="flex flex-col items-center">
              <div className="text-muted-foreground text-xs leading-none mb-1">↙</div>
              <TreeNodeView node={node.left} />
            </div>
          )}
          {node.right && (
            <div className="flex flex-col items-center">
              <div className="text-muted-foreground text-xs leading-none mb-1">↘</div>
              <TreeNodeView node={node.right} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
