import type { ProjectConfig } from './types';
import { THEME_PRESETS } from './themePresets';

export const DEFAULT_CONFIG: ProjectConfig = {
  title: "Feather",
  logoText: 'Feather',
  logoIcon: 'fa-solid fa-feather',
  favicon: '',
  theme: THEME_PRESETS['slate-corporate-modern'],
  siteUrl: "",
  footerText: "Copyright © Feather Documentation Authors.",
  footerLinks: "[]",
  socialLinks: "{}",
  githubRepo: "",
  discordServer: "",
  companyLogo: "",
  mobileLogo: "",
  loadingLogo: "",
  appleTouchIcon: "",
  openGraphImage: "",
  browserColor: "#1e1e2e",
  siteDescription: "A secure static site documentation builder.",
  keywords: "documentation, static, builder, react",
  canonicalUrl: "",
  robotsTxt: "User-agent: *\nDisallow:",
  sitemapXml: "",
  googleAnalyticsId: "",
  plausibleDomain: "",
  umamiScript: "",
  fullWidthMode: false,
  compactMode: false,
  sidebarDefaultCollapsed: false,
  stickySidebar: true,
  readingProgressBar: true,
  scrollToTop: true,
  customCss: "",
  customJs: "",
  customHeadHtml: "",
  enableMermaid: true,
  enableLatex: true,
  enableAdmonitions: true,
  enableFootnotes: true,
  sections: [
    {
      id: "welcome",
      title: "Welcome to feather!",
      icon: "fa-solid fa-star",
      content: "# Welcome to the Feather Documentation! \n\nFeather is an **open-source, secure, fully customizable documentations generator** designed for developers, corporations, or everyday people to make personalized websites for their businesses and more. \n\n### Included with Feather \n\n**Online Website Editing**: A user friendly and comprehensive interface with many features, such as file uploads. It solely uses *localhost* for your editing needs, so your final site won't be editable by others. (you can still make changes by pushing a new json file, of course!)\n\n**Theming!**: Add everything from files to text, to markdowns through the editor. Swap colors, borders, icons and more instantly!\n\n**No database**: Feather doesn't use any database, as it's a *static site*. You **must** edit locally on your host machine, click publish, and drop the downloaded json back into your workspace!\n\n**Built in security, just in case**: Feather utilizes *dompurify by cure53*, which automatically sanitizes HTML, MathML, SVG and other cross site scripting vulnerabilities. "
    },
    {
      id: "getting-started",
      title: "Getting started",
      icon: "fa-solid fa-rocket",
      content: "# Getting started \n\nFollow these quick steps to setup your site and customize Feather to your needs!:\n\n1. **Fork the Github repo**: Clone the repository to your own Github account. The repository can be found on my profile, https://github.com/notrodeveloper!\n\n2. **Run locally**:\n   ```bash\n   npm install\n   npm run dev\n   ```\n\n3. **Launch your site!**: Launch your site by navigating to `http://localhost:5173`. Because you're running on localhost, you will see an Edit Mode button in your sidebar! This is where you can do all your changes to your website. You can also modify the source code if things don't feel right! Choose your preset theme, or make your own custom one. \n\n4. **Edit pages, sections, and more** \n\n5. **Publishing**: Publish your changes by clicking the **Publish** button at the bottom of the editor! This downloads a `feather-docs.json` file.\n\n6. **Commit changes**: Overwrite `public/feather-docs.json` in your repository with your downloaded file and push. When hosted publicly, the editor will be completely disabled for visitors!" 
    },
    {
      id: "theme-presets",
      title: "Theme presets",
      icon: "fa-solid fa-palette",
      content: "# Themes \n\nFeather comes pre-packaged with multiple themes, for different industries, or just general fun. There are different aesthetics available for corporations, developers and more!"
    },
    {
      id: "support-me",
      title: "Supporting Feather",
      icon: "fa-solid fa-heart",
      content: `# Supporting Feather\n\nIf you'd like to support Feather, you may do so by visiting my GitHub Sponsors page. If you make a donation, thank you! And thank you to everyone for using Feather.\n\n<iframe src="https://github.com/sponsors/notrodeveloper/card" title="Sponsor notrodeveloper" height="225" width="600" style="border: 0;"></iframe>`
    },
    {
      id: "credits",
      title: "Credits",
      icon: "fa-solid fa-star",
      content: "# Credits \n\nWe thank FontAwesome for their icons, as they are used across our site and logo! You can find them at https://fontawesome.com/.  "
    }
  ]
};