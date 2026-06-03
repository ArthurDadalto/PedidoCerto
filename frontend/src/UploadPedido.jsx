import { useState, useRef } from 'react';

export default function UploadPedido() {
  const [file, setFile] = useState(null);
  const [diasFollowUp, setDiasFollowUp] = useState('45');
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setSuccessData(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setErrorMsg('');
        setSuccessData(null);
      } else {
        setErrorMsg('Por favor, envie apenas arquivos PDF.');
      }
    }
  };

  const processPedido = async () => {
    if (!file) {
      setErrorMsg('Por favor, selecione um arquivo primeiro.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessData(null);

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('dias_follow_up', diasFollowUp);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/upload-pedido`, {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('senha_mestra')
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro interno ao processar o arquivo.');
      }

      setSuccessData(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setErrorMsg(error.message || 'Falha na leitura. O servidor Express está rodando?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl animate-fade-in mx-auto max-w-lg">
      <h2 className="text-2xl font-semibold mb-2 text-center text-white">Upload de Pedido</h2>
      <p className="text-slate-400 text-center mb-8">Faça upload do relatório do pedido para extrair os dados.</p>

      {!successData && (
        <div className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${file ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-indigo-400 hover:bg-slate-700/30'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="text-5xl mb-4">📄</div>
            {file ? (
              <div className="text-indigo-300 font-medium break-words">{file.name}</div>
            ) : (
              <div className="text-slate-400">Clique para selecionar ou arraste o PDF aqui</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Quando deseja fazer o follow-up?</label>
            <select
              value={diasFollowUp}
              onChange={(e) => setDiasFollowUp(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-md"
            >
              <option value="15">15 dias úteis</option>
              <option value="20">20 dias úteis</option>
              <option value="30">30 dias úteis</option>
              <option value="45">45 dias úteis</option>
            </select>
          </div>

          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}

          <button 
            onClick={processPedido}
            disabled={isLoading || !file}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Extraindo dados com IA...</span>
              </>
            ) : (
              'Processar Pedido'
            )}
          </button>
        </div>
      )}

      {successData && (
        <div className="space-y-6 animate-fade-in mt-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-center shadow-lg shadow-emerald-500/10">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-emerald-400 font-medium text-xl mb-6">Pedido Salvo com Sucesso!</h3>
            
            <div className="bg-slate-900/60 rounded-xl p-5 text-left space-y-4 border border-slate-700/50">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Cliente</div>
                <div className="text-slate-100 text-lg">{successData.cliente_nome}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Fornecedor</div>
                  <div className="text-slate-200">{successData.fornecedor}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Prazo</div>
                  <div className="text-slate-200">{successData.prazo_pagamento}</div>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setSuccessData(null)}
            className="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md"
          >
            Enviar outro pedido
          </button>
        </div>
      )}
    </div>
  );
}
