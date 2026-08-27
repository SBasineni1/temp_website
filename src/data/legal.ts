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
