import { cva, type VariantProps } from "class-variance-authority";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[linear-gradient(135deg,#6fe7dd_0%,#3b82f6_55%,#14213d_100%)] text-slate-950 shadow-[0_18px_40px_rgba(59,130,246,0.28)] hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(59,130,246,0.32)]",
        secondary:
          "border-white/12 bg-white/6 text-white hover:border-[#6fe7dd]/30 hover:bg-white/10",
        ghost: "border-transparent bg-transparent text-slate-300 hover:bg-white/6 hover:text-white",
        danger: "border-rose-400/18 bg-rose-500/12 text-rose-100 hover:bg-rose-500/18",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export function Button({
  className,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,32,0.92),rgba(10,18,32,0.68))] p-5 shadow-[0_24px_90px_rgba(2,6,23,0.38)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-200",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[22px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#6fe7dd]/35 focus:bg-slate-950/90",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-[22px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#6fe7dd]/35 focus:bg-slate-950/90",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-[22px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-[#6fe7dd]/35",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border border-white/10 transition",
        checked ? "bg-[#6fe7dd]" : "bg-white/10",
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow-sm transition", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-7 text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "text-white",
  helper,
}: {
  label: string;
  value: string;
  tone?: string;
  helper?: string;
}) {
  return (
    <Card className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className={cn("font-display text-4xl font-semibold tracking-[-0.05em]", tone)}>{value}</p>
      {helper ? <p className="text-sm text-slate-400">{helper}</p> : null}
    </Card>
  );
}

export function MetricPill({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 font-display text-3xl tracking-[-0.05em] text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}
