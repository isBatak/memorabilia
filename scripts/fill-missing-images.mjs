import fs from 'node:fs/promises';
import path from 'node:path';

const API_ROOT = path.resolve('public/api/v1');
const IMAGE_ROOT = path.resolve('public/images');
const categories = ['cartoons', 'series', 'movies'];
const suffixes = {cartoons: 'crtani film', series: 'TV serija', movies: 'film trailer'};
const requestedSlugs = new Set(process.argv.slice(2));

const queryOverrides = {
  'carobnjakov-sesir': 'Čarobnjakov šešir animirani film',
  'cudesna-suma': 'Čudesna šuma animirani film',
  'danko-bananko': 'Bananaman cartoon',
  'dar-mar-holmes': 'Danger Mouse 1981 cartoon',
  'eustahije-brzic': 'The Blue Racer cartoon',
  'gdje-je-jura': "Where's Wally 1991 cartoon",
  'korni-kornjaca': 'Touché Turtle cartoon',
  'kralj-lavova': 'The Lion King 1994 trailer',
  'labudja-princeza': 'The Swan Princess 1994 trailer',
  'lav-krezumica': 'Snagglepuss cartoon',
  'mala-sirena': 'The Little Mermaid 1989 trailer',
  'moje-tijelo': 'Once Upon a Time Life cartoon',
  'nick-praskaton': 'Nick Knatterton cartoon',
  'orson-i-prijatelji': "Garfield U.S. Acres Orson's Farm cartoon",
  'ovidije': 'Ovide and the Gang cartoon',
  'patuljak-david': 'The World of David the Gnome cartoon',
  'srebrni-pastuh': 'The Silver Brumby cartoon',
  'vitezovi-orijenta': 'Arabian Knights Hanna Barbera cartoon',
  'zekoslav-mrkva': 'Bugs Bunny Looney Tunes cartoon',
  'zekoslavne-price': 'Bugs Bunny Looney Tunes cartoon',
  'zvonko': 'Noddy 1998 cartoon',
  'dadilja': 'The Nanny TV series',
  'djecak-sa-andromede': 'The Boy from Andromeda TV series',
  'djecak-upoznaje-svijet': 'Boy Meets World TV series',
  'gilmoreice': 'Gilmore Girls TV series',
  'moja-obitelj': 'My Family BBC TV series',
  'muneca-brava': 'Muñeca Brava TV series',
  'ono': "Stephen King's It 1990 miniseries trailer",
  'potpuni-stranci': 'Perfect Strangers TV series',
  'prijatelji': 'Friends TV series',
  'puna-kuca': 'Full House TV series',
  'spremni-ili-ne': 'Ready or Not 1993 TV series',
  'stize-drbeeching': 'Oh Doctor Beeching TV series',
  'u-autobusu': 'On the Buses TV series',
  'zvjezdane-staze': 'Star Trek The Original Series',
  'back-to-the-future': 'Back to the Future 1985 trailer',
  'batman': 'Batman 1989 trailer',
  'beetle-juice': 'Beetlejuice 1988 trailer',
  'childs-play': "Child's Play 1988 trailer",
  'critters': 'Critters 1986 trailer',
  'death-becomes-her': 'Death Becomes Her 1992 trailer',
  'dolly-dearest': 'Dolly Dearest 1991 trailer',
  'druzba-pere-kvrzice': 'Družba Pere Kvržice film',
  'empire-of-the-sun': 'Empire of the Sun 1987 trailer',
  'gremlins': 'Gremlins 1984 trailer',
  'home-alone': 'Home Alone 1990 trailer',
  'my-girl': 'My Girl 1991 trailer',
  'nightmare-on-elm-street': 'A Nightmare on Elm Street 1984 trailer',
  'poltergeist': 'Poltergeist 1982 trailer',
  'the-craft': 'The Craft 1996 trailer',
  'the-witches-of-eastwick': 'The Witches of Eastwick 1987 trailer',
  'tko-pjeva-zlo-ne-misli': 'Tko pjeva zlo ne misli film',
  'vlak-u-snijegu': 'Vlak u snijegu film',
  'vuk-samotnjak': 'Vuk samotnjak film'
};

const wikipediaOverrides = {
  'stize-drbeeching': 'Oh, Doctor Beeching!',
  'u-autobusu': 'On the Buses',
  'xena': 'Xena: Warrior Princess',
  'zvjezdane-staze': 'Star Trek: The Original Series',
  'back-to-the-future': 'Back to the Future',
  'batman': 'Batman (1989 film)',
  'beetle-juice': 'Beetlejuice',
  'childs-play': "Child's Play (1988 film)",
  'critters': 'Critters (film)',
  'death-becomes-her': 'Death Becomes Her',
  'dolly-dearest': 'Dolly Dearest',
  'druzba-pere-kvrzice': 'Družba Pere Kvržice',
  'empire-of-the-sun': 'Empire of the Sun (film)',
  'gremlins': 'Gremlins',
  'home-alone': 'Home Alone',
  'my-girl': 'My Girl (film)',
  'nightmare-on-elm-street': 'A Nightmare on Elm Street',
  'poltergeist': 'Poltergeist (1982 film)',
  'the-craft': 'The Craft (film)',
  'the-witches-of-eastwick': 'The Witches of Eastwick (film)',
  'tko-pjeva-zlo-ne-misli': 'Tko pjeva zlo ne misli',
  'vlak-u-snijegu': 'Vlak u snijegu',
  'vuk-samotnjak': 'Vuk samotnjak'
};

const croatianWikipedia = new Set(['druzba-pere-kvrzice', 'tko-pjeva-zlo-ne-misli', 'vlak-u-snijegu', 'vuk-samotnjak']);

const forcedVideoIds = {
  'mis-filip': 'Bb8sTTYcX-g',
  'todor-i-fedor': 'svzfd34cokw',
  'stize-drbeeching': 'rnQr1u21GUI',
  'sex-i-grad': 'X453aKQgob4',
  'dolly-dearest': 'dD4R3mZ18qI',
  'druzba-pere-kvrzice': 'QsOR4Zeh9f0',
  'empire-of-the-sun': 'i_WiDVA1kLY',
  'gremlins': 'XBEVwaJEgaA',
  'home-alone': 'jEDaVHmw7r4',
  'my-girl': 'KSyKO0Lklmo',
  'nightmare-on-elm-street': 'dCVh4lBfW-c',
  'poltergeist': '9eZgEKjYJqA',
  'the-craft': 'SxEqB--5ToI',
  'the-witches-of-eastwick': 'mLs1y_KSTKk',
  'vlak-u-snijegu': 'aQbutONFD9Q',
  'vuk-samotnjak': 'Tyl3jWwsj2Q'
};

const normalize = (value) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

async function getVideo(query, title) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const html = await fetch(searchUrl, {headers: {'user-agent': 'Mozilla/5.0'}, signal: AbortSignal.timeout(15_000)}).then((response) => {
    if (!response.ok) throw new Error(`YouTube search returned ${response.status}`);
    return response.text();
  });
  const ids = [...html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)]
    .map((match) => match[1])
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, 5);
  const candidates = await Promise.all(ids.map(async (id) => {
    const url = `https://www.youtube.com/watch?v=${id}`;
    try {
      const data = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {signal: AbortSignal.timeout(10_000)}).then((response) => response.json());
      return {id, url, title: data.title || ''};
    } catch {
      return {id, url, title: ''};
    }
  }));
  if (!candidates.length) throw new Error('No YouTube results');
  const wanted = new Set(normalize(title).split(' ').filter((token) => token.length > 1));
  return candidates
    .map((candidate, index) => ({
      ...candidate,
      score: [...wanted].filter((token) => normalize(candidate.title).includes(token)).length * 10 - index
    }))
    .sort((a, b) => b.score - a.score)[0];
}

async function downloadThumbnail(videoId) {
  for (const size of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const url = `https://i.ytimg.com/vi/${videoId}/${size}.jpg`;
    const response = await fetch(url, {signal: AbortSignal.timeout(15_000)});
    if (!response.ok) continue;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 10_000) continue;
    return {url, bytes};
  }
  throw new Error('No usable thumbnail');
}

async function getWikipediaImage(entry) {
  const language = croatianWikipedia.has(entry.slug) ? 'hr' : 'en';
  const query = wikipediaOverrides[entry.slug] || entry.title;
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '5',
    prop: 'pageimages|info',
    piprop: 'thumbnail|original',
    pithumbsize: '1280',
    inprop: 'url',
    format: 'json',
    origin: '*'
  });
  const response = await fetch(`https://${language}.wikipedia.org/w/api.php?${params}`, {signal: AbortSignal.timeout(15_000)});
  if (!response.ok) throw new Error(`Wikipedia search returned ${response.status}`);
  const data = await response.json();
  const pages = Object.values(data.query?.pages || {})
    .filter((page) => page.thumbnail?.source)
    .sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  if (!pages.length) throw new Error('No Wikipedia image');
  const page = pages[0];
  const imageResponse = await fetch(page.thumbnail.source, {signal: AbortSignal.timeout(15_000)});
  if (!imageResponse.ok) throw new Error(`Wikipedia image returned ${imageResponse.status}`);
  const contentType = imageResponse.headers.get('content-type') || '';
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  return {
    title: page.title,
    pageUrl: page.fullurl,
    url: page.thumbnail.source,
    extension,
    bytes: Buffer.from(await imageResponse.arrayBuffer())
  };
}

let updated = 0;
const failed = [];

for (const category of categories) {
  const directory = path.join(API_ROOT, category);
  for (const filename of (await fs.readdir(directory)).filter((file) => file.endsWith('.json')).sort()) {
    const file = path.join(directory, filename);
    const entry = JSON.parse(await fs.readFile(file, 'utf8'));
    if (requestedSlugs.size && !requestedSlugs.has(entry.slug)) continue;
    if ((entry.images || []).length && !forcedVideoIds[entry.slug]) continue;
    const query = queryOverrides[entry.slug] || `${entry.title} ${suffixes[category]}`;
    try {
      let source;
      try {
        const forcedId = forcedVideoIds[entry.slug];
        const video = forcedId
          ? {id: forcedId, title: `YouTube ${forcedId}`}
          : await getVideo(query, entry.title);
        const thumbnail = await downloadThumbnail(video.id);
        source = {...thumbnail, extension: 'jpg', label: `${video.title} (${video.id})`};
      } catch {
        const wikipedia = await getWikipediaImage(entry);
        source = {...wikipedia, label: `${wikipedia.title} (${wikipedia.pageUrl})`};
      }
      const imageDirectory = path.join(IMAGE_ROOT, entry.slug);
      await fs.mkdir(imageDirectory, {recursive: true});
      for (const oldFile of await fs.readdir(imageDirectory)) {
        if (/^cover\.(?:jpe?g|png|webp)$/i.test(oldFile)) await fs.unlink(path.join(imageDirectory, oldFile));
      }
      await fs.writeFile(path.join(imageDirectory, `cover.${source.extension}`), source.bytes);
      entry.images = [{
        alt: entry.title,
        url: source.url,
        archivedUrl: null,
        localUrl: `../../../images/${entry.slug}/cover.${source.extension}`
      }];
      await fs.writeFile(file, `${JSON.stringify(entry, null, 2)}\n`);
      updated += 1;
      console.log(`${category}/${entry.slug}: ${source.label}`);
    } catch (error) {
      failed.push(`${category}/${entry.slug}: ${error.message}`);
    }
  }
}

console.log(`Updated ${updated} entries.`);
if (failed.length) {
  console.error(`Failed ${failed.length}:\n${failed.join('\n')}`);
  process.exitCode = 1;
}
