# User-Friendly Version Migration System - Implementation Plan

## Executive Summary

This plan addresses the requirement for a user-friendly version migration system that:
1. Never automatically overwrites user data
2. Supports version-to-version specific migrations for **both Songs and Instruments**
3. Shows a dialog on version mismatch (similar to Settings page UI)
4. Makes upgrading easy while preserving custom data
5. Maintains schema versioning separate from app version for backward compatibility

## Important Notes

- **Not yet released**: Since this hasn't been released, we don't technically need migrations yet, but this infrastructure will be helpful for testing and future-proofing
- **Dual versioning**: Both Songs and Instruments need their own schema versions
- **Schema version location**: Centralized in easily-editable constants file with clear agent instructions

## Critical Issue Identified

**DATA LOSS BUG** in `/Users/jasonbarnes/source/github/drum-notation/src/store/persistence.ts` (lines 69-79):

When versions mismatch, `mergeSongsWithDefaults()` returns only default songs, **completely overwriting all user data**. This must be fixed immediately.

```typescript
// Current problematic code:
if (savedVersion !== CURRENT_VERSION) {
  const mergedSongs = mergeSongsWithDefaults(songsWithOrder, defaultSongs);
  // mergeSongsWithDefaults just returns defaultSongs - USER DATA LOST!
}
```

## Design Overview

### Version-Specific Migration System

Create a migration registry that supports sequential migrations (e.g., 2.0.0 → 2.1.0 → 2.2.0):

```typescript
interface MigrationFunction<T> {
  from: string;          // Source version
  to: string;            // Target version
  migrate: (data: T) => T;
  description: string;   // User-friendly description
  breaking?: boolean;    // Requires user confirmation
}
```

### Migration Dialog Component

Similar to `SongManagement.tsx` with:
- Comparison view showing new/updated/preserved items
- Conflict detection for user-modified defaults
- Options: "Keep My Data", "Accept Updates", "Export Before Updating"
- Summary statistics (new bundled, to update, preserved, conflicts)

### Smart Merging Strategy

```typescript
interface MergeOptions {
  preserveUserData: boolean;     // Keep custom/modified items
  addNewDefaults: boolean;       // Add new bundled items
  updateModified: boolean;       // Overwrite user-modified defaults
  removeDeleted: boolean;        // Remove items no longer in defaults
}
```

### User Experience Flow

1. **App Startup** → Load data without auto-migration
2. **Version Detection** → Compare saved vs. current version
3. **Show Dialog** → If mismatch and not previously dismissed
4. **User Choice** → Select migration strategy
5. **Apply Migration** → Execute with chosen options
6. **Persist Choice** → Remember dismissed versions

## Implementation Steps

### Phase 0: Schema Version Management (NEW) 🎯

**File: `/Users/jasonbarnes/source/github/drum-notation/src/config/schemaVersions.ts`** (NEW)

Centralized schema version constants with agent instructions:

```typescript
/**
 * Schema Version Management
 *
 * IMPORTANT FOR AI AGENTS:
 * - Increment SONGS_SCHEMA_VERSION when making breaking changes to Song interface
 * - Increment INSTRUMENTS_SCHEMA_VERSION when making breaking changes to InstrumentConfig interface
 * - Breaking changes include: removing fields, changing field types, renaming fields
 * - Non-breaking changes: adding optional fields (use `field?: type`)
 * - When incrementing version, add a migration function in the corresponding registry
 *
 * Version format: MAJOR.MINOR.PATCH (semver)
 * - MAJOR: Breaking changes requiring migration
 * - MINOR: New optional fields (backward compatible)
 * - PATCH: Bug fixes, no schema changes
 */

export const SONGS_SCHEMA_VERSION = '2.1.0';
export const INSTRUMENTS_SCHEMA_VERSION = '1.0.0';

/**
 * Change History:
 *
 * SONGS:
 * - 2.1.0: Added displayOrder (optional) and links (optional) fields
 * - 2.0.0: Migrated from legacy format
 *
 * INSTRUMENTS:
 * - 1.0.0: Initial schema with dynamic instrument configuration
 */
```

### Phase 1: Critical Fix (Prevent Data Loss) ⚠️ URGENT

**File: `/Users/jasonbarnes/source/github/drum-notation/src/store/persistence.ts`**

1. Import schema version from centralized config
2. Remove auto-overwrite logic (lines 69-79)
3. Modify `mergeSongsWithDefaults()` to preserve user data by default
4. Return saved data without version-based replacement

**File: `/Users/jasonbarnes/source/github/drum-notation/src/store/instrumentPersistence.ts`**

5. Import schema version from centralized config
6. Already preserves user data correctly (good pattern to follow)

### Phase 2: Migration Infrastructure

**File: `/Users/jasonbarnes/source/github/drum-notation/src/migration/migrationRegistry.ts`** (NEW)

Define version-specific migrations for **both Songs and Instruments**:
```typescript
export const SONGS_MIGRATIONS: MigrationFunction<Song[]>[] = [
  {
    from: '2.0.0',
    to: '2.1.0',
    description: 'Added displayOrder and links support',
    breaking: false,
    migrate: (songs) => songs.map((song, index) => ({
      ...song,
      displayOrder: song.displayOrder ?? index,
      links: song.links ?? []
    }))
  }
  // Future migrations...
];

export const INSTRUMENTS_MIGRATIONS: MigrationFunction<InstrumentConfig[]>[] = [
  // Currently at 1.0.0, no migrations yet
  // Future migrations will go here when schema changes
];
```

**File: `/Users/jasonbarnes/source/github/drum-notation/src/migration/migrationEngine.ts`** (NEW)

Path finding and execution:
- `findMigrationPath()` - BFS to find shortest migration sequence
- `analyzeMigration()` - Check if migration needed, breaking changes, etc.
- `applyMigrationPath()` - Execute sequential migrations

**File: `/Users/jasonbarnes/source/github/drum-notation/src/migration/mergeStrategy.ts`** (NEW)

Smart merging with conflict detection for **both Songs and Instruments**:
```typescript
export function mergeSongsWithDefaults(
  userSongs: Song[],
  defaultSongs: Song[],
  options: MergeOptions
): MergeResult<Song> {
  // Returns: merged items, added, updated, preserved, conflicts
}

export function mergeInstrumentsWithDefaults(
  userInstruments: InstrumentConfig[],
  defaultInstruments: InstrumentConfig[],
  options: MergeOptions
): MergeResult<InstrumentConfig> {
  // Returns: merged items, added, updated, preserved, conflicts
  // Uses instrument 'key' field for matching instead of 'title'
}
```

**File: `/Users/jasonbarnes/source/github/drum-notation/src/migration/index.ts`** (NEW)

Public API exports

### Phase 3: State Management

**File: `/Users/jasonbarnes/source/github/drum-notation/src/store/migrationSlice.ts`** (NEW)

Redux state:
```typescript
interface MigrationState {
  songs: {
    pendingMigration: MigrationAnalysis<Song[]> | null;
    lastMigration: { fromVersion, toVersion, timestamp, userChoice } | null;
    dismissedVersions: string[];
  };
  instruments: { /* similar */ };
  dialogOpen: boolean;
}
```

**File: `/Users/jasonbarnes/source/github/drum-notation/src/store/migrationPersistence.ts`** (NEW)

localStorage handling:
- `saveMigrationState()` - Persist migration choices
- `loadMigrationState()` - Load on startup

**File: `/Users/jasonbarnes/source/github/drum-notation/src/store/migrationDetection.ts`** (NEW)

Startup detection:
```typescript
export function configureMigrationDetection(store: any) {
  // Check version mismatches
  // Skip if dismissed
  // Dispatch pending migration if needed
}
```

### Phase 4: UI Components

**File: `/Users/jasonbarnes/source/github/drum-notation/src/components/MigrationDialog.tsx`** (NEW)

Dialog component with:
- Migration analysis display
- Preview summary (similar to `SongManagement.tsx` summary cards)
- Merge options checkboxes
- Changes preview (new songs, modified songs, conflicts)
- Actions: Dismiss, Export, Keep My Data, Accept Updates

Structure:
```tsx
<MigrationDialog>
  <Header>Migration Required: v{from} → v{to}</Header>
  <Tabs>Songs | Instruments</Tabs>
  <Content>
    <MigrationAnalysis />
    <PreviewSummary /> {/* 4 cards: New, To Update, Preserved, Conflicts */}
    <MergeOptions /> {/* Checkboxes */}
    <ChangesPreview /> {/* Detailed list */}
  </Content>
  <Actions>
    <Dismiss />
    <Export />
    <KeepMyData />
    <AcceptUpdates />
  </Actions>
</MigrationDialog>
```

**File: `/Users/jasonbarnes/source/github/drum-notation/src/components/ConflictCard.tsx`** (NEW, optional)

Display user vs. default comparison for conflicting items

### Phase 5: Integration

**File: `/Users/jasonbarnes/source/github/drum-notation/src/store/index.ts`**

1. Add migration reducer
2. Load data without auto-migration
3. Load migration state
4. Call migration detection
5. Subscribe to save migration state

**File: `/Users/jasonbarnes/source/github/drum-notation/src/App.tsx`**

Render `<MigrationDialog />` at root level

**File: `/Users/jasonbarnes/source/github/drum-notation/src/components/HelpDialog.tsx`**

Add "Migration" section in Settings tab:
- Show migration history
- Manual trigger button
- Current versions display

## Error Handling

### No Migration Path
- Show error dialog
- Offer: Export data, Reset to defaults
- Don't block app

### Migration Fails
- Catch errors, keep original data
- Show error message
- Allow retry or export

### User Has Future Version
- Warn about potential data loss
- Allow "Try anyway" or "Reset"

## Testing Strategy

### Unit Tests
- Each migration function
- Path finding (single hop, multi-hop)
- Merge strategy (all option combinations)
- Conflict detection

### Integration Tests
- Full migration flow old → new
- Dialog interaction and state updates
- Export before update
- Dismiss and re-trigger

### Manual Testing
1. Fresh install → Load defaults
2. Same version → No dialog
3. Old version → Show dialog
4. Dismissed version → No dialog on reload
5. Custom songs only → No conflicts
6. Modified defaults → Show conflicts

## Critical Files Summary

### To Modify
1. `/Users/jasonbarnes/source/github/drum-notation/src/store/persistence.ts` - Fix data loss bug
2. `/Users/jasonbarnes/source/github/drum-notation/src/store/instrumentPersistence.ts` - Wrapper function
3. `/Users/jasonbarnes/source/github/drum-notation/src/store/index.ts` - Integration
4. `/Users/jasonbarnes/source/github/drum-notation/src/App.tsx` - Render dialog
5. `/Users/jasonbarnes/source/github/drum-notation/src/components/HelpDialog.tsx` - Settings section

### To Create
1. `/Users/jasonbarnes/source/github/drum-notation/src/config/schemaVersions.ts` - **NEW: Centralized schema versions**
2. `/Users/jasonbarnes/source/github/drum-notation/src/migration/migrationRegistry.ts` - Both songs and instruments
3. `/Users/jasonbarnes/source/github/drum-notation/src/migration/migrationEngine.ts`
4. `/Users/jasonbarnes/source/github/drum-notation/src/migration/mergeStrategy.ts` - Both songs and instruments
5. `/Users/jasonbarnes/source/github/drum-notation/src/migration/index.ts`
6. `/Users/jasonbarnes/source/github/drum-notation/src/store/migrationSlice.ts`
7. `/Users/jasonbarnes/source/github/drum-notation/src/store/migrationPersistence.ts`
8. `/Users/jasonbarnes/source/github/drum-notation/src/store/migrationDetection.ts`
9. `/Users/jasonbarnes/source/github/drum-notation/src/components/MigrationDialog.tsx`

## Design Decisions

### Why Centralized Schema Versions? (NEW)
- **Single source of truth**: All version numbers in one easily-editable file
- **Agent-friendly**: Clear instructions for AI agents on when to increment
- **Separate from app version**: Schema versions track data structure, not app features
- **Backward compatibility**: User can choose to keep old data format if desired
- **Documentation**: Change history provides context for future developers

### Why Dual Versioning (Songs + Instruments)? (NEW)
- **Independent evolution**: Songs and instruments can change at different rates
- **Clearer migrations**: Each has its own migration registry and merge logic
- **Better UX**: Migration dialog can show both separately with different actions
- **Testing**: Easier to test migrations for each data type independently

### Why Separate Migration from Loading?
- Allows inspection before modification
- User can choose strategy
- Prevents accidental data loss

### Why Migration Registry?
- Easy to add new version migrations
- Self-documenting version history
- Supports sequential migrations

### Why Similar to SongManagement UI?
- Familiar pattern for users
- Reuses comparison logic
- Consistent visual design

### Why Persist Dismissed Versions?
- Don't annoy users repeatedly
- Still allow manual trigger from Settings
- User controls their experience

### Why Build This Before Release? (NEW)
- **Testing infrastructure**: Allows testing migrations locally before they're needed
- **Future-proof**: System is ready when breaking changes are needed
- **User confidence**: Shows commitment to data preservation from day one
- **Simpler iteration**: Can refactor schemas freely during development

## Backward Compatibility

1. **Keep Legacy Migration** - Don't remove existing `migration.ts` for old song format
2. **Sequential Check** - Check legacy format FIRST, then version migration
3. **Graceful Fallback** - If all fails, use defaults and notify user

## Performance Considerations

- Lazy load defaults (only for comparison when needed)
- Debounce preview (when options change)
- Incremental comparison (for large datasets)
- Cache merge preview results
