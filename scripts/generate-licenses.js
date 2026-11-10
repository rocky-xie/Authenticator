"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const lock = require(path.join(root, "node_modules/.package-lock.json"));
const template = fs.readFileSync(
  path.join(root, "scripts/licenses-template.html"),
  "utf8",
);

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const packages = new Map();
for (const [relativePath, metadata] of Object.entries(lock.packages)) {
  if (!relativePath || metadata.dev) continue;
  const packagePath = path.join(root, relativePath);
  const packageJsonPath = path.join(packagePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) continue;

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const key = `${packageJson.name}@${packageJson.version}`;
  if (packages.has(key)) continue;

  const licenseFile = fs
    .readdirSync(packagePath)
    .find((file) => /^(licen[cs]e|copying)(\..*)?$/i.test(file));
  const licenseText = licenseFile
    ? fs.readFileSync(path.join(packagePath, licenseFile), "utf8")
    : `License: ${packageJson.license || metadata.license || "Unknown"}`;
  const homepage =
    typeof packageJson.homepage === "string" &&
    /^https?:\/\//i.test(packageJson.homepage)
      ? packageJson.homepage
      : "";

  packages.set(key, {
    name: packageJson.name || key,
    version: packageJson.version || metadata.version,
    homepage,
    licenseText,
  });
}

const licenseHtml = Array.from(packages.values())
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((pkg) => {
    const label = `${escapeHtml(pkg.name)} ${escapeHtml(pkg.version)}`;
    const title = pkg.homepage
      ? `<a href="${escapeHtml(pkg.homepage)}">${label}</a>`
      : label;
    return `    <h3>${title}</h3>\n    <blockquote>${escapeHtml(
      pkg.licenseText,
    )}</blockquote>`;
  })
  .join("\n");

const output = template.replace(
  /\s*{{#renderLicenses}}[\s\S]*?{{\/renderLicenses}}/,
  `\n${licenseHtml}`,
);
fs.writeFileSync(path.join(root, "view/licenses.html"), output);
