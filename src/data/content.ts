import { z } from 'astro/zod';

import alumniRaw from './alumni.json';
import linksRaw from './links.json';
import membersRaw from './members.json';
import newsRaw from './news.json';
import projectsRaw from './projects.json';
import publicationsRaw from './publications.json';
import recruitmentRaw from './recruitment.json';
import researchAreasRaw from './research-areas.json';
import softwareRaw from './software.json';
import teachingRaw from './teaching.json';

const optionalUrl = z.union([z.literal(''), z.url()]);
const optionalText = z.string();

export const memberSchema = z.object({
  name: z.string().min(1),
  nameKo: optionalText,
  group: z.enum([
    'Postdoctoral researchers',
    'PhD students',
    "Master's students",
    'Undergraduate researchers',
  ]),
  year: optionalText,
  topic: optionalText,
  photo: optionalText,
  email: z.union([z.literal(''), z.email()]),
  role: optionalText,
});

export const alumniSchema = z.object({
  name: z.string().min(1),
  degree: optionalText,
  year: optionalText,
  thesis: optionalText,
  now: optionalText,
});

export const publicationSchema = z.object({
  type: z.enum(['journal', 'conference']),
  authors: z.string().min(1),
  title: z.string().min(1),
  venue: z.string().min(1),
  year: z.string().regex(/^\d{4}$/),
  volume: optionalText,
  pages: optionalText,
  doi: optionalText,
  code: optionalUrl.optional().default(''),
  data: optionalUrl.optional().default(''),
  preprint: optionalUrl.optional().default(''),
});

export const projectSchema = z.object({
  title: z.string().min(1),
  titleKo: optionalText,
  funder: z.string().min(1),
  period: optionalText,
  role: z.enum(['Principal Investigator', 'Co-Investigator']),
  status: z.enum(['current', 'completed', 'planned']),
  summary: optionalText,
  awardNumber: optionalText.optional().default(''),
  url: optionalUrl.optional().default(''),
  relatedDois: z.array(z.string()).optional().default([]),
});

export const softwareSchema = z.object({
  name: z.string().min(1),
  expansion: optionalText,
  description: z.string().min(1),
  status: z.enum(['public', 'alpha', 'in-development']),
  repo: optionalUrl,
  docs: optionalUrl,
});

export const newsSchema = z.object({
  date: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  display: optionalText,
  title: z.string().min(1),
  body: optionalText,
  link: optionalUrl.or(z.string().startsWith('/')),
  linkText: optionalText,
  image: optionalText,
  imageAlt: optionalText,
  pinned: z.boolean().optional().default(false),
  kind: z.enum(['news', 'recruitment']).optional().default('news'),
});

export const recruitmentSchema = z.object({
  active: z.boolean(),
  intake: z.string().min(1),
  positions: z.array(
    z.object({
      degree: z.enum(['MSc', 'PhD', 'Postdoctoral']),
      count: z.number().int().positive(),
    }),
  ),
  openUntil: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  undergraduateSlotsAvailable: z.boolean(),
  summary: z.string().min(1),
  contact: z.email(),
});

export const researchAreaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  topics: z.array(z.string().min(1)).min(1),
  methods: optionalText.optional(),
  selected: z.array(z.string()).optional(),
  funding: z.array(z.string()).optional(),
  lineage: optionalText.optional(),
  emerging: optionalText.optional(),
});

export const teachingSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  titleKo: optionalText,
  level: z.enum(['Undergraduate', 'Graduate']),
  semester: optionalText,
  description: optionalText,
});

export const linkGroupSchema = z.object({
  group: z.string().min(1),
  items: z.array(
    z.object({
      label: z.string().min(1),
      url: optionalUrl,
      note: optionalText,
    }),
  ),
});

export const members = z.array(memberSchema).parse(membersRaw);
export const alumni = z.array(alumniSchema).parse(alumniRaw);
export const publications = z.array(publicationSchema).parse(publicationsRaw);
export const projects = z.array(projectSchema).parse(projectsRaw);
export const software = z.array(softwareSchema).parse(softwareRaw);
export const news = z.array(newsSchema).parse(newsRaw);
export const recruitment = recruitmentSchema.parse(recruitmentRaw);
export const researchAreas = z.array(researchAreaSchema).parse(researchAreasRaw);
export const teaching = z.array(teachingSchema).parse(teachingRaw);
export const links = z.array(linkGroupSchema).parse(linksRaw);

const dois = new Set(publications.map((publication) => publication.doi).filter(Boolean));
for (const area of researchAreas) {
  for (const doi of area.selected ?? []) {
    if (!dois.has(doi)) {
      throw new Error(`Research area "${area.slug}" references an unknown DOI: ${doi}`);
    }
  }
}

export type Member = z.infer<typeof memberSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Software = z.infer<typeof softwareSchema>;
export type NewsItem = z.infer<typeof newsSchema>;
export type ResearchArea = z.infer<typeof researchAreaSchema>;
