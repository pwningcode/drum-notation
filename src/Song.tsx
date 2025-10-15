import React, { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { 
  addMeasureToIntro, 
  removeMeasureFromIntro, 
  addMeasureToVariant, 
  removeMeasureFromVariant, 
  addMeasureToOutro, 
  removeMeasureFromOutro, 
  updateMeasure,
  updateTimeSignature
} from "./store/songsSlice";

/** ---------- Types ---------- */

export type Subdivision =
  | "."       // no hit
  | "B"       // bass
  | "T"       // tone
  | "S"       // slap
  | "^";      // accent

export type Measure = Subdivision[];     // length = beats * 4 (for x/4 time)
export type Section = Measure[];         // one or more measures

export interface TimeSignature {
  beats: 2 | 3 | 4;                      // x in x/4 (you asked for 2/4, 3/4, 4/4)
  division: 4;                           // denominator fixed to 4 for this component
  subdivisions: 3 | 4;                   // subdivisions per beat (3=triplets, 4=sixteenths)
}

export interface SongProps {
  title: string;
  timeSig: TimeSignature;                // { beats: 4, division: 4 } etc.
  intro: Section;                        // array of measures (each = flat array of subdivisions)
  variants: Section[];                   // one-or-more variant sections, each a Section
  outro: Section;
}

/** ---------- Helpers ---------- */


const cycleNext: Record<Subdivision, Subdivision> = {
  ".": "B",
  "B": "T",
  "T": "S",
  "S": "^",
  "^": ".",
};

function ensureMeasureSize(measure: Measure, beats: number, subdivisions: number): Measure {
  const needed = beats * subdivisions;
  if (measure.length === needed) return measure;
  const copy = measure.slice(0, needed);
  while (copy.length < needed) copy.push(".");
  return copy;
}



function symbolFor(sub: Subdivision): string {
  switch (sub) {
    case ".":   return "·"; // subtle dot instead of empty
    case "B":   return "B";
    case "T":   return "T";
    case "S":   return "S";
    case "^":   return "^";
    default:       return "·";
  }
}

function beatLabelRow() {
  // Top header row: each beat spans 4 subdivisions
  return null;
}

function subLabelRow(beats: number, subdivisions: number) {
  const getSubLabels = (subs: number): string[] => {
    switch (subs) {
      case 3: return ["1", "la", "le"]; // triplets
      case 4: return ["1", "e", "&", "a"]; // sixteenths
      default: return ["1", "e", "&", "a"];
    }
  };
  
  const subs = getSubLabels(subdivisions);
  return (
    <tr>
      {Array.from({ length: beats }).flatMap((_, beatIdx) => [
        ...subs.map((lbl, j) => (
          <th
            key={`sublabel-${beatIdx}-${j}`}
            className={`px-1 py-1 text-center text-xs text-zinc-400 ${
              lbl === "1" ? "font-bold text-zinc-200" : "font-medium"
            }`}
            title={lbl === "1" ? `Beat ${beatIdx + 1}` : lbl}
          >
            {lbl === "1" ? `${beatIdx + 1}` : lbl}
          </th>
        )),
        // Add spacing between beats (except after the last beat)
        ...(beatIdx < beats - 1 ? [
          <th key={`spacer-${beatIdx}`} className="w-2" />
        ] : [])
      ])}
    </tr>
  );
}

/** ---------- Measure Table ---------- */

interface MeasureTableProps {
  measure: Measure;
  beats: number;
  subdivisions: number;
  measureIndex: number;
  editable: boolean;
  onUpdate: (next: Measure) => void;
  onRemove?: () => void;
}

const MeasureTable: React.FC<MeasureTableProps> = ({
  measure,
  beats,
  subdivisions,
  measureIndex,
  editable,
  onUpdate,
  onRemove,
}) => {
  const view = ensureMeasureSize(measure, beats, subdivisions);

  const handleClick = (idx: number) => {
    if (!editable) return;
    const next = [...view];
    next[idx] = cycleNext[next[idx]];
    onUpdate(next);
  };

  return (
    <div className="">
      <div className="px-2 py-1 text-xs text-zinc-400 flex items-center justify-between">
        <span>Measure {measureIndex + 1}</span>
        {editable && onRemove && (
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 text-lg font-bold leading-none"
            title="Remove measure"
          >
            ×
          </button>
        )}
      </div>
      <table className="w-full border-t border-zinc-600 text-zinc-200">
        <thead className="bg-zinc-900/50">
          {beatLabelRow()}
          {subLabelRow(beats, subdivisions)}
        </thead>
        <tbody>
          <tr>
            {Array.from({ length: beats }).flatMap((_, beatIdx) => [
              ...view.slice(beatIdx * subdivisions, (beatIdx + 1) * subdivisions).map((cell, subIdx) => (
                <td
                  key={`cell-${beatIdx}-${subIdx}`}
                  onClick={() => handleClick(beatIdx * subdivisions + subIdx)}
                  className={[
                    "h-6 w-8 select-none text-center align-middle",
                    "border border-zinc-600",
                    editable ? "cursor-pointer hover:bg-zinc-800/60" : "",
                    // subtle coloring per type
                    cell === "B" ? "text-emerald-300" : "",
                    cell === "T" ? "text-sky-300" : "",
                    cell === "S" ? "text-orange-300" : "",
                    cell === "^" ? "text-fuchsia-300" : "",
                    cell === "." ? "text-zinc-500" : "",
                  ].join(" ")}
                  title={
                    cell === "."
                      ? "rest"
                      : cell // tooltip
                  }
                >
                  <span className="inline-block text-sm font-semibold">
                    {symbolFor(cell)}
                  </span>
                </td>
              )),
              // Add spacing between beats (except after the last beat)
              ...(beatIdx < beats - 1 ? [
                <td key={`spacer-${beatIdx}`} className="w-2" />
              ] : [])
            ])}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/** ---------- Section Renderer ---------- */

interface SectionViewProps {
  label: string;
  section: Section;
  beats: number;
  subdivisions: number;
  editable: boolean;
  onUpdateMeasure: (mIdx: number, next: Measure) => void;
  onAddMeasure?: () => void;
  onRemoveMeasure?: (mIdx: number) => void;
}

const SectionView: React.FC<SectionViewProps> = ({
  label,
  section,
  beats,
  subdivisions,
  editable,
  onUpdateMeasure,
  onAddMeasure,
  onRemoveMeasure,
}) => {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300">{label}</h3>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {section.map((m, idx) => (
          <MeasureTable
            key={`${label}-m${idx}`}
            measure={m}
            beats={beats}
            subdivisions={subdivisions}
            measureIndex={idx}
            editable={editable}
            onUpdate={(next) => onUpdateMeasure(idx, next)}
            onRemove={onRemoveMeasure ? () => onRemoveMeasure(idx) : undefined}
          />
        ))}
        {editable && onAddMeasure && (
          <div className="flex items-center justify-center">
            <button
              onClick={onAddMeasure}
              className="w-full h-24 border-2 border-dashed border-zinc-600 hover:border-zinc-500 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-300 transition-colors"
              title="Add measure"
            >
              <span className="text-2xl font-bold">+</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

/** ---------- Main Component ---------- */

export const Song: React.FC<SongProps> = ({
  title,
  timeSig,
  intro,
  variants,
  outro,
}) => {
  const dispatch = useAppDispatch();
  const { songs, version } = useAppSelector((state: any) => state.songs);
  const beats = timeSig.beats;
  const subdivisions = timeSig.subdivisions || 4;
  const [isEditing, setIsEditing] = useState(false);


  // Helper functions for adding and removing measures
  const handleAddMeasureToIntro = useCallback(() => {
    dispatch(addMeasureToIntro({ title, beats }));
  }, [dispatch, title, beats]);

  const handleTimeSignatureChange = useCallback((newTimeSig: TimeSignature) => {
    dispatch(updateTimeSignature({ title, timeSig: newTimeSig }));
  }, [dispatch, title]);

  const handleRemoveMeasureFromIntro = useCallback((mIdx: number) => {
    dispatch(removeMeasureFromIntro({ title, measureIndex: mIdx }));
  }, [dispatch, title]);

  const handleAddMeasureToVariant = useCallback((vIdx: number) => {
    dispatch(addMeasureToVariant({ title, variantIndex: vIdx, beats }));
  }, [dispatch, title, beats]);

  const handleRemoveMeasureFromVariant = useCallback((vIdx: number, mIdx: number) => {
    dispatch(removeMeasureFromVariant({ title, variantIndex: vIdx, measureIndex: mIdx }));
  }, [dispatch, title]);

  const handleAddMeasureToOutro = useCallback(() => {
    dispatch(addMeasureToOutro({ title, beats }));
  }, [dispatch, title, beats]);

  const handleRemoveMeasureFromOutro = useCallback((mIdx: number) => {
    dispatch(removeMeasureFromOutro({ title, measureIndex: mIdx }));
  }, [dispatch, title]);

  const copyReduxStateToClipboard = useCallback(() => {
    try {
      // Increment version number
      const currentVersion = version || "1.0.0";
      const versionParts = currentVersion.split('.');
      const major = parseInt(versionParts[0]) || 1;
      const minor = parseInt(versionParts[1]) || 0;
      const patch = parseInt(versionParts[2]) || 0;
      const newVersion = `${major}.${minor}.${patch + 1}`;

      // Format the data for defaultSongs.json
      const formattedData = {
        version: newVersion,
        songs: songs
      };

      // Convert to JSON string with proper formatting
      const jsonString = JSON.stringify(formattedData, null, 2);
      
      // Copy to clipboard
      navigator.clipboard.writeText(jsonString).then(() => {
        console.log('Redux state copied to clipboard for defaultSongs.json');
        console.log('Version incremented to:', newVersion);
      }).catch((error) => {
        console.error('Failed to copy to clipboard:', error);
      });
    } catch (error) {
      console.error('Error formatting Redux state:', error);
    }
  }, [songs, version]);

  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      // When saving, copy the Redux state to clipboard
      copyReduxStateToClipboard();
    }
    setIsEditing(prev => !prev);
  }, [isEditing, copyReduxStateToClipboard]);


  return (
    <div className="space-y-6 text-zinc-100">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
        <button
          onClick={toggleEditMode}
          className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
          title={isEditing ? "Save changes" : "Edit song"}
        >
          {isEditing ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </>
          )}
        </button>
      </header>

      {/* Time Signature Editor */}
      {isEditing && (
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Time Signature</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Beats:</label>
              <select
                value={beats}
                onChange={(e) => handleTimeSignatureChange({
                  ...timeSig,
                  beats: parseInt(e.target.value) as 2 | 3 | 4
                })}
                className="bg-zinc-700 text-zinc-100 border border-zinc-600 rounded px-2 py-1 text-sm"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Subdivisions:</label>
              <select
                value={subdivisions}
                onChange={(e) => handleTimeSignatureChange({
                  ...timeSig,
                  subdivisions: parseInt(e.target.value) as 3 | 4
                })}
                className="bg-zinc-700 text-zinc-100 border border-zinc-600 rounded px-2 py-1 text-sm"
              >
                <option value={3}>3 (Triplets)</option>
                <option value={4}>4 (Sixteenths)</option>
              </select>
            </div>
            <div className="text-xs text-zinc-500">
              {beats}/{timeSig.division} • {subdivisions} subdivisions per beat
            </div>
          </div>
        </div>
      )}

      {/* Intro */}
      <SectionView
        label="Intro"
        section={intro}
        beats={beats}
        subdivisions={subdivisions}
        editable={isEditing}
        onUpdateMeasure={(mIdx, next) =>
          dispatch(updateMeasure({ 
            title, 
            section: 'intro', 
            measureIndex: mIdx, 
            measure: ensureMeasureSize(next, beats, subdivisions) 
          }))
        }
        onAddMeasure={handleAddMeasureToIntro}
        onRemoveMeasure={handleRemoveMeasureFromIntro}
      />

      {/* Variants */}
      <div className="space-y-8">
        {variants.map((variantSection, vIdx) => (
          <SectionView
            key={`variant-${vIdx}`}
            label={`Variant ${vIdx + 1}`}
            section={variantSection}
            beats={beats}
            subdivisions={subdivisions}
            editable={isEditing}
            onUpdateMeasure={(mIdx, next) =>
              dispatch(updateMeasure({ 
                title, 
                section: 'variants', 
                sectionIndex: vIdx,
                measureIndex: mIdx, 
                measure: ensureMeasureSize(next, beats, subdivisions) 
              }))
            }
            onAddMeasure={() => handleAddMeasureToVariant(vIdx)}
            onRemoveMeasure={(mIdx) => handleRemoveMeasureFromVariant(vIdx, mIdx)}
          />
        ))}
      </div>

      {/* Outro */}
      <SectionView
        label="Outro"
        section={outro}
        beats={beats}
        subdivisions={subdivisions}
        editable={isEditing}
        onUpdateMeasure={(mIdx, next) =>
          dispatch(updateMeasure({ 
            title, 
            section: 'outro', 
            measureIndex: mIdx, 
            measure: ensureMeasureSize(next, beats, subdivisions) 
          }))
        }
        onAddMeasure={handleAddMeasureToOutro}
        onRemoveMeasure={handleRemoveMeasureFromOutro}
      />


    </div>
  );
};
