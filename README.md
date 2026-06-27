# Feather
<p align="center">
<img src="public/hero.png" alt="Logo" width="150" height="150">
</p>

Open-source, free, and easy-to-use documentation builder with hundreds of customizable themes and a strict no-logs policy.

Feather is an **open-source, secure, fully customizable documentation generator** designed for developers, corporations, or everyday people to create personalized documentation sections for their businesses and more.

## Included with Feather

### Online Documentation Editing

A user-friendly and comprehensive interface with many features, such as file uploads. It solely uses *localhost* for your editing needs, so your final site won't be editable by others. *(You can still make changes by pushing a new JSON file, of course!)*

### Theming!

Add everything from files to text to Markdown through the editor. Swap colors, borders, icons, and more instantly!

### No Database

Feather doesn't use any database, as it's a *static site*. You **must** edit locally on your host machine, click **Publish**, and drop the downloaded JSON back into your workspace!

### Built-in Security, Just in Case

Feather utilizes *DOMPurify by Cure53*, which automatically sanitizes HTML, MathML, SVG, and other cross-site scripting vulnerabilities.

# Getting Started

Follow these quick steps to set up your site and customize Feather to your needs!

1. **Fork the GitHub repository**

   Clone the repository to your own GitHub account.

2. **Run locally**

   ```bash
   npm install
   npm run dev
   ```

3. **Launch your site**

   Navigate to `http://localhost:5173`. Because you're running on localhost, you'll see an **Edit Mode** button in your sidebar. This is where you can make changes to your website. You can also modify the source code if things don't feel right! Choose a preset theme or create your own custom one.

4. **Edit pages, sections, and more**

5. **Publishing**

   Publish your changes by clicking the **Publish** button at the bottom of the editor. This downloads a `feather-docs.json` file.

6. **Commit changes**

   Overwrite `public/feather-docs.json` in your repository with your downloaded file and push your changes. When hosted publicly, the editor will be completely disabled for visitors!

# Themes

Feather comes pre-packaged with multiple themes for different industries or just for fun. There are different aesthetics available for corporations, developers, and more!

# Supporting Feather

If you'd like to support Feather, you may do so by visiting my GitHub Sponsors page. If you make a donation, thank you! And thank you to everyone for using my service.
