import { useState, useEffect } from 'react';
import type { ProjectConfig } from './types';
import { DEFAULT_CONFIG } from './defaultConfig';
import { DocReader } from './components/DocReader';
import { DocEditor } from './components/DocEditor';
import { ReturnBanner } from './components/ReturnBanner';
import { getContrastColor } from './utils/security';

function App() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [referrerSection, setReferrerSection] = useState<{ id: string; title: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1);

  const isLocalhost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === '[::1]' ||
    window.location.hostname === '';

  const logoIcon = config.logoIcon || '';
  const favicon = config.favicon || '';
  const borderWidth = config.theme?.borderWidth || '0px';
  const borderRadius = config.theme?.borderRadius || '0px';

  const initializeActiveSection = (projectConfig: ProjectConfig) => {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get('section');
    
    if (sectionParam && projectConfig.sections.some(s => s.id === sectionParam)) {
      setActiveSectionId(sectionParam);
    } else if (projectConfig.sections.length > 0) {
      setActiveSectionId(projectConfig.sections[0].id);
    }
  };

  useEffect(() => {
    const savedDraft = isLocalhost ? localStorage.getItem('feather_docs_draft') : null;
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (!parsed.theme) {
          parsed.theme = DEFAULT_CONFIG.theme;
        }
        setTimeout(() => {
          setConfig(parsed);
          initializeActiveSection(parsed);
        }, 0);
        return;
      } catch (e) {
        console.error("Failed to parse saved draft from LocalStorage", e);
      }
    }

    fetch('/feather-docs.json')
      .then((res) => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then((data: ProjectConfig) => {
        if (!data.theme) {
          data.theme = DEFAULT_CONFIG.theme;
        }
        setConfig(data);
        initializeActiveSection(data);
      })
      .catch((err) => {
        console.warn("Could not fetch public/feather-docs.json, using fallback default config.", err);
        setConfig(DEFAULT_CONFIG);
        initializeActiveSection(DEFAULT_CONFIG);
      });
  }, []);

  useEffect(() => {
    if (!config || !config.theme) return;

    const root = document.documentElement;
    const theme = config.theme;

    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--primary-contrast-color', getContrastColor(theme.primaryColor));
    root.style.setProperty('--background-color', theme.backgroundColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--sidebar-color', theme.sidebarColor);
    root.style.setProperty('--border-color', theme.borderColor);
    root.style.setProperty('--border-width', borderWidth);
    root.style.setProperty('--border-radius', borderRadius);

    let fontValue = "'VT323', monospace";
    if (theme.fontFamily === 'inter') {
      fontValue = "'Inter', sans-serif";
    } else if (theme.fontFamily === 'courier') {
      fontValue = "'Courier Prime', monospace";
    }
    root.style.setProperty('--font-family', fontValue);

    let shadowValue = `var(--border-width) var(--border-width) 0px ${theme.borderColor}`;
    if (theme.name.includes('Modern')) {
      shadowValue = "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)";
    } else if (theme.borderColor === 'transparent' || parseInt(borderWidth) === 0) {
      shadowValue = "none";
    }
    root.style.setProperty('--shadow', shadowValue);
  }, [config?.theme, borderWidth, borderRadius]);

  useEffect(() => {
    if (!config || !favicon) return;

    let faviconUrl = favicon.trim();
    const isEmoji = /\p{Emoji}/u.test(favicon) && favicon.trim().length <= 4;
    
    if (isEmoji) {
      faviconUrl = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>${favicon.trim()}</text></svg>`;
    }

    let linkEl = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'icon';
      document.head.appendChild(linkEl);
    }
    linkEl.href = faviconUrl;
  }, [config?.favicon, favicon]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const container = document.querySelector('.search-container');
      if (container && !container.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);



  const selectSection = (id: string, clearReferrer = true) => {
    setActiveSectionId(id);
    if (clearReferrer) {
      setReferrerSection(null);
    }
    
    const newUrl = `${window.location.pathname}?section=${id}`;
    window.history.pushState(null, '', newUrl);
  };

  useEffect(() => {
    const handlePopState = () => {
      if (!config) return;
      const params = new URLSearchParams(window.location.search);
      const sectionParam = params.get('section');
      if (sectionParam && config.sections.some(s => s.id === sectionParam)) {
        setActiveSectionId(sectionParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [config]);

  const handleInternalLinkClick = (targetId: string) => {
    if (!config) return;

    const matchedSection = config.sections.find(s => s.id === targetId);
    if (matchedSection) {
      const currentSection = config.sections.find(s => s.id === activeSectionId);
      if (currentSection) {
        setReferrerSection({ id: activeSectionId, title: currentSection.title });
      }
      selectSection(targetId, false);
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#${targetId}`);
      }
    }
  };

  const handleReturnRedirect = () => {
    if (referrerSection) {
      selectSection(referrerSection.id, true);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleConfigChange = (newConfig: ProjectConfig) => {
    setConfig(newConfig);
    if (isLocalhost) {
      localStorage.setItem('feather_docs_draft', JSON.stringify(newConfig));
    }
  };

  const handleResetDraft = () => {
    if (window.confirm("Are you sure you want to discard your draft? This reverts to the published feather-docs.json file.")) {
      localStorage.removeItem('feather_docs_draft');
      fetch('/feather-docs.json')
        .then((res) => {
          if (!res.ok) throw new Error("File not found");
          return res.json();
        })
        .then((data: ProjectConfig) => {
          setConfig(data);
          initializeActiveSection(data);
          showToast("Reset to published config!");
        })
        .catch(() => {
          setConfig(DEFAULT_CONFIG);
          initializeActiveSection(DEFAULT_CONFIG);
          showToast("Reset to default config!");
        });
    }
  };

  const getSearchSnippet = (content: string, query: string) => {
    const idx = content.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) {
      return content.slice(0, 60) + (content.length > 60 ? '...' : '');
    }
    const start = Math.max(0, idx - 20);
    const end = Math.min(content.length, idx + 40);
    return (start > 0 ? '...' : '') + content.slice(start, end).replace(/\s+/g, ' ') + (end < content.length ? '...' : '');
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const getHighlightedHtml = (text: string, query: string) => {
    if (!query.trim()) return escapeHtml(text);
    const escapedQuery = query.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
  };

  const activeSection = config.sections.find(s => s.id === activeSectionId) || config.sections[0];

  const searchResults = searchQuery.trim()
    ? config.sections
        .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.content.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(s => ({
          id: s.id,
          title: s.title,
          icon: s.icon,
          snippet: getSearchSnippet(s.content, searchQuery)
        }))
    : [];


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex(prev => Math.min(searchResults.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
        selectSection(searchResults[selectedResultIndex].id);
        setSearchQuery('');
        setIsSearchFocused(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchFocused(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('docs-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const isCustomLogoImage = logoIcon && (logoIcon.startsWith('data:image/') || logoIcon.startsWith('http') || logoIcon.startsWith('/'));

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <h1 className="sidebar-logo" style={{ display: 'flex', alignItems: 'center' }}>
              {logoIcon && (
                isCustomLogoImage ? (
                  <img 
                    src={logoIcon} 
                    alt="Logo" 
                    style={{ height: '32px', width: 'auto', marginRight: '8px', objectFit: 'contain', borderRadius: borderRadius }} 
                  />
                ) : (
                  <i className={logoIcon} style={{ marginRight: '8px' }}></i>
                )
              )}
              {config.logoText}
            </h1>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>Docs Generator</span>
          </div>

          <nav className="sidebar-nav">
            {config.sections.map((section) => (
              <button
                key={section.id}
                className={`nav-item ${section.id === activeSectionId ? 'active' : ''}`}
                onClick={() => selectSection(section.id)}
              >
                <span className="nav-item-content">
                  <i className={section.icon || 'fa-solid fa-file'}></i>
                  {section.title}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {isLocalhost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Local host machine controls:</span>
            <button 
              className="btn btn-primary" 
              onClick={() => setEditMode(!editMode)}
              style={{ width: '100%' }}
            >
              <i className={editMode ? 'fa-solid fa-eye' : 'fa-solid fa-pen-to-square'}></i>
              {editMode ? 'View Reader Mode' : 'Open Editor Panel'}
            </button>
            {editMode && (
              <button 
                className="btn btn-danger" 
                onClick={handleResetDraft}
                style={{ width: '100%' }}
              >
                <i className="fa-solid fa-rotate-left"></i> Discard Local Draft
              </button>
            )}
          </div>
        )}
      </aside>

      <div className="main-wrapper">
        <header className="content-header">
          <div className="search-container">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              id="docs-search-input"
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedResultIndex(-1);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleKeyDown}
            />
            <span className="search-shortcut">Ctrl K</span>
            
            {isSearchFocused && searchQuery.trim() && (
              <div className="search-results-dropdown">
                {searchResults.length === 0 ? (
                  <div className="search-no-results">No results found</div>
                ) : (
                  searchResults.map((result, idx) => (
                    <button
                      key={result.id}
                      className={`search-result-item ${idx === selectedResultIndex ? 'selected' : ''}`}
                      onClick={() => {
                        selectSection(result.id);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                    >
                      <div 
                        className="search-result-title"
                        dangerouslySetInnerHTML={{ __html: `${result.icon ? `<i class="${result.icon}"></i>` : ''} ${getHighlightedHtml(result.title, searchQuery)}` }}
                      />
                      <div 
                        className="search-result-snippet"
                        dangerouslySetInnerHTML={{ __html: getHighlightedHtml(result.snippet, searchQuery) }}
                      />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </header>

        <ReturnBanner 
          referrerSection={referrerSection} 
          onReturn={handleReturnRedirect} 
          onClose={() => setReferrerSection(null)} 
        />

        <main style={{ flexGrow: 1 }}>
          {activeSection ? (
            <DocReader 
              activeSection={activeSection} 
              showToast={showToast} 
              onInternalLinkClick={handleInternalLinkClick} 
            />
          ) : (
            <div className="content-container">
              <h2>Select a documentation page from the sidebar to begin.</h2>
            </div>
          )}
        </main>

        <footer className="footer">
          <span>Copyright © {new Date().getFullYear()} Feather Documentation Authors.</span>
          <span>•</span>
          <span style={{ fontStyle: 'italic' }}>Open source under MIT License.</span>
        </footer>
      </div>

      {editMode && isLocalhost && (
        <DocEditor
          config={config}
          activeSectionId={activeSectionId}
          onChangeConfig={handleConfigChange}
          showToast={showToast}
        />
      )}

      {toastMessage && (
        <div className="toast-alert">
          <i className="fa-solid fa-check-circle" style={{ marginRight: '8px' }}></i>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;