/** Convert integer rupees (0 … 999_999) to English words, title-cased. */
const SMALL: string[] = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const TENS: string[] = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function under100(n: number): string {
  if (n < 20) return SMALL[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? `-${SMALL[o]}` : '');
}

function under1000(n: number): string {
  if (n < 100) return under100(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  return `${SMALL[h]} hundred${r ? ` and ${under100(r)}` : ''}`;
}

function dollarsToWords(n: number): string {
  if (n === 0) return 'Zero';
  if (n < 0 || n > 999_999) return String(n);

  const parts: string[] = [];
  let rest = n;

  const m = Math.floor(rest / 1_000_000);
  if (m) {
    parts.push(`${under1000(m)} million`);
    rest %= 1_000_000;
  }
  const th = Math.floor(rest / 1000);
  if (th) {
    parts.push(`${under1000(th)} thousand`);
    rest %= 1000;
  }
  if (rest) parts.push(under1000(rest));

  return parts.join(' ');
}

function titleCaseInvoiceWords(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('-'))
    .join(' ');
}

/** e.g. "Three Hundred And Ninety-Eight Rupees Only" for whole-rupee amounts from paise (cents). */
export function grandTotalInWords(cents: number): string {
  const rupees = Math.floor(cents / 100);
  const words = dollarsToWords(rupees);
  return `${titleCaseInvoiceWords(words)} Rupees Only`;
}
