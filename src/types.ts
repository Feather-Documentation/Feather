export interface ThemeConfig {
  name: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  sidebarColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  fontFamily: 'vt323' | 'inter' | 'courier';
  iconStyle: 'pixel' | 'solid' | 'regular';
}

export interface DocSection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

export interface ProjectConfig {
  title: string;
  logoText: string;
  logoIcon: string;
  favicon: string;
  theme: ThemeConfig;
  sections: DocSection[];
}