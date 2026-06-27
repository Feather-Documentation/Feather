# Inline Page Editor Customization Guide

This guide teaches you how to implement advanced text formatting features, block alignments, Callout admonition banners, and keyboard shortcuts directly inside the inline physical page editor.

---

> [!WARNING]
> **Avoid Deprecated API usage**: 
> While legacy tutorials recommend `document.execCommand('insertHTML')` for inserting custom blocks, this API is deprecated. This guide shows you how to use the modern browser **Selection and Range API** to safely insert custom elements (like tables and callout banners) directly at the user's cursor selection.

---

## 1. The Modern Cursor Insertion Helper

Add this modern selection range insertion helper to the `DocReader` component inside [DocReader.tsx](file:///c:/Users/beuch/Documents/FeatherDocumentation/feather/src/components/DocReader.tsx):

```typescript
const insertHtmlAtCursor = (html: string) => {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();

  const div = document.createElement('div');
  div.innerHTML = html;
  
  const fragment = document.createDocumentFragment();
  let child = div.firstChild;
  while (child) {
    const next = child.nextSibling;
    fragment.appendChild(child);
    child = next;
  }
  range.insertNode(fragment);
  saveContent();
};
```

---

## 2. Text Block Alignment Controls

Align paragraphs and headings left, center, right, or justified using justification commands.

### Add Buttons to the Toolbar
Find the `editMode && !isApiSpec` check inside [DocReader.tsx](file:///c:/Users/beuch/Documents/FeatherDocumentation/feather/src/components/DocReader.tsx) (around line 580) and insert the following buttons directly next to the formatting commands:

```tsx
<button type="button" onClick={() => runCommand('justifyLeft')} className="btn" style={{ padding: '6px 10px' }} title="Align Left">
  <i className="fa-solid fa-align-left"></i>
</button>
<button type="button" onClick={() => runCommand('justifyCenter')} className="btn" style={{ padding: '6px 10px' }} title="Align Center">
  <i className="fa-solid fa-align-center"></i>
</button>
<button type="button" onClick={() => runCommand('justifyRight')} className="btn" style={{ padding: '6px 10px' }} title="Align Right">
  <i className="fa-solid fa-align-right"></i>
</button>
<button type="button" onClick={() => runCommand('justifyFull')} className="btn" style={{ padding: '6px 10px' }} title="Justify">
  <i className="fa-solid fa-align-justify"></i>
</button>
```

---

## 3. Table Grid Creator

Build editable HTML grids with custom dimensions at the text cursor.

### Step A: Add the Table Helper
Insert the table generation function inside the `DocReader` component (utilizing our modern selection API helper):

```typescript
const insertTable = () => {
  const rowsPrompt = window.prompt("Enter number of rows (default 2):", "2");
  const colsPrompt = window.prompt("Enter number of columns (default 2):", "2");
  const rows = parseInt(rowsPrompt || '2', 10);
  const cols = parseInt(colsPrompt || '2', 10);
  if (isNaN(rows) || isNaN(cols)) return;

  let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><thead><tr>';
  for (let j = 0; j < cols; j++) {
    tableHtml += '<th style="border: var(--border-width) solid var(--border-color); padding: 8px; font-weight: bold; background-color: rgba(0,0,0,0.02);">Header</th>';
  }
  tableHtml += '</tr></thead><tbody>';
  for (let i = 0; i < rows; i++) {
    tableHtml += '<tr>';
    for (let j = 0; j < cols; j++) {
      tableHtml += '<td style="border: var(--border-width) solid var(--border-color); padding: 8px;">Cell</td>';
    }
    tableHtml += '</tr>';
  }
  tableHtml += '</tbody></table>';

  insertHtmlAtCursor(tableHtml);
};
```

### Step B: Add Table Button to the Toolbar
Add the table icon trigger inside the formatting toolbar:

```tsx
<button type="button" onClick={insertTable} className="btn" style={{ padding: '6px 10px' }} title="Insert Table">
  <i className="fa-solid fa-table"></i>
</button>
```

---

> [!TIP]
> Custom tables automatically inherit the styling variables defined in the active theme (`var(--border-width)` and `var(--border-color)`), maintaining a consistent design look across presets.

---

## 4. Keyboard Shortcuts

Map standard text editing keys to trigger formatting commands inside the editor canvas.

### Step A: Add the Key Press Listener
Add this key press listener function inside the `DocReader` component:

```typescript
const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (!editMode) return;
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'b') {
      e.preventDefault();
      runCommand('bold');
    } else if (e.key === 'i') {
      e.preventDefault();
      runCommand('italic');
    } else if (e.key === 'u') {
      e.preventDefault();
      runCommand('underline');
    }
  }
};
```

### Step B: Bind Key Listener to contentEditable element
Locate the editable element `ref={containerRef}` (around line 670) and add the `onKeyDown` attribute:

```tsx
<div 
  ref={containerRef}
  contentEditable={!!editMode}
  onInput={saveContent}
  onBlur={saveContent}
  onKeyDown={handleEditorKeyDown}
  className="markdown-body"
  onClick={handleContentClick}
  dangerouslySetInnerHTML={editMode ? undefined : { __html: contentHtml }}
  style={{ outline: 'none' }}
/>
```

---

## 5. Admonition Callout Blocks

Create colored information, warning, success, or warning banners.

### Step A: Add the Callout Helper
Add this callout generation function inside the `DocReader` component:

```typescript
const insertAdmonition = (type: 'info' | 'warning' | 'success' | 'danger') => {
  const borderColors = {
    info: 'var(--primary-color)',
    warning: 'var(--warning-color)',
    success: 'var(--success-color)',
    danger: 'var(--error-color)'
  };
  const labels = {
    info: 'Info',
    warning: 'Warning',
    success: 'Success',
    danger: 'Danger'
  };
  const html = `
    <div class="admonition admonition-${type}" style="border-left: 4px solid ${borderColors[type]}; padding: 12px; margin: 16px 0; background-color: var(--sidebar-color); border-radius: var(--border-radius);">
      <strong>${labels[type]}:</strong> Edit note block text here...
    </div>
  `;
  insertHtmlAtCursor(html);
};
```

### Step B: Add Dropdown Selector to the Toolbar
Add the dropdown markup inside the formatting toolbar:

```tsx
<select 
  onChange={(e) => {
    if (e.target.value) {
      insertAdmonition(e.target.value as 'info' | 'warning' | 'success' | 'danger');
      e.target.value = '';
    }
  }}
  className="editor-select"
  style={{ padding: '4px 8px', fontSize: '12px', width: '90px', height: '34px', cursor: 'pointer' }}
>
  <option value="">Callout...</option>
  <option value="info">Info</option>
  <option value="warning">Warning</option>
  <option value="success">Success</option>
  <option value="danger">Danger</option>
</select>
```

---

> [!IMPORTANT]
> Always call `saveContent()` at the end of custom DOM insertion commands. This serializes the workspace canvas and pushes updates to the local state, allowing auto-recovery to save backups correctly.

---
