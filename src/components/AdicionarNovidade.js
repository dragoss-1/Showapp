import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const AdicionarNovidade = () => {
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [mensagem, setMensagem] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!titulo.trim() || !descricao.trim()) {
            setMensagem('Preencha todos os campos.');
            return;
        }
    
        try {
            await addDoc(collection(db, 'novidades'), {
                Titulo: titulo,
                Descricao: descricao,
            });
    
            setTitulo('');
            setDescricao('');
            setMensagem('Novidade adicionada com sucesso! ✅');
    
            // Redireciona para a página inicial após 1 segundo
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } catch (error) {
            console.error('Erro ao adicionar novidade:', error);
            setMensagem('Erro ao adicionar novidade. ❌');
        }
    };

    return (
        <div className="h-screen">
        <Navbar />
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-lg mt-10">
            <h2 className="text-xl font-bold mb-4">Adicionar Novidade</h2>
            
            {mensagem && <p className="text-sm mb-4">{mensagem}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-semibold">Título:</label>
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-semibold">Descrição:</label>
                    <textarea
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        className="w-full border p-2 rounded"
                        rows="3"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Adicionar
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded"
                >
                    Voltar
                </button>
            </form>
        </div>
    </div>
    );
};

export default AdicionarNovidade;