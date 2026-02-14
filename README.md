# GlideAware Studio™

A client-side web application for ServiceNow development. Features code formatting, task management, note-taking, and visual planning - all running offline in your browser. Your data never leaves your machine.

## App Modes

GlideAware Studio™ provides two primary modes accessible via the top-level toggle:

| Mode | Description |
|------|-------------|
| **Plan** | Task management, note-taking, and sketching for project planning |
| **Develop** | Code formatting, comparison, and visualization for JavaScript/JSON |

---

## 📋 Plan Mode

Plan mode provides offline-first project management tools with automatic data persistence via IndexedDB.

### Tasks (Kanban Board)

A full-featured Kanban board for managing development tasks:

| Feature | Description |
|---------|-------------|
| **Drag & Drop** | Move tasks between columns by dragging |
| **Columns** | To Do, In Progress, On Hold, In Review, Completed |
| **Backlog** | Collapsible sidebar for backlog items |
| **Priorities** | Low, Medium, High, Critical with color coding |
| **External Links** | Link tasks to Jira, ServiceNow, Monday, ClickUp, Asana, Trello, Motion, or custom URLs |
| **Tags** | Organize tasks with custom tags |
| **Auto-save** | Every change persists instantly to IndexedDB |

### Notes (Docs)

WYSIWYG rich text note-taking with formatting:

| Feature | Description |
|---------|-------------|
| **Rich Text Editor** | Bold, italic, headings, lists, checklists, code blocks, links, quotes |
| **WYSIWYG Editing** | See formatted text as you type |
| **Syntax Highlighting** | Code blocks with language highlighting |
| **Search** | Filter notes by title or content |
| **Auto-save** | Debounced saving with visual indicator |
| **Sidebar Navigation** | Quick access to all notes with previews |

### Notes (Sketch)

Canvas-based drawing tool for diagrams and visual notes:

| Feature | Description |
|---------|-------------|
| **Drawing Tools** | Text (click to add labels), Pen, Line, Rectangle, Ellipse, Arrow, Eraser |
| **Color Palette** | 9 preset colors |
| **Stroke Widths** | 4 size options |
| **Multiple Sketches** | Create and manage multiple drawings |
| **Grid Background** | Visual alignment guide |

### Data Persistence

All Plan mode data is stored in IndexedDB and persists across:
- Tab close
- Browser close
- Computer restart
- Power off

### Export / Import

| Action | Description |
|--------|-------------|
| **Export** | Download all Plan data as JSON (`glideaware-plan-YYYY-MM-DD-HHMMSS.json`) |
| **Import** | Load Plan data from a previously exported JSON file |

Use export/import to transfer your planning data between computers or create backups.

---

## 💻 Develop Mode

Develop mode provides tools for ServiceNow JavaScript and JSON development.

### 🔀 Dual Mode Support
Switch between **JavaScript** (ServiceNow) and **JSON** modes with one click. Each mode provides:
- **Polish** (JavaScript) / **Format** (JSON): Format, fix, and validate code/JSON
- **Compare**: Side-by-side comparison with visual diff highlighting
- **Visualize** (JavaScript only): Interactive flow diagram visualization

### ✨ Code Formatting
Formats code using Prettier with ServiceNow-friendly settings (JavaScript) or clean JSON formatting.

### 🔧 Generic JavaScript Auto-Fixes
| Fix | Description |
|-----|-------------|
| **Line endings** | Normalizes Windows `\r\n` to Unix `\n` |
| **Trailing whitespace** | Removes spaces/tabs at end of lines |
| **Multiple semicolons** | Fixes `;;` or `;;;` → `;` |
| **Empty statements** | Removes standalone `;` on their own line |
| **Keyword spacing** | `if(`, `for(`, `while(`, `switch(`, `catch(` → adds space |
| **Excessive blank lines** | Reduces 4+ consecutive blank lines to 2 |
| **Boolean simplification** | `== true` → removes comparison |

### 🔧 ServiceNow Auto-Fixes

#### Intelligent Typo Detection (Fuzzy Matching)
GlideAware Studio™ uses a **two-pass approach** for typo detection:

1. **Fast regex patterns** for common known typos (instant)
2. **Fuzzy matching** using Damerau-Levenshtein edit distance for any remaining typos

**Features:**
- **Context-aware corrections**: Detects variable types (`var gr = new GlideRecord(...)`) and only suggests methods valid for that class
- **Confidence tiers**: High confidence (auto-fix), Medium confidence (auto-fix with note), Low confidence (warning only)
- **Guardrails**: Only corrects in method-call context (`.method(`), requires winner to beat runner-up by margin

**Example**: `gr.addQuerry()` → `gr.addQuery()` (detected because `gr` is known to be a `GlideRecord`)

#### Common Typo Corrections (Sample)
| Category | Examples |
|----------|----------|
| **GlideRecord** | `addQeury` → `addQuery`, `getValeu` → `getValue`, `udpate` → `update`, `getRefrence` → `getReference` |
| **GlideElement** | `chnages` → `changes`, `getJournlaEntry` → `getJournalEntry`, `toStirng` → `toString` |
| **GlideDateTime** | `addSecnods` → `addSeconds`, `comparTo` → `compareTo`, `getDayOfWek` → `getDayOfWeek` |
| **GlideUser** | `hasRoel` → `hasRole`, `isMemberOF` → `isMemberOf`, `getEmial` → `getEmail` |
| **Class names** | `GlideReocrd` → `GlideRecord`, `GlideDateTiem` → `GlideDateTime`, `ArrayUitl` → `ArrayUtil` |
| **g_form** | `setMandaotry` → `setMandatory`, `setVisble` → `setVisible`, `addOptin` → `addOption` |
| **GlideAjax** | `addParm` → `addParam`, `getXMLWiat` → `getXMLWait`, `getParamater` → `getParameter` |
| **gs** | `gs.getPrefernce` → `gs.getPreference`, `gs.addInfoMessge` → `gs.addInfoMessage` |
| **REST/SOAP** | `setRequestBdoy` → `setRequestBody`, `setHttpMehtod` → `setHttpMethod`, `excute` → `execute` |

*The dictionary includes 60+ classes and 400+ methods across GlideRecord, GlideAggregate, GlideElement, GlideDateTime, GlideSchedule, GlideDuration, GlideUser, GlideSession, GlideAjax, g_form, g_user, gs, RESTMessageV2, SOAPMessageV2, ArrayUtil, GlideSysAttachment, XMLDocument2, GlideEmailOutbound, Workflow, and more.*

#### Intelligent Fixes
| Fix | Description |
|-----|-------------|
| **gs.now()** | Replaces with `new GlideDateTime().getDisplayValue()` |
| **gs.nowDateTime()** | Replaces with `new GlideDateTime().getValue()` |
| **getValue('sys_id')** | Optimizes to `getUniqueValue()` |
| **gs.print()** | Replaces with `gs.info()` |
| **String concat in addQuery** | `addQuery('field=' + val)` → `addQuery('field', val)` |
| **Simple addEncodedQuery** | Simplifies single-condition encoded queries to `addQuery()` |
| **String literal equality** | Converts `'string' == 'string'` to `===` (safe patterns only) |

### ⚠️ Generic JavaScript Warnings
| Warning | Description |
|---------|-------------|
| **TODO/FIXME comments** | Counts TODO, FIXME, XXX, HACK, BUG comments |
| **Long lines** | Lines exceeding 150 characters |
| **Empty catch blocks** | `catch(e) {}` - errors silently ignored |
| **Empty code blocks** | Empty `if`, `for`, `while` bodies |
| **Deeply nested code** | 6+ levels of nesting |
| **Unreachable code** | Code after return statement |
| **Long functions** | Functions averaging 50+ lines |
| **Too many parameters** | Functions with 5+ parameters |
| **Assignment in conditional** | `if (x = y)` - possible mistake |
| **Nested ternary** | `a ? b ? c : d : e` |
| **Hardcoded credentials** | Detects password, apiKey, secret, token patterns |

### ⚠️ ServiceNow Warnings

#### Database & Performance
| Warning | Description |
|---------|-------------|
| **update() in while loop** | Each update is a separate DB call - consider batch operations |
| **getRowCount() without setLimit()** | Performance issue on large tables |
| **deleteRecord() in loop** | Suggest using `deleteMultiple()` for performance |
| **getReference() in loop** | N+1 query problem - suggest join or caching |
| **Missing setLimit(1)** | For existence checks, add `setLimit(1)` |
| **query() without conditions** | Full table scan warning |
| **updateMultiple/deleteMultiple without conditions** | Will affect ALL records |
| **get() followed by query()** | `get()` already positions record, `query()` is redundant |
| **next() with updateMultiple()** | `updateMultiple()` ignores per-row changes from iteration |

#### Business Rules
| Warning | Description |
|---------|-------------|
| **setWorkflow(false) not re-enabled** | Workflows will be permanently skipped |
| **setAbortAction without return** | Business Rule may not stop properly |
| **Direct field assignment** | `current.field = value` - suggest `setValue()` |
| **current.update() in BR** | Risks recursion - use Before BR or setWorkflow(false) |
| **current.insert() in BR** | Unusual pattern - verify intentional |

#### Security
| Warning | Description |
|---------|-------------|
| **Hardcoded sys_id** | Use system properties for portability |
| **eval() or GlideEvaluator** | Security risk - avoid dynamic code execution |
| **new Function()** | Security risk similar to eval() |
| **GlideRecordSecure + privileged ops** | setWorkflow(false)/updateMultiple undermines security intent |

#### Best Practices
| Warning | Description |
|---------|-------------|
| **GlideAggregate without aggregate** | No aggregate function called |
| **getXMLWait() usage** | Blocks UI thread - suggest async pattern |
| **gs.sleep() usage** | Blocks thread - avoid in production |
| **gs.getProperty() without default** | Consider adding fallback value |
| **gs.include() legacy** | Use Script Includes with Class.create() pattern |
| **addEncodedQuery with sys_id** | Prefer `addQuery('sys_id', value)` for clarity |
| **g_form.getReference() no callback** | Synchronous call - use callback for async |
| **GlideAjax without sysparm_name** | Processor method will not be invoked |
| **DOM manipulation with g_form** | Prefer g_form APIs - DOM may break on upgrades |

---

## 📦 JSON Mode

### 🔧 JSON Auto-Fixes
| Fix | Description |
|-----|-------------|
| **Remove comments** | Strips single-line (`//`) and multi-line (`/* */`) comments |
| **Remove trailing commas** | Fixes `[1, 2, 3,]` → `[1, 2, 3]` |
| **Single to double quotes** | Converts `'value'` → `"value"` |
| **Quote unquoted keys** | Fixes `{key: value}` → `{"key": value}` |
| **Multiple commas** | Fixes `,,` → `,` |
| **Normalize line endings** | Windows `\r\n` → Unix `\n` |
| **Trailing whitespace** | Removes spaces/tabs at end of lines |
| **Missing braces/brackets** | Adds missing `}` or `]` to complete structure |

### 🚫 JSON Errors
| Error | Description |
|-------|-------------|
| **Syntax errors** | Detailed location (line, column) of JSON parsing failures |
| **Trailing commas** | Not valid in JSON spec |
| **Single quotes** | JSON requires double quotes |
| **Comments** | Not allowed in standard JSON |

### ⚠️ JSON Warnings
| Warning | Description |
|---------|-------------|
| **Duplicate keys** | Later value will override earlier |
| **Deep nesting** | 10+ levels of nesting |
| **Long strings** | Strings over 1000 characters |
| **Many empty containers** | 5+ empty arrays/objects |
| **Excessive nulls** | 10+ null values |
| **Numeric keys** | Suggests using array instead |
| **Large file** | Files over 1000 lines |
| **Control characters** | Unescaped special characters |

### ⚖️ JSON Compare
Compare two JSON objects and visualize their differences:
- **Side-by-side editors** for left and right JSON
- **Visual diff output** with color-coded changes
- **Change statistics** showing additions, deletions, and modifications
- **Swap button** to quickly reverse comparison direction
- **Sample data** to demonstrate the feature

---

## ⚖️ JavaScript Compare Mode

Compare and polish JavaScript code side-by-side:
- **Monaco DiffEditor** with real-time visual comparison
- **Color-coded highlighting** for additions, deletions, and modifications
- **Polish both codes** (Code A and Code B) simultaneously with per-panel fix summaries
- **Toggle highlighting** on/off to focus on code or differences
- **Download both files** (Code A and Code B) with timestamps
- **Swap button** to reverse comparison direction

---

## 🔍 JavaScript Visualize Mode

Generate interactive flow diagrams from your ServiceNow code:

### Flow Diagram Features
- **Interactive canvas** with zoom, pan, and minimap navigation
- **Click-to-code**: Click any node to see its code location and details
- **Automatic layout**: Sequential statements flow vertically, branches flow horizontally
- **Real-time generation**: Instantly visualize code structure

### View Modes
Toggle between two visualization modes using the ⚙️ settings button:

| Mode | Description | Shows |
|------|-------------|-------|
| **Full Ops View** (default) | Everything that executes | All nodes with detailed labels |
| **Logic View** | Control flow focus | Only control flow, database ops, high-impact behavior |

### Node Types
| Node | Description |
|------|-------------|
| **Function** | Function declarations and expressions |
| **Condition** | If/else statements (diamond shape) |
| **Loop** | For, while, do-while, for-in, for-of loops |
| **Switch** | Switch statements |
| **Case** | Switch case clauses |
| **Try** | Try blocks |
| **Catch** | Catch blocks |
| **Finally** | Finally blocks |
| **Return** | Return statements |
| **Throw** | Throw statements |
| **Break/Continue** | Loop control statements |
| **ServiceNow** | GlideRecord, gs.*, g_form.*, etc. |
| **Variable** | Variable declarations (Full Ops only) |
| **Call** | Generic function calls (Full Ops only) |
| **Assignment** | Variable assignments (Full Ops only) |

### Edge Types
| Style | Description |
|-------|-------------|
| **Solid gray** | Normal control flow |
| **Solid green** | True branch (condition met) |
| **Solid red** | False branch (else path) |
| **Animated cyan** | Loop body flow |
| **Dashed red** | Exception path (catch block) |

### ServiceNow-Aware Parsing
The visualizer recognizes ServiceNow-specific patterns:
- **GlideRecord operations**: `new GlideRecord()`, `query()`, `next()`, `update()`, etc.
- **GlideSystem calls**: `gs.info()`, `gs.getUser()`, `gs.getProperty()`, etc.
- **Client-side APIs**: `g_form`, `g_list`, `g_user`, `spUtil`, `$sp`
- **IIFE patterns**: Correctly parses `(function executeRule() {...})()` wrappers
- **Business Rule context**: Handles `current`, `previous` parameters

### Info Panel
Click any node to see:
- Node type (e.g., CONDITION, LOOP, SERVICENOW-CALL)
- Generic label (e.g., `if()`, `while()`, `gr.query()`)
- Detailed code snippet with arguments

---

### ⌨️ Keyboard Shortcut
- `Ctrl+Enter` / `Cmd+Enter` - Context-aware action:
  - **Polish mode (JS)**: Polish the code
  - **Format mode (JSON)**: Format the JSON
  - **Compare mode (JSON)**: Compare the two JSON objects
  - **Compare mode (JS)**: Polish both codes
  - **Visualize mode (JS)**: Generate flow diagram

### 💾 Export
- **Polish/Format mode**: Downloads both original and polished/formatted files with timestamps
- **Compare mode**: Downloads both Code A and Code B files with timestamps
- Filenames: `original_YYYYMMDD_HHMMSS.js` and `polished_YYYYMMDD_HHMMSS.js` (or `code_a_YYYYMMDD_HHMMSS.js` and `code_b_YYYYMMDD_HHMMSS.js` for Compare)

### 🔒 Privacy
- Works offline after initial load
- No server required - code stays in browser
- No data collection or tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- npm

### Installation

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

### Deploy

After building, the `dist/` folder contains static files that can be deployed to any hosting service.

## 📖 Usage

### Plan Mode - Tasks
1. Click **Plan** in the top-level toggle
2. Select **Tasks** to open the Kanban board
3. Create tasks by clicking the **+** button on any column
4. Drag tasks between columns to update status
5. Click a task to edit details, add links, tags, and description
6. Use the collapsible **Backlog** sidebar for items not yet in progress
7. Click **Export** to save all Plan data as JSON

### Plan Mode - Notes (Docs)
1. Click **Plan** → **Notes** → **Docs**
2. Create a new note using the **+** button
3. Use the WYSIWYG toolbar for formatting (bold, italic, code, checklists, etc.)
4. See formatted text immediately as you type
5. Notes save automatically as you type
6. Search notes using the sidebar search box

### Plan Mode - Notes (Sketch)
1. Click **Plan** → **Notes** → **Sketch**
2. Create a new sketch using the **+** button
3. Select a drawing tool from the toolbar (Text, Pen, Line, Rectangle, Ellipse, Arrow, Eraser)
4. For Text tool: click on canvas to place text labels
5. Choose color and stroke width for drawing tools
6. Draw on the canvas - changes save automatically
7. Use **Clear** to reset the canvas

### Develop Mode - Polish (JavaScript) / Format (JSON)
1. Click **Develop** in the top-level toggle
2. Select mode: **JavaScript** or **JSON** using the toggle
3. Paste your code/JSON in the input panel (left)
4. Click **Polish Code** (JavaScript) or **Format JSON** (JSON), or press `Ctrl+Enter`
5. View formatted output in the output panel (right) with highlighted changes
6. Click the fixes/warnings badge to see details
7. Click **Copy** or **Download** to export the output

### Develop Mode - Compare (JavaScript)
1. Select **JavaScript** mode and click **Compare**
2. Enter Code A on the left and Code B on the right
3. See real-time visual diff highlighting
4. Click **Polish Codes** to format both panels simultaneously
5. View per-panel fix summaries and change tracking
6. Toggle highlighting on/off as needed
7. Click **Download** to save both files

### Develop Mode - Compare (JSON)
1. Select **JSON** mode and click **Compare**
2. Enter JSON on the left and modified JSON on the right
3. Click **Compare JSON** to see the visual difference breakdown
4. Use the swap button to reverse comparison direction

### Develop Mode - Visualize (JavaScript)
1. Select **JavaScript** mode and click **Visualize**
2. Paste your ServiceNow code in the editor (or click **Load Sample**)
3. Click **Generate Flow** or press `Ctrl+Enter`
4. Explore the diagram:
   - **Zoom**: Use mouse wheel or +/- controls
   - **Pan**: Click and drag the canvas
   - **Minimap**: Navigate large diagrams quickly
   - **Click nodes**: View code details in the info panel
5. Toggle **View Mode** using the ⚙️ settings button:
   - **Full Ops View**: See all operations with detailed labels
   - **Logic View**: Focus on control flow with simplified labels
6. Use the **Legend** (top-right) to understand node colors and edge types

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| Vite | 7.x | Build tool |
| Monaco Editor | 4.x | Code editor (VS Code engine) |
| TipTap | 3.x | WYSIWYG rich text editor (Notes) |
| Lowlight | 3.x | Syntax highlighting for code blocks |
| Prettier | 3.x | Code formatting |
| React Flow | 11.x | Interactive flow diagrams |
| Acorn | 8.x | JavaScript AST parsing |
| jsondiffpatch | 0.7.x | JSON comparison and diff |
| IndexedDB | Native | Offline data persistence (Plan mode) |

## Project Structure

```
src/
├── App.jsx                    # Main React component
├── index.css                  # Application styles
├── main.jsx                   # React entry point
├── components/
│   ├── FlowNode.jsx           # Custom React Flow node component
│   ├── Icon.jsx               # SVG icon library component
│   └── Plan/
│       ├── TaskBoard.jsx      # Kanban board for task management
│       ├── NoteEditor.jsx     # Rich text note editor (Docs)
│       └── DrawingCanvas.jsx  # Canvas-based drawing tool (Sketch)
└── utils/
    ├── codePolish.js          # Main orchestrator (JS + JSON)
    ├── astParser.js           # JavaScript AST parsing & control flow extraction
    ├── flowGenerator.js       # React Flow diagram generation
    ├── storage/
    │   └── planStorage.js     # IndexedDB persistence for Plan mode
    ├── fixes/
    │   ├── genericFixes.js         # Generic JavaScript fixes
    │   ├── servicenowFixes.js      # ServiceNow-specific fixes
    │   ├── servicenowDictionary.js # ServiceNow API dictionary (classes, methods)
    │   ├── fuzzyMatcher.js         # Damerau-Levenshtein fuzzy matching
    │   └── jsonFixes.js            # JSON-specific fixes
    └── warnings/
        ├── genericWarnings.js      # Generic JavaScript warnings
        ├── servicenowWarnings.js   # ServiceNow warnings & errors
        └── jsonWarnings.js         # JSON warnings & errors
```

## Supported Script Types

### JavaScript Mode
- Business Rules (before, after, async)
- Client Scripts (onLoad, onChange, onSubmit)
- Script Includes
- UI Actions
- Scheduled Jobs
- Scripted REST APIs
- UI Policies
- Portal widgets
- Any JavaScript code

### JSON Mode
- Configuration files
- API payloads
- Import/export data
- Any JSON content

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.

Copyright (c) 2026 Ioannis E. Kosmadakis

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
