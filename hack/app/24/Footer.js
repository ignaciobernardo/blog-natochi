import Image from 'next/image';
import { FaGithub } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="flex items-center justify-center py-8 text-white">
      <div className="container flex max-w-7xl flex-col items-center justify-between px-4 md:flex-row">
        <div className="mb-4 md:mb-0">
          <a href="https://platan.us" target="_blank" rel="noopener noreferrer">
            <Image
              src="/hack24/platanus-logo-horizontal.svg"
              alt="Platanus Logo"
              width={200}
              height={50}
              className="opacity-80 transition-opacity duration-300 hover:opacity-100"
            />
          </a>
        </div>
        <div className="text-center md:text-right">
          <p className="text-zinc-300">hecho con 💛 por 🍌</p>
          <p className="flex items-center justify-center text-sm text-zinc-400 md:justify-end">
            50% humano 50% LLM
            <a
              href="https://github.com/rafafdz/platanus-hack-landing"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-zinc-400 transition-colors duration-300 hover:text-white"
            >
              <FaGithub />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
