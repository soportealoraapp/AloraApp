const plugin = require('tailwindcss/plugin');

const safeAreaPlugin = plugin(function ({ addUtilities }) {
  addUtilities({
    '.pb-safe': {
      'padding-bottom': 'env(safe-area-inset-bottom, 0px)',
    },
    '.pt-safe': {
      'padding-top': 'env(safe-area-inset-top, 0px)',
    },
    '.pl-safe': {
      'padding-left': 'env(safe-area-inset-left, 0px)',
    },
    '.pr-safe': {
      'padding-right': 'env(safe-area-inset-right, 0px)',
    },
    '.mb-safe': {
      'margin-bottom': 'env(safe-area-inset-bottom, 0px)',
    },
    '.mt-safe': {
      'margin-top': 'env(safe-area-inset-top, 0px)',
    },
  });
});

module.exports = safeAreaPlugin;
