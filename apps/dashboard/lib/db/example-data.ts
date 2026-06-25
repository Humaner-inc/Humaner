import { createHash } from 'crypto';
import { extname } from 'path';
import {
  ActionType,
  ActorType,
  ContactRecord,
  ContactStage
} from '@prisma/client';
import { addMilliseconds, subDays } from 'date-fns';
import { v4 } from 'uuid';

import { detectChanges } from '@/lib/db/contact-event-capture';
import { prisma } from '@/lib/db/prisma';
import { getBaseUrl } from '@/lib/urls/get-base-url';
import { getContactImageUrl } from '@/lib/urls/get-contact-image-url';

const BATCH_SIZE = 5;

type InMemoryImage = {
  buffer: Buffer;
  mimeType: string;
};
type ImageCache = Map<string, InMemoryImage>;

export async function addExampleData(
  organizationId: string,
  userId: string
): Promise<void> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const imageCache = await preloadImages();
  let favoritesCount = -1;

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    const timeSpan = now.getTime() - thirtyDaysAgo.getTime();
    const batchQueries = [];

    for (const contact of batch) {
      const contactId = v4();

      // Calculate a random date within the last 30 day
      const randomOffset = Math.random() * timeSpan;
      const randomDate = addMilliseconds(thirtyDaysAgo, randomOffset);

      let imageUrl: string | undefined;

      if (contact.image && imageCache.has(contact.image)) {
        const { buffer, mimeType } = imageCache.get(contact.image)!;
        const hash = createHash('sha256').update(buffer).digest('hex');
        batchQueries.push(
          prisma.contactImage.create({
            data: {
              contactId,
              data: buffer,
              contentType: mimeType,
              hash: hash
            },
            select: {
              id: true // SELECT NONE
            }
          })
        );
        imageUrl = getContactImageUrl(contactId, hash);
      }

      let addToFavorites = false;
      if (['Airbnb', 'Google', 'Microsoft'].includes(contact.name)) {
        addToFavorites = true;
        favoritesCount++;
      }

      batchQueries.push(
        prisma.contact.create({
          data: {
            id: contactId,
            organizationId,
            name: contact.name,
            image: imageUrl,
            record: contact.record,
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            tags: {
              connectOrCreate: contact.tags.map((tag) => ({
                where: { text: tag },
                create: { text: tag }
              }))
            },
            activities: {
              create: {
                actionType: ActionType.CREATE,
                actorId: userId,
                actorType: ActorType.MEMBER,
                metadata: detectChanges(null, {
                  id: contactId,
                  organizationId: organizationId,
                  name: contact.name,
                  image: imageUrl ?? null,
                  record: contact.record,
                  email: contact.email,
                  phone: contact.phone,
                  address: contact.address,
                  stage: ContactStage.LEAD,
                  updatedAt: randomDate,
                  createdAt: randomDate,
                  tags: contact.tags.map((tag) => ({
                    text: tag
                  }))
                }),
                occurredAt: randomDate
              }
            },
            favorites: addToFavorites
              ? { create: { userId: userId, order: favoritesCount } }
              : undefined,
            createdAt: randomDate,
            updatedAt: randomDate
          },
          select: {
            id: true // SELECT NONE
          }
        })
      );
    }

    await prisma.$transaction(batchQueries);
  }
}

async function preloadImages(): Promise<ImageCache> {
  const imageCache = new Map<string, InMemoryImage>();
  await Promise.all(
    contacts.map(async (contact) => {
      if (contact.image) {
        const response = await fetch(`${getBaseUrl()}${contact.image}`);
        if (response.ok) {
          const mimeType =
            response.headers.get('content-type') || getMimeType(contact.image);
          const jsBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(new Uint8Array(jsBuffer));
          imageCache.set(contact.image, { buffer, mimeType });
        }
      }
    })
  );

  return imageCache;
}

function getMimeType(filename: string): string {
  const ext = extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

const contacts = [
  // COMPANIES
  {
    name: 'Adobe',
    image: '/example-data/companies/adobe.png',
    record: ContactRecord.COMPANY,
    email: 'contact@adobe.com',
    phone: '+1 408-536-6000',
    address: '345 Park Avenue, San Jose, CA 95110, USA',
    tags: ['Software', 'Technology', 'Creativity']
  },
  {
    name: 'Airbnb',
    image: '/example-data/companies/airbnb.png',
    record: ContactRecord.COMPANY,
    email: 'press@airbnb.com',
    phone: '+1 415-800-5959',
    address: '888 Brannan Street, San Francisco, CA 94103, USA',
    tags: ['Internet', 'B2C', 'Web Services & Apps']
  },
  {
    name: 'Amazon',
    image: '/example-data/companies/amazon.png',
    record: ContactRecord.COMPANY,
    email: 'contact@amazon.com',
    phone: '+1 206-266-1000',
    address: '410 Terry Avenue North, Seattle, WA 98109, USA',
    tags: ['E-commerce', 'Technology', 'Cloud Computing']
  },
  {
    name: 'AMD',
    image: '/example-data/companies/amd.png',
    record: ContactRecord.COMPANY,
    email: 'info@amd.com',
    phone: '+1 408-749-4000',
    address: '2485 Augustine Drive, Santa Clara, CA 95054, USA',
    tags: ['Semiconductors', 'Hardware', 'Technology']
  },
  {
    name: 'Apple',
    image: '/example-data/companies/apple.png',
    record: ContactRecord.COMPANY,
    email: 'contact@apple.com',
    phone: '+1 408-996-1010',
    address: 'One Apple Park Way, Cupertino, CA 95014, USA',
    tags: ['Technology', 'B2C', 'IT & Services']
  },
  {
    name: 'Broadcom',
    image: '/example-data/companies/broadcom.png',
    record: ContactRecord.COMPANY,
    email: 'info@broadcom.com',
    phone: '+1 408-677-6000',
    address: '1320 Ridder Park Drive, San Jose, CA 95131, USA',
    tags: ['Semiconductors', 'Infrastructure Software', 'Technology']
  },
  {
    name: 'Disney',
    image: '/example-data/companies/disney.png',
    record: ContactRecord.COMPANY,
    email: 'contact@disney.com',
    phone: '+1 818-560-1000',
    address: '500 South Buena Vista Street, Burbank, CA 91521, USA',
    tags: ['Entertainment', 'B2C', 'Broadcasting']
  },
  {
    name: 'Dropbox',
    image: '/example-data/companies/dropbox.png',
    record: ContactRecord.COMPANY,
    email: 'info@dropbox.com',
    phone: '+1 415-857-6800',
    address: '1800 Owens Street, San Francisco, CA 94158, USA',
    tags: ['Cloud Storage', 'Collaboration', 'Software']
  },
  {
    name: 'Google',
    image: '/example-data/companies/google.png',
    record: ContactRecord.COMPANY,
    email: 'contact@google.com',
    phone: '+1 650-253-0000',
    address: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
    tags: ['Technology', 'Internet', 'Web Services & Apps']
  },
  {
    name: 'Intercom',
    image: '/example-data/companies/intercom.png',
    record: ContactRecord.COMPANY,
    email: 'team@intercom.com',
    phone: '+1 415-932-6898',
    address: '55 2nd Street, 4th Floor, San Francisco, CA 94105, USA',
    tags: ['SAAS', 'B2B', 'Technology']
  },
  {
    name: 'LVMH',
    image: '/example-data/companies/lvmh.png',
    record: ContactRecord.COMPANY,
    email: 'contact@lvmh.com',
    phone: '+33 1 44 13 22 22',
    address: '22 Avenue Montaigne, 75008 Paris, France',
    tags: ['Luxury Goods', 'B2C', 'Retail']
  },
  {
    name: 'Microsoft',
    image: '/example-data/companies/microsoft.png',
    record: ContactRecord.COMPANY,
    email: 'contact@microsoft.com',
    phone: '+1 425-882-8080',
    address: 'One Microsoft Way, Redmond, WA 98052, USA',
    tags: ['Technology', 'SAAS', 'B2B', 'IT & Services']
  },
  {
    name: 'Netflix',
    image: '/example-data/companies/netflix.png',
    record: ContactRecord.COMPANY,
    email: 'info@netflix.com',
    phone: '+1 408-540-3700',
    address: '100 Winchester Circle, Los Gatos, CA 95032, USA',
    tags: ['Entertainment', 'Streaming', 'Technology']
  },
  {
    name: 'Nvidia',
    image: '/example-data/companies/nvidia.png',
    record: ContactRecord.COMPANY,
    email: 'info@nvidia.com',
    phone: '+1 408-486-2000',
    address: '2788 San Tomas Expressway, Santa Clara, CA 95051, USA',
    tags: ['Hardware', 'Technology', 'AI']
  },
  {
    name: 'Oracle',
    image: '/example-data/companies/oracle.png',
    record: ContactRecord.COMPANY,
    email: 'info@oracle.com',
    phone: '+1 650-506-7000',
    address: '500 Oracle Parkway, Redwood Shores, CA 94065, USA',
    tags: ['Database', 'Cloud', 'Enterprise Software']
  },
  {
    name: 'PayPal',
    image: '/example-data/companies/paypal.png',
    record: ContactRecord.COMPANY,
    email: 'contact@paypal.com',
    phone: '+1 888-221-1161',
    address: '2211 North First Street, San Jose, CA 95131, USA',
    tags: ['Technology', 'B2C', 'Internet']
  },
  {
    name: 'Qualcomm',
    image: '/example-data/companies/qualcomm.png',
    record: ContactRecord.COMPANY,
    email: 'info@qualcomm.com',
    phone: '+1 858-587-1121',
    address: '5775 Morehouse Dr, San Diego, CA 92121, USA',
    tags: ['Semiconductors', 'Telecommunications', 'Technology']
  },
  {
    name: 'Samsung',
    image: '/example-data/companies/samsung.png',
    record: ContactRecord.COMPANY,
    email: 'info@samsung.com',
    phone: '+82 2-2053-3000',
    address: '129 Samsung-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, South Korea',
    tags: ['Electronics', 'Technology', 'Consumer Goods']
  },
  {
    name: 'Salesforce',
    image: '/example-data/companies/salesforce.png',
    record: ContactRecord.COMPANY,
    email: 'contact@salesforce.com',
    phone: '+1 415-901-7000',
    address: '415 Mission Street, 3rd Floor, San Francisco, CA 94105, USA',
    tags: ['Technology', 'SAAS', 'IT & Services', 'B2B']
  },
  {
    name: 'Slack',
    image: '/example-data/companies/slack.png',
    record: ContactRecord.COMPANY,
    email: 'info@slack.com',
    phone: '+1 415-579-9122',
    address: '500 Howard Street, San Francisco, CA 94105, USA',
    tags: ['Communication', 'Collaboration', 'Software']
  },
  {
    name: 'Spotify',
    image: '/example-data/companies/spotify.png',
    record: ContactRecord.COMPANY,
    email: 'press@spotify.com',
    phone: '+1 212-653-8800',
    address:
      '4 World Trade Center, 150 Greenwich Street, New York, NY 10007, USA',
    tags: ['Music', 'Streaming', 'Technology']
  },
  {
    name: 'Tesla',
    image: '/example-data/companies/tesla.png',
    record: ContactRecord.COMPANY,
    email: 'press@tesla.com',
    phone: '+1 888-518-3752',
    address: '3500 Deer Creek Road, Palo Alto, CA 94304, USA',
    tags: ['Automotive', 'Energy', 'Technology']
  },
  {
    name: 'Uber',
    image: '/example-data/companies/uber.png',
    record: ContactRecord.COMPANY,
    email: 'press@uber.com',
    phone: '+1 415-612-8582',
    address: '1515 3rd Street, San Francisco, CA 94158, USA',
    tags: ['Transportation', 'Technology', 'Logistics']
  },
  {
    name: 'United Airlines',
    image: '/example-data/companies/united-airlines.png',
    record: ContactRecord.COMPANY,
    email: 'customer.service@united.com',
    phone: '+1 800-864-8331',
    address: '233 S. Wacker Drive, Chicago, IL 60606, USA',
    tags: ['Aviation', 'B2C', 'Transportation']
  },
  {
    name: 'Zoom',
    image: '/example-data/companies/zoom.png',
    record: ContactRecord.COMPANY,
    email: 'info@zoom.us',
    phone: '+1 888-799-9666',
    address: '55 Almaden Boulevard, 6th Floor, San Jose, CA 95113, USA',
    tags: ['Video Conferencing', 'Communication', 'Software']
  },
  // PEOPLE
  {
    name: 'Beatrice Richter',
    image: '/example-data/people/beatrice_richter.png',
    record: ContactRecord.PERSON,
    email: 'beatrice.richter@intel.com',
    phone: '+1 408-765-8080',
    address: '2200 Mission College Blvd, Santa Clara, CA 95054, USA',
    tags: ['Semiconductors', 'Technology']
  },
  {
    name: 'Gabriel Fischer',
    image: '/example-data/people/gabriel_fischer.png',
    record: ContactRecord.PERSON,
    email: 'gabriel.fischer@x.com',
    phone: '+1 415-222-9670',
    address: '1355 Market Street, Suite 900, San Francisco, CA 94103, USA',
    tags: ['Social Media', 'Technology']
  },
  {
    name: 'Hugo Schmidt',
    image: '/example-data/people/hugo_schmidt.png',
    record: ContactRecord.PERSON,
    email: 'hugo.schmidt@spotify.com',
    phone: '+1 212-653-8800',
    address:
      '4 World Trade Center, 150 Greenwich Street, New York, NY 10007, USA',
    tags: ['Music', 'Technology']
  },
  {
    name: 'Ishaan Richardson',
    image: '/example-data/people/ishaan_richardson.png',
    record: ContactRecord.PERSON,
    email: 'ishaan.richardson@ibm.com',
    phone: '+1 914-499-1900',
    address: '1 New Orchard Road, Armonk, NY 10504, USA',
    tags: ['Cloud Computing', 'AI']
  },
  {
    name: 'Kathleen Graves',
    image: '/example-data/people/kathleen_graves.png',
    record: ContactRecord.PERSON,
    email: 'kathleen.graves@zoom.us',
    phone: '+1 888-799-9666',
    address: '55 Almaden Blvd, Suite 600, San Jose, CA 95113, USA',
    tags: ['Video Conferencing', 'SAAS']
  },
  {
    name: 'Lucia Bianchi',
    image: '/example-data/people/lucia_bianchi.png',
    record: ContactRecord.PERSON,
    email: 'lucia.bianchi@squareup.com',
    phone: '+1 800-473-3789',
    address: '1455 Market Street, Suite 600, San Francisco, CA 94103, USA',
    tags: ['Financial Services', 'Technology']
  },
  {
    name: 'Marie Jones',
    image: '/example-data/people/marie_jones.png',
    record: ContactRecord.PERSON,
    email: 'marie.jones@slack.com',
    phone: '+1 415-863-1200',
    address: '500 Howard Street, San Francisco, CA 94105, USA',
    tags: ['Collaboration', 'SAAS']
  },
  {
    name: 'Mateo Jensen',
    image: '/example-data/people/mateo_jensen.png',
    record: ContactRecord.PERSON,
    email: 'mateo.jensen@hubspot.com',
    phone: '+1 888-482-7768',
    address: '25 First Street, Cambridge, MA 02141, USA',
    tags: ['Marketing', 'SAAS']
  },
  {
    name: 'Mei Ling Chen',
    image: '/example-data/people/mei_ling_chen.png',
    record: ContactRecord.PERSON,
    email: 'mei.ling.chen@vmware.com',
    phone: '+1 877-486-9273',
    address: '3401 Hillview Ave, Palo Alto, CA 94304, USA',
    tags: ['Virtualization', 'Cloud Infrastructure']
  },
  {
    name: 'Olivia Weber',
    image: '/example-data/people/olivia_weber.png',
    record: ContactRecord.PERSON,
    email: 'olivia.weber@cisco.com',
    phone: '+1 408-526-4000',
    address: '170 West Tasman Dr, San Jose, CA 95134, USA',
    tags: ['Networking', 'IoT']
  },
  {
    name: 'Philip Grant',
    image: '/example-data/people/philip_grant.png',
    record: ContactRecord.PERSON,
    email: 'philip.grant@etsy.com',
    phone: '+1 718-855-6955',
    address: '55 Washington Street, Suite 512, Brooklyn, NY 11201, USA',
    tags: ['E-commerce', 'Technology']
  },
  {
    name: 'Sofia Muller',
    image: '/example-data/people/sofia_muller.png',
    record: ContactRecord.PERSON,
    email: 'sofia.muller@adobe.com',
    phone: '+1 408-536-6000',
    address: '345 Park Avenue, San Jose, CA 95110, USA',
    tags: ['Software', 'Technology']
  },
  {
    name: 'Thomas Clark',
    image: '/example-data/people/thomas_clark.png',
    record: ContactRecord.PERSON,
    email: 'thomas.clark@oracle.com',
    phone: '+1 650-506-7000',
    address: '500 Oracle Parkway, Redwood City, CA 94065, USA',
    tags: ['Database', 'Technology']
  },
  {
    name: 'Victoria Ballard',
    image: '/example-data/people/victoria_ballard.png',
    record: ContactRecord.PERSON,
    email: 'victoria.ballard@dell.com',
    phone: '+1 800-289-3355',
    address: '1 Dell Way, Round Rock, TX 78682, USA',
    tags: ['Hardware', 'IT Solutions']
  },
  {
    name: 'Vivian Casey',
    image: '/example-data/people/vivian_casey.png',
    record: ContactRecord.PERSON,
    email: 'vivian.casey@mongodb.com',
    phone: '+1 650-793-3338',
    address: '1635 Broadway, 3rd Floor, New York, NY 10019, USA',
    tags: ['Database', 'SAAS']
  }
];
