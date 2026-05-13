import { cn } from "@/lib/cn";

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("glass rounded-2xl p-4", className)} {...props} />;
}
