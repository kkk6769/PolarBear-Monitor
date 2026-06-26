interface Props {
  serversCount: number;
}

export default function Footer({ serversCount }: Props) {
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 pb-4 mt-8">
      <p className="text-[13px] font-light tracking-tight text-neutral-600/50 dark:text-neutral-300/50 text-center">
        🐻‍❄️ PolarBear Monitor · {serversCount} 台服务器监控中
      </p>
    </footer>
  );
}
