import { useEffect } from "react";

type Metadata = {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  type?: "website" | "product";
  jsonLd?: Record<string, unknown>;
};

/** Lightweight route metadata without adding a head-management dependency. */
export default function usePageMetadata({
  title,
  description,
  canonicalPath,
  image,
  type = "website",
  jsonLd,
}: Metadata) {
  useEffect(() => {
    const previousTitle = document.title;
    const restore: Array<() => void> = [];
    document.title = title;

    const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (element) {
        const previous = element.content;
        restore.push(() => { element!.content = previous; });
      } else {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
        restore.push(() => element!.remove());
      }
      element.content = content;
    };

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", image ? "summary_large_image" : "summary");
    if (image) setMeta('meta[property="og:image"]', "property", "og:image", new URL(image, window.location.origin).href);

    if (canonicalPath) {
      let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (canonical) {
        const previous = canonical.href;
        restore.push(() => { canonical!.href = previous; });
      } else {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
        restore.push(() => canonical!.remove());
      }
      canonical.href = new URL(canonicalPath, window.location.origin).href;
    }

    if (jsonLd) {
      const structured = document.createElement("script");
      structured.type = "application/ld+json";
      structured.text = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
      document.head.appendChild(structured);
      restore.push(() => structured.remove());
    }

    return () => {
      document.title = previousTitle;
      restore.reverse().forEach((callback) => callback());
    };
  }, [title, description, canonicalPath, image, type, jsonLd]);
}
