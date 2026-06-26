import React, { useEffect, useRef } from 'react';
import type { DocSection } from '../types';
import { renderMarkdown } from '../utils/security';

interface DocReaderProps {
  activeSection: DocSection;
  showToast: (message: string) => void;
  onInternalLinkClick: (targetId: string) => void;
}

export const DocReader: React.FC<DocReaderProps> = ({
  activeSection,
  showToast,
  onInternalLinkClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentHtml = renderMarkdown(activeSection.content);

  useEffect(() => {
    if (!containerRef.current) return;

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
          .catch((err) => {
            console.error("Clipboard copy failed", err);
            showToast("Failed to Copy link");
          });
      };

      header.appendChild(anchorBtn);
    });

    const hash = window.location.hash;
    if (hash) {
      const targetElement = containerRef.current.querySelector(hash);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [activeSection, contentHtml, showToast]);

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
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

  return (
    <div className="content-container">
      <div 
        ref={containerRef}
        className="markdown-body"
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
};