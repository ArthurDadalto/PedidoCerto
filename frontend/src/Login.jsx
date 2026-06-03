import { useState } from 'react';

export default function Login({ onLogin }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErro('');

    try {
      const response = await fetch('http://localhost:3000/verificar-senha', {
        headers: {
          'Authorization': senha
        }
      });

      if (response.ok) {
        localStorage.setItem('senha_mestra', senha);
        onLogin();
      } else {
        setErro('Senha incorreta. Acesso negado.');
      }
    } catch (error) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center flex-1 w-full min-h-[70vh]">
      <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-sm text-center transform transition-all">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-white mb-2">Olá Arthur</h2>
        <p className="text-slate-400 text-sm mb-6">Insira a senha mestra para acessar o sistema.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••••••••"
            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-md text-center tracking-widest font-mono"
            autoFocus
          />
          {erro && <div className="text-red-400 bg-red-500/10 border border-red-500/20 py-2 rounded-lg text-sm font-medium">{erro}</div>}
          <button
            type="submit"
            disabled={isLoading || !senha}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 mt-2"
          >
            {isLoading ? 'Verificando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
