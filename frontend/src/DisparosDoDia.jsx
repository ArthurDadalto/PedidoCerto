import { useState, useEffect } from 'react';
import { format, addBusinessDays, differenceInBusinessDays } from 'date-fns';

export default function DisparosDoDia() {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/pedidos-pendentes', {
      headers: {
        'Authorization': localStorage.getItem('senha_mestra')
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPedidos(data);
        } else {
          setErrorMsg('Erro ao carregar dados.');
        }
      })
      .catch(() => setErrorMsg('Falha na conexão com o servidor.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAprovar = async (pedido) => {
    // Pega o texto atualizado da textarea pelo ID gerado
    const textAreaElement = document.getElementById(`msg-${pedido.id}`);
    const text = textAreaElement ? textAreaElement.value : '';
    
    // Formata o telefone e garante o prefixo 55
    let phone = (pedido.cliente_telefone || '').replace(/\D/g, '');
    if (phone && !phone.startsWith('55')) {
      phone = `55${phone}`;
    }

    // Abre o WhatsApp Web em nova aba
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');

    try {
      // Faz o PUT para o backend marcar como contatado
      const res = await fetch(`http://localhost:3000/pedido-contatado/${pedido.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': localStorage.getItem('senha_mestra')
        }
      });
      
      if (res.ok) {
        // Remove do estado (a tela se atualiza sem recarregar a página)
        setPedidos(prevPedidos => prevPedidos.filter(p => p.id !== pedido.id));
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("WhatsApp aberto, mas houve um erro ao atualizar o status no banco.");
    }
  };

  const calcularDataAlvo = (dataEmissao, dias) => {
    return addBusinessDays(new Date(dataEmissao), dias);
  };

  const getContadorText = (dataAlvo) => {
    const hoje = new Date();
    // zeramos a hora para focar apenas nos dias
    hoje.setHours(0, 0, 0, 0);
    const alvo = new Date(dataAlvo);
    alvo.setHours(0, 0, 0, 0);

    const diff = differenceInBusinessDays(alvo, hoje);
    
    if (diff > 0) return { text: `Faltam ${diff} dias úteis`, color: 'text-amber-400 bg-amber-500/20' };
    if (diff === 0) return { text: 'É hoje!', color: 'text-emerald-400 bg-emerald-500/20' };
    return { text: `Atrasado ${Math.abs(diff)} dias úteis`, color: 'text-red-400 bg-red-500/20' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (errorMsg) {
    return <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-xl">{errorMsg}</div>;
  }

  if (pedidos.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-2xl text-center shadow-lg animate-fade-in">
        <div className="text-4xl mb-4">🙌</div>
        <p className="text-slate-300 font-medium text-lg">Nenhum cliente para repor pedido hoje.</p>
        <p className="text-slate-500 text-sm mt-2">Todos os estoques estão em dia!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
        <span>🔥</span> Disparos de Hoje ({pedidos.length})
      </h2>
      
      <div className="grid gap-6">
        {pedidos.map(pedido => {
          const mensagemSugerida = `Fala ${pedido.cliente_nome}, tudo bem? Vi aqui que o último pedido de ${pedido.fornecedor} já tem um tempinho. Como está o estoque, vamos repor?`;
          
          const dataAlvo = calcularDataAlvo(pedido.data_emissao, pedido.dias_follow_up);
          const contador = getContadorText(dataAlvo);

          return (
            <div key={pedido.id} className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-2xl shadow-xl transition-all hover:shadow-indigo-500/10 hover:border-indigo-500/30 group">
              
              <div className="flex justify-between items-start mb-4 border-b border-slate-700/50 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{pedido.cliente_nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md">
                      {pedido.fornecedor}
                    </span>
                    <span className="text-xs text-slate-400">
                      Último pedido há {pedido.dias_follow_up} dias
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Próximo Pedido:</div>
                  <div className="text-sm font-medium text-slate-200">{format(dataAlvo, 'dd/MM/yyyy')}</div>
                  <div className={`mt-1 text-xs font-bold px-2 py-1 rounded-md inline-block ${contador.color}`}>
                    {contador.text}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Mensagem
                </label>
                <textarea
                  id={`msg-${pedido.id}`}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                  rows="3"
                  defaultValue={mensagemSugerida}
                />
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => handleAprovar(pedido)}
                  className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium py-2 px-5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                  <span>💬</span> Aprovar e Enviar WhatsApp
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
