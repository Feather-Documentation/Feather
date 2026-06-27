import React, { useEffect, useRef, useState } from 'react';
import type { DocSection, ProjectConfig } from '../types';
import { renderMarkdown, validateImageFile } from '../utils/security';


interface DocReaderProps {
  activeSection: DocSection;
  showToast: (message: string) => void;
  onInternalLinkClick: (targetId: string) => void;
  prevSection?: DocSection | null;
  nextSection?: DocSection | null;
  onNavigate?: (id: string) => void;
  t: Record<string, string>;
  config: ProjectConfig;
  editMode?: boolean;
  onContentChange?: (content: string) => void;
}

interface InfoObject {
  title?: string;
  version?: string;
  description?: string;
}

interface ParameterObject {
  name: string;
  in: string;
  required?: boolean;
}

interface ResponseState {
  [key: string]: { status: number; body: string };
}

interface ParamsState {
  [key: string]: string;
}

const ApiReference: React.FC<{ specContent: string }> = ({ specContent }) => {
  const [response, setResponse] = useState<ResponseState>({});
  const [params, setParams] = useState<ParamsState>({});

  const spec = (() => {
    try {
      return JSON.parse(specContent) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();

  if (!spec) {
    return (
      <div className="api-spec-error" style={{ color: 'red', padding: '16px', border: '1px solid red' }}>
        <strong>Invalid OpenAPI Specification:</strong> Failed to parse specification as JSON.
      </div>
    );
  }

  const handleTestRequest = async (pathKey: string, method: string, pathItem: Record<string, unknown>) => {
    const key = `${method}-${pathKey}`;
    try {
      let targetUrl = pathKey;
      const parameters = (pathItem.parameters || []) as ParameterObject[];
      const pathParams = parameters.filter((p) => p.in === 'path');
      pathParams.forEach((p) => {
        const val = params[`${key}-${p.name}`] || `{${p.name}}`;
        targetUrl = targetUrl.replace(`{${p.name}}`, val);
      });

      const queryParams = parameters.filter((p) => p.in === 'query');
      const queryParts = queryParams
        .map((p) => {
          const val = params[`${key}-${p.name}`];
          return val ? `${encodeURIComponent(p.name)}=${encodeURIComponent(val)}` : '';
        })
        .filter((part) => part !== '');
      
      if (queryParts.length > 0) {
        targetUrl = `${targetUrl}?${queryParts.join('&')}`;
      }

      setResponse(prev => ({
        ...prev,
        [key]: { status: 0, body: 'Sending request...' }
      }));

      const res = await fetch(targetUrl, {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json' }
      });
      const body = await res.text();
      setResponse(prev => ({
        ...prev,
        [key]: { status: res.status, body }
      }));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setResponse(prev => ({
        ...prev,
        [key]: { status: 500, body: `Request failed: ${errMsg}` }
      }));
    }
  };

  const info = (spec.info || {}) as InfoObject;
  const paths = (spec.paths || {}) as Record<string, Record<string, unknown>>;

  return (
    <div className="api-spec-container">
      <div className="api-spec-header" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <h2>{info.title || 'API Reference'} <span style={{ fontSize: '14px', opacity: 0.6 }}>v{info.version || '1.0'}</span></h2>
        {info.description && <p style={{ fontSize: '15px', opacity: 0.8, marginTop: '8px' }}>{info.description}</p>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.entries(paths).map(([pathKey, pathObj]) => (
          Object.entries(pathObj).map(([method, detailsVal]) => {
            if (!['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) return null;
            const details = detailsVal as Record<string, unknown>;
            const key = `${method}-${pathKey}`;
            const methodColor = 
              method === 'get' ? '#00c853' : 
              (method === 'post' ? '#2979ff' : 
              (method === 'put' ? '#ffab00' : '#d50000'));

            const parameters = (details.parameters || []) as ParameterObject[];

            return (
              <div 
                key={key} 
                className="api-endpoint-card"
                style={{
                  border: 'var(--border-width) solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  boxShadow: 'var(--shadow)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--sidebar-color)'
                }}
              >
                <div 
                  className="api-endpoint-header" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: 'var(--border-width) solid var(--border-color)',
                    backgroundColor: 'rgba(0,0,0,0.02)'
                  }}
                >
                  <span 
                    style={{
                      backgroundColor: methodColor,
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {method}
                  </span>
                  <code style={{ fontSize: '15px', fontWeight: 'bold' }}>{pathKey}</code>
                  {details.summary ? <span style={{ opacity: 0.6, fontSize: '14px' }}>— {String(details.summary)}</span> : null}
                </div>

                <div className="api-endpoint-body" style={{ padding: '16px' }}>
                  {details.description ? <p style={{ fontSize: '14px', marginBottom: '16px' }}>{String(details.description)}</p> : null}

                  {parameters.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>Parameters</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {parameters.map((p) => (
                          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '13px', width: '120px' }}>
                              <code>{p.name}</code> {p.required && <span style={{ color: 'red' }}>*</span>}
                            </span>
                            <input 
                              type="text"
                              className="editor-input"
                              placeholder={`${p.in} parameter`}
                              value={params[`${key}-${p.name}`] || ''}
                              onChange={(e) => setParams(prev => ({
                                ...prev,
                                [`${key}-${p.name}`]: e.target.value
                              }))}
                              style={{ flexGrow: 1, padding: '4px 8px', fontSize: '13px' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleTestRequest(pathKey, method, details)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    Try it out
                  </button>

                  {response[key] && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>Response Code: {response[key].status || '...'}</h4>
                      <pre 
                        style={{
                          backgroundColor: 'var(--background-color)',
                          color: 'var(--text-color)',
                          padding: '12px',
                          borderRadius: 'var(--border-radius)',
                          border: 'var(--border-width) solid var(--border-color)',
                          overflowX: 'auto',
                          fontSize: '13px'
                        }}
                      >
                        {response[key].body}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export const DocReader: React.FC<DocReaderProps> = ({
  activeSection,
  showToast,
  onInternalLinkClick,
  prevSection,
  nextSection,
  onNavigate,
  t,
  config,
  editMode,
  onContentChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);

  const contentHtml = renderMarkdown(activeSection.content);
  const isApiSpec = activeSection.content.startsWith('---type: openapi---');

  const contentHtmlRef = useRef(activeSection.content);

  useEffect(() => {
    contentHtmlRef.current = activeSection.content;
  });

  useEffect(() => {
    if (editMode && containerRef.current) {
      containerRef.current.innerHTML = renderMarkdown(contentHtmlRef.current);
    }
    const timer = setTimeout(() => {
      setSelectedImg(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeSection.id, editMode]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
      setShowScrollBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!containerRef.current || isApiSpec || editMode) return;

    const parsedHeadings: { id: string; text: string; level: number }[] = [];
    const headers = containerRef.current.querySelectorAll('h1, h2, h3');

    headers.forEach((header) => {
      if (!header.id) {
        const cleanId = header.textContent
          ?.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        header.id = cleanId || 'header';
      }

      parsedHeadings.push({
        id: header.id,
        text: header.textContent?.replace(/\s*copy section link\s*$/, '').trim() || '',
        level: parseInt(header.tagName.replace('H', ''), 10)
      });

      if (header.querySelector('.header-anchor')) return;

      const anchorBtn = document.createElement('button');
      anchorBtn.className = 'header-anchor';
      anchorBtn.setAttribute('title', 'copy section link');
      anchorBtn.innerHTML = '<i class="fa-solid fa-link"></i>';

      anchorBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const sectionId = activeSection.id;
        const headerId = header.id;
        const deepLink = `${window.location.origin}${window.location.pathname}?section=${sectionId}#${headerId}`;
        navigator.clipboard.writeText(deepLink)
          .then(() => {
            showToast("Section link copied to clipboard!");
          })
          .catch((err: unknown) => {
            console.error("Clipboard copy failed:", err);
            showToast("Failed to copy link");
          });
      };

      header.appendChild(anchorBtn);
    });

    setHeadings(parsedHeadings);

    const codeBlocks = containerRef.current.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
      if (block.querySelector('.copy-code-btn')) return;
      block.style.position = 'relative';
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      copyBtn.type = 'button';
      
      copyBtn.onclick = (e) => {
        e.preventDefault();
        const codeElement = block.querySelector('code');
        const codeText = codeElement ? codeElement.innerText : '';
        navigator.clipboard.writeText(codeText).then(() => {
          copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
          showToast("Code copied to clipboard!");
          setTimeout(() => {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
          }, 2000);
        });
      };
      block.appendChild(copyBtn);
    });

    const tabsContainers = containerRef.current.querySelectorAll('.code-tabs');
    tabsContainers.forEach((container) => {
      const buttons = container.querySelectorAll('.tab-btn');
      const contents = container.querySelectorAll('.tab-content');
      buttons.forEach((btn) => {
        const handler = () => {
          const tabId = btn.getAttribute('data-tab');
          buttons.forEach(b => b.classList.remove('active'));
          contents.forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          container.querySelector(`.tab-content[data-tab="${tabId}"]`)?.classList.add('active');
        };
        btn.addEventListener('click', handler);
      });
    });

    if (config.enableMermaid !== false) {
      const mermaidBlocks = containerRef.current.querySelectorAll('.language-mermaid');
      if (mermaidBlocks.length > 0) {
        const win = window as unknown as Record<string, unknown>;
        const runMermaid = () => {
          const mm = win.mermaid as Record<string, unknown>;
          const initFn = mm.init as (t: unknown, el: unknown) => void;
          const initializeFn = mm.initialize as (cfg: unknown) => void;
          initializeFn({ startOnLoad: false, theme: 'default' });
          initFn(undefined, mermaidBlocks);
        };

        if (!win.mermaid) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
          script.onload = runMermaid;
          document.head.appendChild(script);
        } else {
          runMermaid();
        }
      }
    }

    const hash = window.location.hash;
    if (hash) {
      const targetElement = containerRef.current.querySelector(hash);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [activeSection, contentHtml, showToast, isApiSpec, config.enableMermaid, editMode]);

  const saveContent = () => {
    if (containerRef.current && onContentChange) {
      onContentChange(containerRef.current.innerHTML);
    }
  };

  const saveSelectionRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (containerRef.current && containerRef.current.contains(r.commonAncestorContainer)) {
        savedRangeRef.current = r.cloneRange();
      }
    }
  };

  const insertHTMLATCursor = (html: string) => {
    if (!savedRangeRef.current && containerRef.current) {
      containerRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(containerRef.current);
      range.collapse(false);
      savedRangeRef.current = range;
    }

    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (containerRef.current && containerRef.current.contains(r.commonAncestorContainer)) {
        r.deleteContents();
        const d = document.createElement('div');
        d.innerHTML = html;
        const fragment = document.createDocumentFragment();
        let child = d.firstChild;
        while (child) {
          const next = child.nextSibling;
          fragment.appendChild(child);
          child = next;
        }
        r.insertNode(fragment);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
        savedRangeRef.current = r.cloneRange();
        saveContent();
      }
    }
  };

  const insertTable = () => {
    const rowsPrompt = window.prompt("Enter the number of rows (default: 2):", "2");
    const colsPrompt = window.prompt("Enter the number of columns (default: 2):", "2");
    const rows = parseInt(rowsPrompt || '2', 10);
    const cols = parseInt(colsPrompt || '2', 10);
    if (isNaN(rows) || isNaN(cols)) return;

    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><thead><tr>';
    for (let j = 0; j < cols; j++) {
      tableHtml += '<th style="border: var(--border-width) solid var(--border-color); padding: 8px; background-color: var(--sidebar-color);">Header</th>';
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

    insertHTMLATCursor(tableHtml);
  };

  const insertAlert = (type: string) => {
    const allowedTypes = ['info', 'warning', 'success', 'danger'] as const;
    if (!allowedTypes.includes(type as (typeof allowedTypes)[number])) {
      return;
    }
    const safeType = type as (typeof allowedTypes)[number];

    const borderColors = {
      info: 'var(--primary-color)',
      warning: 'var(--warning-color)',
      success: 'var(--success-color)',
      danger: 'var(--error-color)'
    };
    const labels = {
      info: 'Information ',
      warning: 'Warning ',
      success: 'Success ',
      danger: 'Danger '
    };
    const icons = {
      info: 'fa-solid fa-circle-info',
      warning: 'fa-solid fa-triangle-exclamation',
      success: 'fa-solid fa-circle-check',
      danger: 'fa-solid fa-circle-xmark'
    };
    const html = `
      <div class="admonition admonition-${safeType}" style="border-left: 12px solid ${borderColors[safeType]}; padding: 12px; margin: 16px 0; background-color: var(--sidebar-color); border-radius: var(--border-radius); display: flex; align-items: flex-start; gap: 10px;">
        <i class="${icons[safeType]}" style="color: ${borderColors[safeType]}; font-size: 18px; margin-top: 2px; flex-shrink: 0;"></i>
        <div>
          <strong>${labels[safeType]}:</strong> edit..
        </div>
      </div>
    `;
    insertHTMLATCursor(html);
  };

  const runCommand = (command: string, arg = '') => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand(command, false, arg);
    saveSelectionRange();
    saveContent();
  };



  const updateSelectedImgStyle = (styleProps: Record<string, string>) => {
    if (!selectedImg) return;
    const imgEl = selectedImg as unknown as HTMLElement;
    Object.entries(styleProps).forEach(([prop, val]) => {
      imgEl.style.setProperty(prop, val);
    });
    saveContent();
  };

  const moveDomNode = (img: HTMLImageElement, dir: 'up' | 'down') => {
    const imgEl = img as unknown as HTMLElement;
    const parent = imgEl.parentNode;
    if (!parent) return;
    if (dir === 'up') {
      const prev = imgEl.previousSibling;
      if (prev) parent.insertBefore(imgEl, prev);
    } else {
      const next = imgEl.nextSibling;
      if (next) parent.insertBefore(imgEl, next.nextSibling);
    }
    saveContent();
    setSelectedImg(null);
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (editMode) {
      if (target.tagName === 'IMG') {
        setSelectedImg(target as HTMLImageElement);
      } else {
        setSelectedImg(null);
      }
      return;
    }

    const anchor = target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        onInternalLinkClick(targetId);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      await validateImageFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        if (containerRef.current) {
          containerRef.current.focus();
          const img = document.createElement('img');
          img.src = base64;
          img.alt = file.name;
          img.style.width = '100%';
          img.style.display = 'block';
          img.style.margin = '16px auto';
          img.style.borderRadius = 'var(--border-radius)';
          containerRef.current.appendChild(img);
          saveContent();
        }
        showToast("Image uploaded and inserted!");
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(errMsg);
    }
  };

  const wordCount = activeSection.content ? activeSection.content.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
      runCommand('underline')
    }
  }
};
  return (
    <div className="reader-layout" style={{ position: 'relative' }}>
      {config.readingProgressBar && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: `${scrollProgress}%`,
            height: '4px',
            backgroundColor: 'var(--primary-color)',
            zIndex: 9999,
            transition: 'width 0.1s ease-out'
          }}
        />
      )}

      <div className="content-container">
        <div className="breadcrumbs">
          <span>Docs</span>
          <i className="fa-solid fa-chevron-right breadcrumb-separator"></i>
          <span>{activeSection.title}</span>
        </div>

        {activeSection.subtitle && (
          <p className="page-subtitle" style={{ fontSize: '16px', opacity: 0.8, marginTop: '-12px', marginBottom: '16px', fontStyle: 'italic' }}>
            {activeSection.subtitle}
          </p>
        )}

        <div className="page-meta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', fontSize: '13px', opacity: 0.7, alignItems: 'center' }}>
          <span title="Estimated reading time">
            <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
            {readingTime} min read
          </span>
          {activeSection.estimatedDifficulty && (
            <span style={{ textTransform: 'capitalize' }} title="Difficulty rating">
              <i className="fa-solid fa-gauge-high" style={{ marginRight: '4px' }}></i>
              {activeSection.estimatedDifficulty}
            </span>
          )}
          {activeSection.tags && activeSection.tags.split(',').map((tag) => {
            const trimmed = tag.trim();
            if (!trimmed) return null;
            return (
              <span key={trimmed} style={{ backgroundColor: 'var(--border-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                #{trimmed}
              </span>
            );
          })}
        </div>

        {editMode && !isApiSpec && (
          <div 
            style={{
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
              backgroundColor: 'var(--sidebar-color)',
              border: 'var(--border-width) solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              padding: '8px',
              marginBottom: '16px',
              position: 'sticky',
              top: '60px',
              zIndex: 100,
              boxShadow: 'var(--shadow)'
            }}
          >
            <button type="button" onClick={() => runCommand('bold')} className="btn" style={{ padding: '6px 10px' }} title="Bold"><i className="fa-solid fa-bold"></i></button>
            <button type="button" onClick={() => runCommand('italic')} className="btn" style={{ padding: '6px 10px' }} title="Italic"><i className="fa-solid fa-italic"></i></button>
            <button type="button" onClick={() => runCommand('underline')} className="btn" style={{ padding: '6px 10px' }} title="Underline"><i className="fa-solid fa-underline"></i></button>
            <button type="button" onClick={() => runCommand('strikeThrough')} className="btn" style={{ padding: '6px 10px' }} title="Strikethrough"><i className="fa-solid fa-strikethrough"></i></button>
            
            <span style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
            <button type="button" onClick={insertTable} className="btn" style={{ padding: '6px 10px' }} title="Insert Table">
  <i className="fa-solid fa-table"></i>
</button>
<select 
  onChange={(e) => {
    if (e.target.value) {
      insertAlert(e.target.value);
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
            
            <button type="button" onClick={() => runCommand('formatBlock', '<h1>')} className="btn" style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 'bold' }}>H1</button>
            <button type="button" onClick={() => runCommand('formatBlock', '<h2>')} className="btn" style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 'bold' }}>H2</button>
            <button type="button" onClick={() => runCommand('formatBlock', '<h3>')} className="btn" style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 'bold' }}>H3</button>
            <button type="button" onClick={() => runCommand('formatBlock', '<p>')} className="btn" style={{ padding: '6px 10px', fontSize: '11px' }}>Para</button>
            <button type='button' onClick={() => runCommand('justifyLeft')} className='btn' style={{padding: '6px 10px' }} title='align left'>
              <i className='fa-solid fa-align-left'></i>
            </button>
            <button type='button' onClick={() => runCommand('justifyCenter')} className='btn' style={{padding: '6px 10px' }} title='align center'>
              <i className='fa-solid fa-align-center'></i>
            </button>
             <button type='button' onClick={() => runCommand('justifyRight')} className='btn' style={{padding: '6px 10px' }} title='align right'>
              <i className='fa-solid fa-align-right'></i>
            </button>
            <button type='button' onClick={() => runCommand('justifyFull')} className='btn' style={{padding: '6px 10px' }} title='justify full'>
              <i className='fa-solid fa-align-justify'></i>
            </button>
            <span style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
            
            <button type="button" onClick={() => runCommand('insertUnorderedList')} className="btn" style={{ padding: '6px 10px' }} title="Bullet List"><i className="fa-solid fa-list-ul"></i></button>
            <button type="button" onClick={() => runCommand('insertOrderedList')} className="btn" style={{ padding: '6px 10px' }} title="Numbered List"><i className="fa-solid fa-list-ol"></i></button>
            
            <span style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
            
            <button 
              type="button" 
              onClick={() => {
                const url = window.prompt("Enter link URL:");
                if (url) runCommand('createLink', url);
              }} 
              className="btn" 
              style={{ padding: '6px 10px' }} 
              title="Link"
            >
              <i className="fa-solid fa-link"></i>
            </button>
            
            <button type="button" onClick={() => runCommand('removeFormat')} className="btn" style={{ padding: '6px 10px' }} title="Clear Formatting"><i className="fa-solid fa-eraser"></i></button>
            
            <span style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="btn" 
              style={{ padding: '6px 10px' }} 
              title="Insert Image"
            >
              <i className="fa-regular fa-image"></i>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInputChange} 
              style={{ display: 'none' }} 
              accept="image/*" 
            />
          </div>
        )}
  
        {isApiSpec ? (
          <ApiReference 
            specContent={activeSection.content.substring(19)} 
          />
        ) : (
          <div 
            ref={containerRef}
            contentEditable={!!editMode}
            onKeyDown={handleKeyDown}
            onInput={saveContent}
            onBlur={saveContent}
            onMouseUp={saveSelectionRange}
            onKeyUp={saveSelectionRange}
            onFocus={saveSelectionRange}
            className="markdown-body"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={editMode ? undefined : { __html: contentHtml }}
            style={{ outline: 'none' }}
          />
        )}

        <div className="pagination-container">
          {prevSection ? (
            <button 
              type="button" 
              className="pagination-btn prev"
              onClick={() => onNavigate?.(prevSection.id)}
            >
              <span className="pagination-label">{t.prev}</span>
              <span className="pagination-title">{prevSection.title}</span>
            </button>
          ) : <div />}
          {nextSection ? (
            <button 
              type="button" 
              className="pagination-btn next"
              onClick={() => onNavigate?.(nextSection.id)}
            >
              <span className="pagination-label">{t.next}</span>
              <span className="pagination-title">{nextSection.title}</span>
            </button>
          ) : <div />}
        </div>
      </div>

      {!isApiSpec && headings.length > 0 && !editMode && (
        <aside className="on-this-page">
          <h4 className="on-this-page-title">{t.onThisPage}</h4>
          <ul className="on-this-page-list">
            {headings.map((heading) => (
              <li 
                key={heading.id} 
                className={`toc-item-level-${heading.level}`}
              >
                <a 
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(heading.id);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      window.history.pushState(null, '', `#${heading.id}`);
                    }
                  }}
                  className="toc-link"
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {config.scrollToTop && showScrollBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow)',
            zIndex: 1000,
            cursor: 'pointer',
            padding: 0
          }}
          title="Scroll to Top"
        >
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      )}

      {editMode && selectedImg && (
        <div 
          style={{
            position: 'absolute',
            top: `${selectedImg.offsetTop - 50}px`,
            left: `${selectedImg.offsetLeft}px`,
            backgroundColor: 'var(--sidebar-color)',
            border: 'var(--border-width) solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            padding: '6px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            boxShadow: 'var(--shadow)',
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            type="button" 
            onClick={() => updateSelectedImgStyle({ float: 'left', margin: '8px 16px 8px 0', display: 'inline' })}
            className="btn"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <i className="fa-solid fa-align-left"></i> Left
          </button>
          <button 
            type="button" 
            onClick={() => updateSelectedImgStyle({ float: 'none', margin: '16px auto', display: 'block' })}
            className="btn"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <i className="fa-solid fa-align-center"></i> Center
          </button>
          <button 
            type="button" 
            onClick={() => updateSelectedImgStyle({ float: 'right', margin: '8px 0 8px 16px', display: 'inline' })}
            className="btn"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <i className="fa-solid fa-align-right"></i> Right
          </button>
          
          <span style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-color)' }} />
          
          <span style={{ fontSize: '11px' }}>Stretch:</span>
          <input 
            type="range" 
            min="10" 
            max="100" 
            step="5"
            value={parseInt((selectedImg as unknown as HTMLElement).style.width) || 100}
            onChange={(e) => updateSelectedImgStyle({ width: `${e.target.value}%` })}
            style={{ width: '80px', cursor: 'pointer' }}
          />
          
          <span style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-color)' }} />
          
          <button 
            type="button" 
            onClick={() => moveDomNode(selectedImg, 'up')}
            className="btn"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            title="Move Up"
          >
            <i className="fa-solid fa-arrow-up"></i>
          </button>
          <button 
            type="button" 
            onClick={() => moveDomNode(selectedImg, 'down')}
            className="btn"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            title="Move Down"
          >
            <i className="fa-solid fa-arrow-down"></i>
          </button>
        </div>
      )}
    </div>
  );
};