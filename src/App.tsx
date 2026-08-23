import { useEffect, useRef, useState } from 'react';
import Globe from './Globe';
import membersData from './members.json';

interface Member {
  name: string;
  subteam: string; // which grid section the card appears in
  lead?: boolean; // team leads sit first in their subteam's grid
  role?: string; // org-wide role label (Leadership section), e.g. "Faculty Advisor"
  badge?: string; // subteam whose corner badge to show; defaults to subteam
  photo: string; // path under /public, e.g. '/members/jane-doe.jpg' - empty string shows a placeholder
  email: string;
  major: string;
  linkedin?: string;
}

interface Project {
  slug?: string; // links the project card to its post at #/posts/<slug>; omit for no link
  tag: string;
  tagColor: string;
  title: string;
  body: string;
  photo?: string; // path under /public; omitted shows a placeholder block
  photo2?: string; // second image, shown side by side on the full-width card
  photoPosition?: string; // object-position focal point within the crop frame
  photoAspect?: string; // card image aspect ratio; defaults to 16/10
}

const PROJECTS: Project[] = [
  {
    slug: '3d-printed-weather-stations',
    tag: 'Tech · Air',
    tagColor: '#8f0c3a',
    title: '3D Printed Weather Stations',
    body: "Weather stations printed to UCAR's open-source 3DPAWS design: temperature, pressure, humidity, wind and rain for a fraction of commercial cost. Built this summer, deploying around Cayuga Lake this fall.",
    photo: '/projects/sensors.png',
  },
  {
    slug: 'cayuga-lake-buoy',
    tag: 'Water',
    tagColor: '#2e6fc9',
    title: 'Cayuga Lake Buoy',
    body: "A decommissioned research buoy from Todd Cowen's hydraulics lab, being refitted with a commercial GMX-550 weather station, our homemade stations, and a suite of water sensors into one floating lake-monitoring platform.",
    photo: '/projects/sensors-lake.png',
  },
  {
    slug: 'atmospheric-tethersonde',
    tag: 'Air',
    tagColor: '#6d9dcd',
    title: 'Atmospheric Tethersonde',
    body: 'An affordable, portable profiler for the lowest 500 feet of the atmosphere. We built it to get high-resolution observations of boundary-layer and lake-effect weather.',
    photo: '/projects/tethersonde.jpeg',
    photoAspect: '4/5',
    photoPosition: '57% 50%',
  },
  {
    slug: 'nisar-ground-truthing',
    tag: 'Rock',
    tagColor: '#914724',
    title: 'NISAR Ground-Truthing',
    body: "Five soil-moisture nodes at the Game Farm site check NASA's NISAR satellite against what's actually in the dirt.",
    photo: '/projects/nisar.png',
    photoAspect: '4/5',
    photoPosition: '50% 40%',
  },
  {
    slug: 'lidar-hexapod',
    tag: 'Tech · CUPI Partnership',
    tagColor: '#8f0c3a',
    title: 'LiDAR Hexapod',
    body: 'A LiDAR attachment for a six-legged robot, built jointly with Cornell Physical Intelligence. Paired with UAV LiDAR, it is our path to digital twins of the Finger Lakes.',
    photo: '/projects/hexapod.png',
  },
  {
    tag: 'Coming soon',
    tagColor: '#8f0c3a',
    title: 'Drone Photogrammetry',
    body: 'Coming soon: repeatable aerial surveys of Finger Lakes shorelines. Overlapping drone passes stitched into 3D scans, to make erosion measurable and give our sensor data terrain context.',
    photo: '/projects/drone.webp',
  },
];

const PARTNERS = [
  'Cornell College of Engineering',
  'Dept. of Earth & Atmospheric Sciences',
  'Emergent Climate Risk Lab',
  'Cornell Project Team Program',
];

const SUBTEAM_COLORS: Record<string, string> = {
  Leadership: '#4fae7d',
  Air: '#6d9dcd',
  Water: '#094295',
  Rock: '#914724',
  Data: '#5d177f',
  Tech: '#8f0c3a',
  Business: '#dcbe32',
};

// corner badges, sourced from assets/ - one per subteam
const SUBTEAM_BADGES: Record<string, string> = {
  Air: '/badges/air.png',
  Water: '/badges/water.png',
  Rock: '/badges/rock.png',
  Data: '/badges/data.png',
  Tech: '/badges/tech.png',
  Business: '/badges/business.png',
};

interface LegalPage {
  title: string;
  updated: string;
  sections: { h: string; body: string[] }[];
}

const LEGAL_PAGES: Record<string, LegalPage> = {
  '#/privacy': {
    title: 'Privacy Policy',
    updated: 'August 14, 2026',
    sections: [
      {
        h: 'Who we are',
        body: [
          'CU GeoData ("GeoData," "we," "us") is a registered student organization at Cornell University in Ithaca, New York. This policy describes how this website handles information about its visitors. This website is maintained by student members and is not operated by Cornell University.',
        ],
      },
      {
        h: 'Information you provide to us',
        body: [
          'This site does not have user accounts and does not ask you to submit forms. If you contact us by email (for example at cugeodata@cornell.edu), we receive your email address and whatever information you choose to include. We use that information only to respond to you and to conduct ordinary team business, such as recruitment.',
        ],
      },
      {
        h: 'Information collected automatically',
        body: [
          'This is a static website. We do not run analytics, advertising trackers, or social media pixels. Like most websites, the servers that host this site may automatically log standard technical information, such as your IP address, browser type, the pages you visit, and access times, for security and operational purposes. Those logs are controlled by our hosting provider and are subject to its privacy practices.',
        ],
      },
      {
        h: 'Cookies',
        body: [
          'This site does not set cookies and does not use local storage to track you.',
        ],
      },
      {
        h: 'Member photos and bios',
        body: [
          'Photos, names, and short bios of GeoData members appear on this site with the consent of those members. A member who wants their information updated or removed can email us and we will do so promptly.',
        ],
      },
      {
        h: 'How we share information',
        body: [
          'We do not sell, rent, or trade information about visitors. We may share information if required by law, to protect the safety or rights of others, or with Cornell University to the extent required for the administration of registered student organizations.',
        ],
      },
      {
        h: 'Third-party links',
        body: [
          'This site links to external websites, including Cornell University pages. Those sites have their own privacy policies, and we are not responsible for their practices.',
        ],
      },
      {
        h: "Children's privacy",
        body: [
          'This site is not directed at children under 13, and we do not knowingly collect personal information from them. If you believe a child has provided us personal information, contact us and we will delete it.',
        ],
      },
      {
        h: 'Data retention and security',
        body: [
          'We keep emails you send us only as long as needed for the purpose you sent them. We take reasonable measures to protect information in our control, but no method of transmission or storage is completely secure.',
        ],
      },
      {
        h: 'Your choices',
        body: [
          'You can browse this site without providing any personal information. To ask what information we hold about you, or to have it corrected or deleted, email cugeodata@cornell.edu.',
        ],
      },
      {
        h: 'Changes to this policy',
        body: [
          'If we change this policy, we will post the updated version on this page with a new "last updated" date.',
        ],
      },
      {
        h: 'Contact',
        body: [
          'Questions about this policy can be sent to cugeodata@cornell.edu.',
        ],
      },
    ],
  },
  '#/terms': {
    title: 'Terms of Use',
    updated: 'August 14, 2026',
    sections: [
      {
        h: 'Acceptance of these terms',
        body: [
          'By using this website you agree to these Terms of Use. If you do not agree, please do not use the site.',
        ],
      },
      {
        h: 'About this site',
        body: [
          'This website is maintained by the student members of CU GeoData, a registered student organization at Cornell University. It is provided for informational purposes. The content on this site does not represent the official views of Cornell University.',
        ],
      },
      {
        h: 'Intellectual property',
        body: [
          'Unless otherwise noted, the content of this site, including text, images, and graphics, belongs to CU GeoData or its members and may not be republished or used commercially without our permission. You may view and share links to this site for personal, non-commercial purposes.',
          'The Cornell name, logo, and related marks are the property of Cornell University, and nothing on this site grants any right to use them.',
        ],
      },
      {
        h: 'No professional advice; data disclaimer',
        body: [
          'Environmental measurements, maps, and datasets described or published by GeoData are produced by students for educational and research purposes. They are provided without any guarantee of accuracy, completeness, or timeliness, and must not be relied on for emergency response, navigation, health, or other safety-critical decisions.',
        ],
      },
      {
        h: 'Acceptable use',
        body: [
          'You agree not to use this site for any unlawful purpose, attempt to gain unauthorized access to any systems, interfere with the operation of the site, or misrepresent your affiliation with GeoData or Cornell University.',
        ],
      },
      {
        h: 'Disclaimer of warranties',
        body: [
          'This site and its content are provided "as is" and "as available," without warranties of any kind, express or implied, including fitness for a particular purpose and non-infringement.',
        ],
      },
      {
        h: 'Limitation of liability',
        body: [
          'To the fullest extent permitted by law, CU GeoData and its members will not be liable for any damages arising out of your use of, or inability to use, this site or its content.',
        ],
      },
      {
        h: 'External links',
        body: [
          'Links to third-party websites are provided for convenience. We do not endorse and are not responsible for their content or practices.',
        ],
      },
      {
        h: 'Changes',
        body: [
          'We may update this site and these terms at any time. Updated terms take effect when posted on this page.',
        ],
      },
      {
        h: 'Governing law',
        body: [
          'These terms are governed by the laws of the State of New York, without regard to conflict-of-law rules.',
        ],
      },
      {
        h: 'Contact',
        body: [
          'Questions about these terms can be sent to cugeodata@cornell.edu.',
        ],
      },
    ],
  },
};

interface Post {
  slug: string; // project posts share their project's slug so its card header links here
  kind: 'project' | 'blog';
  date: string;
  tag: string;
  tagColor: string;
  title: string;
  dek: string; // the one-liner under the headline
  photo?: string; // path under /public; omitted shows a placeholder
  body: (string | { img: string; max?: number })[]; // a string per paragraph; { img } entries render as framed inline photos, max caps their width in px
  links: { label: string; href: string }[]; // '#' hrefs are placeholders - swap for real ones
  credit?: string; // photo credit line, shown under the links
}

// newest first. Paragraphs marked "Snippet" are templates - replace with real write-ups.
const POSTS: Post[] = [
  {
    slug: 'summer-spotlight-orion-hoch',
    kind: 'blog',
    date: 'August 2026',
    tag: 'Summer Spotlight',
    tagColor: '#4fae7d',
    title: 'Summer Spotlight: Orion Hoch',
    dek: 'Co-Team Lead Orion Hoch spent the summer building 3Dsem, a beginner-friendly devkit for semantic segmentation of 3D point clouds.',
    photo: '/blog/lidar-scan.jpg',
    body: [
      'Orion Hoch is a Computer Science major and Co-Team Lead of GeoData.',
      "I spent my summer in Minnesota building **3Dsem**, a devkit that makes semantic segmentation of 3D point clouds approachable for people who have never touched the tooling around it. Point clouds are just data abstractions of the real world, with my preference being the LiDAR point cloud space. LiDAR has been used heavily in geospatial workflows for decades as a way to capture an environment at multiple phases and measure gross change. The pipelines most devs are used to are very analytical in nature, and with advances in computer vision research in the 3D space, it has become obvious the field is in a major period of change. Incorporating CV techniques into geospatial workflows was a critical focus of mine this summer, and to ease people in, I decided to make the process of semantic segmentation (separating objects from their environment and then labeling them within space) as easy as possible for newer users.",
      { img: '/blog/segmentation-examples.jpg' },
      "Most research code assumes you're comfortable untangling dependency trees and running Docker images before you can label a single point. This, plus the need for newer and better GPU power for inference, has made adoption harder than it needs to be for the people already on the fence. And that's before the training side, which is expensive, time consuming, and often incredibly bespoke to the datasets you are training on, adding an extra layer of complexity.",
      "So my goal was to make inference require zero dependency management or extra downloads for the user, and to make training consistent and easy to share. The trick was modularizing everything. **3Dsem** packages training files and pretrained weights as conda packages, with pixi lockfiles pinned to each model architecture, so installs have no dependency solving or Docker. On top of that I offer an open source GUI that exposes every step of the pipeline, letting users create custom weights with their own data and share them, giving the open source community complete control to make weights for specific datasets or tasks. And for the vast majority of users, the TUI handles fast inference and pulling premade weights for quick results on large data inputs.",
      { img: '/blog/pixi-mascot.jpg' },
      "It's live on PyPI as **3Dsem** and the early reviews from people I've shown it to have been encouraging. Using newer transformer models like Utonia proved quite successful, registering great cross-domain numbers **between 0.81 and 0.89 mIoU** on the most common USGS survey data. I'm still fairly new to this kind of work, so I honestly don't know how useful any of it will turn out to be, but I find it interesting nonetheless, and pointing it at our own hexapod scans this fall feels like the right way to find out.",
      { img: '/blog/usgs-lidar.jpg' },
    ],
    links: [
      { label: '3Dsem on PyPI', href: 'https://pypi.org/project/3Dsem/' },
      { label: 'Orion on LinkedIn', href: 'https://www.linkedin.com/in/orion-hoch/' },
    ],
  },
  {
    slug: 'summer-spotlight-evelyn-keefe',
    kind: 'blog',
    date: 'August 2026',
    tag: 'Summer Spotlight',
    tagColor: '#4fae7d',
    title: 'Summer Spotlight: Evelyn Keefe',
    dek: 'Evelyn Keefe on a summer at NCAR in Boulder: the NSF SOARS program, wildfire smoke, and what regional fires do to global surface pollution.',
    photo: '/blog/soars-cohort.jpg',
    body: [
      'Evelyn Keefe is an Atmospheric Science major and the Air Team Lead of GeoData.',
      'I spent the summer in Boulder, Colorado, working at the **National Center for Atmospheric Research**. I was part of a larger internship program known as the **NSF SOARS program**, which allowed me to work on one research project with the support of multiple mentors. The program is set up so that you have one primary research mentor who oversees the science aspect, one writing mentor who provides feedback on the writing component of your project, and additional mentors who are optional to best support you during the summer. I also had a computational mentor who helped me with analyzing model outputs, as well as troubleshooting the model when it failed to run. Since I was using a model I had never worked with before, it was helpful to have so much support.',
      { img: '/blog/ucar-hangar.jpg' },
      'My project was focused on quantifying the impact of wildfire smoke on global levels of surface pollution. We were working to contribute to a project known as **HTAP3**, or the Hemispheric Transport of Air Pollution project, phase 3. This project had a large scope and the overall goal of improving fire representations in models, including chemistry models. **My project contributed to a sensitivity analysis, which aims to understand how fire inputs into atmospheric chemical models change pollutant levels in different scenarios.** We were examining how fires in different regions around the world change global pollutant levels of surface ozone and fine particulate matter (PM).',
      { img: '/blog/cam-precipitable-water.jpg' },
      'Together, my mentor and I chose to investigate fire emissions from North America and Australia. We used the Community Earth System Model version 2.2 to run different fire emissions scenarios and show us how pollutant behavior changed based on where fires occurred. We adapted a global emissions inventory to three separate scenarios: each without fires in Australia, Canada, or lower North America. After receiving the data, I calculated the percent contribution of each region to global pollution levels over the simulated study period. We found that Australian fires contributed **0.599%** to global surface levels of ozone, and **0.141%** of surface PM. In Canada, fires accounted for **0.364%** of surface ozone and **0.221%** of surface PM, and in lower North America, fires contributed **0.086%** to surface ozone, and **0.064%** to PM. We compared it to a full fire simulation to do these calculations. In this sense, it was more of a case study for how regional fires over this study period inform pollutant levels. The overall contributions were so low because these are the average contributions over the whole study period. **Fire contributions to surface pollutants follow a seasonal cycle, and these five-year averages are a snapshot of these contributions.** The workflow we created can be replicated for other sensitivity studies, and more regions will be examined in the future.',
      { img: '/blog/evelyn-presenting.jpg' },
      "Other than the research, **summer in Boulder had a lot of other perks!** The proximity to nature was incredible, and I was able to go hiking during the weekends. I also got to experience Rocky Mountain National Park, visit UCAR's airplane hangar with research aircraft, and explore the haunted Stanley Hotel that inspired The Shining! **It was a great experience overall, and reaffirmed my desire to do research in the earth sciences.**",
      { img: '/blog/boulder-hiking.jpg' },
    ],
    links: [
      { label: 'NSF SOARS program', href: 'https://soars.ucar.edu/' },
      { label: 'NCAR', href: 'https://ncar.ucar.edu/' },
    ],
    credit: 'Photos courtesy of Evelyn Keefe and the NSF SOARS program.',
  },
  {
    slug: 'lidar-hexapod',
    kind: 'project',
    date: 'August 2026',
    tag: 'Tech · CUPI',
    tagColor: '#8f0c3a',
    title: 'LiDAR Hexapod',
    dek: 'An official partnership with Cornell University Physical Intelligence to build a self-navigating data collection hexapod for the earth sciences, starting with LiDAR.',
    photo: '/projects/hexapod.png',
    body: [
      "This year, we are excited to announce an official partnership with Cornell University Physical Intelligence (CUPI) to build a self-navigating data collection hexapod for the earth sciences, starting with LiDAR collection. CUPI is one of the most inventive robotics teams on Cornell's campus, specializing in the use of AI to improve robotic manipulation and perception. They have previously honed their skills through drone racing, but now with GeoData they are taking steps to apply those skills in the field.",
      { img: '/blog/cupi-sticker.png' },
      "Currently, the majority of LiDAR data is collected from aerial flights, satellites, or UAV scans. Satellites are convenient and offer high coverage, but their coarseness has become a major problem for important tasks like identification. UAV data, on the other hand, is very dense, but it is an expensive initial investment and comes with problems of range, flight planning, and local terrain that take a lot of time and energy to mitigate. The hexapod slots in as a nice in-between: the density is there, and range and availability are fixed by the cheapness of the design and long automated run times.",
      "Dense forest makes the problem concrete. In high-density canopy, coverage from above doesn't always penetrate: the crowns swallow the pulses, and the forest floor comes back patchy or not at all. The future of LiDAR and geotagged data is in data merging, combining passes into improved datasets that no single platform could produce alone. The UAV can cover the tops, the hexapod can cover the bottoms, and the merged cloud gets the whole forest.",
      { img: '/blog/forest-lidar.jpg' },
      "The longer game for us is a digital twin of the Finger Lakes: a full 3D copy of the gorges, shorelines, and forests that you can revisit and compare season over season.",
      'The build is still in progress, but we are excited for the results.',
    ],
    links: [
      { label: 'Cornell Physical Intelligence', href: 'https://cornellphysicalintelligence.com/' },
    ],
  },
  {
    slug: 'new-hardware-in-the-ell',
    kind: 'blog',
    date: 'July 2026',
    tag: 'Team news',
    tagColor: '#4fae7d',
    title: 'New Hardware in the ELL',
    dek: "There's a DGX Spark in the ELL now. Here's what we're planning to do with it, and why we're starting to host our own everything.",
    photo: '/blog/dgx-spark.jpg',
    body: [
      "This semester we bought an NVIDIA DGX Spark, and it now lives in the ELL, with safe remote access for every GeoData student. It's a deceptively small box: a Grace Blackwell chip, 128GB of unified memory, about a petaFLOP of compute. For a relatively small student team, this brings a whole new world of possibilities to the analysis we can run.",
      "The first thing it unlocks is 3D scene reconstruction. Turning drone passes and LiDAR scans into finished models eats GPU time, and until now that meant doing the cost-benefit analysis of managing rental compute and CPU loading. Now, for smaller datasets, it takes minutes, which matters a lot for the constant iteration needed when implementing new research.",
      { img: '/blog/scene-scan.jpg' },
      "The second is forecasting. Tools like NVIDIA's Earth2Studio put real ML weather models within reach of a team like ours. The plan is to pull coarse global forecast data and downscale it into something that actually says what the lake is about to do, then feed our own station data back in to sharpen the local predictions.",
      { img: '/blog/earth2-downscaling.jpg' },
      "The coolest part, though, is the ability to give students on the team the compute to do their own personal projects. Supporting the independent work our teammates do is extremely important for keeping ideas fresh and building critical skills!",
      "The Spark is also the newest tenant in a bigger experiment: hosting our own infrastructure. The ELL now has a small lab network of its own, with a router, a switch, and a Proxmox hypervisor that runs the team's services, and the Spark joins it as the GPU node. Sensor data will flow over a Tailscale mesh into a self-hosted PostGIS and TimescaleDB database. The plan from there is our own little Slurm scheduler handing out jobs across the lab, spinning up cloud machines only when a job actually needs them and tearing them down the moment it finishes.",
      { img: '/blog/proxmox-lab.png' },
      "Part of that is practical and part of it is philosophical. Hardware the club owns keeps working for whoever runs this team after us, costs nothing while it sits, and teaches everyone who touches it how the stack underneath their code actually works. The long-term goal is a club that depends on big organizations for as little as possible.",
    ],
    links: [
      { label: 'TESSERA / GeoTessera', href: 'https://geotessera.org/' },
      { label: 'NVIDIA DGX Spark', href: 'https://www.nvidia.com/en-us/products/workstations/dgx-spark/' },
      { label: 'NVIDIA Earth-2', href: 'https://www.nvidia.com/en-us/high-performance-computing/earth-2/' },
    ],
  },
  {
    slug: 'cayuga-lake-buoy',
    kind: 'project',
    date: 'July 2026',
    tag: 'Water',
    tagColor: '#2e6fc9',
    title: 'Cayuga Lake Buoy',
    dek: "A decommissioned buoy from Todd Cowen's hydraulics lab, being refitted into a single floating weather and water-quality station for Cayuga Lake.",
    photo: '/projects/sensors-lake.png',
    body: [
      "The platform is a decommissioned research buoy that Todd Cowen's hydraulics lab no longer needed, and it's sitting in our lab right now, half stripped and getting a second life.",
      "The current goal for the project is not only mastering the anchoring setup required to create a long-term aquatic fixture on Cayuga Lake, but also developing a deeper understanding of lake-effect conditions. Careful placement of the buoy on specific sections of the lake can tell us a lot about the potential location and movement of storms over the water, and the landing zone of snow and rain.",
      { img: '/blog/nws-snowfall.jpg' },
      "Up top it gets a waterproof weather station, a commercial Gill MaxiMet GMX-550, mounted above wave height, capturing wind speed and direction, temperature, humidity, pressure, solar radiation, and GPS location.",
      "Below the waterline goes the water-quality suite: temperature, dissolved oxygen, turbidity, and conductivity/pH, all reporting through one logger. The point is one coherent instrument for the lake instead of a scatter of gadgets that each need their own babysitting.",
    ],
    links: [
      { label: 'Gill MaxiMet GMX-550', href: 'https://gillinstruments.com/' },
      { label: 'DeFrees Hydraulics Laboratory', href: 'https://www.duffield.cornell.edu/cee/educational-facilities/' },
    ],
  },
  {
    slug: '3d-printed-weather-stations',
    kind: 'project',
    date: 'March 2026',
    tag: 'Tech · Air',
    tagColor: '#8f0c3a',
    title: '3D Printed Weather Stations',
    dek: "Open-source weather stations printed to UCAR's 3DPAWS design, for about a tenth the price of the commercial version.",
    photo: '/projects/sensors.png',
    body: [
      '3DPAWS is an open-source, 3D-printable weather station project from UCAR that produces standardized meteorological readings at a fraction of commercial cost. Ours are built and heading into the field around Cayuga Lake this fall.',
    ],
    links: [
      { label: '3DPAWS guidelines (UCAR)', href: 'https://3dpaws.comet.ucar.edu/' },
    ],
  },
  {
    slug: 'nisar-ground-truthing',
    kind: 'project',
    date: 'August 2025',
    tag: 'Rock',
    tagColor: '#914724',
    title: 'NISAR Ground-Truthing',
    dek: "Five soil-moisture nodes at the Game Farm site check NASA's NISAR satellite against what's actually in the dirt.",
    photo: '/projects/nisar.png',
    body: [
      "Five soil-moisture nodes at the Game Farm site check NASA's NISAR satellite against what's actually in the dirt.",
    ],
    links: [
      { label: 'NISAR mission (NASA)', href: 'https://nisar.jpl.nasa.gov/' },
    ],
  },
  {
    slug: 'atmospheric-tethersonde',
    kind: 'project',
    date: 'May 2024',
    tag: 'Air',
    tagColor: '#6d9dcd',
    title: 'Atmospheric Tethersonde',
    dek: 'An affordable, portable profiler for the lowest 500 feet of the atmosphere, built for boundary-layer and lake-effect weather.',
    photo: '/projects/tethersonde.jpeg',
    body: [
      'The tethersonde is an affordable, portable profiler for the lowest 500 feet of the atmosphere. We built it to get high-resolution observations of boundary-layer and lake-effect weather.',
    ],
    links: [
    ],
  },
];

// sponsorship page - template amounts and perks, adjust to match the packet.
// Alumni destination logos go in public/alumni/; entries without a logo render
// as initials until the file lands.
const SPONSOR_PACKET_PDF = '/sponsorship-packet.pdf'; // drop the packet in public/

const TIERS = [
  { name: 'Rock', color: '#914724', amount: '$500+', perks: ['Logo on our website', 'Decal on a soil-moisture node at the Game Farm site', 'Thank-you in the alumni newsletter'] },
  { name: 'Water', color: '#2e6fc9', amount: '$1,500+', perks: ['Everything in Rock', 'Decal on a Cayuga Lake sensor station, photographed on deployment day', 'Team resume book', 'Social media feature from the field'] },
  { name: 'Air', color: '#6d9dcd', amount: '$3,000+', perks: ['Everything in Water', 'Decal on the tethersonde, flown to 500 feet', 'Logo on team apparel', 'Job postings featured in the alumni newsletter', 'Info session or recruiting event with the team'] },
  { name: 'Orbit', color: '#086727', amount: '$5,000+', perks: ['Everything in Air', 'Decal on the LiDAR hexapod robot and the survey drone', 'A sensor site around the lake named after you', 'First invite to demo day'] },
];

const ALUMNI: { place: string; logo?: string }[] = [
  { place: 'UIUC', logo: '/alumni/uiuc.png' },
  { place: 'Chevron', logo: '/alumni/chevron.png' },
  { place: 'Amazon', logo: '/alumni/amazon.png' },
  { place: 'NOAA', logo: '/alumni/noaa.png' },
  { place: 'NCAR', logo: '/alumni/ncar.png' },
  { place: 'KPMG', logo: '/alumni/kpmg.png' },
  { place: 'Ernst & Young', logo: '/alumni/ey.png' },
  { place: 'NASA', logo: '/alumni/nasa.png' },
  { place: 'Capital One', logo: '/alumni/capital-one.png' },
  { place: 'MIT Lincoln Laboratory', logo: '/alumni/mit-ll.png' },
  { place: 'WashU', logo: '/alumni/washu.png' },
  { place: 'United Airlines', logo: '/alumni/united.png' },
  { place: 'Coinbase', logo: '/alumni/coinbase.png' },
  { place: 'UC Berkeley', logo: '/alumni/berkeley.png' },
  { place: 'Northwestern', logo: '/alumni/northwestern.png' },
  { place: 'Liberty Mutual', logo: '/alumni/liberty-mutual.png' },
];

const teamLabel = (s: string): string => (s === 'Leadership' ? s : `${s} Team`);

// renders **text** in post paragraphs as bold
const emphasize = (text: string) =>
  text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i} style={{ color: '#e6ecf0' }}>{part}</strong> : part));

// members live in src/members.json - mass-edit there. Photos go in
// public/members/ and each entry's "photo" is its path, e.g. "/members/jane.jpg".
// Clicking a photo flips the tile to a contact card (email + major).
const MEMBERS: Member[] = membersData;

const SUBTEAM_COUNT = new Set(MEMBERS.map((m) => m.subteam)).size - 1; // Leadership isn't a subteam
// unique by email (name as fallback) so people on two subteams aren't
// double-counted; the faculty advisor isn't a student member
const MEMBER_COUNT = new Set(MEMBERS.filter((m) => m.role !== 'Faculty Advisor').map((m) => m.email || m.name)).size;

// draggable "ball pit" of alumni destination logos. Physics state lives outside
// React - balls render once and every frame writes transforms directly, same
// reasoning as the globe engine's rAF loop.
function AlumniPit({ alumni }: { alumni: typeof ALUMNI }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const R = window.innerWidth < 720 ? 40 : 60;
    interface Ball { el: HTMLElement; x: number; y: number; vx: number; vy: number }
    const balls: Ball[] = Array.from(wrap.children as HTMLCollectionOf<HTMLElement>).map((el, i) => {
      el.style.width = el.style.height = `${R * 2}px`;
      // spawn stacked above the pit so they rain in on arrival
      return { el, x: R + Math.random() * Math.max(1, wrap.clientWidth - 2 * R), y: -R - i * R * 2.4, vx: (Math.random() - 0.5) * 120, vy: 0 };
    });
    let W = wrap.clientWidth;
    let H = wrap.clientHeight;
    const onResize = () => { W = wrap.clientWidth; H = wrap.clientHeight; };
    window.addEventListener('resize', onResize);

    let dragged: Ball | null = null;
    const pointAt = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      return { px: e.clientX - r.left, py: e.clientY - r.top };
    };
    const onDown = (e: PointerEvent) => {
      const { px, py } = pointAt(e);
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if ((px - b.x) ** 2 + (py - b.y) ** 2 <= R * R) {
          dragged = b;
          b.vx = b.vy = 0;
          wrap.setPointerCapture(e.pointerId);
          break;
        }
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragged) return;
      const { px, py } = pointAt(e);
      // velocity from how far the ball chased the pointer this frame, so a
      // fast flick releases as a throw
      dragged.vx = (px - dragged.x) * 18;
      dragged.vy = (py - dragged.y) * 18;
      dragged.x = px;
      dragged.y = py;
    };
    const onUp = () => { dragged = null; };
    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);

    const G = 1800;
    const REST = 0.78;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      for (const b of balls) {
        if (b === dragged) continue;
        b.vy += G * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < R) { b.x = R; b.vx = -b.vx * REST; }
        else if (b.x > W - R) { b.x = W - R; b.vx = -b.vx * REST; }
        // no ceiling - a hard throw arcs out the top and falls back in
        if (b.y > H - R) { b.y = H - R; b.vy = -b.vy * REST; b.vx *= 0.96; }
      }
      // ponytail: O(n²) pair collisions - fine for a few dozen logos, grid-hash if the list ever gets big
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          const min = 2 * R;
          if (d2 === 0 || d2 >= min * min) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const push = (min - d) / 2;
          if (a !== dragged) { a.x -= nx * push; a.y -= ny * push; }
          if (b !== dragged) { b.x += nx * push; b.y += ny * push; }
          const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rvn < 0) {
            const imp = (-(1 + REST) * rvn) / 2;
            if (a !== dragged) { a.vx -= imp * nx; a.vy -= imp * ny; }
            if (b !== dragged) { b.vx += imp * nx; b.vy += imp * ny; }
          }
        }
      }
      for (const b of balls) b.el.style.transform = `translate(${b.x - R}px, ${b.y - R}px)`;
      raf = requestAnimationFrame(step);
    };
    // hold the drop until the pit scrolls into view so the rain-in isn't wasted off-screen
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      last = performance.now();
      raf = requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(wrap);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative', height: 'clamp(340px,48vw,500px)', overflow: 'hidden', touchAction: 'none', cursor: 'grab', background: '#0b1016' }}>
      {alumni.map((a, i) => (
        <div key={i} title={a.place} style={{ position: 'absolute', top: 0, left: 0, transform: 'translate(-100vw,0)', borderRadius: 999, background: '#e6ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', willChange: 'transform' }}>
          {a.logo ? (
            <img src={a.logo} alt={a.place} draggable={false} style={{ width: '68%', height: '68%', objectFit: 'contain', pointerEvents: 'none' }} />
          ) : (
            <span style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 26, color: '#080b0f', pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>{a.place.split(' ').map((w) => w[0]).join('').slice(0, 3)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ACTIVE SENSORS - the /api/aqi proxy (server.mjs) passes through the Egg API's
// reduced+grouped JSON. Shape-tolerant on purpose: a portal-side format tweak
// should degrade to "no chart", not a crash.
interface EggPoint { t: number; v: number }

function eggSeries(raw: unknown): { key: string; points: EggPoint[] }[] {
  let obj = raw as Record<string, unknown> | null;
  // unwrap single-key wrappers (e.g. keyed by serial number)
  while (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const keys = Object.keys(obj);
    const inner = keys.length === 1 ? obj[keys[0]] : null;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) obj = inner as Record<string, unknown>;
    else break;
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  const out: { key: string; points: EggPoint[] }[] = [];
  const BUCKET = 15 * 60_000; // the API returns ~1-minute raw samples; average to the 15-minute readings the page promises
  for (const [key, val] of Object.entries(obj)) {
    if (!Array.isArray(val)) continue;
    const raw = (val as { t?: string; time?: string; date?: string; v?: unknown; value?: unknown }[])
      .map((p) => ({ t: Date.parse(p?.t ?? p?.time ?? p?.date ?? ''), v: Number(p?.v ?? p?.value) }))
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
      .sort((a, b) => a.t - b.t);
    const buckets = new Map<number, { sum: number; n: number }>();
    for (const p of raw) {
      const b = Math.floor(p.t / BUCKET);
      const cur = buckets.get(b) ?? { sum: 0, n: 0 };
      cur.sum += p.v;
      cur.n += 1;
      buckets.set(b, cur);
    }
    const points = [...buckets.entries()].map(([b, { sum, n }]) => ({ t: b * BUCKET + BUCKET / 2, v: sum / n }));
    if (points.length > 1) out.push({ key: key.toLowerCase(), points });
  }
  return out;
}

// channels rendered in this order when present in the feed
const EGG_CHANNELS: { key: string; label: string; unit: string; scale?: number }[] = [
  { key: 'pm2p5', label: 'PM2.5', unit: 'µg/m³' },
  { key: 'pm10p0', label: 'PM10', unit: 'µg/m³' },
  { key: 'pm1p0', label: 'PM1.0', unit: 'µg/m³' },
  { key: 'co2', label: 'CO2', unit: 'ppm' },
  { key: 'tvoc', label: 'TVOC', unit: 'ppb' },
  { key: 'no2', label: 'NO2', unit: 'ppb' },
  { key: 'o3', label: 'O3', unit: 'ppb' },
  { key: 'so2', label: 'SO2', unit: 'ppb' },
  { key: 'co', label: 'CO', unit: 'ppm' },
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', scale: 0.01 }, // Egg reports Pa
];

const fmtVal = (v: number) => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : v.toFixed(1));
const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function SensorChart({ label, unit, points }: { label: string; unit: string; points: EggPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const vs = points.map((p) => p.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const tspan = t1 - t0 || 1;
  const X = (p: EggPoint) => ((p.t - t0) / tspan) * 100;
  const Y = (p: EggPoint) => 96 - ((p.v - min) / span) * 88; // 4% pad top/bottom in a 0-100 viewBox
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(p).toFixed(2)},${Y(p).toFixed(2)}`).join('');
  const cur = points[points.length - 1];
  const hp = hover != null ? points[hover] : null;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = t0 + ((e.clientX - rect.left) / rect.width) * tspan;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i].t - t) < Math.abs(points[best].t - t)) best = i;
    setHover(best);
  };

  return (
    <div style={{ background: '#0d131a', padding: '18px 18px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c909b' }}>{label}</div>
        {/* Resiple, not Manti: Manti Sans has no period glyph, so decimals render as tofu */}
        <div style={{ fontFamily: "'Resiple',sans-serif", fontWeight: 700, fontSize: 19, color: '#e6ecf0', whiteSpace: 'nowrap' }}>
          {fmtVal((hp ?? cur).v)} <span style={{ fontSize: 12, fontWeight: 400, color: '#7c909b' }}>{unit}</span>
        </div>
      </div>
      <div
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        style={{ position: 'relative', marginTop: 12, touchAction: 'pan-y' }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 96 }} aria-label={`${label}, last 24 hours`}>
          <line x1="0" y1="8" x2="100" y2="8" stroke="rgba(255,255,255,0.07)" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="96" x2="100" y2="96" stroke="rgba(255,255,255,0.07)" vectorEffect="non-scaling-stroke" />
          <path d={`${path}L${X(cur).toFixed(2)},100L${X(points[0]).toFixed(2)},100Z`} fill="rgba(79,174,125,0.12)" stroke="none" />
          <path d={path} fill="none" stroke="#4fae7d" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          {hp && <line x1={X(hp)} y1="0" x2={X(hp)} y2="100" stroke="rgba(255,255,255,0.25)" vectorEffect="non-scaling-stroke" />}
        </svg>
        {hp && (
          <>
            <div style={{ position: 'absolute', left: `${X(hp)}%`, top: `${Y(hp)}%`, width: 8, height: 8, borderRadius: 999, background: '#4fae7d', border: '2px solid #0d131a', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: `${Math.min(82, Math.max(18, X(hp)))}%`, bottom: '104%', transform: 'translateX(-50%)', background: '#1a2530', border: '1px solid rgba(255,255,255,0.12)', padding: '4px 10px', fontFamily: "'Resiple',sans-serif", fontSize: 11.5, color: '#c4d1d9', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
              {fmtVal(hp.v)} {unit} · {fmtTime(hp.t)}
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "'Resiple',sans-serif", fontSize: 10.5, letterSpacing: '0.08em', color: '#5f7078' }}>
        <span>{fmtTime(t0)}</span>
        <span>{fmtTime(t1)}</span>
      </div>
    </div>
  );
}

// one card per egg. Ids are the slot names /api/aqi assigns in EGG_SERIAL order,
// so adding an egg = append its serial to EGG_SERIAL on the server + an entry here.
const EGGS = [
  { id: 'egg1', name: 'Air Quality Egg (Snee Hall)', location: 'Snee Hall roof · Ithaca, NY', blurb: 'An Air Quality Egg mounted on top of Snee Hall, sampling the air over campus around the clock. The last 24 hours, averaged into 15-minute readings.' },
  { id: 'egg2', name: 'Air Quality Egg (ELL)', location: 'The ELL · Cornell', blurb: 'An indoor egg keeping tabs on the lab itself: CO2, particulates, and how much the DGX Spark is actually warming the room. The last 24 hours, averaged into 15-minute readings.' },
];

function EggCharts({ series }: { series: { key: string; points: EggPoint[] }[] }) {
  const newest = Math.max(...series.map((s) => s.points[s.points.length - 1].t));
  const live = Date.now() - newest < 45 * 60_000;
  const charts = EGG_CHANNELS.map((c) => ({ ...c, series: series.find((s) => s.key === c.key) })).filter((c) => c.series);
  return (
    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 999, border: `1px solid ${live ? '#4fae7d' : 'rgba(255,255,255,0.18)'}`, fontFamily: "'Resiple',sans-serif", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: live ? '#4fae7d' : '#7c909b' }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: live ? '#4fae7d' : '#5f7078' }} />
        {live ? 'Live' : 'Offline'} · updated {fmtTime(newest)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 18, marginTop: 24 }}>
        {charts.map((c) => (
          <SensorChart key={c.key} label={c.label} unit={c.unit} points={c.scale ? c.series!.points.map((p) => ({ t: p.t, v: p.v * c.scale! })) : c.series!.points} />
        ))}
      </div>
    </div>
  );
}

function SensorsFeed() {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; raw: Record<string, unknown> }
  >({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    fetch('/api/aqi')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((raw) => alive && setState({ status: 'ready', raw: (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown> }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {EGGS.map((egg) => {
        const series = state.status === 'ready' ? eggSeries(state.raw[egg.id]) : [];
        return (
          <div key={egg.id} style={{ background: '#0d131a', borderTop: '3px solid #6d9dcd', padding: 'clamp(20px,3.5vw,36px)', marginTop: 56 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px 18px' }}>
              <h3 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,3vw,32px)', letterSpacing: '-0.015em', margin: 0 }}>{egg.name}</h3>
              <span style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c909b' }}>{egg.location}</span>
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: '#a9bcc6', margin: '14px 0 0', maxWidth: 640 }}>{egg.blurb}</p>
            <div style={{ marginTop: 28 }}>
              {state.status === 'loading' ? (
                <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 14.5, color: '#7c909b' }}>Contacting the egg…</div>
              ) : series.length === 0 ? (
                <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 14.5, color: '#7c909b' }}>The sensor feed is offline right now. Check back soon.</div>
              ) : (
                <EggCharts series={series} />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const onPostsPage = route === '#/posts';
  const activePost = POSTS.find((p) => route === `#/posts/${p.slug}`);
  // group consecutive paragraphs so each run gets one card while images sit outside on the page
  const postChunks: (string[] | { img: string; max?: number })[] = [];
  for (const para of activePost?.body ?? []) {
    const last = postChunks[postChunks.length - 1];
    if (typeof para === 'string' && Array.isArray(last)) last.push(para);
    else postChunks.push(typeof para === 'string' ? [para] : para);
  }
  const onSponsorsPage = route === '#/sponsors';
  const onSensorsPage = route === '#/sensors';
  const legalPage = LEGAL_PAGES[route];
  const onSubPage = onPostsPage || !!activePost || onSponsorsPage || onSensorsPage || !!legalPage;
  const [menuOpen, setMenuOpen] = useState(false);
  const [postFilter, setPostFilter] = useState<'all' | 'project' | 'blog'>('all');
  // key of the member tile currently flipped to its contact card
  const [flippedMember, setFlippedMember] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail((cur) => (cur === email ? null : cur)), 1500);
  };

  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash);
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (onSubPage) {
      window.scrollTo(0, 0);
      return;
    }
    // returning from a sub-page, the anchor target doesn't exist until
    // after this render - scroll to it manually
    const el = document.getElementById(route.slice(1));
    if (el) el.scrollIntoView();
  }, [route, onSubPage]);

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'clip', background: '#080b0f' }}>
      <header className="site-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 42px', background: 'rgba(8,11,15,0.85)', fontFamily: "'Resiple',sans-serif" }}>
        <a href="#top" className="logo-link" style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#e6ecf0', flexShrink: 0 }}>
          <img src="/logo.png" alt="" style={{ width: 78, height: 78, flexShrink: 0 }} />
          <span className="logo-text" style={{ fontFamily: "'Intan',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>GeoData</span>
        </a>
        <nav className="site-nav" style={{ display: 'flex', alignItems: 'center', gap: 30, fontSize: 17.5, flexShrink: 0 }}>
          <div className="site-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            <a href="#projects" style={{ color: '#a9bcc6' }}>Projects</a>
            <a href="#members" style={{ color: '#a9bcc6' }}>Members</a>
            <a href="#/sponsors" style={{ color: '#a9bcc6' }}>Sponsors</a>
            <a href="#/posts" style={{ color: '#a9bcc6' }}>Posts</a>
            <a href="#/sensors" style={{ color: '#a9bcc6' }}>Sensors</a>
          </div>
          <a href="#join" className="nav-join-btn" style={{ display: 'inline-block', padding: '9px 20px', borderRadius: 999, background: '#086727', color: '#eaf2ee', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: "'Resiple',sans-serif" }}>Join the team</a>
          <button
            type="button"
            className="nav-burger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            style={{ display: 'none', flexShrink: 0, padding: 8, border: 'none', background: 'transparent', color: '#e6ecf0', cursor: 'pointer' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </nav>
        {menuOpen && (
          // hashchange closes the menu on navigation; this onClick covers taps
          // on the link matching the current hash, which fire no hashchange
          <nav className="nav-menu" onClick={() => setMenuOpen(false)} style={{ position: 'absolute', top: '100%', left: 0, right: 0, display: 'none', flexDirection: 'column', background: 'rgba(8,11,15,0.97)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '6px 24px 18px', fontFamily: "'Resiple',sans-serif" }}>
            {[['#projects', 'Projects'], ['#members', 'Members'], ['#/sponsors', 'Sponsors'], ['#/posts', 'Posts'], ['#/sensors', 'Sensors'], ['#join', 'Join the team']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#e6ecf0', fontSize: 17, fontWeight: 700, padding: '13px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>{label}</a>
            ))}
          </nav>
        )}
      </header>

      <span id="top" />

      {activePost ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#080b0f', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <a href="#/posts" style={{ fontFamily: "'Resiple',sans-serif", fontSize: 14.5 }}>← All posts</a>
          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: activePost.tagColor, marginTop: 30 }}>{activePost.tag}</div>
          <h2 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(34px,4.6vw,56px)', letterSpacing: '-0.02em', lineHeight: 1.05, margin: '16px 0 0' }}>{activePost.title}</h2>
          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 12.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c909b', marginTop: 18 }}>{activePost.date}</div>
          <div className="team-photo-frame" style={{ padding: 14, border: `2px solid ${activePost.tagColor}`, boxShadow: '10px 10px 0 rgba(255,255,255,0.08)', marginTop: 56 }}>
            {activePost.photo ? (
              <img decoding="async" src={activePost.photo} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
            ) : (
              <div style={{ aspectRatio: '16/9', background: '#12181e' }} />
            )}
          </div>
          {/* text runs get lifted cards for readability; images sit on the page between them */}
          {postChunks.map((chunk, i) => (
            Array.isArray(chunk) ? (
              <div key={i} style={{ background: '#101820', border: '1px solid rgba(255,255,255,0.07)', padding: 'clamp(24px,5vw,56px)', marginTop: i === 0 ? 56 : 48 }}>
                {chunk.map((para, j) => (
                  <p key={j} style={{ fontSize: 18.5, lineHeight: 1.85, color: '#c4d1d9', margin: j === 0 ? 0 : '36px 0 0' }}>{emphasize(para)}</p>
                ))}
              </div>
            ) : (
              <div key={i} className="team-photo-frame" style={{ padding: 14, border: `2px solid ${activePost.tagColor}`, boxShadow: '10px 10px 0 rgba(255,255,255,0.08)', maxWidth: chunk.max, margin: `${i === 0 ? 56 : 48}px auto 0` }}>
                <img loading="lazy" decoding="async" src={chunk.img} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
              </div>
            )
          ))}
          {(activePost.links.length > 0 || activePost.credit) && (
            <div style={{ background: '#101820', border: '1px solid rgba(255,255,255,0.07)', padding: 'clamp(24px,5vw,56px)', marginTop: 48 }}>
              {activePost.links.length > 0 && (
                <>
                  <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#0e8f38' }}>Links</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                    {activePost.links.map((link) => (
                      <a key={link.label} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ fontSize: 16.5, alignSelf: 'flex-start', color: '#4fae7d' }}>{link.label} ↗</a>
                    ))}
                  </div>
                </>
              )}
              {activePost.credit && (
                <div style={{ marginTop: activePost.links.length > 0 ? 28 : 0, fontFamily: "'Resiple',sans-serif", fontSize: 12.5, letterSpacing: '0.06em', color: '#7c909b' }}>{activePost.credit}</div>
              )}
            </div>
          )}
        </div>
      </section>
      ) : onPostsPage ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#080b0f', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#086727' }}>Field notes</div>
          <h2 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(36px,4.8vw,60px)', letterSpacing: '-0.02em', lineHeight: 1.02, margin: '18px 0 0' }}>Posts</h2>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, color: '#a9bcc6', margin: '18px 0 0', maxWidth: 560 }}>Dispatches from the lake, the lab, and wherever else we left a sensor.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
            {([['all', 'All'], ['project', 'Projects'], ['blog', 'Blog']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPostFilter(value)}
                style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13.5, fontWeight: 700, letterSpacing: '0.04em', padding: '8px 20px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${postFilter === value ? '#086727' : 'rgba(255,255,255,0.18)'}`, background: postFilter === value ? '#086727' : 'transparent', color: postFilter === value ? '#eaf2ee' : '#a9bcc6' }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 48 }}>
            {POSTS.filter((post) => postFilter === 'all' || post.kind === postFilter).map((post, i) => (
              <article key={post.slug} style={i === 0 ? undefined : { borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 44, paddingTop: 44 }}>
                <a href={`#/posts/${post.slug}`} className="post-link" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) clamp(130px,30vw,300px)', gap: 'clamp(18px,3.5vw,44px)', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 8px', fontFamily: "'Resiple',sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c909b' }}>
                      <span style={{ border: `1px solid ${post.kind === 'project' ? '#4fae7d' : '#dcbe32'}`, color: post.kind === 'project' ? '#4fae7d' : '#dcbe32', borderRadius: 999, padding: '2px 10px', fontSize: 10.5 }}>{post.kind === 'project' ? 'Project' : 'Blog'}</span>
                      <span>{post.date} · <span style={{ color: post.tagColor }}>{post.tag}</span></span>
                    </div>
                    <h3 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,3.2vw,34px)', letterSpacing: '-0.015em', lineHeight: 1.12, margin: '14px 0 0' }}>{post.title}</h3>
                    <p style={{ fontSize: 16, lineHeight: 1.6, color: '#a9bcc6', margin: '14px 0 0' }}>{post.dek}</p>
                  </div>
                  <div style={{ padding: 10, border: `2px solid ${post.tagColor}`, boxShadow: '6px 6px 0 rgba(255,255,255,0.09)' }}>
                    {post.photo ? (
                      <img loading="lazy" decoding="async" src={post.photo} alt="" style={{ display: 'block', width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ aspectRatio: '4/3', background: '#12181e' }} />
                    )}
                  </div>
                </a>
              </article>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 44, paddingTop: 26, fontFamily: "'Resiple',sans-serif", fontSize: 13, color: '#5f7078' }}>More field notes soon. We're probably out at the lake.</div>
        </div>
      </section>
      ) : onSensorsPage ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#080b0f', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#086727' }}>Live data</div>
          <h2 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(36px,4.8vw,60px)', letterSpacing: '-0.02em', lineHeight: 1.02, margin: '18px 0 0' }}>Active Sensors</h2>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: '#a9bcc6', maxWidth: 620, margin: '26px 0 0' }}>Instruments we have in the field right now, reporting in. This page reads from the same feeds we do.</p>
          <SensorsFeed />
          <p style={{ fontSize: 14.5, color: '#5f7078', margin: '26px 0 0' }}>More sensors join this page as they go into the field.</p>
        </div>
      </section>
      ) : onSponsorsPage ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#080b0f', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#086727' }}>Support the team</div>
          <h2 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(36px,4.8vw,60px)', letterSpacing: '-0.02em', lineHeight: 1.02, margin: '18px 0 0' }}>Sponsorship</h2>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: '#a9bcc6', maxWidth: 620, margin: '26px 0 0' }}>Every instrument we field, from sensors and sondes to six-legged robots, is designed, built, and broken in by students. Sponsors are what keep the hardware in the water and the team in waders.</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 34 }}>
            <a href="mailto:cugeodata@cornell.edu?subject=Sponsoring%20GeoData" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 999, background: '#086727', color: '#eaf2ee', fontWeight: 700, fontSize: 17, fontFamily: "'Resiple',sans-serif" }}>Become a sponsor</a>
            <a href={SPONSOR_PACKET_PDF} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', color: '#e6ecf0', fontWeight: 700, fontSize: 17, fontFamily: "'Resiple',sans-serif" }}>Download the packet (PDF)</a>
          </div>

          {/* PACKET BOARD */}
          <div className="team-photo-frame" style={{ padding: 14, border: '2px solid #086727', boxShadow: '10px 10px 0 rgba(8,103,39,0.35)', marginTop: 64 }}>
            <object data={`${SPONSOR_PACKET_PDF}#view=FitH`} type="application/pdf" aria-label="GeoData sponsorship packet" style={{ display: 'block', width: '100%', height: 'min(75vh, 780px)', background: '#12181e' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '100%', padding: 24, textAlign: 'center' }}>
                <p style={{ color: '#a9bcc6', margin: 0, maxWidth: 420, lineHeight: 1.6 }}>Your browser doesn't show PDFs inline, so grab the packet directly instead.</p>
                <a href={SPONSOR_PACKET_PDF} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 999, background: '#086727', color: '#eaf2ee', fontWeight: 700, fontFamily: "'Resiple',sans-serif" }}>Open the sponsorship packet</a>
              </div>
            </object>
          </div>

          {/* TIERS */}
          <div style={{ marginTop: 110 }}>
            <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#086727' }}>Sponsorship tiers</div>
            <h3 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(28px,3.4vw,40px)', letterSpacing: '-0.02em', margin: '16px 0 0' }}>Rock, water, air, and beyond</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: 26, marginTop: 44 }}>
              {TIERS.map((tier) => (
                <div key={tier.name} style={{ background: '#0d131a', borderTop: `3px solid ${tier.color}`, padding: '26px 24px' }}>
                  <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: tier.color }}>{tier.name}</div>
                  <div style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 34, marginTop: 12 }}>{tier.amount}</div>
                  <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tier.perks.map((perk) => (
                      <li key={perk} style={{ position: 'relative', paddingLeft: 18, fontSize: 14.5, lineHeight: 1.5, color: '#a9bcc6' }}>
                        <span style={{ position: 'absolute', left: 0, color: tier.color }}>▸</span>{perk}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ALUMNI */}
          <div style={{ marginTop: 130 }}>
            <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#086727' }}>Life after GeoData</div>
            <h2 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(36px,4.8vw,60px)', letterSpacing: '-0.02em', lineHeight: 1.02, margin: '18px 0 0' }}>Alumni</h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: '#a9bcc6', maxWidth: 620, margin: '26px 0 0' }}>GeoData alumni have landed at the organizations, companies, and labs below. Go ahead and toss them around; they're used to landing on their feet.</p>
            <div className="team-photo-frame" style={{ padding: 14, border: '2px solid #086727', boxShadow: '10px 10px 0 rgba(8,103,39,0.35)', marginTop: 40 }}>
              <AlumniPit alumni={ALUMNI} />
            </div>
            <div style={{ marginTop: 36 }}>
              <a href="mailto:cugeodata@cornell.edu" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 999, background: '#086727', color: '#eaf2ee', fontWeight: 700, fontSize: 17, fontFamily: "'Resiple',sans-serif" }}>Contact us for more info</a>
            </div>
          </div>
        </div>
      </section>
      ) : legalPage ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#080b0f', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#086727' }}>CU GeoData</div>
          <h2 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(36px,4.8vw,60px)', letterSpacing: '-0.02em', lineHeight: 1.02, margin: '18px 0 0' }}>{legalPage.title}</h2>
          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, color: '#7c909b', marginTop: 14 }}>Last updated: {legalPage.updated}</div>
          {legalPage.sections.map((s) => (
            <div key={s.h} style={{ marginTop: 44 }}>
              <h3 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 600, fontSize: 22, letterSpacing: '-0.01em', margin: 0 }}>{s.h}</h3>
              {s.body.map((para, i) => (
                <p key={i} style={{ fontSize: 15.5, lineHeight: 1.65, color: '#a9bcc6', margin: '12px 0 0', maxWidth: 680 }}>{para}</p>
              ))}
            </div>
          ))}
        </div>
      </section>
      ) : (
      <>
      <Globe />

      {/* PROJECTS */}
      <section id="projects" style={{ position: 'relative', zIndex: 2, background: '#080b0f', padding: '120px clamp(24px,5vw,72px) 48px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#086727' }}>Featured work</div>
          <h2 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(36px,4.8vw,60px)', letterSpacing: '-0.02em', lineHeight: 1.02, margin: '18px 0 0', maxWidth: '16ch' }}>Instruments built by students, deployed in the field</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(420px,100%),1fr))', gap: 26, marginTop: 56 }}>
            {PROJECTS.map((proj) => (
              <article key={proj.title} style={{ gridColumn: proj.photo2 ? '1 / -1' : undefined }}>
                {proj.photo && proj.photo2 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 26 }}>
                    <img loading="lazy" decoding="async" src={proj.photo} alt={proj.title} style={{ display: 'block', width: '100%', aspectRatio: '16/10', objectFit: 'cover', objectPosition: proj.photoPosition }} />
                    <img loading="lazy" decoding="async" src={proj.photo2} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16/10', objectFit: 'cover' }} />
                  </div>
                ) : proj.photo ? (
                  <img loading="lazy" decoding="async" src={proj.photo} alt={proj.title} style={{ display: 'block', width: '100%', aspectRatio: proj.photoAspect ?? '16/10', objectFit: 'cover', objectPosition: proj.photoPosition }} />
                ) : (
                  <div style={{ aspectRatio: '16/10', background: '#12181e' }} />
                )}
                <div style={{ padding: '20px 0 0' }}>
                  <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: proj.tagColor }}>{proj.tag}</div>
                  <h3 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 600, fontSize: 25, margin: '12px 0 0', letterSpacing: '-0.01em' }}>
                    {proj.slug ? (
                      <a href={`#/posts/${proj.slug}`} className="post-link" aria-label={`Read the ${proj.title} post`}>{proj.title} <span aria-hidden="true" style={{ fontSize: 19, color: '#086727' }}>→</span></a>
                    ) : (
                      proj.title
                    )}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: '#a9bcc6', margin: '12px 0 0' }}>{proj.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERS */}
      <section id="members" style={{ position: 'relative', zIndex: 2, background: '#080b0f', padding: '48px clamp(24px,5vw,72px) 96px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className="members-head" style={{ display: 'flex', flexWrap: 'wrap', gap: '28px 48px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#086727' }}>The team</div>
              <h2 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(36px,4.8vw,60px)', letterSpacing: '-0.02em', lineHeight: 1.02, margin: '18px 0 0' }}>Members</h2>
            </div>
            <div className="members-stats" style={{ padding: '26px 36px', display: 'flex', gap: 48 }}>
              <div>
                <div className="stat-num" style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 46, lineHeight: 1, color: '#086727' }}>{SUBTEAM_COUNT}</div>
                <div className="stat-label" style={{ fontFamily: "'Resiple',sans-serif", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a9bcc6', marginTop: 10 }}>Subteams</div>
              </div>
              <div>
                <div className="stat-num" style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 46, lineHeight: 1, color: '#086727' }}>{MEMBER_COUNT}</div>
                <div className="stat-label" style={{ fontFamily: "'Resiple',sans-serif", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a9bcc6', marginTop: 10 }}>Members</div>
              </div>
            </div>
          </div>
          {[...new Set(MEMBERS.map((m) => m.subteam))].map((subteam) => (
            <div key={subteam} style={{ marginTop: 64 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'Resiple',sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: SUBTEAM_COLORS[subteam] ?? '#7c909b' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: SUBTEAM_COLORS[subteam] ?? '#7c909b', display: 'inline-block' }} />
                {teamLabel(subteam)}
              </div>
              <div className="members-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(190px,100%),1fr))', gap: '36px 28px', marginTop: 26 }}>
                {MEMBERS.filter((m) => m.subteam === subteam).map((m, i) => {
                  const tileKey = `${subteam}:${i}`;
                  const color = SUBTEAM_COLORS[m.badge ?? subteam] ?? '#7c909b';
                  return (
                    <div key={i} style={{ position: 'relative' }}>
                      {flippedMember === tileKey ? (
                        <div
                          onClick={() => setFlippedMember(null)}
                          style={{ position: 'relative', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none' }}
                        >
                          {m.photo ? (
                            <img loading="lazy" decoding="async" src={m.photo} alt="" draggable={false} style={{ display: 'block', width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ aspectRatio: '1/1', background: '#12181e' }} />
                          )}
                          <div className="member-flip" style={{ position: 'absolute', inset: 0, background: 'rgba(12,18,24,0.82)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', border: `2px solid ${color}`, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color }}>{m.role ?? (m.lead ? 'Subteam Lead' : 'Contact')}</div>
                          <div style={{ fontSize: 14.5, color: '#b6c6ce' }}>{m.major || 'Major TBD'}</div>
                          {m.email ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <a href={`mailto:${m.email}`} onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Parachutes Sans',sans-serif", textTransform: 'lowercase', fontSize: 13.5, wordBreak: 'break-all' }}>{m.email}</a>
                              <button
                                type="button"
                                aria-label={`Copy ${m.email}`}
                                onClick={(e) => { e.stopPropagation(); copyEmail(m.email); }}
                                style={{ fontFamily: "'Resiple',sans-serif", fontSize: 11, padding: '3px 10px', borderRadius: 999, border: `1px solid ${copiedEmail === m.email ? color : 'rgba(255,255,255,0.25)'}`, background: 'transparent', color: copiedEmail === m.email ? color : '#a9bcc6', cursor: 'pointer' }}
                              >
                                {copiedEmail === m.email ? 'Copied ✓' : 'Copy'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 13.5, color: '#5f7078' }}>Contact coming soon</span>
                          )}
                          {m.linkedin && (
                            <a href={m.linkedin} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Resiple',sans-serif", fontSize: 12, letterSpacing: '0.06em', color: '#a9bcc6', alignSelf: 'flex-start' }}>LinkedIn</a>
                          )}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setFlippedMember(tileKey)}
                          aria-label={`Contact info for ${m.name}`}
                          style={{ position: 'relative', display: 'block', width: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none' }}
                        >
                          {m.photo ? (
                            <img loading="lazy" decoding="async" src={m.photo} alt={m.name} draggable={false} style={{ display: 'block', width: '100%', aspectRatio: '1/1', objectFit: 'cover', userSelect: 'none', WebkitUserSelect: 'none' }} />
                          ) : (
                            <div style={{ aspectRatio: '1/1', background: '#12181e' }} />
                          )}
                        </button>
                      )}
                      {SUBTEAM_BADGES[m.badge ?? subteam] && (
                        <img className="member-badge" decoding="async" src={SUBTEAM_BADGES[m.badge ?? subteam]} alt={`${m.badge ?? subteam} team badge`} draggable={false} style={{ position: 'absolute', top: 8, right: 8, width: 36, height: 36, pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none' }} />
                      )}
                      <div style={{ fontFamily: "'Resiple',sans-serif", fontWeight: 700, fontSize: 16.5, marginTop: 12 }}>{m.name}</div>
                      {(m.role || m.lead) && (
                        <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginTop: 4 }}>{m.role ?? 'Subteam Lead'}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* TEAM PHOTO */}
          <figure style={{ margin: '72px 0 0' }}>
            <div className="team-photo-frame" style={{ position: 'relative', padding: 14, border: '2px solid #086727', boxShadow: '10px 10px 0 rgba(8,103,39,0.35)' }}>
              <img loading="lazy" decoding="async" src="/team.jpg" alt="The GeoData team on the stairs of Upson Hall" style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1600/1066' }} />
              <figcaption className="team-photo-caption" style={{ position: 'absolute', bottom: 30, left: 30, background: '#086727', color: '#eaf2ee', fontFamily: "'Intan',sans-serif", fontSize: 'clamp(16px,2.2vw,24px)', letterSpacing: '0.04em', padding: '10px 22px', whiteSpace: 'nowrap' }}>Team Photo '25–'26</figcaption>
            </div>
          </figure>
        </div>
      </section>

      {/* JOIN */}
      <section id="join" style={{ position: 'relative', zIndex: 2, background: '#080b0f', padding: '130px clamp(24px,5vw,72px)' }}>
        <div style={{ maxWidth: 820 }}>
          <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#086727' }}>Recruitment open</div>
          <h2 style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(42px,6.2vw,80px)', letterSpacing: '-0.03em', lineHeight: 1, margin: '20px 0 0' }}>Design, Deploy,<br /><span style={{ color: '#086727' }}>Discover</span></h2>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: '#a9bcc6', maxWidth: 560, margin: '26px 0 0' }}>Build the instruments a changing planet needs. GeoData welcomes students of every major, from CS and MechE to earth science and design. If you want to build hardware that ends up outdoors collecting real data, there's a subteam for you.</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 38 }}>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfAKoT7-gJrNmK0nJYy7yEqsZI0egEgZqf0gG8794XujlYAVw/viewform" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '15px 32px', borderRadius: 999, background: '#086727', color: '#eaf2ee', fontWeight: 700, fontSize: 18.5, fontFamily: "'Resiple',sans-serif" }}>Apply to join</a>
            <a href="#projects" style={{ display: 'inline-block', padding: '15px 32px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', color: '#e6ecf0', fontWeight: 700, fontSize: 18.5, fontFamily: "'Resiple',sans-serif" }}>Explore our work</a>
          </div>
        </div>
      </section>

      </>
      )}

      {/* FOOTER - supported by + contact; template details, replace with real ones */}
      <footer id="partners" style={{ position: 'relative', zIndex: 2, background: '#080b0f', padding: '84px clamp(24px,5vw,72px) 36px' }}>
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px 72px', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 220px' }}>
              <span style={{ fontFamily: "'Manti Sans',sans-serif", fontWeight: 600, fontSize: 20 }}>CU GeoData</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, fontSize: 14, color: '#5f7078' }}>
                <span>Cornell University</span>
                <span>Ithaca, NY</span>
              </div>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <div style={{ fontFamily: "'Resiple',sans-serif", fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7c909b' }}>Supported by</div>
              <div className="partners-grid" style={{ display: 'grid', gridTemplateRows: 'repeat(2, auto)', gridAutoFlow: 'column', gridAutoColumns: 'max-content', gap: '8px 40px', marginTop: 14, fontSize: 14, color: '#a9bcc6' }}>
                {PARTNERS.map((partner) => (
                  <span key={partner}>{partner}</span>
                ))}
              </div>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                <span style={{ fontFamily: "'Resiple',sans-serif", fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7c909b' }}>Contact</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <a href="https://www.instagram.com/cugeodata/" target="_blank" rel="noopener noreferrer" aria-label="CU GeoData on Instagram" style={{ color: '#a9bcc6', display: 'inline-flex' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.757 6.162 6.162 6.162 3.405 0 6.162-2.757 6.162-6.162 0-3.402-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.645-1.44-1.44 0-.794.646-1.439 1.44-1.439.793 0 1.44.645 1.44 1.439z"/></svg>
                  </a>
                  <a href="https://www.linkedin.com/company/cu-geodata/" target="_blank" rel="noopener noreferrer" aria-label="CU GeoData on LinkedIn" style={{ color: '#a9bcc6', display: 'inline-flex' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
                  </a>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, fontSize: 14 }}>
                <a href="mailto:cugeodata@cornell.edu">cugeodata@cornell.edu</a>
                <span style={{ color: '#a9bcc6' }}>Upson Hall · Ithaca, NY 14853</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 30, display: 'flex', flexWrap: 'wrap', gap: '6px 20px', alignItems: 'center', fontSize: 10.5, color: '#5f7078' }}>
            <span>© {new Date().getFullYear()} CU GeoData. All rights reserved.</span>
            <a href="#/privacy" style={{ color: '#7c909b' }}>Privacy Policy</a>
            <a href="#/terms" style={{ color: '#7c909b' }}>Terms of Use</a>
            <a href="https://accessibility.cornell.edu" style={{ color: '#7c909b' }}>Web Accessibility Assistance</a>
            <a href="https://officeofcivilrights.cornell.edu/what-we-do/equal-opportunity-affirmative-action/" style={{ color: '#7c909b' }}>Equal Education and Employment Opportunity</a>
          </div>
          <div style={{ marginTop: 6, fontSize: 10.5, color: '#4d5b63', maxWidth: 720 }}>
            CU GeoData is a registered student organization of Cornell University. This website is maintained by its student members and does not represent the official views of Cornell University.
          </div>
        </div>
      </footer>

    </div>
  );
}
