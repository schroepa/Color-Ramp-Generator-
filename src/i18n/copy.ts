export type Locale = 'en' | 'de'

export type Copy = {
  meta: { title: string; description: string }
  header: {
    presets: string
    how: string
    docs: string
    figma: string
    open: string
  }
  hero: {
    headline: string
    subline: string
    placeholder: string
    try: string
    for: string
    checkSit: string
    checkText: string
    checkEven: string
    open: string
    micro: string
    invalid: string
  }
  compare: {
    headline: string
    subline: string
    typical: string
    tintfield: string
    m1: string
    m2: string
    m3: string
    g1: string
    g2: string
    g3: string
    fallback: string
    tryBtn: string
  }
  reasons: {
    easierTitle: string
    easierBody: string
    betterTitle: string
    betterBody: string
    fitsTitle: string
    fitsBody: string
  }
  how: {
    headline: string
    s1Title: string
    s1Body: string
    s2Title: string
    s2Body: string
    s3Title: string
    s3Body: string
  }
  export: {
    headline: string
    copy: string
    guides: string
  }
  figma: {
    label: string
    headline: string
    body: string
    placeholder: string
    button: string
    micro: string
    confirm: string
  }
  faq: { title: string; items: { q: string; a: string }[] }
  cta: { headline: string }
  footer: {
    claim: string
    product: string
    resources: string
    about: string
    openApp: string
    presets: string
    figma: string
    how: string
    docs: string
    changelog: string
    patrick: string
    github: string
    imprint: string
    privacy: string
    made: string
  }
  deHint: string
}

export const en: Copy = {
  meta: {
    title: 'Tintfield · Color scales that just work',
    description:
      'Paste one color, get a contrast-safe color scale for Tailwind, Radix, Material and more. Free, no sign-up, runs in your browser.',
  },
  header: {
    presets: 'Presets',
    how: 'How it works',
    docs: 'Docs',
    figma: 'Figma plugin · soon',
    open: 'Open Tintfield',
  },
  hero: {
    headline: 'Color scales that just work.',
    subline:
      'Paste one color. Get a full, contrast-safe scale in the system you already use. No settings. No sign-up.',
    placeholder: 'Paste a hex, e.g. #0D7377',
    try: 'Try',
    for: 'For',
    checkSit: 'Your color sits on {step}',
    checkText: 'Text on white from {step}',
    checkEven: 'Evenly spaced',
    open: 'Open in Tintfield',
    micro: 'Free · Runs in your browser',
    invalid: 'Try a hex like #0D7377',
  },
  compare: {
    headline: 'Same color. Two scales.',
    subline: 'Most generators spread lightness. Tintfield spreads contrast.',
    typical: 'Typical generator',
    tintfield: 'Tintfield',
    m1: 'Light steps look identical',
    m2: 'Your color forced onto 500',
    m3: 'Unreadable labels',
    g1: 'Every step is distinct',
    g2: 'Your color on its natural step',
    g3: 'Readable everywhere',
    fallback: 'Close call for this color. Try a yellow or a navy.',
    tryBtn: 'Try with your color',
  },
  reasons: {
    easierTitle: 'One color. Zero settings.',
    easierBody:
      'Tintfield places your color, spaces the steps and checks the contrast for you. You only decide when you want to.',
    betterTitle: 'Same step, same contrast.',
    betterBody:
      'Teal 600 and orange 600 pass the same checks. Write one rule for your whole palette: text on white starts at 600.',
    fitsTitle: 'Speaks your system.',
    fitsBody:
      "Tailwind's 50–950, Radix's 1–12, Material's tones. Tintfield uses the steps and names you already work with.",
  },
  how: {
    headline: 'From color to code in three steps',
    s1Title: 'Pick a color.',
    s1Body: 'Paste a hex or start with one of ours.',
    s2Title: 'Pick your system.',
    s2Body: 'Tailwind, Radix, Material and more.',
    s3Title: 'Export.',
    s3Body: 'Tailwind, CSS or Design Tokens, light and dark.',
  },
  export: {
    headline: 'Drop it straight into your project',
    copy: 'Copy',
    guides: 'Guides: Figma · Tailwind · CSS · Tokens',
  },
  figma: {
    label: 'Coming soon',
    headline: 'Tintfield for Figma',
    body: 'Your scales as Figma Variables, light and dark modes included. Change the color, and every variable follows.',
    placeholder: 'you@studio.com',
    button: 'Notify me',
    micro: 'One email when it launches. No spam. Unsubscribe anytime.',
    confirm: 'Almost done. Check your inbox to confirm.',
  },
  faq: {
    title: 'Questions',
    items: [
      {
        q: 'Is Tintfield free?',
        a: 'Yes. The generator is free, with no account and no limits.',
      },
      {
        q: 'Where are my colors stored?',
        a: 'Only in your browser. Nothing is sent to a server unless you create a share link.',
      },
      {
        q: 'Why contrast instead of lightness?',
        a: 'Because contrast is what makes a color usable. When every step has a fixed contrast, the same step works the same way in every hue, so your rules hold across the whole palette.',
      },
      {
        q: 'Where does my brand color end up?',
        a: 'On the step that matches its contrast, not always on 500. You can still move it to any step you like.',
      },
      {
        q: 'Is this an official Tailwind, Radix or Material tool?',
        a: 'No. Tintfield generates its own colors in the structure of these systems. It is not affiliated with their makers.',
      },
      {
        q: 'Can I use the colors commercially?',
        a: 'Yes. Everything you generate is yours to use, in any project.',
      },
      {
        q: 'Does it work with Figma?',
        a: 'Today you can import the Design Tokens export into Figma. A native Figma plugin is coming soon.',
      },
    ],
  },
  cta: { headline: 'Your next color system is one hex away.' },
  footer: {
    claim: 'Color scales that just work.',
    product: 'Product',
    resources: 'Resources',
    about: 'About',
    openApp: 'Open app',
    presets: 'Presets',
    figma: 'Figma plugin (soon)',
    how: 'How it works',
    docs: 'Docs',
    changelog: 'Changelog',
    patrick: 'Patrick Schrödter',
    github: 'GitHub',
    imprint: 'Imprint',
    privacy: 'Privacy',
    made: 'Made in Berlin by Patrick Schrödter',
  },
  deHint: 'Diese Seite gibt es auch auf Deutsch.',
}

export const de: Copy = {
  meta: {
    title: 'Tintfield · Farbskalen, die einfach funktionieren',
    description:
      'Eine Farbe einfügen, eine kontrastsichere Farbskala für Tailwind, Radix, Material und mehr erhalten. Kostenlos, ohne Anmeldung, läuft im Browser.',
  },
  header: {
    presets: 'Presets',
    how: "So funktioniert's",
    docs: 'Doku',
    figma: 'Figma-Plugin · bald',
    open: 'Tintfield öffnen',
  },
  hero: {
    headline: 'Farbskalen, die einfach funktionieren.',
    subline:
      'Eine Farbe einfügen. Eine vollständige, kontrastsichere Skala im System erhalten, das du schon nutzt. Ohne Einstellungen. Ohne Anmeldung.',
    placeholder: 'Hex einfügen, z. B. #0D7377',
    try: 'Probier',
    for: 'Für',
    checkSit: 'Deine Farbe liegt auf {step}',
    checkText: 'Text auf Weiß ab {step}',
    checkEven: 'Gleichmäßig verteilt',
    open: 'In Tintfield öffnen',
    micro: 'Kostenlos · Läuft in deinem Browser',
    invalid: 'Versuch einen Hex wie #0D7377',
  },
  compare: {
    headline: 'Gleiche Farbe. Zwei Skalen.',
    subline:
      'Die meisten Generatoren verteilen Helligkeit. Tintfield verteilt Kontrast.',
    typical: 'Typischer Generator',
    tintfield: 'Tintfield',
    m1: 'Helle Stufen sehen gleich aus',
    m2: 'Deine Farbe auf 500 gezwungen',
    m3: 'Unlesbare Beschriftung',
    g1: 'Jede Stufe unterscheidbar',
    g2: 'Deine Farbe auf ihrer natürlichen Stufe',
    g3: 'Überall lesbar',
    fallback: 'Bei dieser Farbe knapp. Probier ein Gelb oder ein Marineblau.',
    tryBtn: 'Mit deiner Farbe ausprobieren',
  },
  reasons: {
    easierTitle: 'Eine Farbe. Null Einstellungen.',
    easierBody:
      'Tintfield platziert deine Farbe, verteilt die Stufen und prüft den Kontrast. Du entscheidest nur, wenn du willst.',
    betterTitle: 'Gleiche Stufe, gleicher Kontrast.',
    betterBody:
      'Teal 600 und Orange 600 bestehen dieselben Prüfungen. Eine Regel für die ganze Palette: Text auf Weiß ab 600.',
    fitsTitle: 'Spricht dein System.',
    fitsBody:
      'Tailwinds 50–950, Radix’ 1–12, Materials Tones. Tintfield nutzt die Stufen und Namen, mit denen du schon arbeitest.',
  },
  how: {
    headline: 'In drei Schritten von der Farbe zum Code',
    s1Title: 'Farbe wählen.',
    s1Body: 'Hex einfügen oder mit einem Beispiel starten.',
    s2Title: 'System wählen.',
    s2Body: 'Tailwind, Radix, Material und mehr.',
    s3Title: 'Exportieren.',
    s3Body: 'Tailwind, CSS oder Design Tokens, hell und dunkel.',
  },
  export: {
    headline: 'Direkt ins Projekt übernehmen',
    copy: 'Kopieren',
    guides: 'Anleitungen: Figma · Tailwind · CSS · Tokens',
  },
  figma: {
    label: 'Bald verfügbar',
    headline: 'Tintfield für Figma',
    body: 'Deine Skalen als Figma-Variablen, inklusive Hell- und Dunkelmodus. Farbe ändern, alle Variablen ziehen mit.',
    placeholder: 'du@studio.de',
    button: 'Benachrichtigen',
    micro: 'Eine E-Mail zum Start. Kein Spam. Jederzeit abmeldbar.',
    confirm: 'Fast geschafft. Bitte bestätige die E-Mail in deinem Postfach.',
  },
  faq: {
    title: 'Fragen',
    items: [
      {
        q: 'Ist Tintfield kostenlos?',
        a: 'Ja. Der Generator ist kostenlos, ohne Konto und ohne Limits.',
      },
      {
        q: 'Wo werden meine Farben gespeichert?',
        a: 'Nur in deinem Browser. Es wird nichts an einen Server gesendet, außer du erstellst einen Share-Link.',
      },
      {
        q: 'Warum Kontrast statt Helligkeit?',
        a: 'Weil Kontrast eine Farbe nutzbar macht. Wenn jede Stufe einen festen Kontrast hat, funktioniert dieselbe Stufe in jedem Farbton gleich. Deine Regeln gelten für die ganze Palette.',
      },
      {
        q: 'Wo landet meine Markenfarbe?',
        a: 'Auf der Stufe, die zu ihrem Kontrast passt, nicht immer auf 500. Du kannst sie trotzdem auf jede Stufe legen.',
      },
      {
        q: 'Ist das ein offizielles Tool von Tailwind, Radix oder Material?',
        a: 'Nein. Tintfield erzeugt eigene Farben in der Struktur dieser Systeme und steht in keiner Verbindung zu deren Herausgebern.',
      },
      {
        q: 'Darf ich die Farben kommerziell nutzen?',
        a: 'Ja. Alles, was du erzeugst, darfst du in jedem Projekt verwenden.',
      },
      {
        q: 'Funktioniert es mit Figma?',
        a: 'Heute kannst du den Design-Tokens-Export in Figma importieren. Ein natives Figma-Plugin folgt bald.',
      },
    ],
  },
  cta: {
    headline: 'Dein nächstes Farbsystem ist nur einen Hex-Wert entfernt.',
  },
  footer: {
    claim: 'Farbskalen, die einfach funktionieren.',
    product: 'Produkt',
    resources: 'Ressourcen',
    about: 'Über',
    openApp: 'App öffnen',
    presets: 'Presets',
    figma: 'Figma-Plugin (bald)',
    how: "So funktioniert's",
    docs: 'Doku',
    changelog: 'Changelog',
    patrick: 'Patrick Schrödter',
    github: 'GitHub',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    made: 'Gemacht in Berlin von Patrick Schrödter',
  },
  deHint: '',
}

export function copyFor(locale: Locale): Copy {
  return locale === 'de' ? de : en
}

export function withBase(path: string): string {
  const raw = import.meta.env.BASE_URL || '/'
  const base = raw.replace(/\/$/, '')
  if (!path || path === '/') return `${base}/` || '/'
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
