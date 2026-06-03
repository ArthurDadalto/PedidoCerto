export default function Footer() {
  return (
    <footer className="mt-16 pt-8 pb-4 border-t border-slate-700/50">
      <div className="flex flex-col items-center justify-center">
        {/* Linha 1 */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🛒</span> {/* Logo provisória em emoji */}
          <span className="text-slate-300 text-sm font-medium">© 2026 Todos os direitos reservados.</span>
        </div>

        {/* Linha 2 */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-slate-500 text-xs">Desenvolvido por Arthur Dadalto de Carli</span>
          <div className="flex items-center gap-2.5 ml-1">
            {/* Ícone Instagram */}
            <a 
              href="https://www.instagram.com/arthur_dadalto/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-indigo-400 transition-colors"
              aria-label="Instagram de Arthur Dadalto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            
            {/* Ícone WhatsApp */}
            <a 
              href="https://wa.me/27997818321?text=Olá!" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-emerald-400 transition-colors"
              aria-label="WhatsApp de Arthur Dadalto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
