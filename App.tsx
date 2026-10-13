/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PRDConfig, Intersection, UserRole, AlertNotification, SensorTelemetry } from './types/traffic';
import { DEFAULT_PRD, INITIAL_INTERSECTIONS, INITIAL_ALERTS, INITIAL_SENSORS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { PRDStudio } from './components/PRDStudio';
import { DashboardView } from './components/DashboardView';
import { IntersectionSimulation } from './components/IntersectionSimulation';
import { SignalControlView } from './components/SignalControlView';
import { AnalyticsReportsView } from './components/AnalyticsReportsView';
import { CameraSensorView } from './components/CameraSensorView';
import { 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'prd' | 'dashboard' | 'monitoring' | 'control' | 'analytics' | 'sensors'>('prd');
  const [prdConfig, setPrdConfig] = useState<PRDConfig>(DEFAULT_PRD);
  const [intersections, setIntersections] = useState<Intersection[]>(INITIAL_INTERSECTIONS);
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string>('INT-01');
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);
  const [sensors] = useState<SensorTelemetry[]>(INITIAL_SENSORS);
  const [activeRole, setActiveRole] = useState<UserRole>('Traffic administrators');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedIntersection =
    intersections.find((i) => i.id === selectedIntersectionId) || intersections[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateIntersection = (updated: Partial<Intersection>) => {
    setIntersections((prev) =>
      prev.map((item) => (item.id === selectedIntersectionId ? { ...item, ...updated } : item))
    );
  };

  const handleAddAlert = (title: string, description: string, type: 'emergency' | 'congestion' | 'override') => {
    const newAlert: AlertNotification = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type,
      title,
      description,
      intersectionId: selectedIntersectionId,
      resolved: false,
    };
    setAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);
    showToast(`${title}: ${description}`);
  };

  const handleQuickAction = (action: 'emergency_all' | 'flush' | 'caution' | 'reset_all') => {
    if (action === 'emergency_all') {
      setIntersections((prev) =>
        prev.map((i) => ({
          ...i,
          emergencyActive: true,
          controlMode: 'Emergency Priority',
          currentPhase: 'NS',
          phaseState: 'GREEN',
          remainingSeconds: 25,
        }))
      );
      handleAddAlert(
        'Hospital Corridor Preemption',
        'All arterial signals locked green for emergency fleet dispatch.',
        'emergency'
      );
    } else if (action === 'flush') {
      setIntersections((prev) =>
        prev.map((i) => ({
          ...i,
          controlMode: 'Adaptive AI',
          phaseState: 'GREEN',
          remainingSeconds: 45,
        }))
      );
      handleAddAlert(
        'Peak Hour Flush Activated',
        'Max green ceiling applied across major arteries to flush queue buildup.',
        'congestion'
      );
    } else if (action === 'caution') {
      setIntersections((prev) =>
        prev.map((i) => ({
          ...i,
          phaseState: 'YELLOW',
          controlMode: 'Manual Override',
          remainingSeconds: 99,
        }))
      );
      handleAddAlert(
        'Flashing Yellow Caution Initiated',
        'Late-night low-volume safety flash enabled across all nodes.',
        'override'
      );
    } else if (action === 'reset_all') {
      setIntersections((prev) =>
        prev.map((i) => ({
          ...i,
          emergencyActive: false,
          controlMode: 'Adaptive AI',
          phaseState: 'GREEN',
          remainingSeconds: 25,
        }))
      );
      handleAddAlert(
        'Network Adaptive Sync',
        'All intersections restored to automatic Webster ATCS control.',
        'override'
      );
    }
  };

  const handleApplyPRDToSimulation = () => {
    // Map PRD control method to simulator mode
    let targetMode: Intersection['controlMode'] = 'Adaptive AI';
    if (prdConfig.controlMethod === 'Fixed-time signals') {
      targetMode = 'Fixed Time';
    } else if (prdConfig.controlMethod === 'Manual operator control') {
      targetMode = 'Manual Override';
    }

    setIntersections((prev) =>
      prev.map((i) => ({
        ...i,
        controlMode: targetMode,
      }))
    );

    setActiveTab('monitoring');
    showToast(`PRD Configuration applied! Switched to live simulation with ${targetMode} engine.`);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/80 text-white px-4 py-3 rounded-xl shadow-2xl shadow-cyan-950/80 flex items-center gap-3 text-xs animate-bounce font-medium">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        emergencyActive={intersections.some((i) => i.emergencyActive)}
      />

      {/* Role Context Ribbon */}
      <div className="bg-[#090e1a] border-b border-slate-800/80 py-2 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono">Viewing as:</span>
          <span className="text-cyan-300 font-bold font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
            {activeRole}
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            {activeRole === 'Traffic administrators' && 'Full administrative authority: timing policy configuration, PRD blueprint, and system deployment.'}
            {activeRole === 'Traffic police' && 'Operational authority: manual overrides, congestion flush, and emergency green wave dispatch.'}
            {activeRole === 'System operators' && 'Telemetry oversight: sensor health diagnostics, conflict monitor checks, and MQTT feeds.'}
            {activeRole === 'City authorities' && 'Mobility planning: delay reduction analytics, peak hour trends, and carbon reduction metrics.'}
            {activeRole === 'Public / commuters' && 'Public mobility advisory: live intersection states and traffic queue estimates.'}
            {activeRole === 'Researchers / students' && 'Simulation sandbox: test Webster queue formulas, car-following physics, and PRD generation.'}
          </span>
        </div>

        {/* Selected intersection fast switcher */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-500">Active Node:</span>
          <select
            value={selectedIntersectionId}
            onChange={(e) => setSelectedIntersectionId(e.target.value)}
            className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {intersections.map((i) => (
              <option key={i.id} value={i.id}>
                {i.id} — {i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'prd' && (
          <PRDStudio
            config={prdConfig}
            onChangeConfig={setPrdConfig}
            onApplyToSimulation={handleApplyPRDToSimulation}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            intersections={intersections}
            alerts={alerts}
            selectedIntersectionId={selectedIntersectionId}
            onSelectIntersection={(id) => {
              setSelectedIntersectionId(id);
              setActiveTab('monitoring');
            }}
            onQuickAction={handleQuickAction}
          />
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b1220] border border-slate-800 p-4 rounded-xl">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Live 4-Way Intersection Simulator</span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    60 FPS Physics Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real vehicles queue up on red lights, accelerate on green, yield to pedestrians, and clear the corridor for ambulances.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('control')}
                  className="px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Tune Timings (SPaT)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <IntersectionSimulation
              intersection={selectedIntersection}
              onUpdateIntersection={handleUpdateIntersection}
              onAddAlert={handleAddAlert}
            />
          </div>
        )}

        {activeTab === 'control' && (
          <SignalControlView
            intersection={selectedIntersection}
            onUpdateIntersection={handleUpdateIntersection}
            onAddAlert={handleAddAlert}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsReportsView intersections={intersections} />
        )}

        {activeTab === 'sensors' && (
          <CameraSensorView sensors={sensors} intersection={selectedIntersection} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060912] py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SignalPulse ATCS</span>
            <span>·</span>
            <span>Intelligent Traffic Signal Control System & PRD Studio</span>
            <span>·</span>
            <span className="text-slate-600">NEMA TS2 & ITE Compliant Simulation</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Webster Delay Minimization Engine</span>
            <span>•</span>
            <span>YOLOv8 Computer Vision Simulation</span>
            <span>•</span>
            <span>MQTT Telemetry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
