-- Populate Privacy Policy & Terms of Service bodies from demo PDFs (Dhidi placeholders applied)
UPDATE "site_pages"
SET
  "title" = 'Privacy Policy',
  "body" = $pp$
<p>Last updated: <strong>March 31, 2026</strong></p>
<p>Welcome to <strong>Dhidi</strong>. Your privacy is important to us, and we are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.</p>
<h2>1. Information We Collect</h2>
<h3>a. Personal Information</h3>
<ol>
<li>Name</li>
<li>Email address</li>
<li>Phone number</li>
<li>Account credentials</li>
</ol>
<h3>b. Usage Data</h3>
<ol>
<li>IP address</li>
<li>Browser type and version</li>
<li>Pages visited and time spent</li>
<li>Device information</li>
</ol>
<h3>c. Cookies and Tracking Technologies</h3>
<p>We use cookies and similar technologies to enhance your experience and analyze usage.</p>
<h2>2. How We Use Your Information</h2>
<ol>
<li>Provide and maintain our services</li>
<li>Improve user experience</li>
<li>Communicate updates, offers, or support messages</li>
<li>Monitor and analyze usage</li>
<li>Ensure security and prevent fraud</li>
</ol>
<h2>3. Sharing Your Information</h2>
<p>We do not sell your personal data. However, we may share information with:</p>
<ol>
<li>Service providers (e.g., hosting, analytics)</li>
<li>Legal authorities if required by law</li>
<li>Business transfers (e.g., merger or acquisition)</li>
</ol>
<h2>4. Data Security</h2>
<p>We implement appropriate technical and organizational measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
<h2>5. Your Rights</h2>
<p>Depending on your location, you may have the right to:</p>
<ol>
<li>Access your personal data</li>
<li>Correct inaccurate information</li>
<li>Request deletion of your data</li>
<li>Withdraw consent</li>
</ol>
<p>To exercise these rights, contact us at: <a href="mailto:contact@dhidi.com">contact@dhidi.com</a></p>
<h2>6. Third-Party Services</h2>
<p>Our service may contain links to third-party websites. We are not responsible for their privacy practices.</p>
<h2>7. Children&apos;s Privacy</h2>
<p>Our services are not intended for individuals under the age of 13 (or applicable age in your region). We do not knowingly collect data from children.</p>
<h2>8. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.</p>
<h2>9. Contact Us</h2>
<ol>
<li>Email: <a href="mailto:contact@dhidi.com">contact@dhidi.com</a></li>
<li>Address: 84 Sleepy Hollow St, Jamaica, New York 1432</li>
</ol>
$pp$
WHERE "slug" = 'privacy-policy';

UPDATE "site_pages"
SET
  "title" = 'Terms of Service',
  "body" = $tos$
<p>Last updated: <strong>March 31, 2026</strong></p>
<p>Welcome to <strong>Dhidi</strong>. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of our website, applications, and services (&ldquo;Services&rdquo;). By using our Services, you agree to these Terms.</p>
<h2>1. Acceptance of Terms</h2>
<p>By using our Services, you confirm that you:</p>
<ol>
<li>Are at least 18 years old (or legal age in your jurisdiction)</li>
<li>Agree to comply with these Terms</li>
<li>Have the legal capacity to enter into a binding agreement</li>
</ol>
<p>If you do not agree, please do not use our Services.</p>
<h2>2. Use of Services</h2>
<p>You agree not to:</p>
<ol>
<li>Violate any applicable laws or regulations</li>
<li>Infringe on intellectual property rights</li>
<li>Attempt unauthorized access to systems or data</li>
<li>Distribute harmful software (e.g., viruses, malware)</li>
<li>Engage in fraudulent or misleading activities</li>
</ol>
<h2>3. User Accounts</h2>
<ol>
<li>Maintain confidentiality of credentials</li>
<li>Be responsible for all account activities</li>
<li>Provide accurate and updated information</li>
</ol>
<h2>4. Intellectual Property</h2>
<p>All content, trademarks, logos, and software are owned by or licensed to <strong>Dhidi</strong>.</p>
<ol>
<li>Do not copy or distribute without permission</li>
<li>Do not reverse engineer or extract source code</li>
</ol>
<h2>5. Payments and Billing (If Applicable)</h2>
<ol>
<li>Prices may change without notice</li>
<li>Payments must be made in full</li>
<li>Refund policies will be communicated</li>
</ol>
<h2>6. Termination</h2>
<p>We may suspend or terminate access if Terms are violated or illegal activity occurs.</p>
<h2>7. Disclaimer of Warranties</h2>
<p>Services are provided &ldquo;as is&rdquo; without warranties of any kind.</p>
<h2>8. Limitation of Liability</h2>
<p>We are not liable for indirect or consequential damages, including loss of data or profits.</p>
<h2>9. Third-Party Services</h2>
<p>We are not responsible for third-party content or services.</p>
<h2>10. Changes to Terms</h2>
<p>We may update Terms from time to time. Continued use means acceptance.</p>
<h2>11. Governing Law</h2>
<p>These Terms are governed by applicable laws of your jurisdiction.</p>
<h2>12. Contact Us</h2>
<ol>
<li>Email: <a href="mailto:contact@dhidi.com">contact@dhidi.com</a></li>
<li>Address: 84 Sleepy Hollow St, Jamaica, New York 1432</li>
</ol>
$tos$
WHERE "slug" = 'terms-of-service';
