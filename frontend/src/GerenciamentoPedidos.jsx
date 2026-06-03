import { useState, useEffect } from 'react';
import { format, addBusinessDays, differenceInBusinessDays } from 'date-fns';

export default function GerenciamentoPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Estado para o Modal de Edição
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [formData, setFormData] = useState({
    cliente_nome: '',
    fornecedor: '',
    cliente_cnpj: '',
    cliente_telefone: '',
    prazo_pagamento: '',
    dias_follow_up: 45
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = () => {
    setIsLoading(true);
    fetch('http://localhost:3000/pedidos', {
      headers: {
        'Authorization': localStorage.getItem('senha_mestra')
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPedidos(data);
        else setErrorMsg('Erro ao carregar dados.');
      })
      .catch(() => setErrorMsg('Falha na conexão com o servidor.'))
      .finally(() => setIsLoading(false));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido definitivamente?')) {
      try {
        const res = await fetch(`http://localhost:3000/pedidos/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': localStorage.getItem('senha_mestra')
          }
        });
        if (res.ok) {
          setPedidos(prev => prev.filter(p => p.id !== id));
          alert('Pedido excluído com sucesso!');
        } else {
          alert('Erro ao excluir o pedido.');
        }
      } catch (error) {
        alert('Falha na conexão.');
      }
    }
  };

  const calcularDataAlvo = (dataEmissao, dias) => {
    if (!dataEmissao) return new Date();
    return addBusinessDays(new Date(dataEmissao), dias);
  };

  const getContadorText = (dataAlvo) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const alvo = new Date(dataAlvo);
    alvo.setHours(0, 0, 0, 0);

    const diff = differenceInBusinessDays(alvo, hoje);
    
    if (diff > 0) return { text: `Faltam ${diff} dias`, color: 'text-amber-400 bg-amber-500/20' };
    if (diff === 0) return { text: 'É hoje!', color: 'text-emerald-400 bg-emerald-500/20' };
    return { text: `Atrasado ${Math.abs(diff)} dias`, color: 'text-red-400 bg-red-500/20' };
  };

  const openEditModal = (pedido) => {
    setPedidoEditando(pedido);
    setFormData({
      cliente_nome: pedido.cliente_nome || '',
      fornecedor: pedido.fornecedor || '',
      cliente_cnpj: pedido.cliente_cnpj || '',
      cliente_telefone: pedido.cliente_telefone || '',
      prazo_pagamento: pedido.prazo_pagamento || '',
      dias_follow_up: pedido.dias_follow_up || 45
    });
  };

  const closeEditModal = () => {
    setPedidoEditando(null);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:3000/pedidos/${pedidoEditando.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('senha_mestra')
        },
        body: JSON.stringify({ ...pedidoEditando, ...formData })
      });
      if (res.ok) {
        const updatedPedido = await res.json();
        setPedidos(prev => prev.map(p => p.id === updatedPedido.id ? updatedPedido : p));
        closeEditModal();
        alert('Alterações salvas com sucesso!');
      } else {
        alert('Erro ao salvar as alterações.');
      }
    } catch (error) {
      alert('Falha na conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {errorMsg && <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-xl">{errorMsg}</div>}
      
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <span>🗂️</span> Histórico Geral ({pedidos.length})
          </h2>
          <button onClick={carregarPedidos} className="text-sm text-indigo-400 hover:text-indigo-300">Atualizar</button>
        </div>

        {pedidos.length === 0 ? (
          <div className="text-center py-10 text-slate-400">Nenhum pedido encontrado no histórico.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-3 font-semibold">Cliente / Fornecedor</th>
                  <th className="p-3 font-semibold">Contato</th>
                  <th className="p-3 font-semibold">Últ. Pedido</th>
                  <th className="p-3 font-semibold">Próximo Pedido</th>
                  <th className="p-3 font-semibold">Status / Follow-up</th>
                  <th className="p-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(pedido => {
                  const dataAlvo = calcularDataAlvo(pedido.data_emissao, pedido.dias_follow_up);
                  const contador = getContadorText(dataAlvo);
                  
                  return (
                  <tr key={pedido.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-slate-200">{pedido.cliente_nome}</div>
                      <div className="text-xs text-slate-500">{pedido.fornecedor}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-slate-300">{pedido.cliente_telefone || 'Sem telefone'}</div>
                      <div className="text-xs text-slate-500">{pedido.cliente_cnpj}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-slate-300">
                        {pedido.data_emissao ? format(new Date(pedido.data_emissao), 'dd/MM/yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium text-slate-300">{format(dataAlvo, 'dd/MM/yyyy')}</div>
                      <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${contador.color}`}>
                        {contador.text}
                      </div>
                    </td>
                    <td className="p-3 space-y-1">
                      <div>
                        {pedido.contatado ? (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-md">Contatado</span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-md">Pendente</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <span>⏱️</span> {pedido.dias_follow_up} dias
                      </div>
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => openEditModal(pedido)}
                        className="text-xs font-medium px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(pedido.id)}
                        className="text-xs font-medium px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição (Glassmorphism) */}
      {pedidoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
              <h3 className="text-lg font-semibold text-white">Editar Pedido</h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cliente</label>
                <input required name="cliente_nome" value={formData.cliente_nome} onChange={handleFormChange} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Fornecedor</label>
                <input required name="fornecedor" value={formData.fornecedor} onChange={handleFormChange} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">CNPJ</label>
                  <input name="cliente_cnpj" value={formData.cliente_cnpj} onChange={handleFormChange} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Telefone</label>
                  <input name="cliente_telefone" value={formData.cliente_telefone} onChange={handleFormChange} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Prazo Pagamento</label>
                  <input name="prazo_pagamento" value={formData.prazo_pagamento} onChange={handleFormChange} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Dias Follow-up</label>
                  <select name="dias_follow_up" value={formData.dias_follow_up} onChange={handleFormChange} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                    <option value="15">15 dias úteis</option>
                    <option value="20">20 dias úteis</option>
                    <option value="30">30 dias úteis</option>
                    <option value="45">45 dias úteis</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-5 flex justify-end gap-3 border-t border-slate-700/50 mt-2">
                <button type="button" onClick={closeEditModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
