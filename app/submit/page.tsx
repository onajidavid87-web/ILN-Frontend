"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SubmitInvoiceForm from "../../components/SubmitInvoiceForm";

export default function SubmitRoute() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 px-4 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <SubmitInvoiceForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
