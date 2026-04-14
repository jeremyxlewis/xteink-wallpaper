export const CHAR_SETS = {
  CLASSIC: {
    name: 'Classic ASCII',
    chars: '@%#*+=-:. ',
  },
  BLOCKS: {
    name: 'Blocks',
    chars: '█▓▒░ ',
  },
  DETAILED: {
    name: 'Detailed',
    chars: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:"^`\'. ',
  },
  MINIMAL: {
    name: 'Minimal',
    chars: ' ·░█',
  },
  BINARY: {
    name: 'Binary',
    chars: '01',
  },
  BRAILLE: {
    name: 'Braille',
    chars: '⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿',
  },
  DOT_CROSS: {
    name: 'Dot Cross',
    chars: '⋅◦∙○●',
  },
  LINE: {
    name: 'Line',
    chars: '│─┼┌┐└┘├┤┬┴┼',
  },
  PARTICLES: {
    name: 'Particles',
    chars: '•◦○●',
  },
  CLAUDE_CODE: {
    name: 'Claude Code',
    chars: '░▒▓█',
  },
  RETRO: {
    name: 'Retro',
    chars: '█▓▒░ _-=+*#%@',
  },
  TERMINAL: {
    name: 'Terminal',
    chars: '█▓▒░',
  },
  LETTERS_UPPER: {
    name: 'Letters (A-Z)',
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  },
  LETTERS_LOWER: {
    name: 'Letters (a-z)',
    chars: 'abcdefghijklmnopqrstuvwxyz',
  },
  LETTERS_MIXED: {
    name: 'Letters (Aa)',
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  },
  SYMBOLS: {
    name: 'Symbols',
    chars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },
  CUSTOM: {
    name: 'Custom',
    chars: '',
  },
};

export function getCharSet(key) {
  return CHAR_SETS[key] || CHAR_SETS.CLASSIC;
}

export function getAllCharSetKeys() {
  return Object.keys(CHAR_SETS);
}

export function calculateCharBrightness(chars) {
  const brightness = [];
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i] || ' ';
    let total = 0;
    for (let j = 0; j < char.length; j++) {
      const code = char.charCodeAt(j);
      total += (code % 256);
    }
    const avg = char.length > 0 ? total / char.length : 0;
    brightness.push(avg);
  }
  return brightness;
}

export function mapBrightnessToCharIndex(brightnessValue, charCount, inverted = false) {
  const normalized = inverted ? 255 - brightnessValue : brightnessValue;
  const scaled = (normalized / 255) * (charCount - 1);
  return Math.min(Math.max(Math.floor(scaled), 0), charCount - 1);
}
