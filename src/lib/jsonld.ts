// schema.org structured data builders.
import { billTitle, endDate, type Artist, type Show, type Venue } from './data.ts';
import { chicagoIso } from './time.ts';

export const SITE_NAME = '815live';

const abs = (path: string, site: URL) => new URL(path, site).href;

function postalAddress(v: Venue) {
  return {
    '@type': 'PostalAddress',
    streetAddress: v.data.address,
    addressLocality: v.data.city,
    addressRegion: v.data.state,
    postalCode: v.data.zip,
    addressCountry: 'US',
  };
}

function geo(v: Venue) {
  return { '@type': 'GeoCoordinates', latitude: v.data.lat, longitude: v.data.lng };
}

function artistLinks(a: Artist): string[] {
  return [a.data.website, ...Object.values(a.data.socials)].filter((u): u is string => Boolean(u));
}

const STATUS = {
  scheduled: 'https://schema.org/EventScheduled',
  cancelled: 'https://schema.org/EventCancelled',
  postponed: 'https://schema.org/EventPostponed',
} as const;

export function musicEvent(show: Show, site: URL) {
  const v = show.venue;
  const url = abs(`/shows/${show.id}`, site);
  const free = show.cover === null || show.cover === 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: `${billTitle(show)} at ${v.data.name}`,
    url,
    startDate: chicagoIso(show.date, show.startTime),
    ...(show.endTime && { endDate: chicagoIso(endDate(show), show.endTime) }),
    eventStatus: STATUS[show.status],
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(show.notes && { description: show.notes }),
    location: {
      '@type': 'Place',
      name: v.data.name,
      address: postalAddress(v),
      geo: geo(v),
      url: abs(`/venues/${v.id}`, site),
    },
    performer: show.artists.map((a) => ({
      '@type': 'MusicGroup',
      name: a.data.name,
      url: abs(`/artists/${a.id}`, site),
      ...(artistLinks(a).length && { sameAs: artistLinks(a) }),
    })),
    organizer: {
      '@type': 'Organization',
      name: v.data.name,
      url: v.data.website ?? abs(`/venues/${v.id}`, site),
    },
    ...(free && { isAccessibleForFree: true }),
    ...(typeof show.cover === 'number' &&
      show.cover > 0 && {
        offers: {
          '@type': 'Offer',
          price: show.cover.toFixed(2),
          priceCurrency: 'USD',
          url: show.ticketUrl ?? url,
          availability: 'https://schema.org/InStock',
        },
      }),
  };
}

export function musicVenue(v: Venue, site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicVenue',
    name: v.data.name,
    url: abs(`/venues/${v.id}`, site),
    description: v.data.description,
    address: postalAddress(v),
    geo: geo(v),
    ...(v.data.website && { sameAs: [v.data.website] }),
  };
}

export function musicGroup(a: Artist, site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: a.data.name,
    url: abs(`/artists/${a.id}`, site),
    description: a.data.bio,
    ...(a.data.genres.length && { genre: a.data.genres }),
    foundingLocation: { '@type': 'Place', name: a.data.hometown },
    ...(artistLinks(a).length && { sameAs: artistLinks(a) }),
  };
}

export function website(site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: site.href,
    description: 'Live music listings for Rockford, Loves Park, Belvidere and the 815.',
  };
}
