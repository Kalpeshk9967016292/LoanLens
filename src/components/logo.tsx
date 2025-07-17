import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/loanlenslogo.png"
      alt="LoanLens Logo"
      width={32}
      height={32}
    />
  );
}
