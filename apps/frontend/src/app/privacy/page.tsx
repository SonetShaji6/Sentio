import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Sentio",
  description: "Sentio's Privacy Policy.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-grow py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-8">
            Privacy Policy
          </h1>
          <div className="prose prose-lg text-gray-600">
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when
              you create or modify your account, request on-demand services,
              contact customer support, or otherwise communicate with us. This
              information may include: name, email, password, and other
              information you choose to provide.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>We may use the information we collect about you to:</p>
            <ul>
              <li>Provide, maintain, and improve our Services.</li>
              <li>
                Perform internal operations, including, for example, to prevent
                fraud and abuse of our Services.
              </li>
              <li>
                Send you communications we think will be of interest to you,
                including information about products, services, promotions,
                news, and events of Sentio.
              </li>
            </ul>

            <h2>3. Sharing of Information</h2>
            <p>
              We may share the information we collect about you as described in
              this Statement or as described at the time of collection or
              sharing, including as follows:
            </p>
            <ul>
              <li>
                With third party service providers who need access to such
                information to carry out work on our behalf.
              </li>
              <li>
                In response to a request for information by a competent
                authority if we believe disclosure is in accordance with, or is
                otherwise required by, any applicable law, regulation, or legal
                process.
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
