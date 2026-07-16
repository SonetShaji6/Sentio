import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - Sentio",
  description: "Sentio's Terms and Conditions.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-grow py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-8">
            Terms & Conditions
          </h1>
          <div className="prose prose-lg text-gray-600">
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Contractual Relationship</h2>
            <p>
              These Terms of Use ("Terms") govern the access or use by you, an
              individual, of applications, websites, content, products, and
              services (the "Services") made available by Sentio Inc.
            </p>

            <h2>2. The Services</h2>
            <p>
              The Services constitute a technology platform that enables users
              of Sentio's applications or websites to create, host, and
              participate in interactive audience engagement sessions.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              In order to use most aspects of the Services, you must register
              for and maintain an active personal user Services account
              ("Account"). You must be at least 18 years of age, or the age of
              legal majority in your jurisdiction, to obtain an Account.
            </p>

            <h2>4. User Conduct</h2>
            <p>
              You agree that you will not use the Services for any unlawful
              purpose or for the promotion of illegal activities. You are solely
              responsible for your conduct and any data that you submit, post,
              or display on or via the Services.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
