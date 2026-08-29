import { localizePath } from "./locales.js";

export function buildDesktopPrimaryNavigation({
  translate,
  language,
  showRembrandtProject,
}) {
  const links = [
    { id: "topstukken", label: translate("nav.topstukken"), path: "/topstukken" },
    { id: "catalogus", label: translate("nav.collectie"), path: "/collectie" },
    { id: "herkomst", label: translate("nav.herkomst"), path: "/herkomst" },
    { id: "rembrandt-project", label: translate("nav.rembrandtProject"), path: "/rembrandt-project" },
  ];
  return links
    .filter((link) => link.id !== "rembrandt-project" || showRembrandtProject)
    .map(({ path, ...link }) => ({
      ...link,
      href: localizePath(path, language),
    }));
}
