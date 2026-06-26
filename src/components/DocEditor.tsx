import React, { useState, useRef } from 'react';
import type { ProjectConfig, ThemeConfig, DocSection } from '../types';
import { THEME_PRESETS } from '../themePresets';
import { validateImageFile, getContrastColor } from '../utils/security';

interface DocEditorProps {
  config: ProjectConfig;
  activeSectionId: string;
  onChangeConfig: (newConfig: ProjectConfig) => void;
  showToast: (message: string) => void;
}

export const DocEditor: React.FC<DocEditorProps> = ({
  config,
  activeSectionId,
  onChangeConfig,
  showToast,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'all' | 'corporate' | 'gamedev' | 'personal' | 'retro' | 'minimalist'>('all');
  const [modalSearch, setModalSearch] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoIconInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const activeSection = config.sections.find(s => s.id === activeSectionId) || config.sections[0];
  
  const logoIcon = config.logoIcon || '';
  const favicon = config.favicon || '';
  const theme = config.theme || THEME_PRESETS['slate-corporate-modern'];
  const borderWidth = theme.borderWidth || '0px';
  const borderRadius = theme.borderRadius || '0px';

  const updateTheme = (updatedFields: Partial<ThemeConfig>) => {
    const updatedTheme = { ...theme, ...updatedFields };
    
    if (updatedTheme.name !== 'custom') {
      const presetMatches = Object.values(THEME_PRESETS).find((preset) => {
        return (
          preset.primaryColor === updatedTheme.primaryColor &&
          preset.backgroundColor === updatedTheme.backgroundColor &&
          preset.textColor === updatedTheme.textColor &&
          preset.sidebarColor === updatedTheme.sidebarColor &&
          preset.borderColor === updatedTheme.borderColor &&
          preset.fontFamily === updatedTheme.fontFamily &&
          preset.iconStyle === updatedTheme.iconStyle &&
          preset.borderWidth === updatedTheme.borderWidth &&
          preset.borderRadius === updatedTheme.borderRadius
        );
      });
      if (!presetMatches) {
        updatedTheme.name = 'custom';
      }
    }

    onChangeConfig({
      ...config,
      theme: updatedTheme
    });
  };

  const updateActiveSection = (updatedFields: Partial<DocSection>) => {
    const updatedSections = config.sections.map((sec) => {
      if (sec.id === activeSectionId) {
        return { ...sec, ...updatedFields };
      }
      return sec;
    });
    onChangeConfig({ ...config, sections: updatedSections });
  };

  const handlePresetSelect = (presetId: string) => {
    onChangeConfig({
      ...config,
      theme: THEME_PRESETS[presetId]
    });
    setIsPresetModalOpen(false);
    showToast(`Applied theme preset: ${THEME_PRESETS[presetId].name}`);
  };

  const handleAddSection = () => {
    const newId = `section-${Date.now()}`;
    const newSection: DocSection = {
      id: newId,
      title: "New Documentation Page",
      icon: "fa-solid fa-file",
      content: "# New Page\n\nStart writing your content here..."
    };
    onChangeConfig({
      ...config,
      sections: [...config.sections, newSection]
    });
    showToast("Added new documentation section!");
  };

  const handleDeleteSection = () => {
    if (config.sections.length <= 1) {
      showToast("Cannot delete the only remaining page!");
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${activeSection.title}"?`)) {
      const updatedSections = config.sections.filter(s => s.id !== activeSectionId);
      onChangeConfig({
        ...config,
        sections: updatedSections
      });
      showToast("Deleted page.");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    try {
      await validateImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const base64Url = event.target.result as string;
          const imgMarkdown = `\n![Uploaded Image](${base64Url})\n`;
          
          insertTextAtCursor(imgMarkdown);
          showToast("Successfully uploaded and inserted image!");
        }
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "File upload failed.");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleLogoIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await validateImageFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            onChangeConfig({
              ...config,
              logoIcon: event.target.result as string
            });
            showToast("Successfully uploaded logo icon!");
          }
        };
        reader.readAsDataURL(file);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Logo upload failed.");
      }
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await validateImageFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            onChangeConfig({
              ...config,
              favicon: event.target.result as string
            });
            showToast("Successfully uploaded favicon!");
          }
        };
        reader.readAsDataURL(file);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Favicon upload failed.");
      }
    }
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateActiveSection({ content: activeSection.content + text });
      return;
    }

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const oldContent = activeSection.content;
    const newContent = oldContent.substring(0, startPos) + text + oldContent.substring(endPos);
    
    updateActiveSection({ content: newContent });

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handlePublish = () => {
    const configData = JSON.stringify(config, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feather-docs.json';
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast("Downloaded config! Move it to your repo's public/ folder.");
  };

  const currentPresetName = theme.name;

  const filteredPresetEntries = Object.entries(THEME_PRESETS).filter(([id, preset]) => {
    const matchesSearch = preset.name.toLowerCase().includes(modalSearch.toLowerCase());
    
    if (modalTab === 'all') return matchesSearch;
    if (modalTab === 'corporate') return matchesSearch && id.includes('corporate');
    if (modalTab === 'gamedev') return matchesSearch && (id.includes('pixel-pink') || id.includes('cyberpunk') || id.includes('matrix') || id.includes('vaporwave') || id.includes('lava'));
    if (modalTab === 'personal') return matchesSearch && (id.includes('sakura') || id.includes('matcha') || id.includes('cozy') || id.includes('lavender') || id.includes('peach'));
    if (modalTab === 'retro') return matchesSearch && (id.includes('terminal') || id.includes('c64') || id.includes('vintage') || id.includes('macintosh'));
    if (modalTab === 'minimalist') return matchesSearch && (id.includes('slate-corporate-minimal') || id.includes('charcoal-minimal') || id.includes('slate-corporate-outline') || id.includes('minimal'));
    
    return matchesSearch;
  });

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <span className="editor-title">Editor panel</span>
      </div>

      <div className="editor-group">
        <label className="editor-label">Documentation title</label>
        <input 
          type="text" 
          className="editor-input" 
          value={config.title}
          onChange={(e) => onChangeConfig({ ...config, title: e.target.value })}
        />
      </div>

      <div className="editor-group">
        <label className="editor-label">Logo text</label>
        <input 
          type="text" 
          className="editor-input" 
          value={config.logoText}
          onChange={(e) => onChangeConfig({ ...config, logoText: e.target.value })}
        />
      </div>

      <div className="editor-group">
        <label className="editor-label">Logo icon (FontAwesome class or image)</label>
        <div className="upload-row">
          <input 
            type="text" 
            className="editor-input" 
            placeholder="fa-solid fa-feather"
            value={logoIcon.startsWith('data:image/') ? '[Custom Image Upload]' : logoIcon}
            onChange={(e) => onChangeConfig({ ...config, logoIcon: e.target.value })}
            disabled={logoIcon.startsWith('data:image/')}
          />
          <button 
            type="button" 
            className="btn" 
            onClick={() => logoIconInputRef.current?.click()}
            title="Upload logo image"
          >
            <i className="fa-solid fa-upload"></i>
          </button>
          {logoIcon.startsWith('data:image/') && (
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={() => onChangeConfig({ ...config, logoIcon: 'fa-solid fa-feather' })}
              title="Reset icon"
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          )}
          <input 
            type="file" 
            ref={logoIconInputRef} 
            onChange={handleLogoIconUpload} 
            accept="image/png, image/jpeg, image/gif, image/webp" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      <div className="editor-group">
        <label className="editor-label">Favicon (Emoji, URL or image)</label>
        <div className="upload-row">
          <input 
            type="text" 
            className="editor-input" 
            placeholder="🪶"
            value={favicon.startsWith('data:image/') ? '[Custom Image Upload]' : favicon}
            onChange={(e) => onChangeConfig({ ...config, favicon: e.target.value })}
            disabled={favicon.startsWith('data:image/')}
          />
          <button 
            type="button" 
            className="btn" 
            onClick={() => faviconInputRef.current?.click()}
            title="Upload favicon image"
          >
            <i className="fa-solid fa-upload"></i>
          </button>
          {favicon.startsWith('data:image/') && (
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={() => onChangeConfig({ ...config, favicon: '🪶' })}
              title="Reset favicon"
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          )}
          <input 
            type="file" 
            ref={faviconInputRef} 
            onChange={handleFaviconUpload} 
            accept="image/png, image/jpeg, image/gif, image/webp, image/x-icon" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      <div className="editor-group">
        <label className="editor-label">Theme preset: {currentPresetName}</label>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={() => setIsPresetModalOpen(true)}
          style={{ width: '100%' }}
        >
          <i className="fa-solid fa-palette"></i> Select theme preset
        </button>
      </div>

      <div className="editor-group">
        <label className="editor-label">Fine-tune colors</label>
        <div className="color-pickers">
          <div className="color-picker-item">
            <span style={{ fontSize: '13px' }}>Primary Accent</span>
            <div className="color-input-container">
              <input 
                type="color" 
                value={theme.primaryColor} 
                onChange={(e) => updateTheme({ primaryColor: e.target.value })} 
              />
              <span>{theme.primaryColor}</span>
            </div>
          </div>
          <div className="color-picker-item">
            <span style={{ fontSize: '13px' }}>Background</span>
            <div className="color-input-container">
              <input 
                type="color" 
                value={theme.backgroundColor} 
                onChange={(e) => updateTheme({ backgroundColor: e.target.value })} 
              />
              <span>{theme.backgroundColor}</span>
            </div>
          </div>
          <div className="color-picker-item">
            <span style={{ fontSize: '13px' }}>Text Color</span>
            <div className="color-input-container">
              <input 
                type="color" 
                value={theme.textColor} 
                onChange={(e) => updateTheme({ textColor: e.target.value })} 
              />
              <span>{theme.textColor}</span>
            </div>
          </div>
          <div className="color-picker-item">
            <span style={{ fontSize: '13px' }}>Sidebar Background</span>
            <div className="color-input-container">
              <input 
                type="color" 
                value={theme.sidebarColor} 
                onChange={(e) => updateTheme({ sidebarColor: e.target.value })} 
              />
              <span>{theme.sidebarColor}</span>
            </div>
          </div>
          <div className="color-picker-item" style={{ gridColumn: 'span 2' }}>
            <span style={{ fontSize: '13px' }}>Border Lines</span>
            <div className="color-input-container">
              <input 
                type="color" 
                value={theme.borderColor} 
                onChange={(e) => updateTheme({ borderColor: e.target.value })} 
              />
              <span>{theme.borderColor}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="editor-group">
        <label className="editor-label">Font family</label>
        <select 
          className="editor-select" 
          value={theme.fontFamily}
          onChange={(e) => updateTheme({ fontFamily: e.target.value as 'vt323' | 'inter' | 'courier' })}
        >
          <option value="vt323">VT323 (Pixel Art)</option>
          <option value="inter">Inter (Modern Sans)</option>
          <option value="courier">Courier (Monospace)</option>
        </select>
      </div>

      <div className="editor-group">
        <label className="editor-label">Layout and styling</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '12px' }}>Border Size ({theme.borderColor === 'transparent' ? '0px' : borderWidth})</span>
            <input 
              type="range" 
              min="0" 
              max="8" 
              value={parseInt(borderWidth)} 
              onChange={(e) => updateTheme({ borderWidth: `${e.target.value}px` })}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '12px' }}>Corner Radius ({borderRadius})</span>
            <input 
              type="range" 
              min="0" 
              max="24" 
              value={parseInt(borderRadius)} 
              onChange={(e) => updateTheme({ borderRadius: `${e.target.value}px` })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '16px' }} className="editor-group">
        <label className="editor-label">Edit page: {activeSection.title}</label>
        <span style={{ fontSize: '13px' }}>Page Title</span>
        <input 
          type="text" 
          className="editor-input" 
          value={activeSection.title}
          onChange={(e) => updateActiveSection({ title: e.target.value })}
        />
      </div>

      <div className="editor-group">
        <span style={{ fontSize: '13px' }}>Page Icon (FontAwesome class)</span>
        <input 
          type="text" 
          className="editor-input" 
          placeholder="fa-solid fa-file"
          value={activeSection.icon}
          onChange={(e) => updateActiveSection({ icon: e.target.value })}
        />
      </div>

      <div className="editor-group">
        <span style={{ fontSize: '13px' }}>Page Content (Markdown)</span>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={activeSection.content}
          onChange={(e) => updateActiveSection({ content: e.target.value })}
        />
      </div>

      <div className="editor-group">
        <span style={{ fontSize: '13px' }}>Add Image (Drag & Drop or Upload)</span>
        <div 
          className={`drop-zone-overlay ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="drop-zone-icon">
            <i className="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Drag & Drop Image Here
          </span>
          <span style={{ fontSize: '12px', margin: '8px 0' }}>or</span>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            Choose File
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/gif, image/webp" 
            style={{ display: 'none' }} 
          />
          <span style={{ fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>
            PNG, JPG, GIF, WebP (Max 2MB). SVGs blocked.
          </span>
        </div>
      </div>

      <div className="editor-group" style={{ flexDirection: 'row', gap: '8px' }}>
        <button className="btn" style={{ flex: 1 }} onClick={handleAddSection}>
          <i className="fa-solid fa-plus"></i> Add Page
        </button>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteSection}>
          <i className="fa-solid fa-trash"></i> Delete Page
        </button>
      </div>

      <button 
        className="btn btn-primary" 
        style={{ width: '100%', padding: '14px', marginTop: '8px' }}
        onClick={handlePublish}
      >
        <i className="fa-solid fa-cloud-arrow-down"></i> Publish changes
      </button>
      
      <p style={{ fontSize: '11px', textAlign: 'center', opacity: 0.8, marginTop: '-8px' }}>
        Downloads <strong>feather-docs.json</strong>.<br />
        Overwrite the file in <code>public/</code> to save changes.
      </p>

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

              <div className="modal-tabs">
                <button type="button" className={`modal-tab-btn ${modalTab === 'all' ? 'active' : ''}`} onClick={() => setModalTab('all')}>All</button>
                <button type="button" className={`modal-tab-btn ${modalTab === 'corporate' ? 'active' : ''}`} onClick={() => setModalTab('corporate')}>Corporate</button>
                <button type="button" className={`modal-tab-btn ${modalTab === 'gamedev' ? 'active' : ''}`} onClick={() => setModalTab('gamedev')}>Game Dev</button>
                <button type="button" className={`modal-tab-btn ${modalTab === 'personal' ? 'active' : ''}`} onClick={() => setModalTab('personal')}>Personal</button>
                <button type="button" className={`modal-tab-btn ${modalTab === 'retro' ? 'active' : ''}`} onClick={() => setModalTab('retro')}>Retro</button>
                <button type="button" className={`modal-tab-btn ${modalTab === 'minimalist' ? 'active' : ''}`} onClick={() => setModalTab('minimalist')}>Minimalist</button>
              </div>

              <div className="theme-presets-grid">
                {filteredPresetEntries.map(([id, preset]) => (
                  <button
                    key={id}
                    type="button"
                    className={`theme-square-card ${theme?.name === preset.name ? 'active' : ''}`}
                    onClick={() => handlePresetSelect(id)}
                  >
                    <div className="mini-homepage-preview" style={{
                      fontFamily: preset.fontFamily === 'inter' ? "'Inter', sans-serif" : preset.fontFamily === 'courier' ? "'Courier Prime', monospace" : "'VT323', monospace",
                      backgroundColor: preset.backgroundColor,
                      color: preset.textColor,
                      borderColor: preset.borderColor,
                      borderWidth: '1.5px',
                      borderRadius: preset.borderRadius === '12px' ? '3px' : preset.borderRadius === '8px' ? '2px' : '0px',
                      borderStyle: 'solid'
                    }}>
                      <div className="mini-sidebar" style={{
                        backgroundColor: preset.sidebarColor,
                        borderColor: preset.borderColor,
                        borderRightWidth: '1.5px',
                        borderRightStyle: 'solid'
                      }}>
                        <div className="mini-sidebar-header">
                          <div className="mini-logo-dot" style={{ backgroundColor: preset.primaryColor }} />
                          <div className="mini-logo-text" style={{ backgroundColor: preset.textColor }} />
                        </div>
                        <div className="mini-sidebar-nav">
                          <div className="mini-nav-item active" style={{
                            backgroundColor: preset.primaryColor,
                            color: getContrastColor(preset.primaryColor)
                          }}>
                            <div className="mini-nav-icon" style={{ backgroundColor: getContrastColor(preset.primaryColor) }} />
                            <div className="mini-nav-text" style={{ backgroundColor: getContrastColor(preset.primaryColor) }} />
                          </div>
                          <div className="mini-nav-item" style={{ color: preset.textColor }}>
                            <div className="mini-nav-icon" style={{ backgroundColor: preset.textColor, opacity: 0.6 }} />
                            <div className="mini-nav-text" style={{ backgroundColor: preset.textColor, opacity: 0.6 }} />
                          </div>
                        </div>
                        <div className="mini-sidebar-footer">
                          <div className="mini-btn-primary" style={{ backgroundColor: preset.primaryColor }} />
                        </div>
                      </div>
                      <div className="mini-main">
                        <div className="mini-header" style={{
                          borderColor: preset.borderColor,
                          borderBottomWidth: '1.5px',
                          borderBottomStyle: 'solid',
                          backgroundColor: preset.sidebarColor
                        }}>
                          <div className="mini-search-bar" style={{
                            borderColor: preset.borderColor,
                            borderWidth: '0.75px',
                            borderStyle: 'solid'
                          }}>
                            <div className="mini-search-icon" style={{ backgroundColor: preset.textColor, opacity: 0.5 }} />
                            <div className="mini-search-text" style={{ backgroundColor: preset.textColor, opacity: 0.2 }} />
                          </div>
                        </div>
                        <div className="mini-content-body">
                          <div className="mini-heading" style={{
                            backgroundColor: preset.primaryColor
                          }} />
                          <div className="mini-line" style={{ backgroundColor: preset.textColor, opacity: 0.8 }} />
                          <div className="mini-line" style={{ backgroundColor: preset.textColor, opacity: 0.8 }} />
                          <div className="mini-line short" style={{ backgroundColor: preset.textColor, opacity: 0.8 }} />
                        </div>
                        <div className="mini-footer" style={{
                          backgroundColor: preset.sidebarColor,
                          borderColor: preset.borderColor,
                          borderTopWidth: '0.75px',
                          borderTopStyle: 'solid'
                        }}>
                          <div className="mini-footer-text" style={{ backgroundColor: preset.textColor, opacity: 0.4 }} />
                        </div>
                      </div>
                    </div>
                    <span className="theme-card-name">{preset.name}</span>
                  </button>
                ))}
                {filteredPresetEntries.length === 0 && (
                  <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '16px', fontSize: '15px' }}>
                    No presets match your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};