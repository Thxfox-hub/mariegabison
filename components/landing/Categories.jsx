"use client";

import Link from "next/link";
import { categories as CATEGORIES } from "../../lib/landing-data";

export default function Categories() {
  return (
    <section className="border-y border-ink/8 bg-blanc px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="font-sans text-[10px] font-light uppercase tracking-[0.42em] text-ink-soft">
            L&apos;univers Marie Gabison
          </p>
          <h2 className="mt-4 font-serif text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
            Nos créations
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group bg-blanc px-8 py-12 text-center transition duration-500 hover:bg-pearl"
            >
              <h3 className="font-serif text-2xl font-light tracking-[0.06em] text-ink">
                {category.name}
              </h3>
              <p className="mt-4 font-sans text-[12px] font-light leading-relaxed text-ink-soft">
                {category.description}
              </p>
              <span className="mt-6 inline-block font-sans text-[10px] font-light uppercase tracking-[0.28em] text-ink/50 transition group-hover:text-ink">
                Explorer
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
