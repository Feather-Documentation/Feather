import React, { useState } from 'react';
import type { ProjectConfig, ThemeConfig, DocSection } from '../types';
import { THEME_PRESETS } from '../themePresets';
import { getContrastColor, renderMarkdown } from '../utils/security';

interface DocEditorProps {
  config: ProjectConfig;
  activeSectionId: string;
  onChangeConfig: (newConfig: ProjectConfig) => void;
  showToast: (message: string) => void;
}

interface JSZipInstance {
  file: (name: string, content: string | ArrayBuffer | Blob) => void;
  generateAsync: (options: { type: 'blob' }) => Promise<Blob>;
}

interface JSZipConstructor {
  new (): JSZipInstance;
}

export const DocEditor: React.FC<DocEditorProps> = ({
  config,
  activeSectionId,
  onChangeConfig,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'branding' | 'theme' | 'typography' | 'markdown' | 'custom' | 'export'>('pages');
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'all' | 'corporate' | 'gamedev' | 'personal' | 'retro' | 'minimalist'>('all');
  const [modalSearch, setModalSearch] = useState('');

  const activeSection = config.sections.find(s => s.id === activeSectionId) || config.sections[0];
  
  const theme = config.theme || THEME_PRESETS['slate-corporate-modern'];
  const borderWidth = theme.borderWidth || '0px';
  const borderRadius = theme.borderRadius || '0px';

  const updateTheme = (updatedFields: Partial<ThemeConfig>) => {
    const updatedTheme = { ...theme, ...updatedFields };
    onChangeConfig({
      ...config,
      theme: updatedTheme
    });
  };

  const handleConfigFieldChange = (field: keyof ProjectConfig, value: unknown) => {
    onChangeConfig({
      ...config,
      [field]: value
    });
  };

  const updateActiveSection = (updatedFields: Partial<DocSection>) => {
    const updatedSections = config.sections.map((section) => {
      if (section.id === activeSectionId) {
        return { ...section, ...updatedFields };
      }
      return section;
    });
    onChangeConfig({
      ...config,
      sections: updatedSections
    });
  };

  const handleAddSection = () => {
    const newId = `new-page-${Date.now()}`;
    const newSection: DocSection = {
      id: newId,
      title: "New Page",
      icon: "fa-solid fa-file",
      content: "# New Page\n\nWrite your content here."
    };
    const updatedSections = [...config.sections, newSection];
    onChangeConfig({
      ...config,
      sections: updatedSections
    });
    showToast("Added new documentation page!");
  };

  const handleDeleteSection = () => {
    if (config.sections.length <= 1) {
      showToast("Cannot delete the only page!");
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${activeSection.title}"?`)) {
      const updatedSections = config.sections.filter(s => s.id !== activeSectionId);
      onChangeConfig({
        ...config,
        sections: updatedSections
      });
      showToast("Deleted page!");
    }
  };

  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;
    const temp = newSections[idx];
    newSections[idx] = newSections[targetIdx];
    newSections[targetIdx] = temp;
    onChangeConfig({ ...config, sections: newSections });
  };



  const loadJSZip = (): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const win = window as unknown as Record<string, unknown>;
      if (win.JSZip) {
        resolve(win.JSZip);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => resolve(win.JSZip);
      script.onerror = () => reject(new Error('Failed to load JSZip'));
      document.head.appendChild(script);
    });
  };

  const compileHtmlPage = (sec: DocSection, cfg: ProjectConfig) => {
    const currentTheme = cfg.theme;
    const currentIndex = cfg.sections.findIndex(s => s.id === sec.id);
    const prevSec = currentIndex > 0 ? cfg.sections[currentIndex - 1] : null;
    const nextSec = currentIndex < cfg.sections.length - 1 && currentIndex !== -1 ? cfg.sections[currentIndex + 1] : null;

    const navItemsHtml = cfg.sections.map((s, idx) => {
      const href = idx === 0 ? 'index.html' : `${s.id}.html`;
      const isActive = s.id === sec.id;
      const activeClass = isActive ? 'active' : '';
      return `
        <a href="${href}" class="nav-item ${activeClass}">
          ${s.icon ? `<i class="${s.icon} nav-icon"></i>` : ''}
          <span class="nav-text">${s.title}</span>
        </a>
      `;
    }).join('\n');

    const contentHtml = renderMarkdown(sec.content);

    const headers = sec.content.match(/^(#{1,3})\s+(.+)$/gm) || [];
    const tocItemsHtml = headers.map(h => {
      const level = h.match(/^#+/)?.[0].length || 1;
      const text = h.replace(/^#+\s+/, '').trim();
      const cleanId = text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      return `
        <li class="toc-item-level-${level}">
          <a href="#${cleanId}" class="toc-link">${text}</a>
        </li>
      `;
    }).join('\n');

    const hasToc = headers.length > 0;

    let fontValue = "'VT323', monospace";
    if (currentTheme.fontFamily === 'inter') {
      fontValue = "'Inter', sans-serif";
    } else if (currentTheme.fontFamily === 'courier') {
      fontValue = "'Courier Prime', monospace";
    } else if (currentTheme.fontFamily === 'playfair') {
      fontValue = "'Playfair Display', serif";
    } else if (currentTheme.fontFamily === 'outfit') {
      fontValue = "'Outfit', sans-serif";
    } else if (currentTheme.fontFamily === 'space') {
      fontValue = "'Space Grotesk', sans-serif";
    } else if (currentTheme.fontFamily === 'fira') {
      fontValue = "'Fira Code', monospace";
    } else if (currentTheme.fontFamily === 'cinzel') {
      fontValue = "'Cinzel', serif";
    } else if (currentTheme.fontFamily === 'pressstart') {
      fontValue = "'Press Start 2P', monospace";
    } else if (currentTheme.fontFamily === 'jakarta') {
      fontValue = "'Plus Jakarta Sans', sans-serif";
    }

    const fontSize = currentTheme.fontSize || '18px';
    const contentWidth = currentTheme.contentWidth || '860px';
    const lineHeight = currentTheme.lineHeight || '1.5';
    const sidebarWidth = currentTheme.sidebarWidth || '280px';
    const sidebarFlexDir = currentTheme.sidebarPosition === 'right' ? 'row-reverse' : 'row';
    const sidebarBorderRight = currentTheme.sidebarPosition === 'right' ? 'none' : `var(--border-width) solid var(--border-color)`;
    const sidebarBorderLeft = currentTheme.sidebarPosition === 'right' ? `var(--border-width) solid var(--border-color)` : 'none';

    let shadowValue = `var(--border-width) var(--border-width) 0px ${currentTheme.borderColor}`;
    if (currentTheme.shadowType === 'none') {
      shadowValue = 'none';
    } else if (currentTheme.shadowType === 'subtle') {
      shadowValue = '0 2px 8px rgba(0, 0, 0, 0.05)';
    } else if (currentTheme.shadowType === 'medium') {
      shadowValue = '0 8px 30px rgba(0, 0, 0, 0.12)';
    } else if (currentTheme.shadowType === 'heavy') {
      shadowValue = '0 16px 40px rgba(0, 0, 0, 0.2)';
    } else {
      if (currentTheme.name.includes('Modern')) {
        shadowValue = "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)";
      } else if (currentTheme.borderColor === 'transparent' || parseInt(currentTheme.borderWidth) === 0) {
        shadowValue = "none";
      }
    }

    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${sec.title} - ${cfg.title}</title>
    <link rel="icon" type="${cfg.favicon ? (/\p{Emoji}/u.test(cfg.favicon) ? 'image/svg+xml' : 'image/x-icon') : 'image/png'}" href="${cfg.favicon ? (/\p{Emoji}/u.test(cfg.favicon) ? `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>${cfg.favicon.trim()}</text></svg>` : cfg.favicon.trim()) : 'feather-solid.png'}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=VT323&family=Inter:wght@300;400;600;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;600;700&family=Space+Grotesk:wght@400;600;700&family=Fira+Code:wght@400;600&family=Cinzel:wght@400;700&family=Press+Start+2P&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" crossorigin="anonymous" />
    <link rel="stylesheet" href="style.css" />
    <style>
      :root {
        --primary-color: ${currentTheme.primaryColor};
        --primary-contrast-color: ${getContrastColor(currentTheme.primaryColor)};
        --background-color: ${currentTheme.backgroundColor};
        --text-color: ${currentTheme.textColor};
        --sidebar-color: ${currentTheme.sidebarColor};
        --border-color: ${currentTheme.borderColor};
        --border-width: ${currentTheme.borderWidth};
        --border-radius: ${currentTheme.borderRadius};
        --font-family: ${fontValue};
        --base-font-size: ${fontSize};
        --base-line-height: ${lineHeight};
        --content-max-width: ${contentWidth};
        --shadow: ${shadowValue};
        --sidebar-width: ${sidebarWidth};
        --sidebar-flex-direction: ${sidebarFlexDir};
        --sidebar-border-right: ${sidebarBorderRight};
        --sidebar-border-left: ${sidebarBorderLeft};
        --secondary-accent: ${currentTheme.secondaryAccentColor || '#2979ff'};
        --success-color: ${currentTheme.successColor || '#00c853'};
        --warning-color: ${currentTheme.warningColor || '#ffab00'};
        --error-color: ${currentTheme.errorColor || '#d50000'};
        --code-bg-color: ${currentTheme.codeBgColor || 'rgba(0,0,0,0.05)'};
        --inline-code-color: ${currentTheme.inlineCodeColor || '#e83e8c'};
        --link-color: ${currentTheme.linkColor || 'var(--primary-color)'};
        --link-hover-color: ${currentTheme.linkHoverColor || 'var(--primary-color)'};
        --quote-bg-color: ${currentTheme.quoteBlockColor || 'rgba(0,0,0,0.02)'};
        --selection-highlight: ${currentTheme.selectionHighlightColor || 'rgba(121, 40, 202, 0.2)'};
      }
    </style>
  </head>
  <body>
    <div class="app-container">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${cfg.logoIcon ? (cfg.logoIcon.startsWith('fa-') ? `<i class="fa-solid ${cfg.logoIcon}"></i>` : `<img src="${cfg.logoIcon}" alt="Logo" class="logo-image" style="width: 24px; height: 24px; object-fit: contain;" />`) : ''}
            <h1 class="logo-text">${cfg.title}</h1>
          </div>
          <span class="logo-subtitle">${cfg.logoText}</span>
        </div>
        <nav class="sidebar-nav">
          ${navItemsHtml}
        </nav>
      </aside>

      <div class="main-wrapper">
        <header class="content-header">
          <div class="search-container">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input id="docs-search-input" type="text" placeholder="Search docs..." />
            <span class="search-shortcut">Ctrl K</span>
            <div id="search-results-dropdown" class="search-results-dropdown" style="display: none;"></div>
          </div>
        </header>

        <div id="exported-return-banner" class="return-banner" style="display: none;">
          <div class="return-banner-text">
            <i class="fa-solid fa-circle-info"></i>
            <span>You were sent here from a Documentations page.</span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <a id="exported-return-banner-link" class="return-banner-link" href="#" style="text-decoration: none;">
              Return here
            </a>
            <button id="exported-return-banner-close" class="return-banner-close" aria-label="Close banner" style="background: none; border: none; cursor: pointer; color: inherit;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <main style="flex-grow: 1;">
          <div class="reader-layout">
            <div class="content-container">
              <div class="breadcrumbs">
                <span>Docs</span>
                <i class="fa-solid fa-chevron-right breadcrumb-separator"></i>
                <span>${sec.title}</span>
              </div>
              <div class="markdown-body">
                ${contentHtml}
              </div>
              <div class="pagination-container">
                ${prevSec ? `
                  <a href="${currentIndex - 1 === 0 ? 'index.html' : `${prevSec.id}.html`}" class="pagination-btn prev">
                    <span class="pagination-label">Previous</span>
                    <span class="pagination-title">${prevSec.title}</span>
                  </a>
                ` : '<div />'}
                ${nextSec ? `
                  <a href="${nextSec.id}.html" class="pagination-btn next">
                    <span class="pagination-label">Next</span>
                    <span class="pagination-title">${nextSec.title}</span>
                  </a>
                ` : '<div />'}
              </div>
            </div>

            ${hasToc ? `
              <aside class="on-this-page">
                <h4 class="on-this-page-title">On this page</h4>
                <ul class="on-this-page-list">
                  ${tocItemsHtml}
                </ul>
              </aside>
            ` : ''}
          </div>
        </main>

        <footer class="footer">
          <span>Copyright © 2026 Feather Authors.</span>
          \${cfg.footerText ? \`<span>•</span> <span>\${cfg.footerText}</span>\` : ''}
        </footer>
      </div>
    </div>

    <script>
      document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3').forEach(header => {
        if (!header.id) {
          const cleanId = header.textContent
            ?.toLowerCase()
            .replace(/[^\\w\\s-]/g, '')
            .trim()
            .replace(/\\s+/g, '-');
          header.id = cleanId || 'header';
        }
      });

      document.querySelectorAll('pre').forEach(block => {
        block.style.position = 'relative';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyBtn.type = 'button';
        copyBtn.onclick = (e) => {
          e.preventDefault();
          const codeText = block.querySelector('code')?.innerText || '';
          navigator.clipboard.writeText(codeText).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => {
              copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
            }, 2000);
          });
        };
        block.appendChild(copyBtn);
      });

      document.querySelectorAll('.code-tabs').forEach(container => {
        const buttons = container.querySelectorAll('.tab-btn');
        const contents = container.querySelectorAll('.tab-content');
        buttons.forEach(btn => {
          btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            buttons.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            container.querySelector(\`.tab-content[data-tab="\${tabId}"]\`)?.classList.add('active');
          });
        });
      });

      const searchIndex = ${JSON.stringify(cfg.sections.map(s => ({ id: s.id, title: s.title, content: s.content })))};
      const searchInput = document.getElementById('docs-search-input');
      const searchDropdown = document.getElementById('search-results-dropdown');

      function stripHtml(html) {
        return html
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"');
      }

      if (searchInput && searchDropdown) {
        document.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
          }
        });

        document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.style.display = 'none';
          }
        });

        searchInput.addEventListener('input', () => {
          const query = searchInput.value.trim().toLowerCase();
          if (!query) {
            searchDropdown.style.display = 'none';
            return;
          }

          const results = searchIndex.filter(s => s.title.toLowerCase().includes(query) || stripHtml(s.content).toLowerCase().includes(query));
          if (results.length === 0) {
            searchDropdown.innerHTML = '<div class="search-no-results">No results found</div>';
          } else {
            searchDropdown.innerHTML = results.map((r, idx) => {
              const href = searchIndex.findIndex(s => s.id === r.id) === 0 ? 'index.html' : \`\${r.id}.html\`;
              const plain = stripHtml(r.content);
              const idxMatch = plain.toLowerCase().indexOf(query);
              let snippet = '';
              if (idxMatch === -1) {
                snippet = plain.slice(0, 60) + (plain.length > 60 ? '...' : '');
              } else {
                const start = Math.max(0, idxMatch - 20);
                const end = Math.min(plain.length, idxMatch + 40);
                snippet = (start > 0 ? '...' : '') + plain.slice(start, end).replace(/\\s+/g, ' ') + (end < plain.length ? '...' : '');
              }
              return \`
                <a href="\${href}" class="search-result-item" style="text-decoration: none;">
                  <div class="search-result-title">\${r.title}</div>
                  <div class="search-result-snippet" style="opacity: 0.7; font-size: 13px;">\${snippet}</div>
                </a>
              \`;
            }).join('');
          }
          searchDropdown.style.display = 'block';
        });
      }

      const params = new URLSearchParams(window.location.search);
      const referrerParam = params.get('referrer');
      const banner = document.getElementById('exported-return-banner');
      const bannerLink = document.getElementById('exported-return-banner-link');
      const bannerClose = document.getElementById('exported-return-banner-close');
      
      const sectionsList = ${JSON.stringify(cfg.sections.map(s => ({ id: s.id, title: s.title })))};
      let referrerId = referrerParam;

      if (!referrerId && document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          if (refUrl.origin === window.location.origin) {
            const pathParts = refUrl.pathname.split('/');
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart.endsWith('.html')) {
              const cleanedId = lastPart.replace('.html', '');
              if (cleanedId === 'index') {
                referrerId = sectionsList[0].id;
              } else if (sectionsList.some(s => s.id === cleanedId)) {
                referrerId = cleanedId;
              }
            } else if (lastPart === '' || lastPart === 'index.html') {
              referrerId = sectionsList[0].id;
            }
          }
        } catch (e) {
        }
      }

      if (referrerId && banner && bannerLink && bannerClose) {
        const refSec = sectionsList.find(s => s.id === referrerId);
        if (refSec && refSec.id !== '${sec.id}') {
          const refHref = sectionsList.findIndex(s => s.id === refSec.id) === 0 ? 'index.html' : \`\${refSec.id}.html\`;
          bannerLink.href = refHref;
          bannerLink.textContent = \`Return here to "\${refSec.title}"\`;
          banner.style.display = 'flex';
          
          bannerClose.addEventListener('click', () => {
            banner.style.display = 'none';
          });
        }
      }
    </script>
  </body>
</html>
    `.trim();
  };

  const handlePublish = async () => {
    try {
      showToast("Compiling static site bundle...");
      const zipLib = await loadJSZip();
      const JSZip = zipLib as JSZipConstructor;
      const zip = new JSZip();

      const configData = JSON.stringify(config, null, 2);
      zip.file('feather-docs.json', configData);

      let cssContent = '';
      try {
        const cssRes = await fetch('/src/index.css');
        if (cssRes.ok) {
          cssContent = await cssRes.text();
        }
      } catch (err) {
        console.warn("Could not fetch CSS file directly, using fallback.", err);
      }
      zip.file('style.css', cssContent);

      try {
        const logoRes = await fetch('/feather-solid.png');
        if (logoRes.ok) {
          const logoBlob = await logoRes.blob();
          const logoArrayBuffer = await logoBlob.arrayBuffer();
          zip.file('feather-solid.png', logoArrayBuffer);
        }
      } catch (err) {
        console.warn("Could not bundle logo image in static export.", err);
      }

      config.sections.forEach((sec, idx) => {
        const filename = idx === 0 ? 'index.html' : `${sec.id}.html`;
        const html = compileHtmlPage(sec, config);
        zip.file(filename, html);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'feather-docs-site.zip';
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast("Static site exported successfully!");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Static site export failed:", err);
      showToast(`Export failed: ${errMsg}`);
    }
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([activeSection.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeSection.id}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Markdown exported!");
  };

  const handleImportMarkdown = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        updateActiveSection({ content: text, title: file.name.replace(/\.md$/, '') });
        showToast("Markdown imported!");
      };
      reader.readAsText(file);
    }
  };

  const currentPresetName = theme.name;

  const filteredPresetEntries = Object.entries(THEME_PRESETS).filter(([id, preset]) => {
    const matchesSearch = preset.name.toLowerCase().includes(modalSearch.toLowerCase());
    
    if (modalTab === 'all') return matchesSearch;
    if (modalTab === 'corporate') return matchesSearch && id.includes('corporate');
    if (modalTab === 'gamedev') return matchesSearch && (id.includes('pixel-pink') || id.includes('cyberpunk') || id.includes('matrix') || id.includes('vaporwave') || id.includes('lava'));
    if (modalTab === 'personal') return matchesSearch && (id.includes('personal') || id.includes('vintage') || id.includes('cute') || id.includes('gamer') || id.includes('journal') || id.includes('academic'));
    if (modalTab === 'retro') return matchesSearch && (id.includes('retro') || id.includes('commodore') || id.includes('gameboy') || id.includes('cyberpunk') || id.includes('matrix') || id.includes('macintosh'));
    if (modalTab === 'minimalist') return matchesSearch && (id.includes('minimal') || id.includes('mono') || id.includes('nord') || id.includes('paper') || id.includes('sakura'));
    
    return false;
  });

  return (
    <aside className="editor-panel" style={{ width: '420px', borderLeft: 'var(--border-width) solid var(--border-color)' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '4px', overflowX: 'auto', padding: '8px' }}>
        {(['pages', 'branding', 'theme', 'typography', 'markdown', 'custom', 'export'] as const).map((tTab) => (
          <button
            key={tTab}
            onClick={() => setActiveTab(tTab)}
            className={`btn ${activeTab === tTab ? 'btn-primary' : ''}`}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              textTransform: 'capitalize',
              flexShrink: 0,
              backgroundColor: activeTab === tTab ? 'var(--primary-color)' : 'transparent',
              color: activeTab === tTab ? 'var(--primary-contrast-color)' : 'var(--text-color)',
              borderColor: activeTab === tTab ? 'var(--primary-color)' : 'var(--border-color)',
              boxShadow: activeTab === tTab ? 'var(--shadow)' : 'none'
            }}
          >
            {tTab}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeTab === 'pages' && (
          <>
            <div className="editor-group">
              <label className="editor-label">Page Setup</label>
              <input 
                type="text" 
                className="editor-input" 
                placeholder="Page Title" 
                value={activeSection.title}
                onChange={(e) => updateActiveSection({ title: e.target.value })}
              />
              <input 
                type="text" 
                className="editor-input" 
                placeholder="Subtitle / Description" 
                value={activeSection.subtitle || ''}
                onChange={(e) => updateActiveSection({ subtitle: e.target.value })}
              />
              <input 
                type="text" 
                className="editor-input" 
                placeholder="Tags (comma separated)" 
                value={activeSection.tags || ''}
                onChange={(e) => updateActiveSection({ tags: e.target.value })}
              />
              <select
                className="editor-select"
                value={activeSection.estimatedDifficulty || 'easy'}
                onChange={(e) => updateActiveSection({ estimatedDifficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
              >
                <option value="easy">Easy difficulty</option>
                <option value="medium">Medium difficulty</option>
                <option value="hard">Hard difficulty</option>
              </select>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!activeSection.isDraft} 
                    onChange={(e) => updateActiveSection({ isDraft: e.target.checked })}
                  />
                  Is Draft
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!activeSection.isHidden} 
                    onChange={(e) => updateActiveSection({ isHidden: e.target.checked })}
                  />
                  Is Hidden
                </label>
              </div>
            </div>

            <div className="editor-group" style={{ padding: '12px', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius)', textAlign: 'center', opacity: 0.8 }}>
              <i className="fa-solid fa-pen-nib" style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--primary-color)' }}></i>
              <p style={{ fontSize: '13px', margin: 0 }}>
                <strong>Editing has moved!</strong><br />
                You can now type directly on the editing page.
              </p>
            </div>

            <div className="editor-group" style={{ flexDirection: 'row', gap: '8px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={handleAddSection}>
                <i className="fa-solid fa-plus"></i> Add page
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteSection}>
                <i className="fa-solid fa-trash"></i> Delete this page
              </button>
            </div>

            <div className="editor-group">
              <label className="editor-label">Page ordering</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '6px', borderRadius: 'var(--border-radius)' }}>
                {config.sections.map((sec, idx) => (
                  <div key={sec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.title}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button disabled={idx === 0} onClick={() => moveSection(idx, 'up')} style={{ padding: '2px 4px' }} className="btn"><i className="fa-solid fa-chevron-up"></i></button>
                      <button disabled={idx === config.sections.length - 1} onClick={() => moveSection(idx, 'down')} style={{ padding: '2px 4px' }} className="btn"><i className="fa-solid fa-chevron-down"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'branding' && (
          <div className="editor-group">
            <label className="editor-label">Site setup</label>
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Site Title" 
              value={config.title}
              onChange={(e) => handleConfigFieldChange('title', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Sub-Branding Text" 
              value={config.logoText}
              onChange={(e) => handleConfigFieldChange('logoText', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Favicon Symbol (Emoji or URL)" 
              value={config.favicon}
              onChange={(e) => handleConfigFieldChange('favicon', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Company Logo URL / FontAwesome Class" 
              value={config.companyLogo || ''}
              onChange={(e) => handleConfigFieldChange('companyLogo', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Website URL" 
              value={config.siteUrl || ''}
              onChange={(e) => handleConfigFieldChange('siteUrl', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Footer Copyright Text" 
              value={config.footerText || ''}
              onChange={(e) => handleConfigFieldChange('footerText', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Footer Links JSON Array" 
              value={config.footerLinks || ''}
              onChange={(e) => handleConfigFieldChange('footerLinks', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Social Media JSON" 
              value={config.socialLinks || ''}
              onChange={(e) => handleConfigFieldChange('socialLinks', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Github Repository Link" 
              value={config.githubRepo || ''}
              onChange={(e) => handleConfigFieldChange('githubRepo', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Discord Server Invite" 
              value={config.discordServer || ''}
              onChange={(e) => handleConfigFieldChange('discordServer', e.target.value)}
            />

            <label className="editor-label" style={{ marginTop: '12px' }}>SEO Metadata</label>
            <textarea 
              className="editor-textarea" 
              placeholder="Site Description" 
              value={config.siteDescription || ''}
              onChange={(e) => handleConfigFieldChange('siteDescription', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="SEO Keywords" 
              value={config.keywords || ''}
              onChange={(e) => handleConfigFieldChange('keywords', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Apple Touch Icon URL" 
              value={config.appleTouchIcon || ''}
              onChange={(e) => handleConfigFieldChange('appleTouchIcon', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="OpenGraph Image URL" 
              value={config.openGraphImage || ''}
              onChange={(e) => handleConfigFieldChange('openGraphImage', e.target.value)}
            />
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Browser Theme Accent Color" 
              value={config.browserColor || ''}
              onChange={(e) => handleConfigFieldChange('browserColor', e.target.value)}
            />

            <label className="editor-label" style={{ marginTop: '12px' }}>Analytics trackers</label>
            <input 
              type="text" 
              className="editor-input" 
              placeholder="Google Analytics measurement ID" 
              value={config.googleAnalyticsId || ''}
              onChange={(e) => handleConfigFieldChange('googleAnalyticsId', e.target.value)}
            />
          </div>
        )}

        {activeTab === 'theme' && (
          <>
            <div className="editor-group">
              <label className="editor-label">Theme presets</label>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setIsPresetModalOpen(true)}
              >
                Browse Theme Library
              </button>
              <span style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                Active Preset: <strong>{currentPresetName}</strong>
              </span>
            </div>

            <div className="editor-group">
              <label className="editor-label">Primary accent colors</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={theme.primaryColor} 
                  onChange={(e) => updateTheme({ primaryColor: e.target.value, name: 'custom' })}
                  style={{ width: '48px', height: '36px', padding: 0, cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  className="editor-input" 
                  value={theme.primaryColor} 
                  onChange={(e) => updateTheme({ primaryColor: e.target.value, name: 'custom' })}
                  style={{ flexGrow: 1 }}
                />
              </div>
            </div>

            <div className="editor-group">
              <label className="editor-label">Theme color palette</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div>
                  <label>Background</label>
                  <input type="color" value={theme.backgroundColor} onChange={(e) => updateTheme({ backgroundColor: e.target.value, name: 'custom' })} />
                </div>
                <div>
                  <label>Text color</label>
                  <input type="color" value={theme.textColor} onChange={(e) => updateTheme({ textColor: e.target.value, name: 'custom' })} />
                </div>
                <div>
                  <label>Sidebar</label>
                  <input type="color" value={theme.sidebarColor} onChange={(e) => updateTheme({ sidebarColor: e.target.value, name: 'custom' })} />
                </div>
                <div>
                  <label>Borders</label>
                  <input type="color" value={theme.borderColor} onChange={(e) => updateTheme({ borderColor: e.target.value, name: 'custom' })} />
                </div>
                <div>
                  <label>Secondary Accent</label>
                  <input type="color" value={theme.secondaryAccentColor || '#2979ff'} onChange={(e) => updateTheme({ secondaryAccentColor: e.target.value, name: 'custom' })} />
                </div>
                <div>
                  <label>Code block background</label>
                  <input type="color" value={theme.codeBgColor || '#f6f8fa'} onChange={(e) => updateTheme({ codeBgColor: e.target.value, name: 'custom' })} />
                </div>
                <div>
                  <label>Success status</label>
                  <input type="color" value={theme.successColor || '#00c853'} onChange={(e) => updateTheme({ successColor: e.target.value, name: 'custom' })} />
                </div>
                <div>
                  <label>Warning status</label>
                  <input type="color" value={theme.warningColor || '#ffab00'} onChange={(e) => updateTheme({ warningColor: e.target.value, name: 'custom' })} />
                </div>
                <div>
                  <label>Error status</label>
                  <input type="color" value={theme.errorColor || '#d50000'} onChange={(e) => updateTheme({ errorColor: e.target.value, name: 'custom' })} />
                </div>
                <div>
                  <label>Link hover Color</label>
                  <input type="color" value={theme.linkHoverColor || '#ff007f'} onChange={(e) => updateTheme({ linkHoverColor: e.target.value, name: 'custom' })} />
                </div>
              </div>
            </div>

            <div className="editor-group">
              <label className="editor-label">Border styles</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={borderWidth}
                  onChange={(e) => updateTheme({ borderWidth: e.target.value, name: 'custom' })}
                  className="editor-select"
                  style={{ flex: 1 }}
                >
                  <option value="0px">No borders</option>
                  <option value="1px">Thin (1px)</option>
                  <option value="2px">Medium (2px)</option>
                  <option value="3px">Thick (3px)</option>
                  <option value="4px">Retro (4px)</option>
                </select>
                <select
                  value={borderRadius}
                  onChange={(e) => updateTheme({ borderRadius: e.target.value, name: 'custom' })}
                  className="editor-select"
                  style={{ flex: 1 }}
                >
                  <option value="0px">Sharp corners</option>
                  <option value="4px">Subtle rounded (4px)</option>
                  <option value="8px">Medium rounded (8px)</option>
                  <option value="12px">Classic macOS (12px)</option>
                  <option value="20px">Extreme round (20px)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {activeTab === 'typography' && (
          <>
            <div className="editor-group">
              <label className="editor-label">Typography Presets</label>
              <select
                value={theme.fontFamily}
                onChange={(e) => updateTheme({ fontFamily: e.target.value, name: 'custom' })}
                className="editor-select"
              > 
              // you can add more options below for fonts.
                <option value="inter" style={{ fontFamily: "'Inter', sans-serif" }}>Inter</option>
                <option value="outfit" style={{ fontFamily: "'Outfit', sans-serif" }}>Outfit</option>
                <option value="space" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Space Grotesk</option>
                <option value="playfair" style={{ fontFamily: "'Playfair Display', serif" }}>Playfair Display</option>
                <option value="cinzel" style={{ fontFamily: "'Cinzel', serif" }}>Cinzel</option>
                <option value="courier" style={{ fontFamily: "'Courier Prime', monospace" }}>Courier Prime</option>
                <option value="fira" style={{ fontFamily: "'Fira Code', monospace" }}>Fira Code</option>
                <option value="pressstart" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}>Press Start 2P</option>
                <option value="jakarta" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Plus Jakarta Sans</option> 
              </select>
            </div>

            <div className="editor-group">
              <label className="editor-label">Base Font Scaling</label>
              <input 
                type="range" 
                min="14" 
                max="24" 
                value={parseInt(theme.fontSize || '18')} 
                onChange={(e) => updateTheme({ fontSize: `${e.target.value}px`, name: 'custom' })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', opacity: 0.8, textAlign: 'right' }}>
                Active Size: {theme.fontSize || '18px'}
              </span>
            </div>

            <div className="editor-group">
              <label className="editor-label">Line Spacing</label>
              <input 
                type="range" 
                min="1.2" 
                max="2.0" 
                step="0.1"
                value={parseFloat(theme.lineHeight || '1.5')} 
                onChange={(e) => updateTheme({ lineHeight: e.target.value, name: 'custom' })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', opacity: 0.8, textAlign: 'right' }}>
                Active Height: {theme.lineHeight || '1.5'}
              </span>
            </div>

            <div className="editor-group">
              <label className="editor-label">Layout Overrides</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={theme.sidebarPosition || 'left'}
                  onChange={(e) => updateTheme({ sidebarPosition: e.target.value as 'left' | 'right', name: 'custom' })}
                  className="editor-select"
                  style={{ flex: 1 }}
                >
                  <option value="left">Sidebar Left</option>
                  <option value="right">Sidebar Right</option>
                </select>
                <select
                  value={theme.shadowType || 'subtle'}
                  onChange={(e) => updateTheme({ shadowType: e.target.value as 'none' | 'subtle' | 'medium' | 'heavy', name: 'custom' })}
                  className="editor-select"
                  style={{ flex: 1 }}
                >
                  <option value="none">Flat shadows</option>
                  <option value="subtle">Subtle shadows</option>
                  <option value="medium">Medium depth</option>
                  <option value="heavy">Heavy depth</option>
                </select>
              </div>
            </div>

            <div className="editor-group">
              <label className="editor-label">Structure Variables</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!config.fullWidthMode} 
                    onChange={(e) => handleConfigFieldChange('fullWidthMode', e.target.checked)}
                  />
                  Full Width Mode
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!config.compactMode} 
                    onChange={(e) => handleConfigFieldChange('compactMode', e.target.checked)}
                  />
                  Compact Reading Layout
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!config.readingProgressBar} 
                    onChange={(e) => handleConfigFieldChange('readingProgressBar', e.target.checked)}
                  />
                  Top Scroll Progress Bar
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!config.scrollToTop} 
                    onChange={(e) => handleConfigFieldChange('scrollToTop', e.target.checked)}
                  />
                  Scroll-To-Top floating arrow
                </label>
              </div>
            </div>
          </>
        )}

        {activeTab === 'markdown' && (
          <div className="editor-group">
            <label className="editor-label">Parser Toggles</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <input 
                  type="checkbox" 
                  checked={config.enableMermaid !== false} 
                  onChange={(e) => handleConfigFieldChange('enableMermaid', e.target.checked)}
                />
                Render Mermaid.js diagrams
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <input 
                  type="checkbox" 
                  checked={config.enableLatex !== false} 
                  onChange={(e) => handleConfigFieldChange('enableLatex', e.target.checked)}
                />
                Render LaTeX expressions
              </label>
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="editor-group">
            <label className="editor-label">Inject stylesheet stylesheet (CSS)</label>
            <textarea 
              className="editor-textarea"
              placeholder=".my-class { color: red; }"
              value={config.customCss || ''}
              onChange={(e) => handleConfigFieldChange('customCss', e.target.value)}
              style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '12px' }}
            />

            <label className="editor-label" style={{ marginTop: '12px' }}>Inject JavaScript blocks (JS)</label>
            <textarea 
              className="editor-textarea"
              placeholder="console.log('Feather documentation initialized');"
              value={config.customJs || ''}
              onChange={(e) => handleConfigFieldChange('customJs', e.target.value)}
              style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
        )}

        {activeTab === 'export' && (
          <div className="editor-group">
            <label className="editor-label">Publish & Downloads</label>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', marginBottom: '8px' }}
              onClick={handlePublish}
            >
              <i className="fa-solid fa-cloud-arrow-down"></i> Export standalone website ZIP
            </button>
            <button 
              className="btn" 
              style={{ width: '100%', padding: '10px', marginBottom: '8px' }}
              onClick={handleExportMarkdown}
            >
              <i className="fa-regular fa-file-lines"></i> Export Active Page as Markdown
            </button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Import MD:</span>
              <input 
                type="file" 
                onChange={handleImportMarkdown} 
                accept=".md" 
                style={{ fontSize: '12px' }} 
              />
            </div>
          </div>
        )}
      </div>

      {isPresetModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPresetModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Select Theme Preset</span>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsPresetModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              <input 
                type="text" 
                className="modal-search-input" 
                placeholder="Search presets by name..." 
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '8px', margin: '16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', overflowX: 'auto' }}>
                {(['all', 'corporate', 'gamedev', 'personal', 'retro', 'minimalist'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`btn ${modalTab === tab ? 'btn-primary' : ''}`}
                    onClick={() => setModalTab(tab)}
                    style={{ padding: '6px 12px', fontSize: '13px', textTransform: 'capitalize' }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="presets-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                {filteredPresetEntries.map(([id, preset]) => (
                  <button
                    key={id}
                    className={`preset-card ${preset.name === theme.name ? 'active' : ''}`}
                    onClick={() => {
                      updateTheme(preset);
                      setIsPresetModalOpen(false);
                    }}
                    style={{
                      border: 'var(--border-width) solid var(--border-color)',
                      borderRadius: 'var(--border-radius)',
                      padding: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: 'var(--sidebar-color)',
                      color: 'var(--text-color)',
                      boxShadow: 'var(--shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <strong>{preset.name}</strong>
                      {preset.name === theme.name && <i className="fa-solid fa-circle-check" style={{ color: 'var(--primary-color)' }}></i>}
                    </div>
                    <div 
                      style={{
                        width: '100%',
                        height: '60px',
                        backgroundColor: preset.backgroundColor,
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'row'
                      }}
                    >
                      <div style={{ width: '30%', backgroundColor: preset.sidebarColor, borderRight: '1px solid var(--border-color)', padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ width: '80%', height: '4px', backgroundColor: preset.primaryColor, borderRadius: '2px' }} />
                        <div style={{ width: '60%', height: '3px', backgroundColor: preset.textColor, opacity: 0.3, borderRadius: '1px' }} />
                        <div style={{ width: '70%', height: '3px', backgroundColor: preset.textColor, opacity: 0.3, borderRadius: '1px' }} />
                      </div>
                      <div style={{ flexGrow: 1, padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ width: '40%', height: '5px', backgroundColor: preset.textColor, borderRadius: '2px' }} />
                        <div style={{ width: '90%', height: '3px', backgroundColor: preset.textColor, opacity: 0.5, borderRadius: '1px' }} />
                        <div style={{ width: '85%', height: '3px', backgroundColor: preset.textColor, opacity: 0.5, borderRadius: '1px' }} />
                        <div style={{ width: '30%', height: '4px', backgroundColor: preset.primaryColor, borderRadius: '2px', marginTop: 'auto' }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};