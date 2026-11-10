"use strict";

/**
 * Wrap trusted, repository-owned SVG assets as Vue single-file components.
 * This replaces the abandoned vue-svg-loader/SVGO toolchain and deliberately
 * performs no HTML sanitization because it never accepts user-provided SVGs.
 */
module.exports = function svgToVueLoader(source) {
  this.cacheable?.();
  return `<template>${source}</template>`;
};
