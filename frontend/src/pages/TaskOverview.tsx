import { useCallback, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const cloudBackground = new URL("../../assets/cloud.png", import.meta.url).href;
const cloudMarkerSource = new URL("../../assets/cloud-small.svg", import.meta.url).href;

const polylinePoints = [
  { x: 20, y: 8 },
  { x: 44, y: 8 },
  { x: 66, y: 12 },
  { x: 85, y: 19 },
  { x: 92, y: 35 },
  { x: 84, y: 50 },
  { x: 60, y: 57 },
  { x: 33, y: 60 },
  { x: 13, y: 63 },
  { x: 33, y: 75 },
  { x: 50, y: 82 },
  { x: 65, y: 88 },
  { x: 83, y: 93 },
  { x: 77, y: 105 },
  { x: 59, y: 115 },
  { x: 37, y: 120 },
  { x: 14, y: 122 }
];

const cloudMarkerIndices = [2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15 ,16] as const;
const CLOUD_MARKER_WIDTH = 12;
const CLOUD_MARKER_HEIGHT = 10.3;

const cloudMarkerLabels: Record<(typeof cloudMarkerIndices)[number], string> = {
  2: "(i)",
  3: "(ii)",
  4: "(iii)",
  6: "(i)",
  7: "(ii)",
  8: "(iii)",
  10: "(i)",
  11: "(ii)",
  12: "(iii)",
  14: "(i)",
  15: "(ii)",
  16: "(iii)"
};

type SvgTransformStyle = CSSProperties & { transformBox?: string };

interface MainTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  priority: "urgent" | "important" | "when-ready";
}

const mainTasks: MainTask[] = [
  {
    id: "register_death",
    title: "Registry",
    description: "",
    icon: "📋",
    estimatedTime: "1-2 hours",
    priority: "urgent"
  },
  {
    id: "arrange_funeral",
    title: "Funeral",
    description: "",
    icon: "🕊️",
    estimatedTime: "Several days",
    priority: "important"
  },
  {
    id: "legal_financial",
    title: "Legal & Financial",
    description: "",
    icon: "⚖️",
    estimatedTime: "Ongoing",
    priority: "important"
  },
  {
    id: "notify_organizations",
    title: "Accounts",
    description: "",
    icon: "🌐",
    estimatedTime: "2-3 hours",
    priority: "important"
  },
  {
    id: "digital_legacy",
    title: "Digital Legacy",
    description: "",
    icon: "💻",
    estimatedTime: "1-2 hours",
    priority: "when-ready"
  }
];

const TaskOverview = () => {
  const navigate = useNavigate();
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

  const handleMarkerEnter = useCallback((index: number) => {
    setHoveredMarker(index);
  }, []);

  const handleMarkerLeave = useCallback((index: number) => {
    setHoveredMarker((current) => (current === index ? null : current));
  }, []);

  const handleStartGuide = useCallback(() => {
    navigate("/procedure");
  }, [navigate]);

  const handleGoBack = useCallback(() => {
    navigate("/complete");
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'var(--gradient-bg)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-8 md:px-10 lg:px-12 py-12">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Your Gentle Guide
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
              Based on what you've shared with us, here are the main tasks ahead. 
              Don't worry—we'll take you through each one, step by step.
            </p>
          </div>

          {/* Main Tasks Grid */}
          <div className="relative mb-16">
            <svg
              className="absolute inset-0 hidden lg:block z-20"
              viewBox="0 0 100 220"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="rgba(54, 77, 99, 0.35)"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
                points={polylinePoints.map((point) => `${point.x},${point.y}`).join(" ")}
              />
              {cloudMarkerIndices.map((vertexIndex) => {
                const vertex = polylinePoints[vertexIndex - 1];
                if (!vertex) {
                  return null;
                }

                const isHovered = hoveredMarker === vertexIndex;
                const scale = isHovered ? 1.7 : 1;
                const scaleTransition = isHovered
                  ? "transform 0.4s ease-out"
                  : "transform 0.12s ease-in";
                const markerStyle: SvgTransformStyle = {
                  transformOrigin: "50% 50%",
                  transform: `scale(${scale})`,
                  transition: scaleTransition,
                  transformBox: "fill-box"
                };

                return (
                  <g key={`cloud-marker-${vertexIndex}`} transform={`translate(${vertex.x}, ${vertex.y})`}>
                    <g
                      style={markerStyle}
                    >
                      <image
                        href={cloudMarkerSource}
                        x={-CLOUD_MARKER_WIDTH / 2}
                        y={-CLOUD_MARKER_HEIGHT / 2}
                        width={CLOUD_MARKER_WIDTH}
                        height={CLOUD_MARKER_HEIGHT}
                        preserveAspectRatio="xMidYMid meet"
                        onMouseEnter={() => handleMarkerEnter(vertexIndex)}
                        onMouseLeave={() => handleMarkerLeave(vertexIndex)}
                        style={{
                          cursor: "pointer",
                          pointerEvents: "visiblePainted",
                          opacity: isHovered ? 1 : 0.3,
                          transition: isHovered ? "opacity 0s linear" : "opacity 0.12s ease-out"
                        }}
                      />
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="4"
                        fill="#364d63"
                        fontWeight="600"
                        pointerEvents="none"
                      >
                        {cloudMarkerLabels[vertexIndex]}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
            <div className="relative z-10 flex flex-col gap-24 md:gap-36 min-h-[260vh]">
              {mainTasks.map((task, index) => {
                const isLeftAligned = index % 2 === 0;
                const alignmentClass = isLeftAligned ? "items-start" : "items-end";
                const textAlignment = isLeftAligned ? "text-left" : "text-right";
                const edgeOffsetClass = isLeftAligned ? "ml-0 sm:ml-4" : "mr-0 sm:mr-4";

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex w-full",
                      isLeftAligned ? "justify-start" : "justify-end",
                    )}
                  >
                    <div className={cn("relative flex flex-col", alignmentClass, edgeOffsetClass)}>
                      <div
                        className={cn(
                          "w-[21.5rem] sm:w-[23rem] md:w-[24.5rem] lg:w-[26rem] aspect-[2400/1411] px-10 py-12 sm:px-12 sm:py-14 flex items-center justify-center transition-transform duration-300 hover:scale-[1.05] bg-no-repeat bg-center bg-contain",
                          textAlignment,
                        )}
                        style={{
                          backgroundImage: `url(${cloudBackground})`,
                        }}
                      >
                        <div className="w-full px-6 py-6 sm:px-8 sm:py-8 flex items-center gap-6">
                          <div className="text-4xl sm:text-5xl" style={{ textShadow: "0 12px 24px rgba(54, 77, 99, 0.25)" }}>
                            {task.icon}
                          </div>
                          <div className="flex-1 flex flex-col items-start gap-4">
                            <span className="inline-flex items-center justify-center rounded-full bg-secondary/20 px-4 py-1 text-sm font-semibold text-secondary-foreground">
                              Step {index + 1}
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
                              {task.title}
                            </h2>
                            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <span role="img" aria-hidden="true">🕒</span>
                              <span>{task.estimatedTime}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-2xl">💙</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  A gentle reminder
                </h3>
                <p className="text-base text-foreground/80 leading-relaxed">
                  You do not have to do everything at once. This is a guide, not a rulebook. 
                  Some steps are time-sensitive, but many can wait until you feel ready. 
                  We're here to support you at your own pace.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartGuide}
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Start Step-by-Step Guide
            </button>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center rounded-full border-2 border-border bg-background px-8 py-4 text-base font-semibold text-foreground transition hover:bg-muted"
            >
              Not Right Now
            </button>
          </div>

          {/* Back Link */}
          <div className="text-center mt-8">
            <button
              onClick={handleGoBack}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              ← Back to Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;
