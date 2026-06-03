import { useState, useEffect } from 'react';
import UploadPedido from './UploadPedido';
import DisparosDoDia from './DisparosDoDia';
import GerenciamentoPedidos from './GerenciamentoPedidos';
import Footer from './Footer';
import Login from './Login';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [autenticado, setAutenticado] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verificarSenha = async () => {
      const senhaSalva = localStorage.getItem('senha_mestra');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      if (senhaSalva) {
        try {
          const response = await fetch(`${API_URL}/verificar-senha`, {
            headers: { 'Authorization': senhaSalva }
          });
          if (response.ok) {
            setAutenticado(true);
          }
        } catch (error) {
          console.error("Erro ao verificar senha", error);
        }
      }
      setIsCheckingAuth(false);
    };
    
    verificarSenha();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4" style={{ backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%)' }}>
      
      <div className="max-w-4xl mx-auto pt-8">
        <h1 className="text-3xl font-bold text-center text-white mb-2">Painel de Pedidos</h1>
        <p className="text-slate-400 text-center mb-10">Controle de Reposição de Mercadorias</p>
        
        {isCheckingAuth ? (
          <div className="flex justify-center items-center h-64 text-slate-400">Verificando acesso...</div>
        ) : !autenticado ? (
          <Login onLogin={() => setAutenticado(true)} />
        ) : (
          <>
            {/* Navegação por Abas Responsiva */}
            <div className="flex justify-center mb-8 px-2">
              <div className="bg-slate-800/80 p-1.5 rounded-xl flex flex-col sm:flex-row gap-1 border border-slate-700/50 shadow-xl w-full sm:w-auto">
                <button 
                  onClick={() => setActiveTab('upload')}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-center ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                >
                  ⬆️ Upload de Nota
                </button>
                <button 
                  onClick={() => setActiveTab('disparos')}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-center ${activeTab === 'disparos' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                >
                  💬 Disparos Pendentes
                </button>
                <button 
                  onClick={() => setActiveTab('gerenciamento')}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-center ${activeTab === 'gerenciamento' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                >
                  🗂️ Histórico Geral
                </button>
              </div>
            </div>

            <div className="w-full px-2">
              {activeTab === 'upload' && <UploadPedido />}
              {activeTab === 'disparos' && <DisparosDoDia />}
              {activeTab === 'gerenciamento' && <GerenciamentoPedidos />}
            </div>
          </>
        )}

        <Footer />
      </div>
      
    </div>
  );
}

export default App;
