interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarUrl: string;
}

export function Testimonial({
  quote,
  author,
  role,
  company,
  avatarUrl,
}: TestimonialProps) {
  return (
    <div className="bg-white dark:bg-[#10121a] p-8 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-[#232838] flex flex-col justify-between h-full transition-colors">
      <div>
        <div className="flex gap-1 mb-6 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <blockquote className="text-base text-zinc-800 dark:text-zinc-200 leading-relaxed mb-8">
          "{quote}"
        </blockquote>
      </div>
      <div className="flex items-center gap-4 mt-auto pt-4 border-t border-zinc-100 dark:border-[#1e2330]">
        <img
          src={avatarUrl}
          alt={author}
          loading="lazy"
          decoding="async"
          className="w-11 h-11 rounded-full object-cover bg-zinc-100 dark:bg-[#171a24] border border-zinc-200 dark:border-[#262b3a]"
        />
        <div>
          <div className="font-bold text-zinc-950 dark:text-white text-sm">
            {author}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {role}, {company}
          </div>
        </div>
      </div>
    </div>
  );
}
