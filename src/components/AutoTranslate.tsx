import { useEffect, useState } from "react";
import { tr } from "@/lib/i18n";

export const LANG_KEY = "sl-lang";
const EVT = "sl-lang-change";

export function getStoredLang() {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(LANG_KEY) || "en";
}
export function setStoredLang(lang: string) {
  if (typeof window === "undefined" || getStoredLang() === lang) return;
  localStorage.setItem(LANG_KEY, lang);
  window.dispatchEvent(new Event(EVT));
}
export function useStoredLang() {
  const [lang, setLang] = useState("en");
  useEffect(() => {
    const sync = () => setLang(getStoredLang());
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return lang;
}

const ATTRS = ["placeholder", "aria-label", "title"] as const;

/** Translates every visible English phrase on screen into the remembered language. */
export function AutoTranslate() {
  const lang = useStoredLang();
  useEffect(() => {
    const origText = new WeakMap<Text, string>();
    const doneText = new WeakMap<Text, string>();
    const origAttr = new WeakMap<Element, Record<string, string>>();
    document.documentElement.lang = lang;

    const fixText = (n: Text) => {
      const cur = n.nodeValue ?? "";
      if (doneText.get(n) !== cur) origText.set(n, cur); // React changed it
      const src = origText.get(n) ?? cur;
      const key = src.trim();
      if (!key) return;
      const out = src.replace(key, tr(lang, key));
      if (out !== cur) n.nodeValue = out;
      doneText.set(n, out);
    };
    const fixEl = (el: Element) => {
      if (el.closest("input[type=text],textarea,[contenteditable],script,style")) return;
      const store = origAttr.get(el) ?? {};
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (v == null) continue;
        const known = store[a];
        if (known === undefined || (v !== known && v !== tr(lang, known))) store[a] = v;
        const out = tr(lang, store[a] ?? v);
        if (out !== v) el.setAttribute(a, out);
      }
      origAttr.set(el, store);
    };
    const walk = (root: Node) => {
      if (root.nodeType === 3) return fixText(root as Text);
      if (root.nodeType !== 1) return;
      const el = root as Element;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
      fixEl(el);
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let n: Node | null;
      while ((n = tw.nextNode())) n.nodeType === 3 ? fixText(n as Text) : fixEl(n as Element);
    };
    walk(document.body);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "characterData") fixText(m.target as Text);
        else if (m.type === "attributes") fixEl(m.target as Element);
        else m.addedNodes.forEach(walk);
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    return () => mo.disconnect();
  }, [lang]);
  return null;
}
