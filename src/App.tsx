import { useState, useEffect } from 'react';
import type { ProjectConfig } from './types';
import { DEFAULT_CONFIG } from './defaultConfig';
import { DocReader } from './components/DocReader';
import { DocEditor } from './components/DocEditor';
import { ReturnBanner } from './components/ReturnBanner';
import { getContrastColor } from './utils/security';

const LANGUAGES = [
  { code: 'en', flag: 'us', label: 'English' },
  { code: 'es', flag: 'es', label: 'Español' },
  { code: 'fr', flag: 'fr', label: 'Français' },
  { code: 'de', flag: 'de', label: 'Deutsch' },
  { code: 'it', flag: 'it', label: 'Italiano' },
  { code: 'pt', flag: 'pt', label: 'Português' },
  { code: 'nl', flag: 'nl', label: 'Nederlands' },
  { code: 'ru', flag: 'ru', label: 'Русский' },
  { code: 'zh', flag: 'cn', label: '中文' },
  { code: 'ja', flag: 'jp', label: '日本語' },
  { code: 'ko', flag: 'kr', label: '한국어' },
  { code: 'ar', flag: 'sa', label: 'العربية' },
  { code: 'hi', flag: 'in', label: 'हिन्दी' },
  { code: 'bn', flag: 'bd', label: 'বাংলা' },
  { code: 'tr', flag: 'tr', label: 'Türkçe' },
  { code: 'vi', flag: 'vn', label: 'Tiếng Việt' },
  { code: 'pl', flag: 'pl', label: 'Polski' },
  { code: 'sv', flag: 'se', label: 'Svenska' },
  { code: 'no', flag: 'no', label: 'Norsk' },
  { code: 'da', flag: 'dk', label: 'Dansk' }
];

const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    search: "Search docs...",
    onThisPage: "On this page",
    next: "Next",
    prev: "Previous",
    copyright: "Copyright",
    logoText: "Docs Generator",
    editorPanel: "Doc Editor Panel",
    localhostMachineControls: "Local host machine controls:",
    viewReaderMode: "View Reader Mode",
    openEditorPanel: "Open Editor Panel",
    discardLocalDraft: "Discard Local Draft",
    selectPage: "Select a documentation page from the sidebar to begin."
  },
  es: {
    search: "Buscar documentación...",
    onThisPage: "En esta página",
    next: "Siguiente",
    prev: "Anterior",
    copyright: "Derechos de autor",
    logoText: "Generador de Docs",
    editorPanel: "Panel de Editor",
    localhostMachineControls: "Controles de máquina local:",
    viewReaderMode: "Ver Modo Lector",
    openEditorPanel: "Abrir Panel Editor",
    discardLocalDraft: "Descartar Borrador Local",
    selectPage: "Seleccione una página del menú lateral para comenzar."
  },
  fr: {
    search: "Rechercher...",
    onThisPage: "Sur cette page",
    next: "Suivant",
    prev: "Précédent",
    copyright: "Droit d'auteur",
    logoText: "Générateur de Docs",
    editorPanel: "Panneau d'Édition",
    localhostMachineControls: "Contrôles de machine locale:",
    viewReaderMode: "Voir Mode Lecteur",
    openEditorPanel: "Ouvrir le Panneau",
    discardLocalDraft: "Ignorer le Brouillon",
    selectPage: "Sélectionnez une page dans la barre latérale pour commencer."
  },
  de: {
    search: "Dokumente durchsuchen...",
    onThisPage: "Auf dieser Seite",
    next: "Weiter",
    prev: "Zurück",
    copyright: "Urheberrecht",
    logoText: "Dokumenten-Generator",
    editorPanel: "Editor-Panel",
    localhostMachineControls: "Lokale Kontrollen:",
    viewReaderMode: "Lesermodus anzeigen",
    openEditorPanel: "Editor-Panel öffnen",
    discardLocalDraft: "Lokalen Entwurf verwerfen",
    selectPage: "Wählen Sie eine Dokumentationsseite aus der Seitenleiste aus, um zu beginnen."
  },
  it: {
    search: "Cerca nei documenti...",
    onThisPage: "In questa pagina",
    next: "Successivo",
    prev: "Precedente",
    copyright: "Diritto d'autore",
    logoText: "Generatore di documenti",
    editorPanel: "Pannello editor",
    localhostMachineControls: "Controlli host locale:",
    viewReaderMode: "Visualizza modalità lettore",
    openEditorPanel: "Apri pannello editor",
    discardLocalDraft: "Scarta bozza locale",
    selectPage: "Seleziona una pagina di documentazione dalla barra laterale per iniziare."
  },
  pt: {
    search: "Pesquisar documentos...",
    onThisPage: "Nesta página",
    next: "Próximo",
    prev: "Anterior",
    copyright: "Direitos autorais",
    logoText: "Gerador de documentos",
    editorPanel: "Painel do editor",
    localhostMachineControls: "Controles do host local:",
    viewReaderMode: "Visualizar modo leitor",
    openEditorPanel: "Abrir painel do editor",
    discardLocalDraft: "Descartar rascunho local",
    selectPage: "Selecione uma página de documentação na barra lateral para começar."
  },
  nl: {
    search: "Zoeken in documenten...",
    onThisPage: "Op deze pagina",
    next: "Volgende",
    prev: "Vorige",
    copyright: "Auteursrecht",
    logoText: "Documentatiegenerator",
    editorPanel: "Editorpaneel",
    localhostMachineControls: "Lokale hostbesturingselementen:",
    viewReaderMode: "Lezersmodus bekijken",
    openEditorPanel: "Editorpaneel openen",
    discardLocalDraft: "Lokaal concept weggooien",
    selectPage: "Selecteer een documentatiepagina in de zijbalk om te beginnen."
  },
  ru: {
    search: "Поиск документов...",
    onThisPage: "На этой странице",
    next: "Вперед",
    prev: "Назад",
    copyright: "Авторские права",
    logoText: "Генератор документации",
    editorPanel: "Панель редактора",
    localhostMachineControls: "Локальные элементы управления:",
    viewReaderMode: "Режим просмотра",
    openEditorPanel: "Открыть панель редактора",
    discardLocalDraft: "Удалить локальный черновик",
    selectPage: "Выберите страницу документации в боковой панели, чтобы начать."
  },
  zh: {
    search: "搜索文档...",
    onThisPage: "当前页面",
    next: "下一页",
    prev: "上一页",
    copyright: "版权所有",
    logoText: "文档生成器",
    editorPanel: "编辑器面板",
    localhostMachineControls: "本地主机控制:",
    viewReaderMode: "查看读者模式",
    openEditorPanel: "打开编辑器面板",
    discardLocalDraft: "放弃本地草稿",
    selectPage: "从侧边栏中选择一个文档页面开始。"
  },
  ja: {
    search: "ドキュメントを検索...",
    onThisPage: "このページの内容",
    next: "次へ",
    prev: "前へ",
    copyright: "著作権",
    logoText: "ドキュメントジェネレーター",
    editorPanel: "エディターパネル",
    localhostMachineControls: "ローカルホスト制御:",
    viewReaderMode: "リーダーモードを表示",
    openEditorPanel: "エディターパネルを開く",
    discardLocalDraft: "ローカル下書きを破棄",
    selectPage: "開始するには、サイドバーからドキュメントページを選択してください。"
  },
  ko: {
    search: "문서 검색...",
    onThisPage: "이 페이지 목록",
    next: "다음",
    prev: "이전",
    copyright: "저작권",
    logoText: "문서 생성기",
    editorPanel: "편집기 패널",
    localhostMachineControls: "로컬 호스트 제어:",
    viewReaderMode: "독자 모드 보기",
    openEditorPanel: "편집기 패널 열기",
    discardLocalDraft: "로컬 임시 저장 삭제",
    selectPage: "시작하려면 사이드바에서 문서 페이지를 선택하세요."
  },
  ar: {
    search: "البحث في المستندات...",
    onThisPage: "في هذه الصفحة",
    next: "التالي",
    prev: "السابق",
    copyright: "حقوق النشر",
    logoText: "مولد المستندات",
    editorPanel: "لوحة المحرر",
    localhostMachineControls: "عناصر تحكم المضيف المحلي:",
    viewReaderMode: "عرض وضع القارئ",
    openEditorPanel: "افتح لوحة المحرر",
    discardLocalDraft: "تجاهل المسودة المحلية",
    selectPage: "حدد صفحة توثيق من الشريط الجانبي للبدء."
  },
  hi: {
    search: "दस्तावेज़ खोजें...",
    onThisPage: "इस पृष्ठ पर",
    next: "अगला",
    prev: "पिछला",
    copyright: "कॉपीराइट",
    logoText: "दस्तावेज़ जनरेटर",
    editorPanel: "संपादक पैनल",
    localhostMachineControls: "स्थानीय होस्ट नियंत्रण:",
    viewReaderMode: "रीडर मोड देखें",
    openEditorPanel: "संपादक पैनल खोलें",
    discardLocalDraft: "स्थानीय मसौदा खारिज करें",
    selectPage: "शुरू करने के लिए साइडबार से एक दस्तावेज़ पृष्ठ चुनें।"
  },
  bn: {
    search: "নথি খুঁজুন...",
    onThisPage: "এই পৃষ্ঠায়",
    next: "পরবর্তী",
    prev: "পূর্ববর্তী",
    copyright: "কপিরাইট",
    logoText: "নথি জেনারেটর",
    editorPanel: "সম্পাদক প্যানেল",
    localhostMachineControls: "স্থানীয় হোস্ট নিয়ন্ত্রণ:",
    viewReaderMode: "রিডার মোড দেখুন",
    openEditorPanel: "সম্পাদক প্যানেল খুলুন",
    discardLocalDraft: "স্থানীয় খসড়া বাতিল করুন",
    selectPage: "শुरू করতে সাইডবার থেকে একটি ডকুমেন্ট পৃষ্ঠা নির্বাচন করুন।"
  },
  tr: {
    search: "Belgelerde ara...",
    onThisPage: "Bu sayfada",
    next: "Sonraki",
    prev: "Önceki",
    copyright: "Telif hakkı",
    logoText: "Belge Oluşturucu",
    editorPanel: "Editör Paneli",
    localhostMachineControls: "Yerel ana bilgisayar kontrolleri:",
    viewReaderMode: "Okuyucu Modunu Görüntüle",
    openEditorPanel: "Editör Panelini Aç",
    discardLocalDraft: "Yerel Taslağı Sil",
    selectPage: "Başlamak için yan menüden bir belge sayfası seçin."
  },
  vi: {
    search: "Tìm kiếm tài liệu...",
    onThisPage: "Trên trang này",
    next: "Tiếp theo",
    prev: "Trước",
    copyright: "Bản quyền",
    logoText: "Trình tạo tài liệu",
    editorPanel: "Bảng biên tập",
    localhostMachineControls: "Kiểm soát máy chủ cục bộ:",
    viewReaderMode: "Xem chế độ người đọc",
    openEditorPanel: "Mở bảng biên tập",
    discardLocalDraft: "Hủy bản nháp cục bộ",
    selectPage: "Chọn một trang tài liệu từ thanh bên để bắt đầu."
  },
  pl: {
    search: "Szukaj dokumentów...",
    onThisPage: "Na tej stronie",
    next: "Następny",
    prev: "Poprzedni",
    copyright: "Prawo autorskie",
    logoText: "Generator dokumentów",
    editorPanel: "Panel edytora",
    localhostMachineControls: "Lokalne sterowanie hostem:",
    viewReaderMode: "Wyświetl tryb czytelnika",
    openEditorPanel: "Otwórz panel edytora",
    discardLocalDraft: "Odrzuć lokalny szkic",
    selectPage: "Wybierz stronę dokumentacji z paska bocznego, aby rozpocząć."
  },
  sv: {
    search: "Sök i dokument...",
    onThisPage: "På denna sida",
    next: "Nästa",
    prev: "Föregående",
    copyright: "Upphovsrätt",
    logoText: "Dokumentationsgenerator",
    editorPanel: "Editor-panel",
    localhostMachineControls: "Lokala värdkontroller:",
    viewReaderMode: "Visa läsarläge",
    openEditorPanel: "Öppna editor-panelen",
    discardLocalDraft: "Släng lokalt utkast",
    selectPage: "Välj en dokumentationssida från sidofältet för att börja."
  },
  no: {
    search: "Søk i dokumenter...",
    onThisPage: "På denne siden",
    next: "Neste",
    prev: "Forrige",
    copyright: "Opphavsrett",
    logoText: "Dokumentasjonsgenerator",
    editorPanel: "Editor-panel",
    localhostMachineControls: "Lokale vertskontroller:",
    viewReaderMode: "Vis lesermodus",
    openEditorPanel: "Åpne editor-panelen",
    discardLocalDraft: "Forkast lokalt utkast",
    selectPage: "Velg en dokumentasjonsside fra sidemenyen for å begynne."
  },
  da: {
    search: "Søg i dokumenter...",
    onThisPage: "På denne side",
    next: "Næste",
    prev: "Forrige",
    copyright: "Ophavsret",
    logoText: "Dokumentationsgenerator",
    editorPanel: "Editorpanel",
    localhostMachineControls: "Lokale værtskontroller:",
    viewReaderMode: "Vis læsertilstand",
    openEditorPanel: "Åbn editorpanel",
    discardLocalDraft: "Kassér lokalt udkast",
    selectPage: "Vælg en dokumentationsside fra sidebjælken for at begynde."
  }
};

function App() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [referrerSection, setReferrerSection] = useState<{ id: string; title: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1);
  const [lang, setLang] = useState<string>(() => {
    const saved = localStorage.getItem('feather_docs_lang');
    return saved && UI_TRANSLATIONS[saved] ? saved : 'en';
  });
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false);

  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;

  const isLocalhost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === '[::1]' ||
    window.location.hostname === '';

  const logoIcon = config.logoIcon || '';
  const favicon = config.favicon || '';
  const borderWidth = config.theme?.borderWidth || '0px';
  const borderRadius = config.theme?.borderRadius || '0px';
  const isDarkTheme = getContrastColor(config.theme?.backgroundColor || '#ffffff') === '#ffffff';

  const initializeActiveSection = (projectConfig: ProjectConfig) => {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get('section');
    const referrerParam = params.get('referrer');
    
    if (sectionParam && projectConfig.sections.some(s => s.id === sectionParam)) {
      setActiveSectionId(sectionParam);
      if (referrerParam) {
        const refSection = projectConfig.sections.find(s => s.id === referrerParam);
        if (refSection) {
          setReferrerSection({ id: refSection.id, title: refSection.title });
        }
      }
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
    } else if (theme.fontFamily === 'playfair') {
      fontValue = "'Playfair Display', serif";
    } else if (theme.fontFamily === 'outfit') {
      fontValue = "'Outfit', sans-serif";
    } else if (theme.fontFamily === 'space') {
      fontValue = "'Space Grotesk', sans-serif";
    } else if (theme.fontFamily === 'fira') {
      fontValue = "'Fira Code', monospace";
    } else if (theme.fontFamily === 'cinzel') {
      fontValue = "'Cinzel', serif";
    } else if (theme.fontFamily === 'pressstart') {
      fontValue = "'Press Start 2P', monospace";
    } else if (theme.fontFamily === 'jakarta') {
      fontValue = "'Plus Jakarta Sans', sans-serif";
    }
    root.style.setProperty('--font-family', fontValue);

    const fontSize = theme.fontSize || '18px';
    root.style.setProperty('--base-font-size', fontSize);

    const contentWidth = theme.contentWidth || '860px';
    root.style.setProperty('--content-max-width', contentWidth);

    const lineHeight = theme.lineHeight || '1.5';
    root.style.setProperty('--base-line-height', lineHeight);

    let shadowValue = `var(--border-width) var(--border-width) 0px ${theme.borderColor}`;
    if (theme.shadowType === 'none') {
      shadowValue = 'none';
    } else if (theme.shadowType === 'subtle') {
      shadowValue = '0 2px 8px rgba(0, 0, 0, 0.05)';
    } else if (theme.shadowType === 'medium') {
      shadowValue = '0 8px 30px rgba(0, 0, 0, 0.12)';
    } else if (theme.shadowType === 'heavy') {
      shadowValue = '0 16px 40px rgba(0, 0, 0, 0.2)';
    } else {
      if (theme.name.includes('Modern')) {
        shadowValue = "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)";
      } else if (theme.borderColor === 'transparent' || parseInt(borderWidth) === 0) {
        shadowValue = "none";
      }
    }
    root.style.setProperty('--shadow', shadowValue);

    const sidebarWidth = theme.sidebarWidth || '280px';
    root.style.setProperty('--sidebar-width', sidebarWidth);

    const sidebarPosition = theme.sidebarPosition || 'left';
    root.style.setProperty('--sidebar-flex-direction', sidebarPosition === 'right' ? 'row-reverse' : 'row');

    if (sidebarPosition === 'right') {
      root.style.setProperty('--sidebar-border-right', 'none');
      root.style.setProperty('--sidebar-border-left', 'var(--border-width) solid var(--border-color)');
    } else {
      root.style.setProperty('--sidebar-border-right', 'var(--border-width) solid var(--border-color)');
      root.style.setProperty('--sidebar-border-left', 'none');
    }
  }, [config?.theme, borderWidth, borderRadius]);

  useEffect(() => {
    if (!config) return;

    let faviconUrl = favicon ? favicon.trim() : '/feather-solid.png';
    const isEmoji = favicon ? (/\p{Emoji}/u.test(favicon) && favicon.trim().length <= 4) : false;
    
    if (isEmoji && favicon) {
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
      const langDropdown = document.querySelector('.lang-dropdown-container');
      if (langDropdown && !langDropdown.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);



  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem('feather_docs_lang', newLang);
  };

  const selectSection = (id: string, clearReferrer = true) => {
    const prevActiveId = activeSectionId;
    setActiveSectionId(id);
    if (clearReferrer) {
      setReferrerSection(null);
    }
    
    const newUrl = `${window.location.pathname}?section=${id}${clearReferrer ? '' : `&referrer=${prevActiveId}`}`;
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

  useEffect(() => {
    let styleEl = document.getElementById('feather-custom-css');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'feather-custom-css';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = config.customCss || '';

    let scriptEl = document.getElementById('feather-custom-js');
    if (scriptEl) {
      scriptEl.remove();
    }
    if (config.customJs) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'feather-custom-js';
      scriptEl.innerHTML = config.customJs;
      document.body.appendChild(scriptEl);
    }

    const gaEl = document.getElementById('feather-ga-script');
    if (gaEl) {
      gaEl.remove();
    }
    const gaInit = document.getElementById('feather-ga-init');
    if (gaInit) {
      gaInit.remove();
    }
    if (config.googleAnalyticsId) {
      const scriptTag = document.createElement('script');
      scriptTag.id = 'feather-ga-script';
      scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`;
      scriptTag.async = true;
      document.head.appendChild(scriptTag);

      const initTag = document.createElement('script');
      initTag.id = 'feather-ga-init';
      initTag.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.googleAnalyticsId}');
      `;
      document.head.appendChild(initTag);
    }
  }, [config.customCss, config.customJs, config.googleAnalyticsId]);

  useEffect(() => {
    document.title = config.title || 'Docs';

    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', config.browserColor || '#1e1e2e');

    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', config.siteDescription || '');

    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (!keywordsMeta) {
      keywordsMeta = document.createElement('meta');
      keywordsMeta.setAttribute('name', 'keywords');
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.setAttribute('content', config.keywords || '');

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', config.title || '');

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', config.openGraphImage || '');

    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon && config.appleTouchIcon) {
      appleIcon = document.createElement('link');
      appleIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleIcon);
    }
    if (appleIcon && config.appleTouchIcon) {
      appleIcon.setAttribute('href', config.appleTouchIcon);
    }
  }, [config.title, config.browserColor, config.siteDescription, config.keywords, config.openGraphImage, config.appleTouchIcon]);

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

  const toggleLightDarkMode = () => {
    const theme = config.theme;
    const isDark = getContrastColor(theme.backgroundColor) === '#ffffff';
    
    const newBg = theme.textColor;
    const newText = theme.backgroundColor;
    
    const newSidebar = isDark ? '#f1f5f9' : '#16122c';
    
    let newBorder = theme.borderColor;
    if (theme.borderColor === theme.textColor) {
      newBorder = newText;
    } else if (theme.borderColor === theme.backgroundColor) {
      newBorder = newBg;
    }

    const updatedTheme = {
      ...theme,
      name: theme.name.endsWith(' Light') || theme.name.endsWith(' Dark')
        ? theme.name.slice(0, -6) + (isDark ? ' Light' : ' Dark')
        : theme.name + (isDark ? ' Light' : ' Dark'),
      backgroundColor: newBg,
      textColor: newText,
      sidebarColor: newSidebar,
      borderColor: newBorder
    };

    handleConfigChange({
      ...config,
      theme: updatedTheme
    });
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

  const stripHtml = (html: string) => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
  };

  const getSearchSnippet = (content: string, query: string) => {
    const plainText = stripHtml(content);
    const idx = plainText.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) {
      return plainText.slice(0, 60) + (plainText.length > 60 ? '...' : '');
    }
    const start = Math.max(0, idx - 20);
    const end = Math.min(plainText.length, idx + 40);
    return (start > 0 ? '...' : '') + plainText.slice(start, end).replace(/\s+/g, ' ') + (end < plainText.length ? '...' : '');
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
  const currentIndex = config.sections.findIndex(s => s.id === activeSection?.id);
  const prevSection = currentIndex > 0 ? config.sections[currentIndex - 1] : null;
  const nextSection = currentIndex < config.sections.length - 1 && currentIndex !== -1 ? config.sections[currentIndex + 1] : null;

  const searchResults = searchQuery.trim()
    ? config.sections
        .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || stripHtml(s.content).toLowerCase().includes(searchQuery.toLowerCase()))
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

  const companyLogo = config.companyLogo || logoIcon;
  const isCustomLogoImage = companyLogo && (companyLogo.startsWith('data:image/') || companyLogo.startsWith('http') || companyLogo.startsWith('/'));

  const visibleSections = config.sections.filter(s => {
    if (editMode) return true;
    return !s.isDraft && !s.isHidden;
  });

  const presetClassName = config.theme?.name ? `preset-${config.theme.name.toLowerCase().replace(/\s+/g, '-')}` : '';

  return (
    <div className={`app-container ${presetClassName} ${config.fullWidthMode ? 'layout-full-width' : ''} ${config.compactMode ? 'layout-compact' : ''}`}>
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <h1 className="sidebar-logo" style={{ display: 'flex', alignItems: 'center' }}>
              {companyLogo && (
                isCustomLogoImage ? (
                  <img 
                    src={companyLogo} 
                    alt="Logo" 
                    style={{ height: '32px', width: 'auto', marginRight: '8px', objectFit: 'contain', borderRadius: borderRadius }} 
                  />
                ) : (
                  <i className={companyLogo} style={{ marginRight: '8px' }}></i>
                )
              )}
              {config.title}
            </h1>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>{config.logoText}</span>
          </div>

          <nav className="sidebar-nav">
            {visibleSections.map((section) => (
              <button
                key={section.id}
                className={`nav-item ${section.id === activeSectionId ? 'active' : ''}`}
                onClick={() => selectSection(section.id)}
              >
                <span className="nav-item-content">
                  <i className={section.icon || 'fa-solid fa-file'}></i>
                  {section.title}
                  {section.isDraft && <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: 'var(--border-color)', padding: '2px 4px', borderRadius: '4px' }}>Draft</span>}
                  {section.isHidden && <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: 'var(--border-color)', padding: '2px 4px', borderRadius: '4px' }}>Hidden</span>}
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
              placeholder={t.search}
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '16px' }} className="lang-dropdown-container">
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '38px',
                  padding: '0 12px',
                  backgroundColor: 'var(--sidebar-color)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-color)',
                  borderRadius: 'var(--border-radius)',
                  borderWidth: 'var(--border-width)',
                  borderStyle: 'solid',
                  cursor: 'pointer'
                }}
              >
                <img 
                  src={`https://flagcdn.com/${(LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]).flag}.svg`} 
                  alt="flag" 
                  style={{ width: '20px', height: '15px', borderRadius: '2px', objectFit: 'cover' }} 
                />
                <span>{(LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]).label}</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', opacity: 0.6 }}></i>
              </button>

              {isLangOpen && (
                <div 
                  className="search-results-dropdown"
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    width: '180px',
                    zIndex: 100,
                    backgroundColor: 'var(--sidebar-color)',
                    borderColor: 'var(--border-color)',
                    borderWidth: 'var(--border-width)',
                    borderStyle: 'solid',
                    borderRadius: 'var(--border-radius)',
                    boxShadow: 'var(--shadow)',
                    padding: '4px'
                  }}
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        handleLangChange(l.code);
                        setIsLangOpen(false);
                      }}
                      className="lang-result-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 'calc(var(--border-radius) - 2px)',
                        color: 'var(--text-color)',
                        fontSize: '14px'
                      }}
                    >
                      <img 
                        src={`https://flagcdn.com/${l.flag}.svg`} 
                        alt={l.label} 
                        style={{ width: '20px', height: '15px', borderRadius: '2px', objectFit: 'cover' }} 
                      />
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              type="button"
              className="btn"
              onClick={toggleLightDarkMode}
              title="Toggle theme mode"
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--sidebar-color)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
                borderRadius: 'var(--border-radius)',
                borderWidth: 'var(--border-width)',
                borderStyle: 'solid'
              }}
            >
              <i className={isDarkTheme ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
            </button>
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
              prevSection={prevSection}
              nextSection={nextSection}
              onNavigate={selectSection}
              t={t}
              config={config}
              editMode={editMode}
              onContentChange={(newContent) => {
                const updatedSections = config.sections.map((section) => {
                  if (section.id === activeSection.id) {
                    return { ...section, content: newContent };
                  }
                  return section;
                });
                handleConfigChange({ ...config, sections: updatedSections });
              }}
            />
          ) : (
            <div className="content-container">
              <h2>Select a documentation page from the sidebar to begin.</h2>
            </div>
          )}
        </main>

        <footer className="footer">
          <span>Copyright © 2026 Feather Authors.</span>
          {config.footerText && (
            <span>&nbsp;•&nbsp;{config.footerText}</span>
          )}
          {config.footerLinks && (() => {
            try {
              const links = JSON.parse(config.footerLinks) as { label: string; url: string }[];
              return links.map(link => (
                <span key={link.label}>
                  &nbsp;•&nbsp;<a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{link.label}</a>
                </span>
              ));
            } catch {
              return null;
            }
          })()}
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