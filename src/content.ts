import membersData from './members.json';

export interface Member {
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

export interface Project {
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

export const PROJECTS: Project[] = [
  {
    slug: '3d-printed-weather-stations',
    tag: 'Tech x Air',
    tagColor: '#c92556',
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
    body: 'An affordable, portable atmospheric profiler. We built it to get high-resolution observations of boundary-layer and lake-effect weather.',
    photo: '/projects/tethersonde.jpeg',
    photoAspect: '4/5',
    photoPosition: '57% 50%',
  },
  {
    slug: 'nisar-ground-truthing',
    tag: 'Rock',
    tagColor: '#c1703f',
    title: 'NISAR Ground-Truthing',
    body: "Five soil-moisture nodes at the Game Farm site check NASA's NISAR satellite against what's actually in the dirt.",
    photo: '/projects/nisar.png',
    photoAspect: '4/5',
    photoPosition: '50% 40%',
  },
  {
    slug: 'lidar-hexapod',
    tag: 'Tech x CUPI Partnership',
    tagColor: '#c92556',
    title: 'LiDAR Hexapod',
    body: 'A LiDAR attachment for a six-legged robot, built jointly with Cornell Physical Intelligence. Paired with UAV LiDAR, it is our path to digital twins of the Finger Lakes.',
    photo: '/projects/hexapod.png',
  },
  {
    tag: 'Coming soon',
    tagColor: '#c92556',
    title: 'Drone Photogrammetry',
    body: 'Coming soon: repeatable aerial surveys of Finger Lakes shorelines. Overlapping drone passes stitched into 3D scans, to make erosion measurable and give our sensor data terrain context.',
    photo: '/projects/drone.webp',
  },
];

export const PARTNERS = [
  'Duffield College of Engineering',
  'Dept. of Earth & Atmospheric Sciences',
  'Cornell Project Team Program',
];

export const SUBTEAM_COLORS: Record<string, string> = {
  Leadership: '#4fae7d',
  Air: '#6d9dcd',
  Water: '#2e6fc9',
  Rock: '#c1703f',
  Data: '#8b3fbf',
  Tech: '#c92556',
  Business: '#dcbe32',
};

// corner badges in public/badges/ - one per subteam
export const SUBTEAM_BADGES: Record<string, string> = {
  Air: '/badges/air.png',
  Water: '/badges/water.png',
  Rock: '/badges/rock.png',
  Data: '/badges/data.png',
  Tech: '/badges/tech.png',
  Business: '/badges/business.png',
};

export interface LegalPage {
  title: string;
  updated: string;
  sections: { h: string; body: string[] }[];
}

// keys double as hash routes - a "tidied" key is a dead route
export const LEGAL_PAGES: Record<string, LegalPage> = {
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

export interface Post {
  slug: string; // project posts share their project's slug so its card header links here
  kind: 'project' | 'blog';
  date: string;
  tag: string;
  tagColor: string;
  title: string;
  dek: string; // the one-liner under the headline
  photo?: string; // path under /public; omitted shows a placeholder
  body: (string | { img: string; max?: number })[]; // a string per paragraph; { img } entries render as framed inline photos, max caps their width in px
  links: { label: string; href: string }[];
  credit?: string; // photo credit line, shown under the links
}

// newest first
// slug must match a PROJECTS slug to link project card -> post
export const POSTS: Post[] = [
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
    tag: 'Tech x CUPI',
    tagColor: '#c92556',
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
      { img: '/projects/hexapod-leg.png' },
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
    tag: 'Tech x Air',
    tagColor: '#c92556',
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
    tagColor: '#c1703f',
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
    dek: 'An affordable, portable atmospheric profiler, built for boundary-layer and lake-effect weather.',
    photo: '/projects/tethersonde.jpeg',
    body: [
      'The tethersonde is an affordable, portable atmospheric profiler. We built it to get high-resolution observations of boundary-layer and lake-effect weather.',
    ],
    links: [
    ],
  },
];

export const SPONSOR_PACKET_PDF = '/sponsorship-packet.pdf';

// Mohs hardness ladder (quartz 7 < topaz 8 < ruby/corundum 9 < diamond 10)
export const TIERS = [
  { name: 'Quartz', color: '#6d9dcd', amount: '$500+', perks: ['Logo on our website', 'Decal on a soil-moisture node at the Game Farm site', 'Thank-you in the alumni newsletter'] },
  { name: 'Topaz', color: '#c1703f', amount: '$1,500+', perks: ['Everything in Quartz', 'Decal on a Cayuga Lake sensor station, photographed on deployment day', 'Team resume book', 'Social media feature from the field'] },
  { name: 'Ruby', color: '#c92556', amount: '$3,000+', perks: ['Everything in Topaz', 'Decal on the tethersonde, flown to 500 feet', 'Logo on team apparel', 'Job postings featured in the alumni newsletter', 'Info session or recruiting event with the team'] },
  { name: 'Diamond', color: '#8b3fbf', amount: '$5,000+', perks: ['Everything in Ruby', 'Decal on the LiDAR hexapod robot and the survey drone', 'A sensor site around the lake named after you', 'First invite to demo day'] },
];

export const ALUMNI: { place: string; logo?: string }[] = [
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
  { place: 'SpaceX', logo: '/alumni/spacex.png' },
  { place: 'Yale', logo: '/alumni/yale.png' },
];

// members live in src/members.json - mass-edit there. Photos go in
// public/members/ and each entry's "photo" is its path, e.g. "/members/jane.jpg".
// Clicking a photo flips the tile to a contact card (email + major).
export const MEMBERS: Member[] = membersData;

export const SUBTEAM_COUNT = new Set(MEMBERS.map((m) => m.subteam)).size - 1; // Leadership isn't a subteam
// unique by email (name as fallback) so people on two subteams aren't
// double-counted; the faculty advisor isn't a student member
export const MEMBER_COUNT = new Set(MEMBERS.filter((m) => m.role !== 'Faculty Advisor').map((m) => m.email || m.name)).size;
